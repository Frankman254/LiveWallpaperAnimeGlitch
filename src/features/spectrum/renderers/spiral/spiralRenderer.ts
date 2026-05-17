/**
 * Spiral spectrum renderer.
 *
 * Distributes the FFT bins along a logarithmic-feel spiral that grows
 * outward from the center. Each bin becomes a glowing dot whose size +
 * brightness track its amplitude. The whole spiral rotates with
 * `spectrumRotationSpeed`.
 *
 * Tunables exposed in the panel (mapped 1:1 to store fields):
 *   - `spectrumSpiralTurns`        → revolutions inner → outer
 *   - `spectrumSpiralOuterRadius`  → outer radius as a fraction of the
 *                                    canvas short side
 *   - `spectrumSpiralTightness`    → ease curve of the radius growth.
 *                                    <1 packs the spiral inward, >1 outward,
 *                                    1 = even spacing per turn (true
 *                                    Archimedean spiral feel).
 *   - `spectrumSpiralShape`        → polygon distortion applied to the
 *                                    radius (circle / hexagon / star / …).
 */
import type {
	SpectrumRuntimeState,
	SpectrumSettings
} from '@/features/spectrum/runtime/spectrumRuntime';
import { getColor } from '@/features/spectrum/color/spectrumColor';
import type { SpectrumRadialShape } from '@/types/wallpaper';

const TAU = Math.PI * 2;

/**
 * Polygon radius modulator. Given an angle and a polygon side count,
 * returns a multiplier in roughly [cos(π/n), 1] that bends a circle into
 * the polygon outline. Returns 1 for circle (no distortion).
 *
 * For star and diamond we use a custom radial signal to emphasize spikes.
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
			// A diamond is a square rotated 45°.
			return 1 / Math.max(0.001, Math.cos(((angle + Math.PI / 4) % (TAU / 4)) - TAU / 8));
		case 'hexagon':
			sides = 6;
			break;
		case 'octagon':
			sides = 8;
			break;
		case 'star':
			// 5-point star: alternate spikes by mixing two cosine harmonics.
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
	if (barCount === 0) return;

	const cx = canvas.width / 2;
	const cy = canvas.height / 2;
	const shortSide = Math.min(canvas.width, canvas.height);

	const innerR = Math.max(0, settings.spectrumInnerRadius);
	const baseR = innerR > 0 ? innerR : shortSide * 0.05;

	// Outer radius is a fraction of the short side, clamped so the spiral
	// always has room to grow regardless of `spectrumInnerRadius`.
	const outerFrac = clamp(settings.spectrumSpiralOuterRadius, 0.1, 0.7);
	const maxR = Math.max(baseR + 12, shortSide * outerFrac);

	const turns = clamp(settings.spectrumSpiralTurns, 1, 12);
	const tightness = clamp(settings.spectrumSpiralTightness, 0.4, 2.5);
	const shape = settings.spectrumSpiralShape;

	const rotation = runtime.rotation;
	const baseDotSize = Math.max(0.6, settings.spectrumBarWidth * 0.45);
	const dotGrow = Math.max(0.5, settings.spectrumBarWidth * 0.9);
	const heightCap = Math.max(1, settings.spectrumMaxHeight);

	ctx.save();
	ctx.globalAlpha = settings.spectrumOpacity;
	ctx.shadowBlur = settings.spectrumShadowBlur;
	ctx.shadowColor = settings.spectrumPrimaryColor;

	for (let i = 0; i < barCount; i++) {
		const t = barCount > 1 ? i / (barCount - 1) : 0;
		const angle = rotation + t * TAU * turns;
		const easedT = Math.pow(t, tightness);
		const baseRadius = baseR + (maxR - baseR) * easedT;
		const radius = baseRadius * shapeRadiusFactor(angle, shape);

		const x = cx + Math.cos(angle) * radius;
		const y = cy + Math.sin(angle) * radius;

		const amp = Math.min(1, Math.max(0, heights[i] / heightCap));
		const dotR = baseDotSize + dotGrow * amp;

		ctx.fillStyle = getColor(settings, t);
		ctx.beginPath();
		ctx.arc(x, y, dotR, 0, TAU);
		ctx.fill();
	}

	ctx.restore();
}

function clamp(v: number, lo: number, hi: number): number {
	return v < lo ? lo : v > hi ? hi : v;
}
