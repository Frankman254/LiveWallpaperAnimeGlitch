import type { ImageFitMode } from '@/types/wallpaper';
import {
	getRotatedHalfExtents,
	resolveMinimumCoverScale
} from './resolveImageTransform';

export type AutoFitResult = {
	fitMode: ImageFitMode;
	scale: number;
	positionX: number;
	positionY: number;
};

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/**
 * Renderer-side safety clamp: pull a resolved image-rect center back inside
 * the coverage bounds. `drawnWidth`/`drawnHeight` should be the *non-reactive*
 * drawn size — bass zoom only grows the image, so clamping against the smaller
 * base keeps a pulse safe.
 */
export function clampCoveredCenterPx({
	cx,
	cy,
	viewportWidth,
	viewportHeight,
	drawnWidth,
	drawnHeight,
	rotation
}: {
	cx: number;
	cy: number;
	viewportWidth: number;
	viewportHeight: number;
	drawnWidth: number;
	drawnHeight: number;
	rotation: number;
}): { cx: number; cy: number } {
	const { halfW, halfH } = getRotatedHalfExtents(
		drawnWidth,
		drawnHeight,
		rotation
	);
	const overflowX = Math.max(0, halfW - viewportWidth / 2);
	const overflowY = Math.max(0, halfH - viewportHeight / 2);
	return {
		cx: clamp(
			cx,
			viewportWidth / 2 - overflowX,
			viewportWidth / 2 + overflowX
		),
		cy: clamp(
			cy,
			viewportHeight / 2 - overflowY,
			viewportHeight / 2 + overflowY
		)
	};
}

export function suggestBackgroundAutoFit(
	viewportWidth: number,
	viewportHeight: number,
	imageWidth: number,
	imageHeight: number,
	rotation = 0,
	mirrorFillDepth = 0
): AutoFitResult {
	const safeViewportWidth = Math.max(1, viewportWidth);
	const safeViewportHeight = Math.max(1, viewportHeight);
	const safeImageWidth = Math.max(1, imageWidth);
	const safeImageHeight = Math.max(1, imageHeight);
	// Cover base: Keep Covered means the image must always bleed past the
	// viewport edges, so the stored fitMode must say what is actually drawn
	// (a full-bleed crop), not the bookkeeping base used to derive it. A
	// 'contain' base would store a fake inflated scale (e.g. 3.5x on a
	// portrait image in a landscape viewport) that is identical in pixels
	// but dishonest in the UI and makes every later neutral edit (scale
	// reset -> 1) break coverage. With 'cover', rotation 0 resolves to
	// exactly 1.0 — clean, honest, and auto-fit == the natural cover fit.
	const fitMode: ImageFitMode = 'cover';
	const scale = resolveMinimumCoverScale(
		safeViewportWidth,
		safeViewportHeight,
		safeImageWidth,
		safeImageHeight,
		fitMode,
		rotation,
		mirrorFillDepth
	);

	return {
		fitMode,
		scale,
		positionX: 0,
		positionY: 0
	};
}

export function loadImageDimensions(
	url: string
): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.decoding = 'async';
		image.onload = () => {
			resolve({
				width: image.naturalWidth || image.width,
				height: image.naturalHeight || image.height
			});
		};
		image.onerror = () => reject(new Error('image-dimensions-failed'));
		image.src = url;
	});
}
