import type { ImageFitMode } from '@/types/wallpaper';
import {
	getRotatedHalfExtents,
	resolveMinimumCoverScale
} from '@/features/background/resolveImageTransform';

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
	// Contain base: the neutral scale (1.0) lands at the natural minimal fit and
	// Keep Covered (which only ever raises scale) won't over-zoom. The returned
	// scale below is the minimum-cover scale relative to the contain base, so the
	// drawn pixels are identical to the old cover behavior — the difference is the
	// image stays in 'contain' so subsequent neutral edits don't blow it up.
	const fitMode: ImageFitMode = 'contain';
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
