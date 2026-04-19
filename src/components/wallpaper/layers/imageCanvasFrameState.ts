import type { AudioEnvelope } from '@/utils/audioEnvelope';
import { clamp, lerp } from '@/lib/math';
import { getScanlineAmount } from './imageCanvasEffects';
import type { BackgroundImageLayer } from '@/types/layers';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import type { ImageLayer } from './imageCanvasShared';

export type ParallaxOffset = {
	parallaxX: number;
	parallaxY: number;
};

export type BackgroundAudioMetrics = {
	bassBoost: number;
	envelopeNormalized: number;
	envelopeSmoothed: number;
	adaptivePeak: number;
	adaptiveFloor: number;
};

export type LayerFilterMetrics = {
	brightness: number;
	contrast: number;
	saturation: number;
	blur: number;
	hue: number;
	colorFilter: string;
	rgbShiftPixels: number;
	scanlineAmount: number;
	filmNoiseAmount: number;
	vignetteAmount: number;
	bloomAmount: number;
	lumaThreshold: number;
	lensWarpAmount: number;
	heatDistortionAmount: number;
};

export function resolveActiveImageLayer(
	currentLayer: ImageLayer,
	state: WallpaperStore
): ImageLayer {
	if (currentLayer.type !== 'background-image') return currentLayer;

	return {
		...currentLayer,
		enabled: state.backgroundImageEnabled,
		imageUrl: state.imageUrl,
		scale: state.imageScale,
		positionX: state.imagePositionX,
		positionY: state.imagePositionY,
		opacity: state.imageOpacity,
		fitMode: state.imageFitMode,
		mirror: state.imageMirror,
		rotation: state.imageRotation,
		transitionType: state.slideshowTransitionType,
		transitionDuration: state.slideshowTransitionDuration,
		transitionIntensity: state.slideshowTransitionIntensity,
		transitionAudioDrive: state.slideshowTransitionAudioDrive,
		audioReactiveConfig: {
			...currentLayer.audioReactiveConfig,
			enabled: state.imageBassReactive,
			sensitivity: state.imageBassScaleIntensity,
			channel: state.imageAudioChannel
		}
	};
}

export function smoothMouseMotion(
	current: { x: number; y: number },
	target: { x: number; y: number },
	factor = 0.05
): { x: number; y: number } {
	return {
		x: lerp(current.x, target.x, factor),
		y: lerp(current.y, target.y, factor)
	};
}

export function resolveParallaxOffset(
	layer: ImageLayer,
	state: WallpaperStore,
	smoothedMouse: { x: number; y: number },
	canvasWidth: number,
	canvasHeight: number
): ParallaxOffset {
	if (layer.type !== 'background-image') {
		return { parallaxX: 0, parallaxY: 0 };
	}

	return {
		parallaxX:
			smoothedMouse.x * state.parallaxStrength * canvasWidth * 0.08,
		parallaxY:
			smoothedMouse.y * state.parallaxStrength * canvasHeight * 0.08
	};
}

export function resolveBackgroundAudioMetrics(
	layer: BackgroundImageLayer,
	state: WallpaperStore,
	imageChannelValue: number,
	dt: number,
	envelope: AudioEnvelope
): BackgroundAudioMetrics {
	if (!layer.audioReactiveConfig?.enabled) {
		return {
			bassBoost: 0,
			envelopeNormalized: 0,
			envelopeSmoothed: 0,
			adaptivePeak: 0,
			adaptiveFloor: 0
		};
	}

	const env = envelope.tick(imageChannelValue, Math.max(dt, 1 / 120), {
		attack: state.imageBassAttack,
		release: state.imageBassRelease,
		responseSpeed: state.imageBassReactivitySpeed * 2.4,
		peakWindow: state.imageBassPeakWindow,
		peakFloor: state.imageBassPeakFloor,
		punch: state.imageBassPunch,
		scaleIntensity: state.imageBassReactiveScaleIntensity,
		min: 0,
		max: layer.audioReactiveConfig.sensitivity ?? 0
	});

	return {
		bassBoost: env.value,
		envelopeNormalized: env.normalizedAmplitude,
		envelopeSmoothed: env.smoothedAmplitude,
		adaptivePeak: env.adaptivePeak,
		adaptiveFloor: env.adaptiveFloor
	};
}

export function resolveEffectiveLayerOpacity(
	layer: ImageLayer,
	state: WallpaperStore,
	filterActive: boolean,
	isTransitioning: boolean,
	backgroundEnvelopeNormalized: number
): number {
	if (layer.type !== 'background-image') {
		return layer.opacity;
	}

	const backgroundOpacityFactor =
		state.imageBassReactive && state.imageOpacityReactive
			? clamp(
					1 -
						state.imageOpacityReactiveAmount +
						backgroundEnvelopeNormalized *
							state.imageOpacityReactiveAmount,
					0.05,
					1
				)
			: 1;

	return (
		layer.opacity *
		(isTransitioning ? 1 : backgroundOpacityFactor) *
		(filterActive ? state.filterOpacity : 1)
	);
}

export function resolveLayerFilterMetrics(params: {
	state: WallpaperStore;
	filterActive: boolean;
	isTransitioning: boolean;
	time: number;
	amplitude: number;
	rgbShiftChannelValue: number;
	canvasWidth: number;
	canvasHeight: number;
}): LayerFilterMetrics {
	const {
		state,
		filterActive,
		isTransitioning,
		time,
		amplitude,
		rgbShiftChannelValue,
		canvasWidth,
		canvasHeight
	} = params;

	const brightness = filterActive ? state.filterBrightness : 1;
	const contrast = filterActive ? state.filterContrast : 1;
	const saturation = filterActive ? state.filterSaturation : 1;
	const blur = filterActive ? state.filterBlur : 0;
	const hue = filterActive ? state.filterHueRotate : 0;
	const colorFilter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) hue-rotate(${hue}deg)`;
	const rgbShiftBoost = state.rgbShiftAudioReactive
		? rgbShiftChannelValue * state.rgbShiftAudioSensitivity
		: 0;
	const rgbShiftPixels =
		filterActive && !isTransitioning
			? clamp(
					(state.rgbShift + rgbShiftBoost) *
						Math.min(canvasWidth, canvasHeight) *
						0.65,
					0,
					36
				)
			: 0;
	const scanlineAmount =
		filterActive && !isTransitioning
			? getScanlineAmount(
					state.scanlineMode,
					state.scanlineIntensity,
					time,
					amplitude
				)
			: 0;
	const filmNoiseAmount =
		filterActive && !isTransitioning ? state.noiseIntensity : 0;
	const vignetteAmount =
		filterActive && !isTransitioning ? state.filterVignette : 0;
	const bloomAmount =
		filterActive && !isTransitioning ? state.filterBloom : 0;
	const lumaThreshold = filterActive ? state.filterLumaThreshold : 0.72;
	const lensWarpAmount =
		filterActive && !isTransitioning ? state.filterLensWarp : 0;
	const heatDistortionAmount =
		filterActive && !isTransitioning ? state.filterHeatDistortion : 0;

	return {
		brightness,
		contrast,
		saturation,
		blur,
		hue,
		colorFilter,
		rgbShiftPixels,
		scanlineAmount,
		filmNoiseAmount,
		vignetteAmount,
		bloomAmount,
		lumaThreshold,
		lensWarpAmount,
		heatDistortionAmount
	};
}
