import {
	resolveAudioChannelValue,
	type AudioChannelSelectionState,
	type AudioSnapshot,
	type ResolvedAudioChannelValue
} from '@/lib/audio/audioChannels';
import type { AudioEnvelope } from '@/utils/audioEnvelope';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

export type ImageCanvasAudioSelections = {
	imageChannelSelection: AudioChannelSelectionState;
	transitionChannelSelection: AudioChannelSelectionState;
	rgbShiftChannelSelection: AudioChannelSelectionState;
	rgbShiftEnvelope: AudioEnvelope;
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
	selections: ImageCanvasAudioSelections,
	dt: number
): ImageCanvasResolvedAudioState {
	const imageChannelResolved = resolveAudioChannelValue(
		audio.channels,
		state.imageAudioChannel,
		selections.imageChannelSelection,
		state.imageAudioSmoothing,
		state.audioAutoKickThreshold,
		state.audioAutoSwitchHoldMs,
		audio.timestampMs
	);
	const imageChannelValue = imageChannelResolved.value;
	const { value: transitionChannelValue } = resolveAudioChannelValue(
		audio.channels,
		state.slideshowTransitionAudioChannel,
		selections.transitionChannelSelection,
		state.slideshowTransitionAudioSmoothing,
		state.audioAutoKickThreshold,
		state.audioAutoSwitchHoldMs,
		audio.timestampMs
	);
	const rgbShiftChannelResolved = resolveAudioChannelValue(
		audio.channels,
		state.rgbShiftAudioChannel,
		selections.rgbShiftChannelSelection,
		state.rgbShiftAudioSmoothing,
		state.audioAutoKickThreshold,
		state.audioAutoSwitchHoldMs,
		audio.timestampMs
	);
	const rgbShiftEnvelopeState = selections.rgbShiftEnvelope.tick(
		rgbShiftChannelResolved.value,
		Math.max(dt, 1 / 120),
		{
			attack: state.rgbShiftAudioAttack,
			release: state.rgbShiftAudioRelease,
			responseSpeed: state.rgbShiftAudioReactivitySpeed * 2.4,
			peakWindow: state.rgbShiftAudioPeakWindow,
			peakFloor: state.rgbShiftAudioPeakFloor,
			punch: state.rgbShiftAudioPunch,
			scaleIntensity: 1,
			min: 0,
			max: 1
		}
	);
	const rgbShiftChannelValue = rgbShiftEnvelopeState.value;

	return {
		imageChannelResolved,
		imageChannelValue,
		transitionChannelValue,
		rgbShiftChannelValue
	};
}
