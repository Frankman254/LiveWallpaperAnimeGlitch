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
	/**
	 * Geometric extents of the full mirror-fill composition (all tiles
	 * unioned) relative to the primary's drawn center. Pure geometry — no
	 * focus, no parallax. `compositionWidth/Height = maxX-minX, maxY-minY`.
	 * UI surfaces that need composition-space math (e.g. dragging the focus
	 * marker) read these.
	 */
	compositionWidth: number;
	compositionHeight: number;
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
	/** Number of mirrored extension rings on each side of the primary image. */
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
const MIRROR_FILL_SEAM_OVERLAP = 3;

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

/**
 * `count` is the LITERAL number of mirror copies added to the primary.
 * count=1 → 1 clone (asymmetric, beside the original); count=2 → 1 left
 * + 1 right (symmetric); count=3 → 2 right + 1 left (asymmetric again);
 * etc. Clones spread alternately right/left starting from the right.
 */
export const MIRROR_FILL_MAX_COUNT = 5;

function sanitizeMirrorFillCount(count: number): number {
	return Math.max(0, Math.min(MIRROR_FILL_MAX_COUNT, Math.round(count)));
}

function getMirrorFillStepXForWidth(width: number): number {
	return Math.max(1, width - MIRROR_FILL_SEAM_OVERLAP);
}

function getMirrorFillCloneDx(index: number): number {
	return index % 2 === 1 ? Math.ceil(index / 2) : -(index / 2);
}

function getMirrorFillRelativeCenterXs(width: number, count: number): number[] {
	const safeCount = sanitizeMirrorFillCount(count);
	const stepX = getMirrorFillStepXForWidth(width);
	const centers = [0];
	for (let i = 1; i <= safeCount; i++) {
		centers.push(getMirrorFillCloneDx(i) * stepX);
	}
	return centers;
}

/**
 * Returns the geometric extents of the full mirror-fill composition (primary
 * + all clones) relative to the primary's center, in pixel space. Pure
 * geometry — no focus, no parallax. Focus is applied AFTER this on the
 * composition as a whole (see resolveImageTransform), since focus is a
 * composition-space concept: (0.5, 0.5) means "center of the entire visible
 * mirrored composition", not "center of the source tile".
 */
function getCompositeUnion({
	width,
	height,
	rotation,
	mirrorFillCount
}: {
	width: number;
	height: number;
	rotation: number;
	mirrorFillCount: number;
}): { minX: number; maxX: number; minY: number; maxY: number } {
	const { halfW, halfH } = getRotatedHalfExtents(width, height, rotation);
	const centers = getMirrorFillRelativeCenterXs(width, mirrorFillCount);
	let minX = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let minY = Number.POSITIVE_INFINITY;
	let maxY = Number.NEGATIVE_INFINITY;

	for (const centerX of centers) {
		minX = Math.min(minX, centerX - halfW);
		maxX = Math.max(maxX, centerX + halfW);
		minY = Math.min(minY, -halfH);
		maxY = Math.max(maxY, halfH);
	}

	return { minX, maxX, minY, maxY };
}

function getCoverageBoundsFromUnion(
	viewportWidth: number,
	viewportHeight: number,
	union: { minX: number; maxX: number; minY: number; maxY: number }
): ImageTransformBounds {
	const minTargetX = viewportWidth - union.maxX;
	const maxTargetX = -union.minX;
	const minTargetY = viewportHeight - union.maxY;
	const maxTargetY = -union.minY;

	const minX = (minTargetX - viewportWidth / 2) / (viewportWidth * 0.5);
	const maxX = (maxTargetX - viewportWidth / 2) / (viewportWidth * 0.5);
	const yA = (viewportHeight / 2 - maxTargetY) / (viewportHeight * 0.5);
	const yB = (viewportHeight / 2 - minTargetY) / (viewportHeight * 0.5);

	return {
		minX: Math.min(minX, maxX),
		maxX: Math.max(minX, maxX),
		minY: Math.min(yA, yB),
		maxY: Math.max(yA, yB)
	};
}

