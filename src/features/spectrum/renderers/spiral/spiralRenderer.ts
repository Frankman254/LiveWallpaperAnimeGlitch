/**
 * Spiral spectrum renderer.
 *
 * Two passes per frame:
 *   1. Stroke the spiral curve itself (the "spine") so the path between
 *      consecutive bins reads as a continuous spiral instead of a stack
 *      of concentric rings of dots.
 *   2. Plot a dot at each bin position. Both the dot's radial offset and
 *      its size + alpha are modulated by that bin's amplitude — so a kick
 *      doesn't just brighten everything, it visibly distorts the spiral
 *      outward along the frequencies where the kick lives.
 *
 * Tunables exposed in the panel (1:1 with store fields):
 *   - `spectrumSpiralTurns`        revolutions inner → outer
 *   - `spectrumSpiralOuterRadius`  outer radius as a fraction of the
 *                                  canvas short side
 *   - `spectrumSpiralTightness`    ease curve of the radius growth.
 *                                  <1 packs the spiral inward, >1 outward,
 *                                  1 = even spacing per turn (Archimedean).
 *   - `spectrumSpiralShape`        polygon distortion on the radius
 *                                  (circle / square / hexagon / star / …).
 */
import type {
	SpectrumRuntimeState,
	SpectrumSettings
} from '@/features/spectrum/runtime/spectrumRuntime';
import { getColor } from '@/features/spectrum/color/spectrumColor';
import { getRadialShapeFactor } from '@/features/spectrum/geometry/radialGeometry';
import type {
	SpectrumRadialShape,
	SpectrumSpiralDotShape
} from '@/types/wallpaper';

const TAU = Math.PI * 2;

/**
 * Polygon radius modulator. Delegates to the radial shape registry so any
 * shape (including newly-added pentagon / star6 / etc.) renders consistently
 * with the other families. Local override deleted — the registry is now the
 * single source of truth for shape math.
 */
function shapeRadiusFactor(angle: number, shape: SpectrumRadialShape): number {
	return getRadialShapeFactor(shape, angle, 0).factor;
}

/**
 * Glow blur cap for the spiral renderer.
 *
 * Two issues fused: the original code missed the `* glowIntensity` factor
 * (so the user's Glow slider did nothing to the spiral — only `shadowBlur`
 * itself did), AND it ran uncapped. At max settings × ~1024 strokes/frame
 * in gradient mode, this was untenable. Cap at 22 (similar density to
 * orbital). `modulator` lets each pass scale down (e.g. dots use 0.6 to
 * keep the stroke highlight stronger than the dot halos).
 */
function computeSpiralGlowBlur(
	settings: SpectrumSettings,
	modulator: number
): number {
	const requested =
		settings.spectrumShadowBlur * settings.spectrumGlowIntensity * modulator;
	return Math.min(requested, 22);
}

