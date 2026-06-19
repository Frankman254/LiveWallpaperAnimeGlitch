import type { SpectrumLinearOrientation } from '@/types/wallpaper';
import type { SpectrumSettings } from '../runtime/spectrumRuntime';
import {
	resolveRgbSplitAlpha,
	resolveRgbSplitOffsetPx
} from './spectrumFxBudget';

function readRgbSplitAmount(settings: SpectrumSettings): number {
	return settings.spectrumRgbSplitAmount ?? 0;
}

/**
 * Linear wave RGB split — fringes perpendicular to trace orientation.
 * Draw BEFORE the main trace so the center line stays clean.
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
	const amount = readRgbSplitAmount(settings);
	const offset = resolveRgbSplitOffsetPx(
		settings.spectrumRgbSplit,
		amount,
		referencePx,
		settings.performanceMode,
		barCount
	);
	if (offset <= 0.001) return;

	const alpha = resolveRgbSplitAlpha(amount);
	const shiftX = orientation === 'vertical' ? offset : 0;
	const shiftY = orientation === 'vertical' ? 0 : offset;
	const fringeWidth = Math.max(lineWidth, lineWidth * 1.08);

	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	ctx.shadowBlur = 0;
	ctx.shadowColor = 'transparent';
	ctx.lineWidth = fringeWidth;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.globalAlpha *= alpha;
	ctx.strokeStyle = 'rgb(255, 48, 48)';
	ctx.save();
	ctx.translate(shiftX, shiftY);
	tracePath();
	ctx.stroke();
	ctx.restore();
	ctx.strokeStyle = 'rgb(48, 120, 255)';
	ctx.save();
	ctx.translate(-shiftX, -shiftY);
	tracePath();
	ctx.stroke();
	ctx.restore();
	ctx.restore();
}

/**
 * Radial wave RGB split — red outside, blue inside the closed trace.
 * Draw BEFORE main trace; fill is already committed underneath.
 */
export function drawRadialRgbSplitPass(
	ctx: CanvasRenderingContext2D,
	settings: SpectrumSettings,
	referencePx: number,
	barCount: number,
	lineWidth: number,
	tracePath: (radiusOffset: number) => void
): void {
	const amount = readRgbSplitAmount(settings);
	const offset = resolveRgbSplitOffsetPx(
		settings.spectrumRgbSplit,
		amount,
		referencePx,
		settings.performanceMode,
		barCount
	);
	if (offset <= 0.001) return;

	const alpha = resolveRgbSplitAlpha(amount);
	const fringeWidth = Math.max(lineWidth, lineWidth * 1.08);

	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	ctx.shadowBlur = 0;
	ctx.shadowColor = 'transparent';
	ctx.lineWidth = fringeWidth;
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.globalAlpha *= alpha;
	ctx.strokeStyle = 'rgb(255, 48, 48)';
	tracePath(offset);
	ctx.stroke();
	ctx.strokeStyle = 'rgb(48, 120, 255)';
	tracePath(-offset);
	ctx.stroke();
	ctx.restore();
}
