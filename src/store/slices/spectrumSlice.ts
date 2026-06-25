import type { StateCreator } from 'zustand';
import { SPECTRUM_RANGES } from '@/config/ranges';
import { clamp } from '@/lib/math';
import { DEFAULT_STATE } from '@/lib/constants';
import { CANONICAL_FACTORY_SPECTRUM_PATCH } from '@/lib/canonicalFactoryPresets';
import {
	buildSpectrumMacroPatch,
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
	getSpectrumLiquidLayerFieldKey,
	getSpectrumLiquidLayerRigidShapeFieldKey,
	getSpectrumLiquidLayerShapeFieldKey,
	type SpectrumLiquidLayerParamKey
} from '@/features/spectrum/spectrumLiquidLayers';
import type { SpectrumFrameMemoryPresetId } from '@/features/spectrum/spectrumFrameMemoryPresets';
import type { SpectrumFrameMemoryTarget } from '@/features/spectrum/spectrumFrameMemoryPresets';
import { hydrateSpectrumProfileValues } from '@/features/spectrum/runtime/spectrumProfileHydrate';
import {
	applySpectrumTargetSettings,
	defaultSpectrumTargetSettings,
	extractSpectrumTargetSettings,
	pickSpectrumInstanceSettings,
	readSlotTargetSettings,
	writeSlotTargetSettings,
	type SpectrumProfileTarget
} from '@/features/spectrum/spectrumTargetProfile';
import { invalidateSpectrumPresetMorph } from '@/features/spectrum/runtime/spectrumPresetTransition';
import type {
	ColorSourceMode,
	ResolvedAudioReactiveChannel,
	SpectrumInstance,
	SpectrumProfileSettings
} from '@/types/wallpaper';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2];

