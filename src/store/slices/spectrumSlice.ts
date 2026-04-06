import type { StateCreator } from 'zustand';
import { DEFAULT_STATE } from '@/lib/constants';
import {
	buildSpectrumProfileName,
	extractSpectrumProfileSettings,
	MAX_PROFILE_SLOT_COUNT
} from '@/lib/featureProfiles';
import { normalizeSpectrumShape } from '@/features/spectrum/spectrumControlConfig';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2];

export function createSpectrumSlice(
	set: WallpaperSet,
	_get: WallpaperGet,
	_api: WallpaperApi
) {
	return {
		setShowSpectrumDiagnosticsHud: v =>
			set({ showSpectrumDiagnosticsHud: v }),
		setSpectrumEnabled: v => set({ spectrumEnabled: v }),
		setSpectrumMode: v => set({ spectrumMode: v }),
		setSpectrumLinearOrientation: v =>
			set({ spectrumLinearOrientation: v }),
		setSpectrumLinearDirection: v => set({ spectrumLinearDirection: v }),
		setSpectrumRadialShape: v => set({ spectrumRadialShape: v }),
		setSpectrumRadialAngle: v => set({ spectrumRadialAngle: v }),
		setSpectrumRadialFitLogo: v => set({ spectrumRadialFitLogo: v }),
		setSpectrumFollowLogo: v => set({ spectrumFollowLogo: v }),
		setSpectrumLogoGap: v => set({ spectrumLogoGap: v }),
		setSpectrumCircularClone: v => set({ spectrumCircularClone: v }),
		setSpectrumSpan: v => set({ spectrumSpan: v }),
		setSpectrumCloneOpacity: v => set({ spectrumCloneOpacity: v }),
		setSpectrumCloneScale: v => set({ spectrumCloneScale: v }),
		setSpectrumCloneGap: v => set({ spectrumCloneGap: v }),
		setSpectrumCloneStyle: v =>
			set({ spectrumCloneStyle: normalizeSpectrumShape(v) }),
		setSpectrumCloneRadialShape: v => set({ spectrumCloneRadialShape: v }),
		setSpectrumCloneRadialAngle: v => set({ spectrumCloneRadialAngle: v }),
		setSpectrumCloneBarCount: v => set({ spectrumCloneBarCount: v }),
		setSpectrumCloneBarWidth: v => set({ spectrumCloneBarWidth: v }),
		setSpectrumCloneMinHeight: v => set({ spectrumCloneMinHeight: v }),
		setSpectrumCloneMaxHeight: v => set({ spectrumCloneMaxHeight: v }),
		setSpectrumCloneSmoothing: v => set({ spectrumCloneSmoothing: v }),
		setSpectrumCloneGlowIntensity: v =>
			set({ spectrumCloneGlowIntensity: v }),
		setSpectrumCloneShadowBlur: v => set({ spectrumCloneShadowBlur: v }),
		setSpectrumClonePrimaryColor: v => set({ spectrumClonePrimaryColor: v }),
		setSpectrumCloneSecondaryColor: v =>
			set({ spectrumCloneSecondaryColor: v }),
		setSpectrumCloneColorSource: v => set({ spectrumCloneColorSource: v }),
		setSpectrumCloneColorMode: v => set({ spectrumCloneColorMode: v }),
		setSpectrumCloneBandMode: v => set({ spectrumCloneBandMode: v }),
		setSpectrumCloneAudioSmoothingEnabled: v =>
			set({ spectrumCloneAudioSmoothingEnabled: v }),
		setSpectrumCloneAudioSmoothing: v =>
			set({ spectrumCloneAudioSmoothing: v }),
		setSpectrumCloneRotationSpeed: v =>
			set({ spectrumCloneRotationSpeed: v }),
		setSpectrumCloneMirror: v => set({ spectrumCloneMirror: v }),
		setSpectrumClonePeakHold: v => set({ spectrumClonePeakHold: v }),
		setSpectrumClonePeakDecay: v => set({ spectrumClonePeakDecay: v }),
		setSpectrumInnerRadius: v => set({ spectrumInnerRadius: v }),
		setSpectrumBarCount: v => set({ spectrumBarCount: v }),
		setSpectrumBarWidth: v => set({ spectrumBarWidth: v }),
		setSpectrumMinHeight: v => set({ spectrumMinHeight: v }),
		setSpectrumMaxHeight: v => set({ spectrumMaxHeight: v }),
		setSpectrumSmoothing: v => set({ spectrumSmoothing: v }),
		setSpectrumOpacity: v => set({ spectrumOpacity: v }),
		setSpectrumGlowIntensity: v => set({ spectrumGlowIntensity: v }),
		setSpectrumShadowBlur: v => set({ spectrumShadowBlur: v }),
		setSpectrumPrimaryColor: v => set({ spectrumPrimaryColor: v }),
		setSpectrumSecondaryColor: v => set({ spectrumSecondaryColor: v }),
		setSpectrumColorSource: v => set({ spectrumColorSource: v }),
		setSpectrumColorMode: v => set({ spectrumColorMode: v }),
		setSpectrumBandMode: v => set({ spectrumBandMode: v }),
		setSpectrumAudioSmoothingEnabled: v =>
			set({ spectrumAudioSmoothingEnabled: v }),
		setSpectrumAudioSmoothing: v => set({ spectrumAudioSmoothing: v }),
		setSpectrumShape: v => set({ spectrumShape: normalizeSpectrumShape(v) }),
		setSpectrumWaveFillOpacity: v => set({ spectrumWaveFillOpacity: v }),
		setSpectrumRotationSpeed: v => set({ spectrumRotationSpeed: v }),
		setSpectrumMirror: v => set({ spectrumMirror: v }),
		setSpectrumPeakHold: v => set({ spectrumPeakHold: v }),
		setSpectrumPeakDecay: v => set({ spectrumPeakDecay: v }),
		setSpectrumPositionX: v => set({ spectrumPositionX: v }),
		setSpectrumPositionY: v => set({ spectrumPositionY: v }),
		setSpectrumCloneWaveFillOpacity: v =>
			set({ spectrumCloneWaveFillOpacity: v }),
		addSpectrumProfileSlot: () =>
			set(state => {
				if (state.spectrumProfileSlots.length >= MAX_PROFILE_SLOT_COUNT)
					return state;
				return {
					spectrumProfileSlots: [
						...state.spectrumProfileSlots,
						{
							name: `Spectrum ${state.spectrumProfileSlots.length + 1}`,
							values: null
						}
					]
				};
			}),
		removeSpectrumProfileSlot: index =>
			set(state => {
				if (index < 3 || index >= state.spectrumProfileSlots.length)
					return state;
				return {
					spectrumProfileSlots: state.spectrumProfileSlots.filter(
						(_, slotIndex) => slotIndex !== index
					)
				};
			}),
		saveSpectrumProfileSlot: index =>
			set(state => {
				if (index < 0 || index >= state.spectrumProfileSlots.length)
					return state;
				const nextSlots = state.spectrumProfileSlots.map(
					(slot, slotIndex) =>
						slotIndex === index
							? {
									name: buildSpectrumProfileName(state),
									values: extractSpectrumProfileSettings(
										state
									)
								}
							: slot
				);
				return { spectrumProfileSlots: nextSlots };
			}),
		loadSpectrumProfileSlot: index =>
			set(state => {
				const slot = state.spectrumProfileSlots[index];
				if (!slot?.values) return state;
				return {
					...slot.values,
					spectrumMode:
						slot.values.spectrumMode ?? DEFAULT_STATE.spectrumMode,
					spectrumLinearOrientation:
						slot.values.spectrumLinearOrientation ??
						DEFAULT_STATE.spectrumLinearOrientation,
					spectrumLinearDirection:
						slot.values.spectrumLinearDirection ??
						DEFAULT_STATE.spectrumLinearDirection,
					spectrumRadialShape:
						slot.values.spectrumRadialShape ??
						DEFAULT_STATE.spectrumRadialShape,
					spectrumRadialAngle:
						slot.values.spectrumRadialAngle ??
						DEFAULT_STATE.spectrumRadialAngle,
					spectrumRadialFitLogo:
						slot.values.spectrumRadialFitLogo ??
						DEFAULT_STATE.spectrumRadialFitLogo,
					spectrumCircularClone:
						slot.values.spectrumCircularClone ??
						DEFAULT_STATE.spectrumCircularClone,
					spectrumLogoGap:
						slot.values.spectrumLogoGap ??
						DEFAULT_STATE.spectrumLogoGap,
					spectrumSpan:
						slot.values.spectrumSpan ?? DEFAULT_STATE.spectrumSpan,
					spectrumCloneOpacity:
						slot.values.spectrumCloneOpacity ??
						DEFAULT_STATE.spectrumCloneOpacity,
					spectrumCloneScale:
						slot.values.spectrumCloneScale ??
						DEFAULT_STATE.spectrumCloneScale,
					spectrumCloneGap:
						slot.values.spectrumCloneGap ??
						DEFAULT_STATE.spectrumCloneGap,
					spectrumCloneStyle:
						normalizeSpectrumShape(
							slot.values.spectrumCloneStyle ??
								DEFAULT_STATE.spectrumCloneStyle
						),
					spectrumCloneRadialShape:
						slot.values.spectrumCloneRadialShape ??
						DEFAULT_STATE.spectrumCloneRadialShape,
					spectrumCloneRadialAngle:
						slot.values.spectrumCloneRadialAngle ??
						DEFAULT_STATE.spectrumCloneRadialAngle,
					spectrumCloneBarCount:
						slot.values.spectrumCloneBarCount ??
						DEFAULT_STATE.spectrumCloneBarCount,
					spectrumCloneBarWidth:
						slot.values.spectrumCloneBarWidth ??
						DEFAULT_STATE.spectrumCloneBarWidth,
					spectrumCloneMinHeight:
						slot.values.spectrumCloneMinHeight ??
						DEFAULT_STATE.spectrumCloneMinHeight,
					spectrumCloneMaxHeight:
						slot.values.spectrumCloneMaxHeight ??
						DEFAULT_STATE.spectrumCloneMaxHeight,
					spectrumCloneSmoothing:
						slot.values.spectrumCloneSmoothing ??
						DEFAULT_STATE.spectrumCloneSmoothing,
					spectrumCloneGlowIntensity:
						slot.values.spectrumCloneGlowIntensity ??
						DEFAULT_STATE.spectrumCloneGlowIntensity,
					spectrumCloneShadowBlur:
						slot.values.spectrumCloneShadowBlur ??
						DEFAULT_STATE.spectrumCloneShadowBlur,
					spectrumClonePrimaryColor:
						slot.values.spectrumClonePrimaryColor ??
						DEFAULT_STATE.spectrumClonePrimaryColor,
					spectrumCloneSecondaryColor:
						slot.values.spectrumCloneSecondaryColor ??
						DEFAULT_STATE.spectrumCloneSecondaryColor,
					spectrumCloneColorMode:
						slot.values.spectrumCloneColorMode ??
						DEFAULT_STATE.spectrumCloneColorMode,
					spectrumCloneBandMode:
						slot.values.spectrumCloneBandMode ??
						DEFAULT_STATE.spectrumCloneBandMode,
					spectrumCloneAudioSmoothingEnabled:
						slot.values.spectrumCloneAudioSmoothingEnabled ??
						DEFAULT_STATE.spectrumCloneAudioSmoothingEnabled,
					spectrumCloneAudioSmoothing:
						slot.values.spectrumCloneAudioSmoothing ??
						DEFAULT_STATE.spectrumCloneAudioSmoothing,
					spectrumCloneRotationSpeed:
						slot.values.spectrumCloneRotationSpeed ??
						DEFAULT_STATE.spectrumCloneRotationSpeed,
					spectrumCloneMirror:
						slot.values.spectrumCloneMirror ??
						DEFAULT_STATE.spectrumCloneMirror,
					spectrumClonePeakHold:
						slot.values.spectrumClonePeakHold ??
						DEFAULT_STATE.spectrumClonePeakHold,
					spectrumClonePeakDecay:
						slot.values.spectrumClonePeakDecay ??
						DEFAULT_STATE.spectrumClonePeakDecay,
					spectrumWaveFillOpacity:
						slot.values.spectrumWaveFillOpacity ??
						DEFAULT_STATE.spectrumWaveFillOpacity,
					spectrumShape: normalizeSpectrumShape(
						slot.values.spectrumShape ??
							DEFAULT_STATE.spectrumShape
					),
					spectrumCloneWaveFillOpacity:
						slot.values.spectrumCloneWaveFillOpacity ??
						DEFAULT_STATE.spectrumCloneWaveFillOpacity
				};
			})
	} satisfies Partial<WallpaperStore>;
}
