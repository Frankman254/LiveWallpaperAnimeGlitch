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
	rotation = 0
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
	const requiredImageAxisWidth =
		safeViewportWidth * cos + safeViewportHeight * sin;
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
	if (!keepCovered) {
		return {
			minX: -freeBound,
			maxX: freeBound,
			minY: -freeBound,
			maxY: freeBound
		};
	}
	const { halfW, halfH } = getRotatedHalfExtents(
		drawnWidth,
		drawnHeight,
		rotation
	);
	const overflowX = Math.max(0, halfW - viewportWidth / 2);
	const overflowY = Math.max(0, halfH - viewportHeight / 2);
	const maxNormX = overflowX / (viewportWidth * 0.5);
	const maxNormY = overflowY / (viewportHeight * 0.5);
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

function pushMirrorFillRects(
	drawRects: ImageDrawRect[],
	primary: ImageDrawRect,
	viewportWidth: number,
	viewportHeight: number,
	invert: boolean
) {
	const spacingX = primary.width;
	const spacingY = primary.height;
	const fillHorizontal =
		primary.width < viewportWidth || primary.width >= primary.height;
	const steps = [-2, -1, 1, 2];
	for (const step of steps) {
		const offset = step * (fillHorizontal ? spacingX : spacingY);
		drawRects.push({
			...primary,
			cx: fillHorizontal ? primary.cx + offset : primary.cx,
			cy: fillHorizontal ? primary.cy : primary.cy + offset,
			mirror: invert ? primary.mirror : !primary.mirror,
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

	const minScaleForCoverage = resolveMinimumCoverScale(
		safeViewportWidth,
		safeViewportHeight,
		safeImageWidth,
		safeImageHeight,
		fitMode,
		rotation
	);
	const coveredBaseScale = keepCovered
		? Math.max(responsiveBaseScale, minScaleForCoverage)
		: responsiveBaseScale;
	const visibleReactiveBoost = Math.max(
		0,
		resolvedScale - responsiveBaseScale
	);
	const effectiveScale = keepCovered
		? coveredBaseScale + visibleReactiveBoost
		: resolvedScale;
	const clampScale = keepCovered ? coveredBaseScale : effectiveScale;
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
		keepCovered
	);
	const clampFocusOffset = getFocusOffset(
		clampDrawnWidth,
		clampDrawnHeight,
		rotation,
		mirror,
		focusX,
		focusY
	);
	const bounds = keepCovered
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
		keepCovered &&
		(effectivePositionX !== resolvedPositionX ||
			effectivePositionY !== resolvedPositionY)
	) {
		warnings.push('position-clamped-for-coverage');
	}
	if (keepCovered && authoredBaseScale < minScaleForCoverage) {
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
	const centerX = targetX - focusOffset.x + parallaxX;
	const centerY = targetY - focusOffset.y + parallaxY;
	const primary: ImageDrawRect = {
		cx: centerX,
		cy: centerY,
		width: drawnWidth,
		height: drawnHeight,
		rotation,
		mirror,
		kind: 'primary'
	};
	const drawRects = [primary];
	if (mirrorFill) {
		pushMirrorFillRects(
			drawRects,
			primary,
			safeViewportWidth,
			safeViewportHeight,
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
