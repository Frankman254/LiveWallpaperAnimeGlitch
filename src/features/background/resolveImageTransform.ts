import {
	getLayoutReferenceResolution,
	resolveResponsiveBackgroundTransform
} from '@/features/layout/responsiveLayout';
import type { ImageFitMode, WallpaperState } from '@/types/wallpaper';

export type ImageDrawRect = {
	cx: number;
	cy: number;
	width: number;
	height: number;
	rotation: number;
	mirror: boolean;
	mirrorY?: boolean;
	kind: 'primary' | 'mirror-fill';
};

export type ImageTransformBounds = {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
};

export type ResolvedImageTransform = {
	drawRects: ImageDrawRect[];
	effectiveScale: number;
	effectivePositionX: number;
	effectivePositionY: number;
	effectiveRotation: number;
	minScaleForCoverage: number;
	bounds: ImageTransformBounds;
	warnings: string[];
	baseWidth: number;
	baseHeight: number;
	centerX: number;
	centerY: number;
};

export type ResolveImageTransformParams = {
	viewportWidth: number;
	viewportHeight: number;
	imageWidth: number;
	imageHeight: number;
	fitMode: ImageFitMode;
	scale: number;
	positionX: number;
	positionY: number;
	rotation: number;
	mirror: boolean;
	keepCovered: boolean;
	focusX?: number | null;
	focusY?: number | null;
	mirrorFill?: boolean;
	mirrorFillInvert?: boolean;
	/** Number of mirror clones (>=1). UI default 1. Asymmetric counts (1, 3, 5) form an offset pair; even counts split symmetric around primary. */
	mirrorFillCount?: number;
	reactiveScaleBoost?: number;
	parallaxX?: number;
	parallaxY?: number;
	freeBound?: number;
	layout?: Pick<
		WallpaperState,
		| 'layoutResponsiveEnabled'
		| 'layoutBackgroundReframeEnabled'
		| 'layoutReferenceWidth'
		| 'layoutReferenceHeight'
	>;
};

const MAX_AUTO_FIT_SCALE = 4;

function clamp(value: number, min: number, max: number): number {
	if (max < min) return (min + max) / 2;
	return Math.min(max, Math.max(min, value));
}

function clamp01(value: number): number {
	return clamp(value, 0, 1);
}

export function getImageBaseSize(
	viewportWidth: number,
	viewportHeight: number,
	imageWidth: number,
	imageHeight: number,
	fitMode: ImageFitMode
): { width: number; height: number } {
	const imageAspect = imageWidth / Math.max(imageHeight, 1);
	const viewportAspect = viewportWidth / Math.max(viewportHeight, 1);

	if (fitMode === 'stretch') {
		return { width: viewportWidth, height: viewportHeight };
	}
	if (fitMode === 'fit-width') {
		return {
			width: viewportWidth,
			height: viewportWidth / Math.max(imageAspect, 0.001)
		};
	}
	if (fitMode === 'fit-height') {
		return { width: viewportHeight * imageAspect, height: viewportHeight };
	}
	if (fitMode === 'contain') {
		if (viewportAspect > imageAspect) {
			return {
				width: viewportHeight * imageAspect,
				height: viewportHeight
			};
		}
		return {
			width: viewportWidth,
			height: viewportWidth / Math.max(imageAspect, 0.001)
		};
	}
	if (viewportAspect > imageAspect) {
		return {
			width: viewportWidth,
			height: viewportWidth / Math.max(imageAspect, 0.001)
		};
	}
	return { width: viewportHeight * imageAspect, height: viewportHeight };
}

export function getRotatedHalfExtents(
	width: number,
	height: number,
	rotationDeg: number
): { halfW: number; halfH: number } {
	const radians = (rotationDeg * Math.PI) / 180;
	const cos = Math.abs(Math.cos(radians));
	const sin = Math.abs(Math.sin(radians));
	const halfW = width / 2;
	const halfH = height / 2;
	return {
		halfW: halfW * cos + halfH * sin,
		halfH: halfW * sin + halfH * cos
	};
}

