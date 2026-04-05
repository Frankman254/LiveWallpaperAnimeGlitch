import type { CSSProperties } from 'react';
import type { BackgroundImageLayer, OverlayImageLayer } from '@/types/layers';
import type { FilterTarget } from '@/types/wallpaper';

export type ImageLayer = BackgroundImageLayer | OverlayImageLayer;
export type BackgroundImageSnapshot = Pick<
	BackgroundImageLayer,
	'scale' | 'positionX' | 'positionY' | 'fitMode' | 'mirror'
>;
export type BackgroundTransitionSnapshot = Pick<
	BackgroundImageLayer,
	| 'transitionType'
	| 'transitionDuration'
	| 'transitionIntensity'
	| 'transitionAudioDrive'
>;

const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(
	url: string,
	onReady: (image: HTMLImageElement) => void
): HTMLImageElement {
	const cached = imageCache.get(url);
	if (cached) {
		if (cached.complete && cached.naturalWidth > 0) onReady(cached);
		else cached.onload = () => onReady(cached);
		return cached;
	}

	const image = new Image();
	image.decoding = 'async';
	image.src = url;
	image.onload = () => onReady(image);
	imageCache.set(url, image);
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
	parallaxY: number
): { cx: number; cy: number; width: number; height: number } {
	if (layer.type === 'background-image') {
		const base = getBackgroundBaseSize(
			canvasWidth,
			canvasHeight,
			image.naturalWidth || canvasWidth,
			image.naturalHeight || canvasHeight,
			layer.fitMode
		);

		const scale = Math.max(0.01, layer.scale + bassBoost);
		return {
			cx:
				canvasWidth / 2 +
				layer.positionX * canvasWidth * 0.5 +
				parallaxX,
			cy:
				canvasHeight / 2 -
				layer.positionY * canvasHeight * 0.5 +
				parallaxY,
			width: base.width * scale,
			height: base.height * scale
		};
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
	parallaxY: number
): { cx: number; cy: number; width: number; height: number } {
	const base = getBackgroundBaseSize(
		canvasWidth,
		canvasHeight,
		image.naturalWidth || canvasWidth,
		image.naturalHeight || canvasHeight,
		snapshot.fitMode
	);

	const scale = Math.max(0.01, snapshot.scale + bassBoost);
	return {
		cx:
			canvasWidth / 2 +
			snapshot.positionX * canvasWidth * 0.5 +
			parallaxX,
		cy:
			canvasHeight / 2 -
			snapshot.positionY * canvasHeight * 0.5 +
			parallaxY,
		width: base.width * scale,
		height: base.height * scale
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
