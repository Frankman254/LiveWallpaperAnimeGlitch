import type { SpectrumLinearOrientation } from '@/types/wallpaper';
import type { SpectrumSettings } from '../runtime/spectrumRuntime';
import { resolveRgbSplitOffsetPx } from './spectrumFxBudget';

/**
 * Cheap chromatic-aberration pass for linear wave traces. Re-strokes the path
 * twice with additive blending. Offset is perpendicular to the trace axis.
 */
export function drawLinearRgbSplitPass(
	ctx: CanvasRenderingContext2D,
	settings: SpectrumSettings,
	referencePx: number,
	barCount: number,
	lineWidth: number,
	orientation: SpectrumLinearOrientation,
	tracePath: () => void
): void {
	const offset = resolveRgbSplitOffsetPx(
		settings.spectrumRgbSplit,
		settings.spectrumRgbSplitAmount ?? 0,
		referencePx,
		settings.performanceMode,
		barCount
	);
	if (offset <= 0.001) return;

	const shiftX = orientation === 'vertical' ? offset : 0;
	const shiftY = orientation === 'vertical' ? 0 : offset;

	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	ctx.shadowBlur = 0;
	ctx.lineWidth = lineWidth;
	ctx.globalAlpha = 0.55;
	ctx.strokeStyle = 'rgb(255, 40, 40)';
	ctx.save();
	ctx.translate(shiftX, shiftY);
	tracePath();
	ctx.stroke();
	ctx.restore();
	ctx.strokeStyle = 'rgb(40, 120, 255)';
	ctx.save();
	ctx.translate(-shiftX, -shiftY);
	tracePath();
	ctx.stroke();
	ctx.restore();
	ctx.restore();
}

/**
 * Radial chromatic separation: red channel slightly outside the trace, blue
 * slightly inside — preserves shape, rotation, and a closed path.
 */
export function drawRadialRgbSplitPass(
	ctx: CanvasRenderingContext2D,
	settings: SpectrumSettings,
	referencePx: number,
	barCount: number,
	lineWidth: number,
	tracePath: (radiusOffset: number) => void
): void {
	const offset = resolveRgbSplitOffsetPx(
		settings.spectrumRgbSplit,
		settings.spectrumRgbSplitAmount ?? 0,
		referencePx,
		settings.performanceMode,
		barCount
	);
	if (offset <= 0.001) return;

	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	ctx.shadowBlur = 0;
	ctx.lineWidth = lineWidth;
	ctx.globalAlpha = 0.55;
	ctx.strokeStyle = 'rgb(255, 40, 40)';
	tracePath(offset);
	ctx.stroke();
	ctx.strokeStyle = 'rgb(40, 120, 255)';
	tracePath(-offset);
	ctx.stroke();
	ctx.restore();
}