export function drawSpiral(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings
): void {
	const heights = runtime.pixelHeights;
	const barCount = heights.length;
	if (barCount < 2) return;

	// Honour the placement offset so the clone variant renders centred on
	// the logo instead of the canvas centre. `spectrumPositionX/Y` are in
	// [-1, 1] and reach the canvas edges at ±1.
	const cx =
		canvas.width / 2 +
		(settings.spectrumPositionX ?? 0) * canvas.width * 0.5;
	const cy =
		canvas.height / 2 -
		(settings.spectrumPositionY ?? 0) * canvas.height * 0.5;
	const shortSide = Math.min(canvas.width, canvas.height);

	const innerR = Math.max(0, settings.spectrumInnerRadius);
	const baseR = innerR > 0 ? innerR : shortSide * 0.05;

	const outerFrac = clamp(settings.spectrumSpiralOuterRadius, 0.1, 0.7);
	const maxR = Math.max(baseR + 12, shortSide * outerFrac);

	const baseTurns = clamp(settings.spectrumSpiralTurns, 1, 12);
	const tightness = clamp(settings.spectrumSpiralTightness, 0.4, 2.5);
	const shape = settings.spectrumSpiralShape;
	const rotation = runtime.rotation;
	const logMode = settings.spectrumSpiralLogarithmic;
	const gradientStroke = settings.spectrumSpiralGradientStroke;
	const arms = clamp(settings.spectrumSpiralArms, 1, 4);
	const audioTurnsAmount = clamp(settings.spectrumSpiralAudioTurns, 0, 1);

	const baseDot = Math.max(0.4, settings.spectrumBarWidth * 0.25);
	const dotGrow = Math.max(0.6, settings.spectrumBarWidth * 2.3);
	const heightCap = Math.max(1, settings.spectrumMaxHeight);
	const radialPush = shortSide * 0.05;

	// Audio-driven extra turns: average amplitude across the spectrum adds
	// up to +50% turn count when `audioTurns` is at 1.
	let avgAmp = 0;
	for (let i = 0; i < barCount; i++) avgAmp += heights[i] / heightCap;
	avgAmp = clamp(avgAmp / barCount, 0, 1);
	const turns = baseTurns * (1 + 0.5 * audioTurnsAmount * avgAmp);

	const armsCount = arms;
	const pointsPerArm = barCount;
	const armAngleOffset = TAU / armsCount;

	const xs = new Float32Array(armsCount * pointsPerArm);
	const ys = new Float32Array(armsCount * pointsPerArm);
	const ts = new Float32Array(armsCount * pointsPerArm);
	const amps = new Float32Array(armsCount * pointsPerArm);

	for (let arm = 0; arm < armsCount; arm++) {
		const armBase = rotation + arm * armAngleOffset;
		for (let i = 0; i < pointsPerArm; i++) {
			const t = i / (pointsPerArm - 1);
			const angle = armBase + t * TAU * turns;
			// Linear (Archimedean) vs logarithmic-feel radius mapping.
			// Logarithmic: r grows exponentially with t → galaxy-like core
			// packed and outer arms sweeping. Linear: even spacing per turn.
			const easedT = logMode
				? (Math.exp(t * tightness) - 1) / (Math.exp(tightness) - 1)
				: Math.pow(t, tightness);
			const baseRadius = baseR + (maxR - baseR) * easedT;
			const amp = clamp(heights[i] / heightCap, 0, 1);
			const radius =
				baseRadius * shapeRadiusFactor(angle, shape) +
				amp * radialPush;
			const idx = arm * pointsPerArm + i;
			xs[idx] = cx + Math.cos(angle) * radius;
			ys[idx] = cy + Math.sin(angle) * radius;
			ts[idx] = t;
			amps[idx] = amp;
		}
	}

	ctx.save();
	ctx.globalAlpha = settings.spectrumOpacity;
	ctx.shadowColor = settings.spectrumPrimaryColor;

	// 1) Stroke the spiral arm(s). `spectrumSpiralStrokeWidth` multiplies a
	// width derived from `spectrumBarWidth` so the connector reads from a
	// thin guideline (low values) up to a thick ribbon (high values). When
	// the multiplier is 0 the stroke pass is skipped entirely.
	const strokeMultiplier = clamp(settings.spectrumSpiralStrokeWidth, 0, 6);
	const dotShape = settings.spectrumSpiralDotShape;
	// Gradient stroke fires N×(bars-1) separate stroke() calls (each one
	// with shadow), so its shadow is gated MUCH tighter than solid stroke
	// (which is one batched stroke per arm). At default settings the
	// gradient halo is barely visible anyway — the per-bin color shift IS
	// the visual identity, not the glow.
	const isGradientStroke = gradientStroke && strokeMultiplier > 0;
	ctx.shadowBlur = computeSpiralGlowBlur(
		settings,
		isGradientStroke ? 0.25 : 1
	);
	if (strokeMultiplier > 0) {
		ctx.lineWidth = Math.max(
			0.4,
			settings.spectrumBarWidth * 0.18 * strokeMultiplier
		);
		ctx.lineJoin = 'round';
		ctx.lineCap = 'round';
		if (gradientStroke) {
			for (let arm = 0; arm < armsCount; arm++) {
				const base = arm * pointsPerArm;
				for (let i = 1; i < pointsPerArm; i++) {
					const a = base + i - 1;
					const b = base + i;
					ctx.strokeStyle = getColor(settings, ts[b]);
					ctx.beginPath();
					ctx.moveTo(xs[a], ys[a]);
					ctx.lineTo(xs[b], ys[b]);
					ctx.stroke();
				}
			}
		} else {
			ctx.strokeStyle = settings.spectrumPrimaryColor;
			for (let arm = 0; arm < armsCount; arm++) {
				const base = arm * pointsPerArm;
				ctx.beginPath();
				ctx.moveTo(xs[base], ys[base]);
				for (let i = 1; i < pointsPerArm; i++) {
					ctx.lineTo(xs[base + i], ys[base + i]);
				}
				ctx.stroke();
			}
		}
	}

	// 2) Plot dots. Glyph chosen per `dotShape`; the `'mix'` variant cycles
	// through every concrete shape per-bin so the spiral feels like a
	// stream of tokens instead of a necklace of identical circles (which
	// was the "looks like a cheap Orbital" complaint).
	ctx.shadowBlur = computeSpiralGlowBlur(settings, 0.6);
	const total = armsCount * pointsPerArm;
	for (let i = 0; i < total; i++) {
		const amp = amps[i];
		const dotR = baseDot + dotGrow * amp;
		ctx.fillStyle = getColor(settings, ts[i]);
		ctx.globalAlpha = settings.spectrumOpacity * (0.35 + 0.65 * amp);
		drawDotShape(ctx, xs[i], ys[i], dotR, dotShape, i % MIX_SHAPES.length);
	}

	ctx.restore();
}

