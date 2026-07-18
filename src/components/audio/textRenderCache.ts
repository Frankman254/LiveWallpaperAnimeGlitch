/**
 * Shared helpers for offscreen text-render caches (track title, lyrics).
 *
 * Text with glow is expensive to draw per frame (canvas shadowBlur rasterizes
 * a full blur kernel per glyph), so overlays render each line ONCE to an
 * offscreen canvas keyed by its style and then just blit it every frame.
 */

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function createOffscreenCanvas(
	width: number,
	height: number
): HTMLCanvasElement | null {
	if (typeof document === 'undefined') return null;
	const canvas = document.createElement('canvas');
	canvas.width = Math.max(1, Math.ceil(width));
	canvas.height = Math.max(1, Math.ceil(height));
	return canvas;
}

/** Supersampling factor for cached text so it stays crisp when scaled. */
export function getTextRenderScale(): number {
	if (typeof window === 'undefined') return 1;
	return clamp(window.devicePixelRatio || 1, 1, 2);
}
