/**
 * Spiral spectrum renderer.
 *
 * Distributes the FFT bins along a logarithmic-feel spiral that grows
 * outward from the center. Each bin becomes a glowing dot whose size +
 * brightness track its amplitude. The whole spiral rotates with
 * `spectrumRotationSpeed`, so the lobe sweeps the screen on energy.
 *
 * Why a spiral instead of yet another bar layout: the polar mapping turns
 * the frequency axis into a curve that reads as "depth + motion" without
 * needing 3D. It also clones well — the inner radius offset lets the main
 * spiral and the clone live concentrically around the logo.
 */
import type {
	SpectrumRuntimeState,
	SpectrumSettings
} from '@/features/spectrum/runtime/spectrumRuntime';
import { getColor } from '@/features/spectrum/color/spectrumColor';

const TAU = Math.PI * 2;

/** Total full revolutions of the spiral from inner to outer radius. */
const SPIRAL_TURNS = 3.2;
/** Curvature: <1 packs bins toward the center, >1 toward the outer rim. */
const RADIUS_EASE = 0.62;

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
	const baseR = innerR > 0 ? innerR : shortSide * 0.08;
	const maxR = shortSide * 0.48;

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
		const angle = rotation + t * TAU * SPIRAL_TURNS;
		const radius = baseR + (maxR - baseR) * Math.pow(t, RADIUS_EASE);

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
