import type { StateCreator } from 'zustand';
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
		setAudioTrackTitleGlowColor: v => set({ audioTrackTitleGlowColor: v }),
		setAudioTrackTitleGlowBlur: v => set({ audioTrackTitleGlowBlur: v }),
		setAudioTrackTitleBackdropEnabled: v =>
			set({ audioTrackTitleBackdropEnabled: v }),
		setAudioTrackTitleBackdropColor: v =>
			set({ audioTrackTitleBackdropColor: v }),
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
		setAudioTrackTimeFontStyle: v => set({ audioTrackTimeFontStyle: v }),
		setAudioTrackTimeFontSize: v => set({ audioTrackTimeFontSize: v }),
		setAudioTrackTimeLetterSpacing: v =>
			set({ audioTrackTimeLetterSpacing: v }),
		setAudioTrackTimeOpacity: v => set({ audioTrackTimeOpacity: v }),
		setAudioTrackTimeRgbShift: v => set({ audioTrackTimeRgbShift: v }),
		setAudioTrackTimeTextColor: v => set({ audioTrackTimeTextColor: v }),
		setAudioTrackTimeGlowColor: v => set({ audioTrackTimeGlowColor: v }),
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
			set({ audioTrackTimeFilterHueRotate: v })
	} satisfies Partial<WallpaperStore>;
}