export function resolveMinimumCoverScale(
	viewportWidth: number,
	viewportHeight: number,
	imageWidth: number,
	imageHeight: number,
	fitMode: ImageFitMode = 'cover',
	rotation = 0,
	mirrorFillCount = 0
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
	const safeMirrorFillCount = sanitizeMirrorFillCount(mirrorFillCount);
	let low = 0.01;
	let high = MAX_AUTO_FIT_SCALE;

	for (let i = 0; i < 32; i++) {
		const mid = (low + high) / 2;
		const union = getCompositeUnion({
			width: base.width * mid,
			height: base.height * mid,
			rotation,
			mirrorFillCount: safeMirrorFillCount
		});
		const covers =
			union.maxX - union.minX >= safeViewportWidth &&
			union.maxY - union.minY >= safeViewportHeight;
		if (covers) high = mid;
		else low = mid;
	}

	return clamp(high, 0.01, MAX_AUTO_FIT_SCALE);
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

/**
 * Composition-space focus offset.
 *
 * `focusX/focusY` ∈ [0,1] address a point on the FULL visible composition
 * (the union of the primary tile + all mirror-fill clones). (0.5, 0.5) is
 * the geometric center of that composition. The returned offset is the
 * pixel-space delta from the composition's center to the focus point —
 * `centerX = targetX − focus.x` then places that focus point AT `targetX`.
 *
 * For Mirror Fill OFF, `compositionWidth` equals the source rect's drawn
 * width, so the math reduces to the original "focus on the source image"
 * behaviour exactly.
 *
 * `mirror` only flips the X mapping when the primary itself is horizontally
 * mirrored (Image Mirror toggle). Mirror-fill clones cancel out at the
 * composition level (symmetric expansion), so the composition's geometric
 * center is the same as the primary's center regardless of `count`.
 */
function getFocusOffset(
	compositionWidth: number,
	compositionHeight: number,
	rotation: number,
	mirror: boolean,
	focusX: number | null,
	focusY: number | null
): { x: number; y: number } {
	const focusActive = focusX != null && focusY != null;
	if (!focusActive) return { x: 0, y: 0 };

	const focusLocalX =
		(mirror ? 0.5 - clamp01(focusX) : clamp01(focusX) - 0.5) *
		compositionWidth;
	const focusLocalY = (clamp01(focusY) - 0.5) * compositionHeight;
	const radians = (rotation * Math.PI) / 180;
	const cos = Math.cos(radians);
	const sin = Math.sin(radians);

	return {
		x: focusLocalX * cos - focusLocalY * sin,
		y: focusLocalX * sin + focusLocalY * cos
	};
}

function pushMirrorFillRects(
	drawRects: ImageDrawRect[],
	primary: ImageDrawRect,
	count: number,
	invert: boolean
) {
	if (count <= 0) return;
	const stepX = getMirrorFillStepXForWidth(primary.width);
	// `count` is the literal number of clones. Spread alternately right/left
	// (dx = +1, -1, +2, -2, +3, ...) so count=1 puts one mirror beside the
	// original, count=2 adds the symmetric pair, etc. The primary stays at
	// the user's anchor; the composition expands outward.
	for (let i = 1; i <= count; i++) {
		const dx = getMirrorFillCloneDx(i);
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
	const sanitizedMirrorCount =
		mirrorFill && mirrorFillCount > 0
			? sanitizeMirrorFillCount(mirrorFillCount)
			: 0;

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

	const minScaleForCoverage = resolveMinimumCoverScale(
		safeViewportWidth,
		safeViewportHeight,
		safeImageWidth,
		safeImageHeight,
		fitMode,
		rotation,
		sanitizedMirrorCount
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

	// Composition extents at the clamp scale (no reactive boost). Used to
	// compute coverage bounds + the conservative focus offset for clamping
	// the stored position. The clamp union is pure geometry; focus is
	// applied as a composition-level offset OUTSIDE the union.
	const clampUnion = getCompositeUnion({
		width: clampDrawnWidth,
		height: clampDrawnHeight,
		rotation,
		mirrorFillCount: sanitizedMirrorCount
	});
	const clampCompositionWidth = clampUnion.maxX - clampUnion.minX;
	const clampCompositionHeight = clampUnion.maxY - clampUnion.minY;
	const clampFocusOffset = getFocusOffset(
		clampCompositionWidth,
		clampCompositionHeight,
		rotation,
		mirror,
		focusX,
		focusY
	);
	const bounds = coverageActive
		? getCoverageBoundsFromUnion(
				safeViewportWidth,
				safeViewportHeight,
				{
					minX: clampUnion.minX - clampFocusOffset.x,
					maxX: clampUnion.maxX - clampFocusOffset.x,
					minY: clampUnion.minY - clampFocusOffset.y,
					maxY: clampUnion.maxY - clampFocusOffset.y
				}
			)
		: getBounds(
				safeViewportWidth,
				safeViewportHeight,
				clampDrawnWidth,
				clampDrawnHeight,
				rotation,
				freeBound,
				false
			);
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

	// Composition extents at the actual drawn scale (with reactive boost).
	// Used for the final pixel-space clamp (parallax + bass-grown image gets
	// more room). Focus offset scales with composition so the focus point
	// stays anchored on screen as the image breathes.
	const renderedUnion = getCompositeUnion({
		width: drawnWidth,
		height: drawnHeight,
		rotation,
		mirrorFillCount: sanitizedMirrorCount
	});
	const compositionWidth = renderedUnion.maxX - renderedUnion.minX;
	const compositionHeight = renderedUnion.maxY - renderedUnion.minY;
	const focusOffset = getFocusOffset(
		compositionWidth,
		compositionHeight,
		rotation,
		mirror,
		focusX,
		focusY
	);

	const targetX =
		safeViewportWidth / 2 + effectivePositionX * safeViewportWidth * 0.5;
	const targetY =
		safeViewportHeight / 2 - effectivePositionY * safeViewportHeight * 0.5;
	let rawCenterX = targetX - focusOffset.x + parallaxX;
	let rawCenterY = targetY - focusOffset.y + parallaxY;
	// Keep Covered: the composition (whose extents in pixel space are
	// centerX+union.minX..centerX+union.maxX, regardless of focus) must always
	// reach both viewport edges. centerX already absorbed the focus offset, so
	// the clamp is in pure pixel space against the geometric union.
	if (coverageActive) {
		const minCenterX = safeViewportWidth - renderedUnion.maxX;
		const maxCenterX = -renderedUnion.minX;
		const minCenterY = safeViewportHeight - renderedUnion.maxY;
		const maxCenterY = -renderedUnion.minY;
		rawCenterX = clamp(
			rawCenterX,
			Math.min(minCenterX, maxCenterX),
			Math.max(minCenterX, maxCenterX)
		);
		rawCenterY = clamp(
			rawCenterY,
			Math.min(minCenterY, maxCenterY),
			Math.max(minCenterY, maxCenterY)
		);
	}
	const centerX =
		mirrorFill && sanitizedMirrorCount > 0
			? Math.round(rawCenterX)
			: rawCenterX;
	const centerY =
		mirrorFill && sanitizedMirrorCount > 0
			? Math.round(rawCenterY)
			: rawCenterY;
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
		centerY,
		compositionWidth,
		compositionHeight
	};
}