export function resolveMinimumCoverScale(
	viewportWidth: number,
	viewportHeight: number,
	imageWidth: number,
	imageHeight: number,
	fitMode: ImageFitMode = 'cover',
	rotation = 0,
	horizontalTileCount = 1
): number {
	const safeViewportWidth = Math.max(1, viewportWidth);
	const safeViewportHeight = Math.max(1, viewportHeight);
	const base = getImageBaseSize(
		safeViewportWidth,
		safeViewportHeight,
		Math.max(1, imageWidth),
		Math.max(1, imageHeight),
		fitMode
	);
	const radians = ((rotation % 180) * Math.PI) / 180;
	const cos = Math.abs(Math.cos(radians));
	const sin = Math.abs(Math.sin(radians));
	// Mirror fill stacks horizontalTileCount tiles across the X axis, so the
	// horizontal coverage requirement gets divided by that many — the
	// composite covers what a single tile can't.
	const tiles = Math.max(1, horizontalTileCount);
	const requiredImageAxisWidth =
		(safeViewportWidth * cos + safeViewportHeight * sin) / tiles;
	const requiredImageAxisHeight =
		safeViewportWidth * sin + safeViewportHeight * cos;

	return clamp(
		Math.max(
			requiredImageAxisWidth / Math.max(1, base.width),
			requiredImageAxisHeight / Math.max(1, base.height),
			1
		),
		0.01,
		MAX_AUTO_FIT_SCALE
	);
}

function getBounds(
	viewportWidth: number,
	viewportHeight: number,
	drawnWidth: number,
	drawnHeight: number,
	rotation: number,
	freeBound: number,
	keepCovered: boolean
): ImageTransformBounds {
	const { halfW, halfH } = getRotatedHalfExtents(
		drawnWidth,
		drawnHeight,
		rotation
	);
	const overflowX = Math.max(0, halfW - viewportWidth / 2);
	const overflowY = Math.max(0, halfH - viewportHeight / 2);
	const maxNormX = overflowX / (viewportWidth * 0.5);
	const maxNormY = overflowY / (viewportHeight * 0.5);
	if (!keepCovered) {
		// Free mode: small images get the standard `freeBound` headroom (so
		// you can drag them off screen). Larger images get at least the
		// overflow so the user can pan the whole image into view — that's
		// what unblocks Y for tall portraits on a landscape viewport.
		const freeBoundX = Math.max(freeBound, maxNormX);
		const freeBoundY = Math.max(freeBound, maxNormY);
		return {
			minX: -freeBoundX,
			maxX: freeBoundX,
			minY: -freeBoundY,
			maxY: freeBoundY
		};
	}
	return {
		minX: -maxNormX,
		maxX: maxNormX,
		minY: -maxNormY,
		maxY: maxNormY
	};
}

function getFocusOffset(
	drawnWidth: number,
	drawnHeight: number,
	rotation: number,
	mirror: boolean,
	focusX: number | null,
	focusY: number | null
): { x: number; y: number } {
	const focusActive = focusX != null && focusY != null;
	if (!focusActive) return { x: 0, y: 0 };

	const focusLocalX =
		(mirror ? 0.5 - clamp01(focusX) : clamp01(focusX) - 0.5) * drawnWidth;
	const focusLocalY = (clamp01(focusY) - 0.5) * drawnHeight;
	const radians = (rotation * Math.PI) / 180;
	const cos = Math.cos(radians);
	const sin = Math.sin(radians);

	return {
		x: focusLocalX * cos - focusLocalY * sin,
		y: focusLocalX * sin + focusLocalY * cos
	};
}

// Horizontal-only mirror fill. Lays out `count` clones alternating right/left
// starting from the right. Mirror flip alternates by spatial parity (every
// other tile is mirrored), so the composite reads as a continuous kaleidoscope.
//
// A 2px seam overlap + integer rounding kills the anti-aliasing hairline that
// would otherwise show between primary and its clones, especially when the
// audio reactive boost pushes positions onto fractional pixels.
const MIRROR_FILL_SEAM_OVERLAP = 3;

function getMirrorFillStepX(primary: ImageDrawRect): number {
	return Math.max(1, primary.width - MIRROR_FILL_SEAM_OVERLAP);
}

function pushMirrorFillRects(
	drawRects: ImageDrawRect[],
	primary: ImageDrawRect,
	count: number,
	invert: boolean
) {
	if (count <= 0) return;
	const stepX = getMirrorFillStepX(primary);
	// dx is the signed spatial step (positive = right, negative = left). The
	// first clone goes to the right (dx=+1), the second to the left (dx=-1),
	// the third to dx=+2, etc.
	for (let i = 1; i <= count; i++) {
		const dx = i % 2 === 1 ? Math.ceil(i / 2) : -(i / 2);
		const flipX = Math.abs(dx) % 2 === 1;
		const mirrorX = primary.mirror !== flipX;
		drawRects.push({
			...primary,
			cx: Math.round(primary.cx + dx * stepX),
			cy: Math.round(primary.cy),
			width: primary.width,
			height: primary.height,
			mirror: invert ? !mirrorX : mirrorX,
			mirrorY: false,
			kind: 'mirror-fill'
		});
	}
}

