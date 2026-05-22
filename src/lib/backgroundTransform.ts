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
	focusX: number | null;
	focusY: number | null;
	fitMode: ImageFitMode;
	keepCovered: boolean;
	mirror?: boolean;
	/** Position slider extent used when coverage is OFF. Defaults to 1. */
	freeBound?: number;
};

function clamp(value: number, min: number, max: number): number {
	if (max < min) return (min + max) / 2;
	return Math.min(max, Math.max(min, value));
}

/**
 * The pixel offset (from image center) at which the focus point lands, in
 * viewport space, after scaling and rotation. The renderer shifts the image
 * by `-focusOffset` so the focus point sits at the viewport center when
 * position is zero. Coverage bounds must follow that shift.
 */
function getFocusOffsetPx(
	focusX: number | null,
	focusY: number | null,
	drawnWidth: number,
	drawnHeight: number,
	rotationDeg: number,
	mirror: boolean
): { x: number; y: number } {
	if (focusX == null || focusY == null) return { x: 0, y: 0 };
	const radians = (rotationDeg * Math.PI) / 180;
	const cos = Math.cos(radians);
	const sin = Math.sin(radians);
	const localX = (mirror ? 0.5 - focusX : focusX - 0.5) * drawnWidth;
	const localY = (focusY - 0.5) * drawnHeight;
	return {
		x: localX * cos - localY * sin,
		y: localX * sin + localY * cos
	};
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
	focusX,
	focusY,
	fitMode,
	keepCovered,
	mirror = false,
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

	const focusOffset = getFocusOffsetPx(
		focusX,
		focusY,
		drawnWidth,
		drawnHeight,
		rotation,
		mirror
	);

	// Position is normalized: positionX * (viewportWidth * 0.5) is the pixel
	// nudge. The renderer's center is `vp/2 - focusOffset + posPx`, so for
	// coverage the legal center offset is ±overflow, which maps back to:
	//   posPx ∈ [focusOffset - overflow, focusOffset + overflow]   (X)
	//   posPx ∈ [-focusOffset - overflow, -focusOffset + overflow] (Y, sign flip)
	const halfViewportWidthPx = safeViewportWidth * 0.5;
	const halfViewportHeightPx = safeViewportHeight * 0.5;
	const minX = (focusOffset.x - overflowX) / halfViewportWidthPx;
	const maxX = (focusOffset.x + overflowX) / halfViewportWidthPx;
	const minY = (-focusOffset.y - overflowY) / halfViewportHeightPx;
	const maxY = (-focusOffset.y + overflowY) / halfViewportHeightPx;

	return {
		scale: effectiveScale,
		positionX: clamp(positionX, minX, maxX),
		positionY: clamp(positionY, minY, maxY),
		minScale,
		bounds: { minX, maxX, minY, maxY }
	};
}
