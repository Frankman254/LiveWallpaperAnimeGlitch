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

/**
 * Downscale `source` to 1/scale into `small`, then upscale it back onto
 * `outCtx` with smoothing off — hard square pixels, no allocation of its own.
 *
 * Shared by the spectrum-wide pixelate post-process (whole scene) and the
 * per-liquid-layer pass (one layer at a time), so both produce the exact same
 * grid instead of two lookalike implementations.
 */
export function blitPixelated(
	outCtx: CanvasRenderingContext2D,
	source: HTMLCanvasElement,
	small: HTMLCanvasElement | null
): void {
	const w = source.width;
	const h = source.height;
	const smallCtx = small?.getContext('2d') ?? null;
	if (!small || !smallCtx) {
		outCtx.drawImage(source, 0, 0);
		return;
	}
	const sw = small.width;
	const sh = small.height;
	smallCtx.clearRect(0, 0, sw, sh);
	smallCtx.imageSmoothingEnabled = true; // average colors on the way down
	smallCtx.drawImage(source, 0, 0, w, h, 0, 0, sw, sh);
	outCtx.save();
	outCtx.imageSmoothingEnabled = false; // hard blocky pixels on the way up
	outCtx.drawImage(small, 0, 0, sw, sh, 0, 0, w, h);
	outCtx.restore();
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
