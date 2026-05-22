import type { CSSProperties } from 'react';
import type { BackgroundImageLayer, OverlayImageLayer } from '@/types/layers';
import type { FilterTarget, WallpaperState } from '@/types/wallpaper';
import {
	getLayoutReferenceResolution,
	resolveResponsiveBackgroundTransform
} from '@/features/layout/responsiveLayout';
import { resolveMinimumCoverScale } from '@/lib/backgroundAutoFit';
import { getLruEntry, setLruEntry } from '@/lib/lruCache';

export type ImageLayer = BackgroundImageLayer | OverlayImageLayer;
export type BackgroundImageSnapshot = Pick<
	BackgroundImageLayer,
	| 'scale'
	| 'positionX'
	| 'positionY'
	| 'fitMode'
	| 'focusX'
	| 'focusY'
	| 'coverageLockEnabled'
	| 'mirror'
	| 'rotation'
>;
export type BackgroundTransitionSnapshot = Pick<
	BackgroundImageLayer,
	| 'transitionType'
	| 'transitionDuration'
	| 'transitionIntensity'
	| 'transitionAudioDrive'
>;
export type LayerRect = {
	cx: number;
	cy: number;
	width: number;
	height: number;
};

type ResponsiveLayoutOptions = Pick<
	WallpaperState,
	| 'layoutResponsiveEnabled'
	| 'layoutBackgroundReframeEnabled'
	| 'layoutReferenceWidth'
	| 'layoutReferenceHeight'
>;

const IMAGE_CACHE_LIMIT = 10;
const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(
	url: string,
	onReady: (image: HTMLImageElement) => void
): HTMLImageElement {
	const cached = getLruEntry(imageCache, url);
	if (cached) {
		if (cached.complete && cached.naturalWidth > 0) onReady(cached);
		else cached.onload = () => onReady(cached);
		return cached;
	}

	const image = new Image();
	image.decoding = 'async';
	image.src = url;
	image.onload = () => onReady(image);
	setLruEntry(imageCache, url, image, IMAGE_CACHE_LIMIT);
	return image;
}

export function getBackgroundBaseSize(
	canvasWidth: number,
	canvasHeight: number,
	imageWidth: number,
	imageHeight: number,
	fitMode: BackgroundImageLayer['fitMode']
): { width: number; height: number } {
	const imageAspect = imageWidth / Math.max(imageHeight, 1);
	const canvasAspect = canvasWidth / Math.max(canvasHeight, 1);

	if (fitMode === 'stretch') {
		return { width: canvasWidth, height: canvasHeight };
	}

	if (fitMode === 'fit-width') {
		return {
			width: canvasWidth,
			height: canvasWidth / Math.max(imageAspect, 0.001)
		};
	}

	if (fitMode === 'fit-height') {
		return { width: canvasHeight * imageAspect, height: canvasHeight };
	}

	if (fitMode === 'contain') {
		if (canvasAspect > imageAspect) {
			return { width: canvasHeight * imageAspect, height: canvasHeight };
		}
		return {
			width: canvasWidth,
			height: canvasWidth / Math.max(imageAspect, 0.001)
		};
	}

	if (canvasAspect > imageAspect) {
		return {
			width: canvasWidth,
			height: canvasWidth / Math.max(imageAspect, 0.001)
		};
	}
	return { width: canvasHeight * imageAspect, height: canvasHeight };
}

export function getLayerRect(
	layer: ImageLayer,
	canvasWidth: number,
	canvasHeight: number,
	image: HTMLImageElement,
	bassBoost: number,
	parallaxX: number,
	parallaxY: number,
	layout?: ResponsiveLayoutOptions
): { cx: number; cy: number; width: number; height: number } {
	if (layer.type === 'background-image') {
		return getBackgroundRectFromSnapshot(
			canvasWidth,
			canvasHeight,
			image,
			{
				scale: layer.scale,
				positionX: layer.positionX,
				positionY: layer.positionY,
				fitMode: layer.fitMode,
				focusX: layer.focusX,
				focusY: layer.focusY,
				coverageLockEnabled: layer.coverageLockEnabled,
				mirror: layer.mirror,
				rotation: layer.rotation
			},
			bassBoost,
			parallaxX,
			parallaxY,
			layout
		);
	}

	return {
		cx: canvasWidth / 2 + layer.positionX * canvasWidth,
		cy: canvasHeight / 2 - layer.positionY * canvasHeight,
		width: layer.width * layer.scale,
		height: layer.height * layer.scale
	};
}

