import {
	resolveAudioChannelValue,
	type AudioChannelSelectionState,
	type AudioSnapshot,
	type ResolvedAudioChannelValue
} from '@/lib/audio/audioChannels';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

export type ImageCanvasAudioSelections = {
	imageChannelSelection: AudioChannelSelectionState;
	transitionChannelSelection: AudioChannelSelectionState;
	rgbShiftChannelSelection: AudioChannelSelectionState;
};

export type ImageCanvasResolvedAudioState = {
	imageChannelResolved: ResolvedAudioChannelValue;
	imageChannelValue: number;
	transitionChannelValue: number;
	rgbShiftChannelValue: number;
};

export function resolveImageCanvasAudioState(
	audio: AudioSnapshot,
	state: WallpaperStore,
	selections: ImageCanvasAudioSelections
): ImageCanvasResolvedAudioState {
	const imageChannelResolved = resolveAudioChannelValue(
		audio.channels,
		state.imageAudioChannel,
		selections.imageChannelSelection,
		state.imageAudioSmoothingEnabled ? state.imageAudioSmoothing : 0,
		state.audioAutoKickThreshold,
		state.audioAutoSwitchHoldMs,
		audio.timestampMs
	);
	const imageChannelValue = state.imageAudioSmoothingEnabled
		? imageChannelResolved.value
		: imageChannelResolved.instantLevel;
	const { instantLevel: transitionChannelValue } = resolveAudioChannelValue(
		audio.channels,
		state.slideshowTransitionAudioChannel,
		selections.transitionChannelSelection,
		0,
		state.audioAutoKickThreshold,
		state.audioAutoSwitchHoldMs,
		audio.timestampMs
	);
	const rgbShiftChannelResolved = resolveAudioChannelValue(
		audio.channels,
		state.rgbShiftAudioChannel,
		selections.rgbShiftChannelSelection,
		state.rgbShiftAudioSmoothingEnabled
			? state.rgbShiftAudioSmoothing
			: 0,
		state.audioAutoKickThreshold,
		state.audioAutoSwitchHoldMs,
		audio.timestampMs
	);
	const rgbShiftChannelValue = state.rgbShiftAudioSmoothingEnabled
		? rgbShiftChannelResolved.value
		: rgbShiftChannelResolved.instantLevel;

	return {
		imageChannelResolved,
		imageChannelValue,
		transitionChannelValue,
		rgbShiftChannelValue
	};
}
