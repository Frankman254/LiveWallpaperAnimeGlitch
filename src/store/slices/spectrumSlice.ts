import type { StateCreator } from 'zustand';
import { SPECTRUM_RANGES } from '@/config/ranges';
import { clamp } from '@/lib/math';
import { DEFAULT_STATE } from '@/lib/constants';
import { CANONICAL_FACTORY_SPECTRUM_PATCH } from '@/lib/canonicalFactoryPresets';
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
import { buildSpectrumFrameMemoryPresetPatch } from '@/features/spectrum/spectrumFrameMemoryPresets';
import { buildSpectrumTunnelPresetPatch } from '@/features/spectrum/spectrumTunnelPresets';
import { buildSpectrumLiquidPresetPatch } from '@/features/spectrum/spectrumLiquidPresets';
import {
	getSpectrumCloneLiquidLayerFieldKey,
	getSpectrumCloneLiquidLayerRigidShapeFieldKey,
	getSpectrumCloneLiquidLayerShapeFieldKey,
	getSpectrumLiquidLayerFieldKey,
	getSpectrumLiquidLayerRigidShapeFieldKey,
	getSpectrumLiquidLayerShapeFieldKey,
	type SpectrumLiquidLayerParamKey
} from '@/features/spectrum/spectrumLiquidLayers';
import type { SpectrumFrameMemoryPresetId } from '@/features/spectrum/spectrumFrameMemoryPresets';
import type { SpectrumFrameMemoryTarget } from '@/features/spectrum/spectrumFrameMemoryPresets';
import { hydrateSpectrumProfileValues } from '@/features/spectrum/runtime/spectrumProfileHydrate';
import { invalidateSpectrumPresetMorph } from '@/features/spectrum/runtime/spectrumPresetTransition';
import type {
	ResolvedAudioReactiveChannel,
	SpectrumProfileSettings
} from '@/types/wallpaper';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2];

function clampShockwaveBandThreshold(value: number): number {
	return Number.isFinite(value)
		? clamp(
				value,
				SPECTRUM_RANGES.shockwaveBandThreshold.min,
				SPECTRUM_RANGES.shockwaveBandThreshold.max
			)
		: (DEFAULT_STATE.spectrumShockwaveBandThresholds.bass ?? 0.5);
}

