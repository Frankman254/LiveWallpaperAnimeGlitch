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
import type { SpectrumRadialShape } from '@/types/wallpaper';

const TAU = Math.PI * 2;

/**
 * Polygon radius modulator. Returns a multiplier in roughly [cos(π/n), 1]
 * that bends a circle into the polygon outline; 1 for the plain circle.
 */
function shapeRadiusFactor(angle: number, shape: SpectrumRadialShape): number {
	if (shape === 'circle') return 1;
	let sides = 0;
	switch (shape) {
		case 'triangle':
			sides = 3;
			break;
		case 'square':
			sides = 4;
			break;
		case 'diamond':
			return (
				1 /
				Math.max(
					0.001,
					Math.cos(((angle + Math.PI / 4) % (TAU / 4)) - TAU / 8)
				)
			);
		case 'hexagon':
			sides = 6;
			break;
		case 'octagon':
			sides = 8;
			break;
		case 'star':
			return 0.85 + 0.45 * Math.cos(angle * 5);
	}
	if (sides <= 0) return 1;
	const half = TAU / sides;
	const phase = (angle % half) - half / 2;
	return 1 / Math.max(0.001, Math.cos(phase));
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

	const cx = canvas.width / 2;
	const cy = canvas.height / 2;
	const shortSide = Math.min(canvas.width, canvas.height);

	const innerR = Math.max(0, settings.spectrumInnerRadius);
	const baseR = innerR > 0 ? innerR : shortSide * 0.05;

	const outerFrac = clamp(settings.spectrumSpiralOuterRadius, 0.1, 0.7);
	const maxR = Math.max(baseR + 12, shortSide * outerFrac);

	const turns = clamp(settings.spectrumSpiralTurns, 1, 12);
	const tightness = clamp(settings.spectrumSpiralTightness, 0.4, 2.5);
	const shape = settings.spectrumSpiralShape;
	const rotation = runtime.rotation;

	// Dot size mapping. Small at rest, much bigger on transients — gives the
	// spiral a clear "breathing" feel instead of a uniform necklace of dots.
	const baseDot = Math.max(0.4, settings.spectrumBarWidth * 0.25);
	const dotGrow = Math.max(0.6, settings.spectrumBarWidth * 2.3);
	const heightCap = Math.max(1, settings.spectrumMaxHeight);
	// Audio pushes dots outward on hits — this is what makes the curve
	// visibly distort along loud frequencies.
	const radialPush = shortSide * 0.05;

	// Precompute positions + amps; reused by both the stroke pass and the
	// dot pass so a single trig pass covers both renderings.
	const xs = new Float32Array(barCount);
	const ys = new Float32Array(barCount);
	const ts = new Float32Array(barCount);
	const amps = new Float32Array(barCount);

	for (let i = 0; i < barCount; i++) {
		const t = i / (barCount - 1);
		const angle = rotation + t * TAU * turns;
		const easedT = Math.pow(t, tightness);
		const baseRadius = baseR + (maxR - baseR) * easedT;
		const amp = clamp(heights[i] / heightCap, 0, 1);
		const radius =
			baseRadius * shapeRadiusFactor(angle, shape) + amp * radialPush;
		xs[i] = cx + Math.cos(angle) * radius;
		ys[i] = cy + Math.sin(angle) * radius;
		ts[i] = t;
		amps[i] = amp;
	}

	ctx.save();
	ctx.globalAlpha = settings.spectrumOpacity;
	ctx.shadowBlur = settings.spectrumShadowBlur;
	ctx.shadowColor = settings.spectrumPrimaryColor;

	// 1) Stroke the spiral path — this is what makes the curve READ as a
	// spiral instead of dots arranged in a circle.
	ctx.strokeStyle = settings.spectrumPrimaryColor;
	ctx.lineWidth = Math.max(0.6, settings.spectrumBarWidth * 0.18);
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.moveTo(xs[0], ys[0]);
	for (let i = 1; i < barCount; i++) {
		ctx.lineTo(xs[i], ys[i]);
	}
	ctx.stroke();

	// 2) Plot dots. Each dot's size + alpha track its own bin amplitude so a
	// kick visibly inflates a region of the curve rather than the whole
	// spiral lighting up uniformly.
	ctx.shadowBlur = settings.spectrumShadowBlur * 0.6;
	for (let i = 0; i < barCount; i++) {
		const amp = amps[i];
		const dotR = baseDot + dotGrow * amp;
		ctx.fillStyle = getColor(settings, ts[i]);
		ctx.globalAlpha = settings.spectrumOpacity * (0.35 + 0.65 * amp);
		ctx.beginPath();
		ctx.arc(xs[i], ys[i], dotR, 0, TAU);
		ctx.fill();
	}

	ctx.restore();
}

function clamp(v: number, lo: number, hi: number): number {
	return v < lo ? lo : v > hi ? hi : v;
}
