import type { StateCreator } from 'zustand';
import {
	buildTrackTitleProfileName,
	extractTrackTitleProfileSettings,
	MAX_TRACK_TITLE_SLOT_COUNT
} from '@/lib/featureProfiles';
import { DEFAULT_STATE } from '@/lib/constants';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2];

export function createAudioSlice(
	set: WallpaperSet,
	_get: WallpaperGet,
	_api: WallpaperApi
) {
	return {
		setAudioReactive: v => set({ audioReactive: v }),
		setAudioSensitivity: v => set({ audioSensitivity: v }),
		setAudioCaptureState: v => set({ audioCaptureState: v }),
		setAudioSourceMode: v => set({ audioSourceMode: v }),
		setAudioFileAssetId: v => set({ audioFileAssetId: v }),
		setAudioFileName: v => set({ audioFileName: v }),
		setAudioFileVolume: v => set({ audioFileVolume: v }),
		setAudioFileLoop: v => set({ audioFileLoop: v }),
		setAudioPaused: v => set({ audioPaused: v }),
		setMotionPaused: v => set({ motionPaused: v }),
		setFftSize: v => set({ fftSize: v }),
		setAudioSmoothing: v => set({ audioSmoothing: v }),
		setAudioChannelSmoothing: v => set({ audioChannelSmoothing: v }),
		setAudioSelectedChannelSmoothing: v =>
			set({ audioSelectedChannelSmoothing: v }),
		setAudioAutoKickThreshold: v => set({ audioAutoKickThreshold: v }),
		setAudioAutoSwitchHoldMs: v => set({ audioAutoSwitchHoldMs: v }),
		setAudioTrackTitleEnabled: v => set({ audioTrackTitleEnabled: v }),
		setAudioTrackTitleLayoutMode: v =>
			set({ audioTrackTitleLayoutMode: v }),
		setAudioTrackTitleFontStyle: v => set({ audioTrackTitleFontStyle: v }),
		setAudioTrackTitleUppercase: v => set({ audioTrackTitleUppercase: v }),
		setAudioTrackTitlePositionX: v => set({ audioTrackTitlePositionX: v }),
		setAudioTrackTitlePositionY: v => set({ audioTrackTitlePositionY: v }),
		setAudioTrackTitleFontSize: v => set({ audioTrackTitleFontSize: v }),
		setAudioTrackTitleLetterSpacing: v =>
			set({ audioTrackTitleLetterSpacing: v }),
		setAudioTrackTitleWidth: v => set({ audioTrackTitleWidth: v }),
		setAudioTrackTitleOpacity: v => set({ audioTrackTitleOpacity: v }),
		setAudioTrackTitleScrollSpeed: v =>
			set({ audioTrackTitleScrollSpeed: v }),
		setAudioTrackTitleRgbShift: v => set({ audioTrackTitleRgbShift: v }),
		setAudioTrackTitleTextColor: v => set({ audioTrackTitleTextColor: v }),
		setAudioTrackTitleTextColorSource: v =>
			set({ audioTrackTitleTextColorSource: v }),
		setAudioTrackTitleStrokeColor: v =>
			set({ audioTrackTitleStrokeColor: v }),
		setAudioTrackTitleStrokeColorSource: v =>
			set({ audioTrackTitleStrokeColorSource: v }),
		setAudioTrackTitleStrokeWidth: v =>
			set({ audioTrackTitleStrokeWidth: v }),
		setAudioTrackTitleGlowColor: v => set({ audioTrackTitleGlowColor: v }),
		setAudioTrackTitleGlowColorSource: v =>
			set({ audioTrackTitleGlowColorSource: v }),
		setAudioTrackTitleGlowBlur: v => set({ audioTrackTitleGlowBlur: v }),
		setAudioTrackTitleBackdropEnabled: v =>
			set({ audioTrackTitleBackdropEnabled: v }),
		setAudioTrackTitleBackdropColor: v =>
			set({ audioTrackTitleBackdropColor: v }),
		setAudioTrackTitleBackdropColorSource: v =>
			set({ audioTrackTitleBackdropColorSource: v }),
		setAudioTrackTitleBackdropOpacity: v =>
			set({ audioTrackTitleBackdropOpacity: v }),
		setAudioTrackTitleBackdropPadding: v =>
			set({ audioTrackTitleBackdropPadding: v }),
		setAudioTrackTitleFilterBrightness: v =>
			set({ audioTrackTitleFilterBrightness: v }),
		setAudioTrackTitleFilterContrast: v =>
			set({ audioTrackTitleFilterContrast: v }),
		setAudioTrackTitleFilterSaturation: v =>
			set({ audioTrackTitleFilterSaturation: v }),
		setAudioTrackTitleFilterBlur: v =>
			set({ audioTrackTitleFilterBlur: v }),
		setAudioTrackTitleFilterHueRotate: v =>
			set({ audioTrackTitleFilterHueRotate: v }),
		setAudioTrackTimeEnabled: v => set({ audioTrackTimeEnabled: v }),
		setAudioTrackTimePositionX: v => set({ audioTrackTimePositionX: v }),
		setAudioTrackTimePositionY: v => set({ audioTrackTimePositionY: v }),
		setAudioTrackTimeWidth: v => set({ audioTrackTimeWidth: v }),
		setAudioTrackTimeFontStyle: v => set({ audioTrackTimeFontStyle: v }),
		setAudioTrackTimeFontSize: v => set({ audioTrackTimeFontSize: v }),
		setAudioTrackTimeLetterSpacing: v =>
			set({ audioTrackTimeLetterSpacing: v }),
		setAudioTrackTimeOpacity: v => set({ audioTrackTimeOpacity: v }),
		setAudioTrackTimeRgbShift: v => set({ audioTrackTimeRgbShift: v }),
		setAudioTrackTimeTextColor: v => set({ audioTrackTimeTextColor: v }),
		setAudioTrackTimeTextColorSource: v =>
			set({ audioTrackTimeTextColorSource: v }),
		setAudioTrackTimeStrokeColor: v =>
			set({ audioTrackTimeStrokeColor: v }),
		setAudioTrackTimeStrokeColorSource: v =>
			set({ audioTrackTimeStrokeColorSource: v }),
		setAudioTrackTimeStrokeWidth: v =>
			set({ audioTrackTimeStrokeWidth: v }),
		setAudioTrackTimeGlowColor: v => set({ audioTrackTimeGlowColor: v }),
		setAudioTrackTimeGlowColorSource: v =>
			set({ audioTrackTimeGlowColorSource: v }),
		setAudioTrackTimeGlowBlur: v => set({ audioTrackTimeGlowBlur: v }),
		setAudioTrackTimeFilterBrightness: v =>
			set({ audioTrackTimeFilterBrightness: v }),
		setAudioTrackTimeFilterContrast: v =>
			set({ audioTrackTimeFilterContrast: v }),
		setAudioTrackTimeFilterSaturation: v =>
			set({ audioTrackTimeFilterSaturation: v }),
		setAudioTrackTimeFilterBlur: v =>
			set({ audioTrackTimeFilterBlur: v }),
		setAudioTrackTimeFilterHueRotate: v =>
			set({ audioTrackTimeFilterHueRotate: v }),
		addTrackTitleProfileSlot: () =>
			set(state => {
				if (
					state.trackTitleProfileSlots.length >=
					MAX_TRACK_TITLE_SLOT_COUNT
				)
					return state;
				return {
					trackTitleProfileSlots: [
						...state.trackTitleProfileSlots,
						{
							name: `Track Title ${state.trackTitleProfileSlots.length + 1}`,
							values: null
						}
					]
				};
			}),
		removeTrackTitleProfileSlot: index =>
			set(state => {
				if (index < 3 || index >= state.trackTitleProfileSlots.length)
					return state;
				return {
					trackTitleProfileSlots:
						state.trackTitleProfileSlots.filter(
							(_, i) => i !== index
						)
				};
			}),
		saveTrackTitleProfileSlot: index =>
			set(state => {
				if (
					index < 0 ||
					index >= state.trackTitleProfileSlots.length
				)
					return state;
				const nextSlots = state.trackTitleProfileSlots.map(
					(slot, i) =>
						i === index
							? {
									name: buildTrackTitleProfileName(state),
									values: extractTrackTitleProfileSettings(
										state
									)
								}
							: slot
				);
				return { trackTitleProfileSlots: nextSlots };
			}),
		loadTrackTitleProfileSlot: index =>
			set(state => {
				const slot = state.trackTitleProfileSlots[index];
				if (!slot?.values) return state;
				const defaults = extractTrackTitleProfileSettings(
					DEFAULT_STATE as WallpaperStore
				);
				return { ...defaults, ...slot.values };
			})
	} satisfies Partial<WallpaperStore>;
}