function buildCanonicalSpectrumFactoryPatch(): Partial<WallpaperStore> {
	const patch = normalizeSpectrumSettings(
		CANONICAL_FACTORY_SPECTRUM_PATCH as Partial<SpectrumProfileSettings>
	) as Partial<WallpaperStore>;
	const spectrumProfileSlots =
		CANONICAL_FACTORY_SPECTRUM_PATCH.spectrumProfileSlots?.map(slot => ({
			...slot,
			values: slot.values
				? hydrateSpectrumProfileValues(slot.values)
				: null
		}));

	return {
		...patch,
		...(spectrumProfileSlots ? { spectrumProfileSlots } : {})
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
		setSpectrumFrameMemoryEnabled: v =>
			set({ spectrumFrameMemoryEnabled: v }),
		setSpectrumAfterglow: v => set({ spectrumAfterglow: v }),
		setSpectrumMotionTrails: v => set({ spectrumMotionTrails: v }),
		setSpectrumGhostFrames: v => set({ spectrumGhostFrames: v }),
		setSpectrumFrameHistoryDepth: v =>
			set({ spectrumFrameHistoryDepth: v }),
		setSpectrumGainExpressiveness: v =>
			set({ spectrumGainExpressiveness: v }),
		setSpectrumEnvelopeAttack: v => set({ spectrumEnvelopeAttack: v }),
		setSpectrumEnvelopeRelease: v => set({ spectrumEnvelopeRelease: v }),
		setSpectrumEnvelopeReactivitySpeed: v =>
			set({ spectrumEnvelopeReactivitySpeed: v }),
		setSpectrumEnvelopePeakWindow: v =>
			set({ spectrumEnvelopePeakWindow: v }),
		setSpectrumEnvelopePeakFloor: v =>
			set({ spectrumEnvelopePeakFloor: v }),
		setSpectrumEnvelopePunch: v => set({ spectrumEnvelopePunch: v }),
		setSpectrumPeakRibbonsEnabled: v =>
			set({ spectrumPeakRibbonsEnabled: v }),
		setSpectrumPeakRibbons: v => set({ spectrumPeakRibbons: v }),
		setSpectrumPeakRibbonAngle: v => set({ spectrumPeakRibbonAngle: v }),
		setSpectrumBassShockwaveEnabled: v =>
			set({ spectrumBassShockwaveEnabled: v }),
		setSpectrumBassShockwave: v => set({ spectrumBassShockwave: v }),
		setSpectrumShockwaveBandMode: v =>
			set({ spectrumShockwaveBandMode: v }),
		setSpectrumShockwaveBandThreshold: (channel, value) =>
			set(state => ({
				spectrumShockwaveBandThresholds: {
					...DEFAULT_STATE.spectrumShockwaveBandThresholds,
					...state.spectrumShockwaveBandThresholds,
					[channel as ResolvedAudioReactiveChannel]:
						clampShockwaveBandThreshold(value)
				}
			})),
		setSpectrumShockwaveThickness: v =>
			set({
				spectrumShockwaveThickness: Number.isFinite(v)
					? clamp(
							v,
							SPECTRUM_RANGES.shockwaveThickness.min,
							SPECTRUM_RANGES.shockwaveThickness.max
						)
					: DEFAULT_STATE.spectrumShockwaveThickness
			}),
		setSpectrumShockwaveOpacity: v =>
			set({
				spectrumShockwaveOpacity: Number.isFinite(v)
					? clamp(
							v,
							SPECTRUM_RANGES.shockwaveOpacity.min,
							SPECTRUM_RANGES.shockwaveOpacity.max
						)
					: DEFAULT_STATE.spectrumShockwaveOpacity
			}),
		setSpectrumShockwaveBlur: v =>
			set({
				spectrumShockwaveBlur: Number.isFinite(v)
					? clamp(
							v,
							SPECTRUM_RANGES.shockwaveBlur.min,
							SPECTRUM_RANGES.shockwaveBlur.max
						)
					: DEFAULT_STATE.spectrumShockwaveBlur
			}),
		setSpectrumShockwaveColorMode: v =>
			set({ spectrumShockwaveColorMode: v }),
		setSpectrumEnergyBloomEnabled: v =>
			set({ spectrumEnergyBloomEnabled: v }),
		setSpectrumEnergyBloom: v =>
			set({
				spectrumEnergyBloom: Number.isFinite(v)
					? clamp(
							v,
							SPECTRUM_RANGES.energyBloom.min,
							SPECTRUM_RANGES.energyBloom.max
						)
					: DEFAULT_STATE.spectrumEnergyBloom
			}),
		setSpectrumFigureRotationSpeed: v =>
			set({ spectrumFigureRotationSpeed: v }),
		setSpectrumCloneFigureRotationSpeed: v =>
			set({ spectrumCloneFigureRotationSpeed: v }),
		setSpectrumOscilloscopeLineWidth: v =>
			set({ spectrumOscilloscopeLineWidth: v }),
		setSpectrumTunnelRingCount: v => set({ spectrumTunnelRingCount: v }),
		setSpectrumTunnelDepthFalloff: v =>
			set({ spectrumTunnelDepthFalloff: v }),
		setSpectrumTunnelRingSpacing: v =>
			set({ spectrumTunnelRingSpacing: v }),
		setSpectrumTunnelWallOpacity: v =>
			set({ spectrumTunnelWallOpacity: v }),
		setSpectrumTunnelPulseStrength: v =>
			set({ spectrumTunnelPulseStrength: v }),
		setSpectrumTunnelAlternateRotation: v =>
			set({ spectrumTunnelAlternateRotation: v }),
		setSpectrumLiquidLayerRigidShape: (layer, v) =>
			set({ [getSpectrumLiquidLayerRigidShapeFieldKey(layer)]: v }),
		setSpectrumLiquidLayerParam: (
			layer: 1 | 2 | 3,
			param: SpectrumLiquidLayerParamKey,
			value: number
		) =>
			set({
				[getSpectrumLiquidLayerFieldKey(layer, param)]: value
			}),
		applySpectrumLiquidPreset: (preset: SpectrumFrameMemoryPresetId) =>
			set(state =>
				normalizeSpectrumSettings({
					...state,
					...buildSpectrumLiquidPresetPatch(preset)
				})
			),
		setSpectrumCloneTunnelDepthFalloff: v =>
			set({ spectrumCloneTunnelDepthFalloff: v }),
		setSpectrumCloneTunnelRingSpacing: v =>
			set({ spectrumCloneTunnelRingSpacing: v }),
		setSpectrumCloneTunnelWallOpacity: v =>
			set({ spectrumCloneTunnelWallOpacity: v }),
		setSpectrumCloneTunnelPulseStrength: v =>
			set({ spectrumCloneTunnelPulseStrength: v }),
		setSpectrumCloneTunnelAlternateRotation: v =>
			set({ spectrumCloneTunnelAlternateRotation: v }),
		setSpectrumCloneLiquidLayerParam: (
			layer: 1 | 2 | 3,
			param: SpectrumLiquidLayerParamKey,
			value: number
		) =>
			set({
				[getSpectrumCloneLiquidLayerFieldKey(layer, param)]: value
			}),
		setSpectrumLiquidLayerShape: (layer, shape) =>
			set({ [getSpectrumLiquidLayerShapeFieldKey(layer)]: shape }),
		setSpectrumCloneLiquidLayerShape: (layer, shape) =>
			set({ [getSpectrumCloneLiquidLayerShapeFieldKey(layer)]: shape }),
		setSpectrumCloneLiquidLayerRigidShape: (layer, v) =>
			set({
				[getSpectrumCloneLiquidLayerRigidShapeFieldKey(layer)]: v
			}),
		setSpectrumSpiralTurns: v => set({ spectrumSpiralTurns: v }),
		setSpectrumSpiralOuterRadius: v =>
			set({ spectrumSpiralOuterRadius: v }),
		setSpectrumSpiralTightness: v => set({ spectrumSpiralTightness: v }),
		setSpectrumSpiralShape: v => set({ spectrumSpiralShape: v }),
		setSpectrumSpiralLogarithmic: v =>
			set({ spectrumSpiralLogarithmic: v }),
		setSpectrumSpiralGradientStroke: v =>
			set({ spectrumSpiralGradientStroke: v }),
		setSpectrumSpiralArms: v => set({ spectrumSpiralArms: v }),
		setSpectrumSpiralAudioTurns: v => set({ spectrumSpiralAudioTurns: v }),
		setSpectrumSpiralDotShape: v => set({ spectrumSpiralDotShape: v }),
		setSpectrumSpiralStrokeWidth: v =>
			set({ spectrumSpiralStrokeWidth: v }),
		setSpectrumCloneSpiralTurns: v => set({ spectrumCloneSpiralTurns: v }),
		setSpectrumCloneSpiralOuterRadius: v =>
			set({ spectrumCloneSpiralOuterRadius: v }),
		setSpectrumCloneSpiralTightness: v =>
			set({ spectrumCloneSpiralTightness: v }),
		setSpectrumCloneSpiralShape: v => set({ spectrumCloneSpiralShape: v }),
		setSpectrumCloneSpiralLogarithmic: v =>
			set({ spectrumCloneSpiralLogarithmic: v }),
		setSpectrumCloneSpiralGradientStroke: v =>
			set({ spectrumCloneSpiralGradientStroke: v }),
		setSpectrumCloneSpiralArms: v => set({ spectrumCloneSpiralArms: v }),
		setSpectrumCloneSpiralAudioTurns: v =>
			set({ spectrumCloneSpiralAudioTurns: v }),
		setSpectrumCloneSpiralDotShape: v =>
			set({ spectrumCloneSpiralDotShape: v }),
		setSpectrumCloneSpiralStrokeWidth: v =>
			set({ spectrumCloneSpiralStrokeWidth: v }),
		setSpectrumOscilloscopeScrollSpeed: v =>
			set({ spectrumOscilloscopeScrollSpeed: v }),
		setSpectrumOscilloscopeReactiveWidth: v =>
			set({ spectrumOscilloscopeReactiveWidth: v }),
		setSpectrumOscilloscopePhosphor: v =>
			set({ spectrumOscilloscopePhosphor: v }),
		setSpectrumOscilloscopePhosphorDecay: v =>
			set({ spectrumOscilloscopePhosphorDecay: v }),
		setSpectrumOscilloscopeGrid: v => set({ spectrumOscilloscopeGrid: v }),
		setSpectrumOscilloscopeGridDivisions: v =>
			set({ spectrumOscilloscopeGridDivisions: v }),
		setSpectrumCloneOscilloscopeLineWidth: v =>
			set({ spectrumCloneOscilloscopeLineWidth: v }),
		setSpectrumCloneOscilloscopeScrollSpeed: v =>
			set({ spectrumCloneOscilloscopeScrollSpeed: v }),
		setSpectrumCloneOscilloscopeReactiveWidth: v =>
			set({ spectrumCloneOscilloscopeReactiveWidth: v }),
		setSpectrumCloneOscilloscopePhosphor: v =>
			set({ spectrumCloneOscilloscopePhosphor: v }),
		setSpectrumCloneOscilloscopePhosphorDecay: v =>
			set({ spectrumCloneOscilloscopePhosphorDecay: v }),
		setSpectrumCloneOscilloscopeGrid: v =>
			set({ spectrumCloneOscilloscopeGrid: v }),
		setSpectrumCloneOscilloscopeGridDivisions: v =>
			set({ spectrumCloneOscilloscopeGridDivisions: v }),
		setSpectrumDriveMode: v => set({ spectrumDriveMode: v }),
		setSpectrumManualSections: v => set({ spectrumManualSections: v }),
		setSpectrumManualAddWeight: v => set({ spectrumManualAddWeight: v }),
		setSpectrumManualAttack: v => set({ spectrumManualAttack: v }),
		setSpectrumManualRelease: v => set({ spectrumManualRelease: v }),
		setSpectrumManualBinding: (index, key) =>
			set(state => {
				const bindings = state.spectrumManualBindings.slice();
				bindings[index] = key;
				return { spectrumManualBindings: bindings };
			}),
		setShowSpectrumManualHud: v => set({ showSpectrumManualHud: v }),
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
		setSpectrumCloneFamily: v =>
			set({
				spectrumCloneFamily: normalizeSpectrumFamily(v)
			}),
		setSpectrumCloneTunnelRingCount: v =>
			set({ spectrumCloneTunnelRingCount: v }),
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
		setSpectrumClonePrimaryColor: v =>
			set({ spectrumClonePrimaryColor: v }),
		setSpectrumCloneSecondaryColor: v =>
			set({ spectrumCloneSecondaryColor: v }),
		setSpectrumCloneColorSource: v => set({ spectrumCloneColorSource: v }),
		setSpectrumCloneColorMode: v => set({ spectrumCloneColorMode: v }),
		setSpectrumCloneBandMode: v => set({ spectrumCloneBandMode: v }),
		setSpectrumCloneAudioSmoothing: v =>
			set({ spectrumCloneAudioSmoothing: v }),
		setSpectrumCloneRotationSpeed: v =>
			set({ spectrumCloneRotationSpeed: v }),
		setSpectrumCloneRotationDrive: v =>
			set({ spectrumCloneRotationDrive: v }),
		setSpectrumCloneRotationAudioAmount: v =>
			set({ spectrumCloneRotationAudioAmount: v }),
		setSpectrumCloneRotationChannel: v =>
			set({ spectrumCloneRotationChannel: v }),
		setSpectrumCloneRotationDirection: v =>
			set({ spectrumCloneRotationDirection: v }),
		setSpectrumCloneRotationSmoothing: v =>
			set({ spectrumCloneRotationSmoothing: v }),
		setSpectrumCloneMirror: v => set({ spectrumCloneMirror: v }),
		setSpectrumClonePeakHold: v => set({ spectrumClonePeakHold: v }),
		setSpectrumClonePeakDecay: v => set({ spectrumClonePeakDecay: v }),
		setSpectrumClonePeakRibbonsEnabled: v =>
			set({ spectrumClonePeakRibbonsEnabled: v }),
		setSpectrumClonePeakRibbons: v => set({ spectrumClonePeakRibbons: v }),
		setSpectrumCloneFrameMemoryEnabled: v =>
			set({ spectrumCloneFrameMemoryEnabled: v }),
		setSpectrumCloneAfterglow: v => set({ spectrumCloneAfterglow: v }),
		setSpectrumCloneMotionTrails: v =>
			set({ spectrumCloneMotionTrails: v }),
		setSpectrumCloneGhostFrames: v => set({ spectrumCloneGhostFrames: v }),
		setSpectrumCloneFrameHistoryDepth: v =>
			set({ spectrumCloneFrameHistoryDepth: v }),
		setSpectrumCloneGainExpressiveness: v =>
			set({ spectrumCloneGainExpressiveness: v }),
		setSpectrumCloneEnvelopeAttack: v =>
			set({ spectrumCloneEnvelopeAttack: v }),
		setSpectrumCloneEnvelopeRelease: v =>
			set({ spectrumCloneEnvelopeRelease: v }),
		setSpectrumCloneEnvelopeReactivitySpeed: v =>
			set({ spectrumCloneEnvelopeReactivitySpeed: v }),
		setSpectrumCloneEnvelopePeakWindow: v =>
			set({ spectrumCloneEnvelopePeakWindow: v }),
		setSpectrumCloneEnvelopePeakFloor: v =>
			set({ spectrumCloneEnvelopePeakFloor: v }),
		setSpectrumCloneEnvelopePunch: v =>
			set({ spectrumCloneEnvelopePunch: v }),
		setSpectrumCloneEnergyBloomEnabled: v =>
			set({ spectrumCloneEnergyBloomEnabled: v }),
		setSpectrumCloneEnergyBloom: v => set({ spectrumCloneEnergyBloom: v }),
		setSpectrumCloneBassShockwaveEnabled: v =>
			set({ spectrumCloneBassShockwaveEnabled: v }),
		setSpectrumCloneBassShockwave: v =>
			set({ spectrumCloneBassShockwave: v }),
		setSpectrumCloneShockwaveBandMode: v =>
			set({ spectrumCloneShockwaveBandMode: v }),
		setSpectrumCloneShockwaveBandThreshold: (channel, value) =>
			set(state => ({
				spectrumCloneShockwaveBandThresholds: {
					...DEFAULT_STATE.spectrumCloneShockwaveBandThresholds,
					...state.spectrumCloneShockwaveBandThresholds,
					[channel as ResolvedAudioReactiveChannel]:
						clampShockwaveBandThreshold(value)
				}
			})),
		setSpectrumCloneShockwaveThickness: v =>
			set({
				spectrumCloneShockwaveThickness: Number.isFinite(v)
					? clamp(
							v,
							SPECTRUM_RANGES.shockwaveThickness.min,
							SPECTRUM_RANGES.shockwaveThickness.max
						)
					: DEFAULT_STATE.spectrumCloneShockwaveThickness
			}),
		setSpectrumCloneShockwaveOpacity: v =>
			set({
				spectrumCloneShockwaveOpacity: Number.isFinite(v)
					? clamp(
							v,
							SPECTRUM_RANGES.shockwaveOpacity.min,
							SPECTRUM_RANGES.shockwaveOpacity.max
						)
					: DEFAULT_STATE.spectrumCloneShockwaveOpacity
			}),
		setSpectrumCloneShockwaveBlur: v =>
			set({
				spectrumCloneShockwaveBlur: Number.isFinite(v)
					? clamp(
							v,
							SPECTRUM_RANGES.shockwaveBlur.min,
							SPECTRUM_RANGES.shockwaveBlur.max
						)
					: DEFAULT_STATE.spectrumCloneShockwaveBlur
			}),
		setSpectrumCloneShockwaveColorMode: v =>
			set({ spectrumCloneShockwaveColorMode: v }),
		setSpectrumClonePeakRibbonAngle: v =>
			set({ spectrumClonePeakRibbonAngle: v }),
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
		setSpectrumAudioSmoothing: v => set({ spectrumAudioSmoothing: v }),
		setSpectrumShape: v =>
			set({ spectrumShape: normalizeSpectrumShape(v) }),
		setSpectrumWaveFillOpacity: v => set({ spectrumWaveFillOpacity: v }),
		setSpectrumRotationSpeed: v =>
			set({ spectrumRotationSpeed: Math.abs(v) }),
		setSpectrumMirror: v => set({ spectrumMirror: v }),
		setSpectrumPeakHold: v => set({ spectrumPeakHold: v }),
		setSpectrumPeakDecay: v => set({ spectrumPeakDecay: v }),
		setSpectrumPositionX: v => set({ spectrumPositionX: v }),
		setSpectrumPositionY: v => set({ spectrumPositionY: v }),
		setSpectrumClonePositionX: v => set({ spectrumClonePositionX: v }),
		setSpectrumClonePositionY: v => set({ spectrumClonePositionY: v }),
		setSpectrumCloneWaveFillOpacity: v =>
			set({ spectrumCloneWaveFillOpacity: v }),
		applySpectrumMacro: (macro, value) =>
			set(state => buildSpectrumMacroPatch(state, macro, value)),
		applySpectrumFrameMemoryPreset: (
			preset: SpectrumFrameMemoryPresetId,
			target: SpectrumFrameMemoryTarget
		) =>
			set(() =>
				normalizeSpectrumSettings(
					buildSpectrumFrameMemoryPresetPatch(preset, target)
				)
			),
		applySpectrumTunnelPreset: (preset: SpectrumFrameMemoryPresetId) =>
			set(state =>
				normalizeSpectrumSettings({
					...state,
					...buildSpectrumTunnelPresetPatch(preset)
				})
			),
		randomizeSpectrum: colorSource => {
			invalidateSpectrumPresetMorph();
			set(generateRandomSpectrumProfile(colorSource));
		},
		addSpectrumProfileSlot: () =>
			set(state => {
				if (
					state.spectrumProfileSlots.length >= MAX_SPECTRUM_SLOT_COUNT
				)
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
			set(buildCanonicalSpectrumFactoryPatch());
		},
		restoreFactorySpectrumDefaults: () => {
			invalidateSpectrumPresetMorph();
			set(buildCanonicalSpectrumFactoryPatch());
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
