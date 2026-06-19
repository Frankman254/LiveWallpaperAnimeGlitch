import { mixHexColors } from '../color/spectrumColor';
import type { SpectrumSettings } from '../runtime/spectrumRuntime';

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

/**
 * High-luminance core tint derived from the trace palette — keeps hue identity
 * while staying visibly brighter than the outer glow stroke.
 */
export function resolveNeonCoreStrokeStyle(
	settings: SpectrumSettings,
	intensity: number
): string {
	const coreIntensity = clamp01(intensity);
	const primary = settings.spectrumPrimaryColor;
	const secondary = settings.spectrumSecondaryColor ?? '#ffffff';
	const mixed = mixHexColors(primary, secondary, 0.35);
	return mixHexColors(mixed, '#ffffff', 0.45 + coreIntensity * 0.45);
}

export function resolveNeonCoreLineWidth(
	lineWidth: number,
	coreWidthFrac: number
): number {
	return Math.max(1, lineWidth * clamp01(coreWidthFrac) * 0.72);
}

/**
 * Thin bright core stroke over an existing path. One extra stroke, no blur.
 * Caller must have already built the path and cleared shadowBlur.
 */
export function drawNeonCorePass(
	ctx: CanvasRenderingContext2D,
	lineWidth: number,
	intensity: number,
	coreWidthFrac: number,
	strokeStyle: string | CanvasGradient
): void {
	const coreIntensity = clamp01(intensity);
	if (coreIntensity <= 0.01) return;

	ctx.save();
	ctx.globalCompositeOperation = 'source-over';
	ctx.shadowBlur = 0;
	ctx.shadowColor = 'transparent';
	ctx.globalAlpha *= 0.65 + coreIntensity * 0.35;
	ctx.lineWidth = resolveNeonCoreLineWidth(lineWidth, coreWidthFrac);
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.strokeStyle = strokeStyle;
	ctx.stroke();
	ctx.restore();
}
