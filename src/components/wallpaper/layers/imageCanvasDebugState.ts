import { publishBackgroundScaleTelemetry } from '@/lib/debug/backgroundScaleTelemetry';
import { setDebugBgAudio } from '@/lib/debug/frameAudioDebugSnapshot';
import type { ResolvedAudioChannelValue } from '@/lib/audio/audioChannels';
import type { BackgroundImageLayer } from '@/types/layers';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

type BackgroundDebugMetrics = {
	bassBoost: number;
	envelopeNormalized: number;
	envelopeSmoothed: number;
	adaptivePeak: number;
	adaptiveFloor: number;
	imageChannelValue: number;
	imageChannelResolved: ResolvedAudioChannelValue;
};

export function publishImageCanvasBackgroundDebugState(
	layer: BackgroundImageLayer | null,
	state: WallpaperStore,
	metrics: BackgroundDebugMetrics
) {
	if (!layer) {
		setDebugBgAudio(null);
		return;
	}

	if (layer.imageUrl) {
		setDebugBgAudio({
			requestChannel: state.imageAudioChannel,
			resolvedChannel: metrics.imageChannelResolved.resolvedChannel,
			channelInstant: metrics.imageChannelResolved.instantLevel,
			channelRouterSmoothed: metrics.imageChannelResolved.value,
			envelopeBoost: metrics.bassBoost,
			hasSlideshowLayer: true
		});
	} else {
		setDebugBgAudio(null);
	}

	if (!state.showBackgroundScaleMeter) return;

	const maxBoost = Math.max(0, layer.audioReactiveConfig?.sensitivity ?? 0);
	publishBackgroundScaleTelemetry({
		hasSignal: Boolean(layer.imageUrl),
		imageBassReactive: Boolean(layer.audioReactiveConfig?.enabled),
		baseScale: state.imageScale,
		bassBoost: metrics.bassBoost,
		maxBoost,
		driveInstant: metrics.imageChannelValue,
		channelRouterSmoothed: metrics.imageChannelResolved.value,
		envelopeNormalized: metrics.envelopeNormalized,
		envelopeSmoothed: metrics.envelopeSmoothed,
		adaptivePeak: metrics.adaptivePeak,
		adaptiveFloor: metrics.adaptiveFloor
	});
}