function randomChoice<T>(items: readonly T[]): T {
	return items[Math.floor(Math.random() * items.length)]!;
}

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
	// hydrate (not just normalize): the canonical data still carries legacy
	// flat `spectrumClone*` keys, which hydration converts to
	// `spectrumInstances` — and it keeps dead keys out of the store.
	const patch = hydrateSpectrumProfileValues(
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

function getCurrentSpectrumPresetProfiles(
	state: WallpaperStore
): SpectrumProfileSettings[] {
	const profiles = state.spectrumProfileSlots
		.map(slot => slot.values)
		.filter((values): values is SpectrumProfileSettings => Boolean(values))
		.map(values => hydrateSpectrumProfileValues(values));
	if (profiles.length > 0) return profiles;

	return (
		buildCanonicalSpectrumFactoryPatch()
			.spectrumProfileSlots?.map(slot => slot.values)
			.filter((values): values is SpectrumProfileSettings =>
				Boolean(values)
			)
			.map(values => hydrateSpectrumProfileValues(values)) ?? []
	);
}

function buildPresetShuffleSpectrumPatch(
	state: WallpaperStore,
	colorSource: ColorSourceMode
): Partial<WallpaperStore> {
	const profiles = getCurrentSpectrumPresetProfiles(state);
	if (profiles.length === 0) return {};

	const mainProfile = randomChoice(profiles);
	const secondaryProfiles = profiles.filter(
		profile => profile !== mainProfile
	);
	const instanceProfile = randomChoice(
		secondaryProfiles.length > 0 ? secondaryProfiles : profiles
	);
	const sourceInstance =
		instanceProfile.spectrumInstances[0] ??
		mainProfile.spectrumInstances[0] ??
		null;

	return {
		...mainProfile,
		spectrumColorSource: colorSource,
		spectrumInstances: state.spectrumInstances.map((instance, index) => {
			if (index !== 0 || !sourceInstance) return instance;
			return normalizeSpectrumSettings({
				...instance,
				...sourceInstance,
				id: instance.id,
				enabled: sourceInstance.enabled ?? instance.enabled,
				spectrumColorSource: colorSource
			}) as SpectrumInstance;
		})
	};
}

/** Per-target preset shuffle: applies one random preset's look to the chosen
 *  spectrum only, leaving the other spectrum, master enable and visibility
 *  untouched. */
function buildTargetPresetShufflePatch(
	state: WallpaperStore,
	target: SpectrumProfileTarget,
	colorSource: ColorSourceMode
): Partial<WallpaperStore> {
	const profiles = getCurrentSpectrumPresetProfiles(state);
	if (profiles.length === 0) return {};
	const profile = randomChoice(profiles);
	const settings = {
		...pickSpectrumInstanceSettings(profile),
		spectrumColorSource: colorSource
	};
	return applySpectrumTargetSettings(
		state,
		target,
		settings
	) as Partial<WallpaperStore>;
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
		setSpectrumMainVisible: v =>
			set(state => {
				if (v) return { spectrumMainVisible: true };
				// At least one spectrum must stay visible: use the master
				// `spectrumEnabled` toggle to hide everything. Refuse to turn off
				// the main spectrum when no instance is enabled.
				const anyInstanceEnabled = state.spectrumInstances.some(
					inst => inst.enabled
				);
				if (!anyInstanceEnabled) return state;
				return { spectrumMainVisible: false };
			}),
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
		setSpectrumLiquidLayerShape: (layer, shape) =>
			set({ [getSpectrumLiquidLayerShapeFieldKey(layer)]: shape }),
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
		setSpectrumSpan: v => set({ spectrumSpan: v }),
		setSpectrumInnerRadius: v => set({ spectrumInnerRadius: v }),
		setSpectrumBarCount: v => set({ spectrumBarCount: v }),
		setSpectrumBarWidth: v => set({ spectrumBarWidth: v }),
		setSpectrumMinHeight: v => set({ spectrumMinHeight: v }),
		setSpectrumMaxHeight: v => set({ spectrumMaxHeight: v }),
		setSpectrumSmoothing: v => set({ spectrumSmoothing: v }),
		setSpectrumOpacity: v => set({ spectrumOpacity: v }),
		setSpectrumGlowIntensity: v => set({ spectrumGlowIntensity: v }),
		setSpectrumGlowReach: v => set({ spectrumGlowReach: v }),
		setSpectrumGlowAudioAmount: v => set({ spectrumGlowAudioAmount: v }),
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
		patchSpectrumMain: patch =>
			set(() => {
				if (
					patch.spectrumFamily !== undefined ||
					patch.spectrumMode !== undefined
				) {
					invalidateSpectrumPresetMorph();
				}
				const next = { ...patch };
				if (next.spectrumFamily !== undefined) {
					next.spectrumFamily = normalizeSpectrumFamily(
						next.spectrumFamily
					);
				}
				if (next.spectrumShape !== undefined) {
					next.spectrumShape = normalizeSpectrumShape(
						next.spectrumShape
					);
				}
				return normalizeSpectrumSettings(
					next
				) as Partial<WallpaperStore>;
			}),
		updateSpectrumInstance: (id, patch) =>
			set(state => {
				if (
					patch.spectrumFamily !== undefined ||
					patch.spectrumMode !== undefined
				) {
					invalidateSpectrumPresetMorph();
				}
				return {
					spectrumInstances: state.spectrumInstances.map(inst =>
						inst.id === id
							? (normalizeSpectrumSettings({
									...inst,
									...patch
								}) as SpectrumInstance)
							: inst
					)
				};
			}),
		setSpectrumInstanceEnabled: (id, v) =>
			set(state => {
				if (!v) {
					// At least one spectrum must stay visible (see
					// setSpectrumMainVisible). Refuse to disable the last one.
					const otherVisible =
						state.spectrumMainVisible ||
						state.spectrumInstances.some(
							inst => inst.id !== id && inst.enabled
						);
					if (!otherVisible) return state;
				}
				return {
					spectrumInstances: state.spectrumInstances.map(inst =>
						inst.id === id ? { ...inst, enabled: v } : inst
					)
				};
			}),
		applySpectrumMacro: (macro, value) =>
			set(state => buildSpectrumMacroPatch(state, macro, value)),
		applySpectrumFrameMemoryPreset: (
			preset: SpectrumFrameMemoryPresetId,
			target: SpectrumFrameMemoryTarget
		) =>
			set(state => {
				const patch = normalizeSpectrumSettings(
					buildSpectrumFrameMemoryPresetPatch(preset, target)
				);
				if (target === 'main') return patch;
				return {
					spectrumInstances: state.spectrumInstances.map(
						(inst, index) =>
							index === 0
								? (normalizeSpectrumSettings({
										...inst,
										...patch
									}) as SpectrumInstance)
								: inst
					)
				};
			}),
		applySpectrumTunnelPreset: (preset: SpectrumFrameMemoryPresetId) =>
			set(state =>
				normalizeSpectrumSettings({
					...state,
					...buildSpectrumTunnelPresetPatch(preset)
				})
			),
		randomizeSpectrum: colorSource => {
			invalidateSpectrumPresetMorph();
			set(state => buildPresetShuffleSpectrumPatch(state, colorSource));
		},
		randomizeSpectrumTarget: (target, colorSource) => {
			invalidateSpectrumPresetMorph();
			set(state =>
				buildTargetPresetShufflePatch(state, target, colorSource)
			);
		},
		resetSpectrumTarget: target =>
			set(state =>
				applySpectrumTargetSettings(
					state,
					target,
					defaultSpectrumTargetSettings(target)
				)
			),
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
		// Profiles keep an independent look per spectrum: a slot stores the main
		// look in its flat keys and the second-spectrum look in
		// `spectrumInstances[0]`. Saving updates only the active target's portion;
		// loading reads only the active target's portion. `target` defaults to
		// 'main' so legacy/HUD callers operate on Spectrum 1.
		saveSpectrumProfileSlot: (index, target = 'main') =>
			set(state => {
				if (index < 0 || index >= state.spectrumProfileSlots.length)
					return state;
				const settings = extractSpectrumTargetSettings(state, target);
				const nextSlots = state.spectrumProfileSlots.map(
					(slot, slotIndex) =>
						slotIndex === index
							? {
									name: buildSpectrumProfileName({
										...state,
										...settings
									}),
									values: writeSlotTargetSettings(
										slot.values,
										target,
										settings
									)
								}
							: slot
				);
				return { spectrumProfileSlots: nextSlots };
			}),
		loadSpectrumProfileSlot: (index, target = 'main') => {
			invalidateSpectrumPresetMorph();
			set(state => {
				const slot = state.spectrumProfileSlots[index];
				if (!slot?.values) return state;
				const template = readSlotTargetSettings(
					hydrateSpectrumProfileValues(slot.values),
					target
				);
				const patch = applySpectrumTargetSettings(
					state,
					target,
					template
				) as Partial<WallpaperStore>;
				if (target === 'instance') {
					const instances = (
						patch.spectrumInstances ?? state.spectrumInstances
					).map((inst, instanceIndex) =>
						instanceIndex === 0 ? { ...inst, enabled: true } : inst
					);
					return {
						...patch,
						spectrumInstances: instances,
						spectrumEnabled: true
					};
				}
				return {
					...patch,
					spectrumEnabled: true,
					spectrumMainVisible: true
				};
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
				spectrumMainVisible: true,
				logoEnabled: Boolean(state.logoUrl)
			}));
		}
	} satisfies Partial<WallpaperStore>;
}
