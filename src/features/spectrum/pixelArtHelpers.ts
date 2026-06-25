import type { SpectrumShape } from '@/types/wallpaper';

/** Rounds and clamps pixelate grid scale (px per block). */
export function normalizePixelateScale(scale: number | undefined): number {
	return Math.max(1, Math.round(scale ?? 1));
}

export function isPixelatePostProcessActive(settings: {
	spectrumPixelate?: boolean;
	spectrumPixelateScale?: number;
}): boolean {
	const pixelScale = normalizePixelateScale(settings.spectrumPixelateScale);
	return Boolean(settings.spectrumPixelate) && pixelScale > 1;
}

export function computePixelateSmallSize(
	width: number,
	height: number,
	scale: number
): { width: number; height: number } {
	const s = Math.max(1, scale);
	return {
		width: Math.max(1, Math.floor(width / s)),
		height: Math.max(1, Math.floor(height / s))
	};
}

export function resolveClassicRadialShapeFallback(
	shape: SpectrumShape
): SpectrumShape {
	return shape;
}

export function quantizePixelBarCells(
	height: number,
	cellPitch: number,
	maxCells = 256
): number {
	if (cellPitch <= 0) return 0;
	return Math.min(maxCells, Math.floor(height / cellPitch));
}
