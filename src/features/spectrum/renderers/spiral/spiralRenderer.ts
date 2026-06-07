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
import { resolveGlowReach } from '@/features/spectrum/renderers/linear/linearRenderer';

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
		settings.spectrumShadowBlur *
		settings.spectrumGlowIntensity *
		resolveGlowReach(settings) *
		modulator;
	return Math.min(requested, 22);
}

export function drawSpiral(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings,
	dt: number = 1 / 60
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
	const logMode = settings.spectrumSpiralLogarithmic;
	const gradientStroke = settings.spectrumSpiralGradientStroke;
	const arms = clamp(settings.spectrumSpiralArms, 1, 4);
	const audioTurnsAmount = clamp(settings.spectrumSpiralAudioTurns, 0, 1);
	const safeDt = Math.max(0, Math.min(0.1, dt));

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

	// ── Audio reactivity runtime state ────────────────────────────────────
	// All three accumulators are gated by `audioTurnsAmount`, so a single
	// user-facing dial controls how loud each effect speaks. At 0 they're
	// fully bypassed (vanilla spiral). At 1 they're as expressive as the
	// math allows. The math is family-local, not in CircularSpectrum's
	// shared rotation, so other families stay untouched.
	const lastAvg = runtime.spiralLastAvgAmp ?? 0;
	const transient = Math.max(0, avgAmp - lastAvg);
	runtime.spiralLastAvgAmp = avgAmp;

	// (A) Rotation audio boost — extra angular phase added to base rotation.
	// Scales with current avgAmp so loud passages spin faster and silence
	// reverts to the user's configured `spectrumRotationSpeed`.
	const rotationGain = audioTurnsAmount * 2.4;
	runtime.spiralAudioRotationPhase =
		(runtime.spiralAudioRotationPhase ?? 0) +
		safeDt * avgAmp * rotationGain;
	const rotation = runtime.rotation + runtime.spiralAudioRotationPhase;

	// (B) Outer radius peak-hold pulse — kicks "exhale" by extending the
	// reachable outer radius briefly. Peak-hold so a spike sticks before
	// decaying back into the configured radius.
	const radiusPulseDecay = Math.exp(-safeDt * 3.2);
	const pulseTarget = avgAmp * audioTurnsAmount;
	runtime.spiralOuterRadiusPulse = Math.max(
		pulseTarget,
		(runtime.spiralOuterRadiusPulse ?? 0) * radiusPulseDecay
	);
	const effectiveMaxR =
		maxR + runtime.spiralOuterRadiusPulse * radialPush * 4;

	// (C) Kick flash latch — when a transient lands hard enough we set the
	// flash high; it decays smoothly. While > 0.5 the dot pass overrides
	// the resolved shape to `star` so kicks burst as visible spikes.
	const kickThreshold = 0.18;
	const flashDecay = Math.exp(-safeDt * 4.5);
	const flashedNow =
		transient > kickThreshold && audioTurnsAmount > 0
			? clamp(
					transient * 3 * audioTurnsAmount,
					0,
					1
				)
			: 0;
	runtime.spiralKickFlash = Math.max(
		flashedNow,
		(runtime.spiralKickFlash ?? 0) * flashDecay
	);
	const kickFlashActive =
		(runtime.spiralKickFlash ?? 0) > 0.5 && audioTurnsAmount > 0;

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
			const baseRadius = baseR + (effectiveMaxR - baseR) * easedT;
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
	// Non-solid color modes (rainbow / gradient / visible-rotate) need
	// per-segment coloring or the stroke collapses to a single primary
	// color — that's exactly the "connecting line doesn't take rainbow"
	// bug. We auto-promote to per-segment coloring whenever the color
	// mode isn't solid, regardless of the `spectrumSpiralGradientStroke`
	// toggle. The toggle still controls whether we use per-segment in
	// solid mode (still useful for solid → secondary fade effects).
	const colorModeNeedsPerSegment =
		settings.spectrumColorMode !== 'solid';
	const usePerSegmentStroke =
		(gradientStroke || colorModeNeedsPerSegment) && strokeMultiplier > 0;
	ctx.shadowBlur = computeSpiralGlowBlur(
		settings,
		usePerSegmentStroke ? 0.25 : 1
	);
	if (strokeMultiplier > 0) {
		ctx.lineWidth = Math.max(
			0.4,
			settings.spectrumBarWidth * 0.18 * strokeMultiplier
		);
		ctx.lineJoin = 'round';
		ctx.lineCap = 'round';
		if (usePerSegmentStroke) {
			// Per-segment loop already pays the cost of N strokes per arm,
			// so we get audio-reactive WIDTH modulation for free — louder
			// bins drew the thickest segment ribbons. Makes the spiral
			// breathe with kicks instead of reading as a static curve.
			// `baseSegmentWidth` is captured once so the multiplier scales
			// off the user's configured stroke width, not whatever the
			// previous segment ended on.
			const baseSegmentWidth = ctx.lineWidth;
			for (let arm = 0; arm < armsCount; arm++) {
				const base = arm * pointsPerArm;
				for (let i = 1; i < pointsPerArm; i++) {
					const a = base + i - 1;
					const b = base + i;
					const segAmp = (amps[a] + amps[b]) * 0.5;
					ctx.lineWidth = baseSegmentWidth * (0.55 + 0.9 * segAmp);
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
	// During a kick flash the resolved shape is overridden to `star` so
	// transients burst as visible spikes regardless of the user's choice.
	ctx.shadowBlur = computeSpiralGlowBlur(settings, 0.6);
	const total = armsCount * pointsPerArm;
	const effectiveDotShape: SpectrumSpiralDotShape = kickFlashActive
		? 'star'
		: dotShape;
	const flashRadiusBoost = kickFlashActive
		? 1 + (runtime.spiralKickFlash ?? 0) * 0.5
		: 1;
	for (let i = 0; i < total; i++) {
		const amp = amps[i];
		const dotR = (baseDot + dotGrow * amp) * flashRadiusBoost;
		ctx.fillStyle = getColor(settings, ts[i]);
		ctx.globalAlpha = settings.spectrumOpacity * (0.35 + 0.65 * amp);
		drawDotShape(
			ctx,
			xs[i],
			ys[i],
			dotR,
			effectiveDotShape,
			i % MIX_SHAPES.length
		);
	}

	// 3) Shockwaves following the spiral spine. The frame-effects pipeline
	// already advances `runtime.shockwaves` for us (spawn/decay/cull), but
	// skips the generic ring draw for the spiral family. Here we sweep
	// each wave's radius across the cached spine and brighten the segments
	// whose radius falls inside a narrow band around the wave, so a kick
	// looks like a luminous pulse travelling outward along the arms.
	const waves = runtime.shockwaves ?? [];
	if (waves.length > 0) {
		const bandHalf = Math.max(8, shortSide * 0.025);
		ctx.save();
		ctx.globalCompositeOperation = 'lighter';
		ctx.lineJoin = 'round';
		ctx.lineCap = 'round';
		const spineBaseWidth = Math.max(
			0.6,
			settings.spectrumBarWidth * 0.22 *
				clamp(settings.spectrumSpiralStrokeWidth, 0.6, 6)
		);
		// Per-segment radii are computed inside the (arm × pointsPerArm)
		// loop above but not stored — recompute cheaply via the same
		// easing curve. radiusAt(t) === baseR + (effectiveMaxR - baseR) * easedT
		const radiusAt = (t: number) => {
			const easedT = logMode
				? (Math.exp(t * tightness) - 1) /
					(Math.exp(tightness) - 1)
				: Math.pow(t, tightness);
			return baseR + (effectiveMaxR - baseR) * easedT;
		};
		for (const wave of waves) {
			const waveColor =
				(settings.spectrumShockwaveColorMode ?? 'cycle') ===
				'secondary'
					? settings.spectrumSecondaryColor
					: getColor(
							settings,
							(runtime.idleTime * 0.12) % 1
						);
			ctx.strokeStyle = waveColor;
			ctx.shadowColor = waveColor;
			ctx.shadowBlur = Math.min(
				18,
				settings.spectrumShadowBlur * 0.4 + wave.thickness * 0.6
			);
			for (let arm = 0; arm < armsCount; arm++) {
				const base = arm * pointsPerArm;
				for (let i = 1; i < pointsPerArm; i++) {
					const a = base + i - 1;
					const b = base + i;
					const tMid = (ts[a] + ts[b]) * 0.5;
					const rMid = radiusAt(tMid);
					const dist = Math.abs(rMid - wave.radius);
					if (dist > bandHalf) continue;
					const proximity = 1 - dist / bandHalf;
					ctx.globalAlpha = clamp(
						wave.alpha * proximity * 0.95,
						0,
						1
					);
					ctx.lineWidth = Math.max(
						0.4,
						spineBaseWidth +
							wave.thickness * 0.6 * proximity
					);
					ctx.beginPath();
					ctx.moveTo(xs[a], ys[a]);
					ctx.lineTo(xs[b], ys[b]);
					ctx.stroke();
				}
			}
		}
		ctx.restore();
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
