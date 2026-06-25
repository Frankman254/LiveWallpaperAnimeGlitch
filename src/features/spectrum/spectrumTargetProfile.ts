import { DEFAULT_STATE } from '@/lib/constants';
import { normalizeSpectrumSettings } from '@/features/spectrum/spectrumStateTransforms';
import { hydrateSpectrumProfileValues } from '@/features/spectrum/runtime/spectrumProfileHydrate';
import {
	SPECTRUM_INSTANCE_SETTING_KEYS,
	createDefaultSpectrumInstanceSettings
} from '@/features/spectrum/spectrumInstanceModel';
import type {
	SpectrumInstance,
	SpectrumInstanceSettings,
	SpectrumProfileSettings,
	WallpaperState
} from '@/types/wallpaper';

/**
 * Which spectrum a target-bound action operates on. Structurally identical to
 * the editor's `SpectrumTarget`; kept here so store/profile code never imports
 * UI. 'main' = the flat WallpaperState keys; 'instance' = spectrumInstances[0]
 * ("Spectrum 2").
 */
export type SpectrumProfileTarget = 'main' | 'instance';

/** Plucks only the per-instance setting keys out of any superset object. */
export function pickSpectrumInstanceSettings(
	source: Partial<SpectrumInstanceSettings>
): SpectrumInstanceSettings {
	const defaults =
		createDefaultSpectrumInstanceSettings() as unknown as Record<
			string,
			unknown
		>;
	const src = source as unknown as Record<string, unknown>;
	for (const key of SPECTRUM_INSTANCE_SETTING_KEYS) {
		const value = src[key];
		if (value !== undefined) defaults[key] = value;
	}
	return defaults as unknown as SpectrumInstanceSettings;
}

/** Reads the live per-instance settings of the chosen target. */
export function extractSpectrumTargetSettings(
	state: WallpaperState,
	target: SpectrumProfileTarget
): SpectrumInstanceSettings {
	if (target === 'instance') {
		const instance = state.spectrumInstances[0];
		return instance
			? pickSpectrumInstanceSettings(instance)
			: createDefaultSpectrumInstanceSettings();
	}
	return pickSpectrumInstanceSettings(
		state as unknown as Partial<SpectrumInstanceSettings>
	);
}

/** Factory-default per-instance settings for the chosen target. The main
 *  spectrum keeps its own DEFAULT_STATE look; the extra instance uses the
 *  canonical instance defaults. */
export function defaultSpectrumTargetSettings(
	target: SpectrumProfileTarget
): SpectrumInstanceSettings {
	if (target === 'instance') return createDefaultSpectrumInstanceSettings();
	return pickSpectrumInstanceSettings(
		DEFAULT_STATE as unknown as Partial<SpectrumInstanceSettings>
	);
}

/**
 * Builds the store patch that writes a per-instance settings object onto the
 * chosen target only — flat keys for the main spectrum, a single instance swap
 * for "Spectrum 2". Never touches the other spectrum, master enable, or the
 * profile slots. Callers add visibility/enable flags on top when wanted.
 */
export function applySpectrumTargetSettings(
	state: WallpaperState,
	target: SpectrumProfileTarget,
	settings: Partial<SpectrumInstanceSettings>
): Partial<WallpaperState> {
	const picked = pickSpectrumInstanceSettings(settings);
	if (target === 'instance') {
		return {
			spectrumInstances: state.spectrumInstances.map((inst, index) =>
				index === 0
					? (normalizeSpectrumSettings({
							...inst,
							...picked
						}) as SpectrumInstance)
					: inst
			)
		};
	}
	return normalizeSpectrumSettings(picked) as Partial<WallpaperState>;
}

/**
 * Builds a profile slot value from a single target's look. The slot keeps the
 * full `SpectrumProfileSettings` shape (so persistence/export/import and the
 * scene system stay unchanged), but only the per-instance template keys carry
 * meaning — visibility and the other spectrum stay at defaults.
 */
export function buildSpectrumTargetProfile(
	settings: SpectrumInstanceSettings
): SpectrumProfileSettings {
	return hydrateSpectrumProfileValues({ ...settings });
}

/** Per-instance keys of a profile slot, normalized for comparison. */
function profileTemplateSettings(
	values: SpectrumProfileSettings
): SpectrumInstanceSettings {
	return pickSpectrumInstanceSettings(
		hydrateSpectrumProfileValues(
			values
		) as Partial<SpectrumInstanceSettings>
	);
}

function instanceSettingsEqual(
	a: SpectrumInstanceSettings,
	b: SpectrumInstanceSettings
): boolean {
	const ao = a as unknown as Record<string, unknown>;
	const bo = b as unknown as Record<string, unknown>;
	return SPECTRUM_INSTANCE_SETTING_KEYS.every(key => {
		const av = ao[key];
		const bv = bo[key];
		if (
			av !== null &&
			bv !== null &&
			typeof av === 'object' &&
			typeof bv === 'object'
		) {
			return JSON.stringify(av) === JSON.stringify(bv);
		}
		return av === bv;
	});
}

/**
 * Target-aware version of the active-profile selector: returns the slot whose
 * template matches the *currently edited* spectrum, or -1. Reactive-friendly
 * (pure over state + target).
 */
export function selectSpectrumActiveProfileIndexForTarget(
	state: WallpaperState,
	target: SpectrumProfileTarget
): number {
	const current = pickSpectrumInstanceSettings(
		buildSpectrumTargetProfile(
			extractSpectrumTargetSettings(state, target)
		) as Partial<SpectrumInstanceSettings>
	);
	return state.spectrumProfileSlots.findIndex(slot =>
		slot.values
			? instanceSettingsEqual(
					current,
					profileTemplateSettings(slot.values)
				)
			: false
	);
}