export function getBackgroundRectFromSnapshot(
	canvasWidth: number,
	canvasHeight: number,
	image: HTMLImageElement,
	snapshot: BackgroundImageSnapshot,
	bassBoost: number,
	parallaxX: number,
	parallaxY: number,
	layout?: ResponsiveLayoutOptions
): { cx: number; cy: number; width: number; height: number } {
	const base = getBackgroundBaseSize(
		canvasWidth,
		canvasHeight,
		image.naturalWidth || canvasWidth,
		image.naturalHeight || canvasHeight,
		snapshot.fitMode
	);
	const authoredBaseScale = Math.max(0.01, snapshot.scale);
	const reactiveScaleBoost = Math.max(0, bassBoost);
	const authoredScale = authoredBaseScale + reactiveScaleBoost;
	let scale = authoredScale;
	let positionX = snapshot.positionX;
	let positionY = snapshot.positionY;
	let responsiveBaseScale = authoredBaseScale;
	const focusActive = snapshot.focusX != null && snapshot.focusY != null;
	if (
		layout?.layoutResponsiveEnabled &&
		layout.layoutBackgroundReframeEnabled
	) {
		const reference = getLayoutReferenceResolution(layout);
		const referenceBase = getBackgroundBaseSize(
			reference.width,
			reference.height,
			image.naturalWidth || reference.width,
			image.naturalHeight || reference.height,
			snapshot.fitMode
		);
		const responsiveTransform = resolveResponsiveBackgroundTransform({
			...layout,
			authoredScale,
			authoredPositionX: snapshot.positionX,
			authoredPositionY: snapshot.positionY,
			mirror: snapshot.mirror,
			currentViewport: { width: canvasWidth, height: canvasHeight },
			currentBaseWidth: base.width,
			currentBaseHeight: base.height,
			referenceBaseWidth: referenceBase.width,
			referenceBaseHeight: referenceBase.height
		});
		scale = responsiveTransform.scale;
		positionX = responsiveTransform.positionX;
		positionY = responsiveTransform.positionY;

		if (snapshot.coverageLockEnabled && reactiveScaleBoost > 0) {
			responsiveBaseScale = resolveResponsiveBackgroundTransform({
				...layout,
				authoredScale: authoredBaseScale,
				authoredPositionX: snapshot.positionX,
				authoredPositionY: snapshot.positionY,
				mirror: snapshot.mirror,
				currentViewport: { width: canvasWidth, height: canvasHeight },
				currentBaseWidth: base.width,
				currentBaseHeight: base.height,
				referenceBaseWidth: referenceBase.width,
				referenceBaseHeight: referenceBase.height
			}).scale;
		} else {
			responsiveBaseScale = scale - reactiveScaleBoost;
		}
	}
	if (snapshot.coverageLockEnabled) {
		const coverScale = resolveMinimumCoverScale(
			canvasWidth,
			canvasHeight,
			image.naturalWidth || canvasWidth,
			image.naturalHeight || canvasHeight,
			snapshot.fitMode,
			snapshot.rotation
		);
		const visibleReactiveBoost = Math.max(0, scale - responsiveBaseScale);
		scale =
			Math.max(responsiveBaseScale, coverScale) + visibleReactiveBoost;
	}
	const drawnWidth = base.width * scale;
	const drawnHeight = base.height * scale;
	if (focusActive) {
		const focusX = snapshot.focusX ?? 0.5;
		const focusY = snapshot.focusY ?? 0.5;
		const radians = (snapshot.rotation * Math.PI) / 180;
		const cos = Math.cos(radians);
		const sin = Math.sin(radians);
		const localX =
			(snapshot.mirror ? 0.5 - focusX : focusX - 0.5) * drawnWidth;
		const localY = (focusY - 0.5) * drawnHeight;
		const rotatedX = localX * cos - localY * sin;
		const rotatedY = localX * sin + localY * cos;
		return {
			cx:
				canvasWidth / 2 -
				rotatedX +
				positionX * canvasWidth * 0.5 +
				parallaxX,
			cy:
				canvasHeight / 2 -
				rotatedY -
				positionY * canvasHeight * 0.5 +
				parallaxY,
			width: drawnWidth,
			height: drawnHeight
		};
	}
	return {
		cx: canvasWidth / 2 + positionX * canvasWidth * 0.5 + parallaxX,
		cy: canvasHeight / 2 - positionY * canvasHeight * 0.5 + parallaxY,
		width: drawnWidth,
		height: drawnHeight
	};
}

export function targetMatches(
	layer: ImageLayer,
	filterTargets: FilterTarget[],
	selectedOverlayId: string | null
): boolean {
	if (layer.type === 'background-image') {
		return filterTargets.includes('background');
	}

	return (
		filterTargets.includes('selected-overlay') &&
		layer.id === selectedOverlayId
	);
}

export function getCanvasBlendMode(
	layer: ImageLayer
): CSSProperties['mixBlendMode'] {
	if (layer.type !== 'overlay-image') return 'normal';
	if (layer.blendMode === 'screen') return 'screen';
	if (layer.blendMode === 'lighten') return 'lighten';
	if (layer.blendMode === 'multiply') return 'multiply';
	return 'normal';
}