const MIX_SHAPES: ReadonlyArray<Exclude<SpectrumSpiralDotShape, 'mix'>> = [
	'circle',
	'square',
	'triangle',
	'diamond',
	'star',
	'plus'
];

function drawDotShape(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	r: number,
	shape: SpectrumSpiralDotShape,
	mixIndex: number
): void {
	const resolved =
		shape === 'mix'
			? MIX_SHAPES[mixIndex % MIX_SHAPES.length]
			: shape;
	switch (resolved) {
		case 'circle':
			ctx.beginPath();
			ctx.arc(x, y, r, 0, TAU);
			ctx.fill();
			return;
		case 'square': {
			const s = r * 1.6;
			ctx.fillRect(x - s / 2, y - s / 2, s, s);
			return;
		}
		case 'triangle': {
			const h = r * 1.8;
			ctx.beginPath();
			ctx.moveTo(x, y - h * 0.6);
			ctx.lineTo(x - h * 0.55, y + h * 0.4);
			ctx.lineTo(x + h * 0.55, y + h * 0.4);
			ctx.closePath();
			ctx.fill();
			return;
		}
		case 'diamond': {
			const d = r * 1.4;
			ctx.beginPath();
			ctx.moveTo(x, y - d);
			ctx.lineTo(x + d, y);
			ctx.lineTo(x, y + d);
			ctx.lineTo(x - d, y);
			ctx.closePath();
			ctx.fill();
			return;
		}
		case 'star': {
			const outer = r * 1.6;
			const inner = outer * 0.45;
			ctx.beginPath();
			for (let i = 0; i < 10; i++) {
				const angle = (i / 10) * TAU - Math.PI / 2;
				const radius = i % 2 === 0 ? outer : inner;
				const px = x + Math.cos(angle) * radius;
				const py = y + Math.sin(angle) * radius;
				if (i === 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			}
			ctx.closePath();
			ctx.fill();
			return;
		}
		case 'plus': {
			const arm = r * 1.5;
			const thick = r * 0.55;
			ctx.fillRect(x - thick, y - arm, thick * 2, arm * 2);
			ctx.fillRect(x - arm, y - thick, arm * 2, thick * 2);
			return;
		}
	}
}

function clamp(v: number, lo: number, hi: number): number {
	return v < lo ? lo : v > hi ? hi : v;
}
