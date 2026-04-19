import type { StateCreator } from 'zustand';
import { SPECTRUM_RANGES } from '@/config/ranges';
import { clamp } from '@/lib/math';
import { DEFAULT_STATE } from '@/lib/constants';
import {
	buildSpectrumMacroPatch,
	generateRandomSpectrumProfile,
	normalizeSpectrumSettings
} from '@/features/spectrum/spectrumStateTransforms';
import {
	buildSpectrumProfileName,
	extractSpectrumProfileSettings,
	MAX_SPECTRUM_SLOT_COUNT
} from '@/lib/featureProfiles';
import {
	normalizeSpectrumFamily,
	normalizeSpectrumShape
} from '@/features/spectrum/spectrumControlConfig';
import { hydrateSpectrumProfileValues } from '@/features/spectrum/runtime/spectrumProfileHydrate';
import { invalidateSpectrumPresetMorph } from '@/features/spectrum/runtime/spectrumPresetTransition';
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
		setDiagnosticsHudPositionX: v =>
			set({
				diagnosticsHudPositionX: Math.min(1, Math.max(0, v))
			}),
		setDiagnosticsHudPositionY: v =>
			set({
				diagnosticsHudPositionY: Math.min(1, Math.max(0, v))
			}),
		setSpectrumEnabled: v => set({ spectrumEnabled: v }),
		setSpectrumFamily: v =>
			set(state => {
				invalidateSpectrumPresetMorph();
				const nextFamily = normalizeSpectrumFamily(v);
				const profile = extractSpectrumProfileSettings(state);
				return normalizeSpectrumSettings({
					...profile,
					spectrumFamily: nextFamily
				}) as Partial<WallpaperStore>;
			}),
		setSpectrumAfterglow: v => set({ spectrumAfterglow: v }),
		setSpectrumMotionTrails: v => set({ spectrumMotionTrails: v }),
		setSpectrumGhostFrames: v => set({ spectrumGhostFrames: v }),
		setSpectrumPeakRibbons: v => set({ spectrumPeakRibbons: v }),
		setSpectrumBassShockwave: v => set({ spectrumBassShockwave: v }),
		setSpectrumShockwaveBandMode: v =>
			set({ spectrumShockwaveBandMode: v }),
		setSpectrumEnergyBloom: v =>
			set({
				spectrumEnergyBloom: Number.isFinite(v)
					? clamp(v, SPECTRUM_RANGES.energyBloom.min, SPECTRUM_RANGES.energyBloom.max)
					: DEFAULT_STATE.spectrumEnergyBloom
			}),
		setSpectrumOscilloscopeLineWidth: v => set({ spectrumOscilloscopeLineWidth: v }),
		setSpectrumTunnelRingCount: v => set({ spectrumTunnelRingCount: v }),
		setSpectrumSpectrogramDecay: v => set({ spectrumSpectrogramDecay: v }),
		setSpectrumMode: v =>
			set(state => {
				invalidateSpectrumPresetMorph();
				const profile = extractSpectrumProfileSettings(state);
				return normalizeSpectrumSettings({
					...profile,
					spectrumMode: v
				}) as Partial<WallpaperStore>;
			}),
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
		setSpectrumCloneFollowLogo: v => set({ spectrumCloneFollowLogo: v }),
		setSpectrumCloneRadialFitLogo: v =>
			set({ spectrumCloneRadialFitLogo: v }),
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
		applySpectrumMacro: (macro, value) =>
			set(state => buildSpectrumMacroPatch(state, macro, value)),
		randomizeSpectrum: colorSource => {
			invalidateSpectrumPresetMorph();
			set(generateRandomSpectrumProfile(colorSource));
		},
		addSpectrumProfileSlot: () =>
			set(state => {
				if (state.spectrumProfileSlots.length >= MAX_SPECTRUM_SLOT_COUNT)
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
		loadSpectrumProfileSlot: index => {
			invalidateSpectrumPresetMorph();
			set(state => {
				const slot = state.spectrumProfileSlots[index];
				if (!slot?.values) return state;
				return hydrateSpectrumProfileValues(slot.values);
			});
		},
		resetSpectrumToDefaults: () => {
			invalidateSpectrumPresetMorph();
			set({
				...hydrateSpectrumProfileValues(
					extractSpectrumProfileSettings(
						DEFAULT_STATE as unknown as WallpaperStore
					)
				)
			});
		},
		recoverAudioOverlays: () => {
			invalidateSpectrumPresetMorph();
			set(state => ({
				...hydrateSpectrumProfileValues(
					extractSpectrumProfileSettings(
						DEFAULT_STATE as unknown as WallpaperStore
					)
				),
				spectrumEnabled: true,
				logoEnabled: Boolean(state.logoUrl)
			}));
		}
	} satisfies Partial<WallpaperStore>;
}
