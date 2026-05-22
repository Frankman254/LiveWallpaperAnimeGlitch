import type { ImageFitMode } from '@/types/wallpaper';
import { getBackgroundBaseSize } from '@/components/wallpaper/layers/imageCanvasShared';
import {
	getRotatedHalfExtents,
	resolveMinimumCoverScale
} from '@/lib/backgroundAutoFit';

/**
 * Single source of truth for the "Keep Screen Covered" constraint.
 *
 * Every consumer (live renderer, editor preview, position sliders, drag,
 * auto-fit) resolves the same transform here so they can never disagree.
 * Coverage clamps BOTH scale (>= minScale) and position (so the rotated
 * image AABB always contains the viewport), and is independent of audio
 * reactivity — bass zoom only ever adds scale on top of the covered base,
 * so a pulse can never expose the background.
 */

export type ImageTransformBounds = {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
};

export type ResolvedImageTransform = {
	scale: number;
	positionX: number;
	positionY: number;
	minScale: number;
	bounds: ImageTransformBounds;
};

export type ResolveCoveredImageTransformParams = {
	viewportWidth: number;
	viewportHeight: number;
	imageWidth: number;
	imageHeight: number;
	scale: number;
	rotation: number;
	positionX: number;
	positionY: number;
	fitMode: ImageFitMode;
	keepCovered: boolean;
	/** Position slider extent used when coverage is OFF. Defaults to 1. */
	freeBound?: number;
};

function clamp(value: number, min: number, max: number): number {
	if (max < min) return (min + max) / 2;
	return Math.min(max, Math.max(min, value));
}

export function resolveCoveredImageTransform({
	viewportWidth,
	viewportHeight,
	imageWidth,
	imageHeight,
	scale,
	rotation,
	positionX,
	positionY,
	fitMode,
	keepCovered,
	freeBound = 1
}: ResolveCoveredImageTransformParams): ResolvedImageTransform {
	const safeViewportWidth = Math.max(1, viewportWidth);
	const safeViewportHeight = Math.max(1, viewportHeight);
	const safeImageWidth = Math.max(1, imageWidth);
	const safeImageHeight = Math.max(1, imageHeight);

	const minScale = resolveMinimumCoverScale(
		safeViewportWidth,
		safeViewportHeight,
		safeImageWidth,
		safeImageHeight,
		fitMode,
		rotation
	);

	if (!keepCovered) {
		return {
			scale,
			positionX,
			positionY,
			minScale,
			bounds: {
				minX: -freeBound,
				maxX: freeBound,
				minY: -freeBound,
				maxY: freeBound
			}
		};
	}

	const effectiveScale = Math.max(scale, minScale);
	const base = getBackgroundBaseSize(
		safeViewportWidth,
		safeViewportHeight,
		safeImageWidth,
		safeImageHeight,
		fitMode
	);
	const drawnWidth = base.width * effectiveScale;
	const drawnHeight = base.height * effectiveScale;
	const { halfW, halfH } = getRotatedHalfExtents(
		drawnWidth,
		drawnHeight,
		rotation
	);

	// Overflow margin: how far the image center can stray from the viewport
	// center while still covering it. Clamp at 0 (no slack when exactly fit).
	const overflowX = Math.max(0, halfW - safeViewportWidth / 2);
	const overflowY = Math.max(0, halfH - safeViewportHeight / 2);

	// Position is normalized: positionX * (viewportWidth * 0.5) is the pixel
	// nudge from viewport center. Legal center offset for coverage is ±overflow,
	// so the normalized bound is overflow / (viewport * 0.5).
	const maxNormX = overflowX / (safeViewportWidth * 0.5);
	const maxNormY = overflowY / (safeViewportHeight * 0.5);

	return {
		scale: effectiveScale,
		positionX: clamp(positionX, -maxNormX, maxNormX),
		positionY: clamp(positionY, -maxNormY, maxNormY),
		minScale,
		bounds: { minX: -maxNormX, maxX: maxNormX, minY: -maxNormY, maxY: maxNormY }
	};
}
