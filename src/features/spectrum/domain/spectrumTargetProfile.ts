import { DEFAULT_STATE } from '@/lib/constants';
import { normalizeSpectrumSettings } from '@/features/spectrum/spectrumStateTransforms';
import { hydrateSpectrumProfileValues } from '@/features/spectrum/runtime/spectrumProfileHydrate';
import {
	SPECTRUM_INSTANCE_SETTING_KEYS,
	createDefaultSpectrumInstance,
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
 * Reads a slot's stored look for ONE target portion. A slot keeps an
 * independent look per spectrum: the flat keys hold the Spectrum 1 portion and
 * `spectrumInstances[0]` holds the Spectrum 2 portion. This matches both new
 * slots and legacy dual-format slots (where flat = main, instances[0] = second
 * spectrum), so loading a slot into Spectrum 2 reads the second-spectrum look
 * instead of the main one.
 */
export function readSlotTargetSettings(
	values: SpectrumProfileSettings,
	target: SpectrumProfileTarget
): SpectrumInstanceSettings {
	if (target === 'instance') {
		const instance = values.spectrumInstances?.[0];
		return pickSpectrumInstanceSettings(
			(instance ?? {}) as Partial<SpectrumInstanceSettings>
		);
	}
	return pickSpectrumInstanceSettings(
		values as unknown as Partial<SpectrumInstanceSettings>
	);
}

/**
 * Writes a target's look into a slot value, preserving the OTHER target's
 * portion so a single slot can carry an independent look per spectrum.
 */
export function writeSlotTargetSettings(
	values: SpectrumProfileSettings | null,
	target: SpectrumProfileTarget,
	settings: SpectrumInstanceSettings
): SpectrumProfileSettings {
	const base = hydrateSpectrumProfileValues(
		(values ?? {}) as Partial<SpectrumProfileSettings>
	);
	const picked = pickSpectrumInstanceSettings(settings);
	if (target === 'instance') {
		const instance0 =
			base.spectrumInstances[0] ?? createDefaultSpectrumInstance();
		return {
			...base,
			spectrumInstances: [
				normalizeSpectrumSettings({
					...instance0,
					...picked
				}) as SpectrumInstance,
				...base.spectrumInstances.slice(1)
			]
		};
	}
	return normalizeSpectrumSettings({
		...base,
		...picked
	}) as SpectrumProfileSettings;
}

/** Normalizes a per-instance settings object through the profile hydrate path
 *  so live state and stored slots compare on equal footing. */
function normalizeTemplate(
	settings: Partial<SpectrumInstanceSettings>
): SpectrumInstanceSettings {
	return pickSpectrumInstanceSettings(
		hydrateSpectrumProfileValues({
			...settings
		}) as Partial<SpectrumInstanceSettings>
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
	const current = normalizeTemplate(
		extractSpectrumTargetSettings(state, target)
	);
	const slots =
		target === 'instance'
			? state.spectrumSecondProfileSlots
			: state.spectrumProfileSlots;
	return slots.findIndex(slot =>
		slot.values
			? instanceSettingsEqual(
					current,
					normalizeTemplate(
						readSlotTargetSettings(slot.values, target)
					)
				)
			: false
	);
}

/**
 * Whether one specific slot's stored look matches the live target settings.
 *
 * `selectSpectrumActiveProfileIndexForTarget` only returns the *first* matching
 * slot, so when several slots normalize to the same look it can't distinguish
 * them. The HUD carousel uses this per-slot check to keep an explicit
 * navigation cursor authoritative: as long as the cursor's slot still matches
 * live state, stepping stays on that slot's neighbours instead of snapping back
 * to the first duplicate.
 */
export function isSpectrumSlotActiveForTarget(
	state: WallpaperState,
	target: SpectrumProfileTarget,
	slotIndex: number
): boolean {
	const slots =
		target === 'instance'
			? state.spectrumSecondProfileSlots
			: state.spectrumProfileSlots;
	const slot = slots[slotIndex];
	if (!slot?.values) return false;
	const current = normalizeTemplate(
		extractSpectrumTargetSettings(state, target)
	);
	return instanceSettingsEqual(
		current,
		normalizeTemplate(readSlotTargetSettings(slot.values, target))
	);
}