// Net horizontal shift the primary needs so the composite is centered on the
// user's anchor. Odd counts have one extra clone on the right, so the primary
// shifts left by half a step. Even counts are spatially symmetric — no shift.
function getMirrorFillCompositeShift(
	count: number,
	stepX: number
): number {
	if (count <= 0) return 0;
	const rightCount = Math.ceil(count / 2);
	const leftCount = Math.floor(count / 2);
	return ((leftCount - rightCount) * stepX) / 2;
}

// Total horizontal extent of the composite (primary + clones).
function getMirrorFillCompositeWidth(
	primaryWidth: number,
	count: number,
	stepX: number
): number {
	if (count <= 0) return primaryWidth;
	const tilesPerSide = Math.max(
		Math.ceil(count / 2),
		Math.floor(count / 2)
	);
	return primaryWidth + 2 * tilesPerSide * stepX;
}

export function resolveImageTransform({
	viewportWidth,
	viewportHeight,
	imageWidth,
	imageHeight,
	fitMode,
	scale,
	positionX,
	positionY,
	rotation,
	mirror,
	keepCovered,
	focusX = null,
	focusY = null,
	mirrorFill = false,
	mirrorFillInvert = false,
	mirrorFillCount = 1,
	reactiveScaleBoost = 0,
	parallaxX = 0,
	parallaxY = 0,
	freeBound = 1,
	layout
}: ResolveImageTransformParams): ResolvedImageTransform {
	const warnings: string[] = [];
	const safeViewportWidth = Math.max(1, viewportWidth);
	const safeViewportHeight = Math.max(1, viewportHeight);
	const safeImageWidth = Math.max(1, imageWidth);
	const safeImageHeight = Math.max(1, imageHeight);
	const base = getImageBaseSize(
		safeViewportWidth,
		safeViewportHeight,
		safeImageWidth,
		safeImageHeight,
		fitMode
	);
	const authoredBaseScale = Math.max(0.01, scale);
	const authoredScale = authoredBaseScale + Math.max(0, reactiveScaleBoost);
	let responsiveBaseScale = authoredBaseScale;
	let resolvedScale = authoredScale;
	let resolvedPositionX = positionX;
	let resolvedPositionY = positionY;

	if (
		layout?.layoutResponsiveEnabled &&
		layout.layoutBackgroundReframeEnabled
	) {
		const reference = getLayoutReferenceResolution(layout);
		const referenceBase = getImageBaseSize(
			reference.width,
			reference.height,
			safeImageWidth,
			safeImageHeight,
			fitMode
		);
		const responsive = resolveResponsiveBackgroundTransform({
			...layout,
			authoredScale,
			authoredPositionX: positionX,
			authoredPositionY: positionY,
			mirror,
			currentViewport: {
				width: safeViewportWidth,
				height: safeViewportHeight
			},
			currentBaseWidth: base.width,
			currentBaseHeight: base.height,
			referenceBaseWidth: referenceBase.width,
			referenceBaseHeight: referenceBase.height
		});
		resolvedScale = responsive.scale;
		resolvedPositionX = responsive.positionX;
		resolvedPositionY = responsive.positionY;
		responsiveBaseScale = resolvedScale - Math.max(0, reactiveScaleBoost);
	}

	// When Mirror Fill is on, the composite spans `mirrorFillCount + 1` tiles
	// across X. Keep Covered treats those tiles as one image, so the primary
	// only needs to satisfy the share of the viewport that ONE tile covers.
	const compositeTileCount =
		mirrorFill && mirrorFillCount > 0 ? mirrorFillCount + 1 : 1;
	const minScaleForCoverage = resolveMinimumCoverScale(
		safeViewportWidth,
		safeViewportHeight,
		safeImageWidth,
		safeImageHeight,
		fitMode,
		rotation,
		compositeTileCount
	);
	const coverageActive = keepCovered;
	const coveredBaseScale = coverageActive
		? Math.max(responsiveBaseScale, minScaleForCoverage)
		: responsiveBaseScale;
	const visibleReactiveBoost = Math.max(
		0,
		resolvedScale - responsiveBaseScale
	);
	const effectiveScale = coverageActive
		? coveredBaseScale + visibleReactiveBoost
		: resolvedScale;
	const clampScale = coverageActive ? coveredBaseScale : effectiveScale;
	const drawnWidth = base.width * effectiveScale;
	const drawnHeight = base.height * effectiveScale;
	const clampDrawnWidth = base.width * clampScale;
	const clampDrawnHeight = base.height * clampScale;

	const centerBounds = getBounds(
		safeViewportWidth,
		safeViewportHeight,
		clampDrawnWidth,
		clampDrawnHeight,
		rotation,
		freeBound,
		coverageActive
	);
	const clampFocusOffset = getFocusOffset(
		clampDrawnWidth,
		clampDrawnHeight,
		rotation,
		mirror,
		focusX,
		focusY
	);
	const bounds = coverageActive
		? {
				minX:
					centerBounds.minX +
					clampFocusOffset.x / (safeViewportWidth * 0.5),
				maxX:
					centerBounds.maxX +
					clampFocusOffset.x / (safeViewportWidth * 0.5),
				minY:
					centerBounds.minY -
					clampFocusOffset.y / (safeViewportHeight * 0.5),
				maxY:
					centerBounds.maxY -
					clampFocusOffset.y / (safeViewportHeight * 0.5)
			}
		: centerBounds;
	const effectivePositionX = clamp(
		resolvedPositionX,
		bounds.minX,
		bounds.maxX
	);
	const effectivePositionY = clamp(
		resolvedPositionY,
		bounds.minY,
		bounds.maxY
	);
	if (
		coverageActive &&
		(effectivePositionX !== resolvedPositionX ||
			effectivePositionY !== resolvedPositionY)
	) {
		warnings.push('position-clamped-for-coverage');
	}
	if (coverageActive && authoredBaseScale < minScaleForCoverage) {
		warnings.push('scale-raised-for-coverage');
	}

	const focusOffset = getFocusOffset(
		drawnWidth,
		drawnHeight,
		rotation,
		mirror,
		focusX,
		focusY
	);

	const targetX =
		safeViewportWidth / 2 + effectivePositionX * safeViewportWidth * 0.5;
	const targetY =
		safeViewportHeight / 2 - effectivePositionY * safeViewportHeight * 0.5;
	const sanitizedMirrorCount = Math.max(
		0,
		Math.min(8, Math.round(mirrorFillCount))
	);
	// Shift the primary so the composite (primary + N clones) is centered on
	// the user's chosen anchor. For odd N, more clones land on the right, so
	// the primary moves left by half a step. Even N is symmetric — no shift.
	const compositeShiftX = mirrorFill
		? getMirrorFillCompositeShift(
				sanitizedMirrorCount,
				Math.max(1, drawnWidth - MIRROR_FILL_SEAM_OVERLAP)
			)
		: 0;
	const centerX =
		mirrorFill && sanitizedMirrorCount > 0
			? Math.round(targetX - focusOffset.x + parallaxX + compositeShiftX)
			: targetX - focusOffset.x + parallaxX;
	const centerY =
		mirrorFill && sanitizedMirrorCount > 0
			? Math.round(targetY - focusOffset.y + parallaxY)
			: targetY - focusOffset.y + parallaxY;
	// Snap width/height to even integers when mirror fill is on so adjacent
	// tile edges land on the same integer pixel grid and the AA hairline at
	// the seam disappears.
	const rectWidth =
		mirrorFill && sanitizedMirrorCount > 0
			? 2 * Math.round(drawnWidth / 2)
			: drawnWidth;
	const rectHeight =
		mirrorFill && sanitizedMirrorCount > 0
			? 2 * Math.round(drawnHeight / 2)
			: drawnHeight;
	const primary: ImageDrawRect = {
		cx: centerX,
		cy: centerY,
		width: rectWidth,
		height: rectHeight,
		rotation,
		mirror,
		kind: 'primary'
	};
	const drawRects = [primary];
	if (mirrorFill && sanitizedMirrorCount > 0) {
		pushMirrorFillRects(
			drawRects,
			primary,
			sanitizedMirrorCount,
			mirrorFillInvert
		);
	}

	return {
		drawRects,
		effectiveScale,
		effectivePositionX,
		effectivePositionY,
		effectiveRotation: rotation,
		minScaleForCoverage,
		bounds,
		warnings,
		baseWidth: base.width,
		baseHeight: base.height,
		centerX,
		centerY
	};
}
