import type { StateCreator } from 'zustand';
import { DEFAULT_STATE } from '@/lib/constants';
import {
	buildSpectrumProfileName,
	extractSpectrumProfileSettings,
	MAX_PROFILE_SLOT_COUNT
} from '@/lib/featureProfiles';
import { normalizeSpectrumShape } from '@/features/spectrum/spectrumControlConfig';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import type { SpectrumProfileSettings } from '@/types/wallpaper';

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2];

function hydrateSpectrumProfileValues(
	values: Partial<SpectrumProfileSettings>
): SpectrumProfileSettings {
	return {
		spectrumEnabled:
			values.spectrumEnabled ?? DEFAULT_STATE.spectrumEnabled,
		spectrumMode: values.spectrumMode ?? DEFAULT_STATE.spectrumMode,
		spectrumLinearOrientation:
			values.spectrumLinearOrientation ??
			DEFAULT_STATE.spectrumLinearOrientation,
		spectrumLinearDirection:
			values.spectrumLinearDirection ??
			DEFAULT_STATE.spectrumLinearDirection,
		spectrumRadialShape:
			values.spectrumRadialShape ?? DEFAULT_STATE.spectrumRadialShape,
		spectrumRadialAngle:
			values.spectrumRadialAngle ?? DEFAULT_STATE.spectrumRadialAngle,
		spectrumRadialFitLogo:
			values.spectrumRadialFitLogo ?? DEFAULT_STATE.spectrumRadialFitLogo,
		spectrumFollowLogo:
			values.spectrumFollowLogo ?? DEFAULT_STATE.spectrumFollowLogo,
		spectrumLogoGap: values.spectrumLogoGap ?? DEFAULT_STATE.spectrumLogoGap,
		spectrumCircularClone:
			values.spectrumCircularClone ?? DEFAULT_STATE.spectrumCircularClone,
		spectrumSpan: values.spectrumSpan ?? DEFAULT_STATE.spectrumSpan,
		spectrumCloneOpacity:
			values.spectrumCloneOpacity ?? DEFAULT_STATE.spectrumCloneOpacity,
		spectrumCloneScale:
			values.spectrumCloneScale ?? DEFAULT_STATE.spectrumCloneScale,
		spectrumCloneGap:
			values.spectrumCloneGap ?? DEFAULT_STATE.spectrumCloneGap,
		spectrumCloneStyle: normalizeSpectrumShape(
			values.spectrumCloneStyle ?? DEFAULT_STATE.spectrumCloneStyle
		),
		spectrumCloneRadialShape:
			values.spectrumCloneRadialShape ??
			DEFAULT_STATE.spectrumCloneRadialShape,
		spectrumCloneRadialAngle:
			values.spectrumCloneRadialAngle ??
			DEFAULT_STATE.spectrumCloneRadialAngle,
		spectrumCloneBarCount:
			values.spectrumCloneBarCount ?? DEFAULT_STATE.spectrumCloneBarCount,
		spectrumCloneBarWidth:
			values.spectrumCloneBarWidth ?? DEFAULT_STATE.spectrumCloneBarWidth,
		spectrumCloneMinHeight:
			values.spectrumCloneMinHeight ?? DEFAULT_STATE.spectrumCloneMinHeight,
		spectrumCloneMaxHeight:
			values.spectrumCloneMaxHeight ?? DEFAULT_STATE.spectrumCloneMaxHeight,
		spectrumCloneSmoothing:
			values.spectrumCloneSmoothing ?? DEFAULT_STATE.spectrumCloneSmoothing,
		spectrumCloneGlowIntensity:
			values.spectrumCloneGlowIntensity ??
			DEFAULT_STATE.spectrumCloneGlowIntensity,
		spectrumCloneShadowBlur:
			values.spectrumCloneShadowBlur ??
			DEFAULT_STATE.spectrumCloneShadowBlur,
		spectrumClonePrimaryColor:
			values.spectrumClonePrimaryColor ??
			DEFAULT_STATE.spectrumClonePrimaryColor,
		spectrumCloneSecondaryColor:
			values.spectrumCloneSecondaryColor ??
			DEFAULT_STATE.spectrumCloneSecondaryColor,
		spectrumCloneColorSource:
			values.spectrumCloneColorSource ??
			DEFAULT_STATE.spectrumCloneColorSource,
		spectrumCloneColorMode:
			values.spectrumCloneColorMode ?? DEFAULT_STATE.spectrumCloneColorMode,
		spectrumCloneBandMode:
			values.spectrumCloneBandMode ?? DEFAULT_STATE.spectrumCloneBandMode,
		spectrumCloneAudioSmoothingEnabled:
			values.spectrumCloneAudioSmoothingEnabled ??
			DEFAULT_STATE.spectrumCloneAudioSmoothingEnabled,
		spectrumCloneAudioSmoothing:
			values.spectrumCloneAudioSmoothing ??
			DEFAULT_STATE.spectrumCloneAudioSmoothing,
		spectrumCloneRotationSpeed:
			values.spectrumCloneRotationSpeed ??
			DEFAULT_STATE.spectrumCloneRotationSpeed,
		spectrumCloneMirror:
			values.spectrumCloneMirror ?? DEFAULT_STATE.spectrumCloneMirror,
		spectrumClonePeakHold:
			values.spectrumClonePeakHold ?? DEFAULT_STATE.spectrumClonePeakHold,
		spectrumClonePeakDecay:
			values.spectrumClonePeakDecay ?? DEFAULT_STATE.spectrumClonePeakDecay,
		spectrumInnerRadius:
			values.spectrumInnerRadius ?? DEFAULT_STATE.spectrumInnerRadius,
		spectrumBarCount: values.spectrumBarCount ?? DEFAULT_STATE.spectrumBarCount,
		spectrumBarWidth: values.spectrumBarWidth ?? DEFAULT_STATE.spectrumBarWidth,
		spectrumMinHeight:
			values.spectrumMinHeight ?? DEFAULT_STATE.spectrumMinHeight,
		spectrumMaxHeight:
			values.spectrumMaxHeight ?? DEFAULT_STATE.spectrumMaxHeight,
		spectrumSmoothing:
			values.spectrumSmoothing ?? DEFAULT_STATE.spectrumSmoothing,
		spectrumOpacity: values.spectrumOpacity ?? DEFAULT_STATE.spectrumOpacity,
		spectrumGlowIntensity:
			values.spectrumGlowIntensity ?? DEFAULT_STATE.spectrumGlowIntensity,
		spectrumShadowBlur:
			values.spectrumShadowBlur ?? DEFAULT_STATE.spectrumShadowBlur,
		spectrumPrimaryColor:
			values.spectrumPrimaryColor ?? DEFAULT_STATE.spectrumPrimaryColor,
		spectrumSecondaryColor:
			values.spectrumSecondaryColor ?? DEFAULT_STATE.spectrumSecondaryColor,
		spectrumColorSource:
			values.spectrumColorSource ?? DEFAULT_STATE.spectrumColorSource,
		spectrumColorMode:
			values.spectrumColorMode ?? DEFAULT_STATE.spectrumColorMode,
		spectrumBandMode:
			values.spectrumBandMode ?? DEFAULT_STATE.spectrumBandMode,
		spectrumAudioSmoothingEnabled:
			values.spectrumAudioSmoothingEnabled ??
			DEFAULT_STATE.spectrumAudioSmoothingEnabled,
		spectrumAudioSmoothing:
			values.spectrumAudioSmoothing ?? DEFAULT_STATE.spectrumAudioSmoothing,
		spectrumShape: normalizeSpectrumShape(
			values.spectrumShape ?? DEFAULT_STATE.spectrumShape
		),
		spectrumWaveFillOpacity:
			values.spectrumWaveFillOpacity ?? DEFAULT_STATE.spectrumWaveFillOpacity,
		spectrumRotationSpeed:
			values.spectrumRotationSpeed ?? DEFAULT_STATE.spectrumRotationSpeed,
		spectrumMirror: values.spectrumMirror ?? DEFAULT_STATE.spectrumMirror,
		spectrumPeakHold:
			values.spectrumPeakHold ?? DEFAULT_STATE.spectrumPeakHold,
		spectrumPeakDecay:
			values.spectrumPeakDecay ?? DEFAULT_STATE.spectrumPeakDecay,
		spectrumPositionX:
			values.spectrumPositionX ?? DEFAULT_STATE.spectrumPositionX,
		spectrumPositionY:
			values.spectrumPositionY ?? DEFAULT_STATE.spectrumPositionY,
		spectrumCloneWaveFillOpacity:
			values.spectrumCloneWaveFillOpacity ??
			DEFAULT_STATE.spectrumCloneWaveFillOpacity
	};
}

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
									values: hydrateSpectrumProfileValues(
										extractSpectrumProfileSettings(state)
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
				return hydrateSpectrumProfileValues(slot.values);
			})
	} satisfies Partial<WallpaperStore>;
}
