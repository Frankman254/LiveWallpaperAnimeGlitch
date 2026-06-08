/**
 * Scene slots are composition-only records that reference slots owned by
 * individual feature subsystems (spectrum, looks, particles, rain, logo,
 * trackTitle). Applying a Scene slot resolves each non-null reference and
 * copies the values from that feature's slot into a partial state patch. A
 * `null` reference means "do not apply this subsystem" — the feature's
 * current state is preserved.
 *
 * Design rules (hard):
 *  - A Scene slot MUST NOT flatten raw config.
 *  - A Scene slot MUST NOT own values; values live in each feature's slot.
 *  - Feature slots remain under each feature's authority; Scene only reads.
 */
import {
	extractLooksProfileSettings,
	extractParticlesProfileSettings,
	hydrateParticlesProfileValues,
	extractRainProfileSettings,
	extractTrackTitleProfileSettings,
	extractLogoProfileSettings,
	extractLightsProfileSettings,
	extractCameraFxProfileSettings
} from '@/lib/featureProfiles';
import { hydrateSpectrumProfileValues } from '@/features/spectrum/runtime/spectrumProfileHydrate';
import { DEFAULT_STATE } from '@/lib/constants';
import type { SceneSlot, SceneSlotRef, WallpaperState } from '@/types/wallpaper';

export function createSceneSlotId(): string {
	return `scene-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function defaultSceneSlotName(index: number): string {
	return `Scene ${index + 1}`;
}

export function createEmptySceneSlot(name?: string): SceneSlot {
	return {
		id: createSceneSlotId(),
		name: name?.trim() || defaultSceneSlotName(0),
		spectrumSlotIndex: null,
		looksSlotIndex: null,
		particlesSlotIndex: null,
		rainSlotIndex: null,
		lightsSlotIndex: null,
		cameraFxSlotIndex: null,
		logoSlotIndex: null,
		trackTitleSlotIndex: null
	};
}

/**
 * Clamp a slot index reference so it still points to a valid slot in
 * `slotsLength`. The literal `'off'` is preserved (force-off has no slot to
 * validate). Out-of-range numeric indices collapse to `null` so downstream
 * code does not crash on stale references.
 */
export function normalizeSlotRef(
	ref: SceneSlotRef | undefined,
	slotsLength: number
): SceneSlotRef {
	if (ref === 'off') return 'off';
	if (typeof ref !== 'number' || !Number.isFinite(ref)) return null;
	if (ref < 0 || ref >= slotsLength) return null;
	return Math.trunc(ref);
}

export function normalizeSceneSlotAgainstState(
	slot: SceneSlot,
	state: WallpaperState
): SceneSlot {
	return {
		...slot,
		spectrumSlotIndex: normalizeSlotRef(
			slot.spectrumSlotIndex,
			state.spectrumProfileSlots.length
		),
		looksSlotIndex: normalizeSlotRef(
			slot.looksSlotIndex,
			state.looksProfileSlots.length
		),
		particlesSlotIndex: normalizeSlotRef(
			slot.particlesSlotIndex,
			state.particlesProfileSlots.length
		),
		rainSlotIndex: normalizeSlotRef(
			slot.rainSlotIndex,
			state.rainProfileSlots.length
		),
		lightsSlotIndex: normalizeSlotRef(
			slot.lightsSlotIndex,
			state.lightsProfileSlots.length
		),
		cameraFxSlotIndex: normalizeSlotRef(
			slot.cameraFxSlotIndex,
			state.cameraFxProfileSlots.length
		),
		logoSlotIndex: normalizeSlotRef(
			slot.logoSlotIndex,
			state.logoProfileSlots.length
		),
		trackTitleSlotIndex: normalizeSlotRef(
			slot.trackTitleSlotIndex,
			state.trackTitleProfileSlots.length
		)
	};
}

/**
 * Resolve a Scene slot into a state patch. Each subsystem ref is 3-state:
 *  - `null`   → not present in the patch (the feature keeps its current state).
 *  - `'off'`  → emit a force-off patch (the feature's `*Enabled` flag(s) false).
 *  - `number` → copy the saved slot's values over the feature defaults.
 */
export function buildSceneSlotActivationPatch(
	state: WallpaperState,
	slot: SceneSlot
): Partial<WallpaperState> {
	const patch: Partial<WallpaperState> = {};
	const defaults = DEFAULT_STATE as WallpaperState;

	// Spectrum
	if (slot.spectrumSlotIndex === 'off') {
		Object.assign(patch, { spectrumEnabled: false });
	} else if (slot.spectrumSlotIndex !== null) {
		const ref = state.spectrumProfileSlots[slot.spectrumSlotIndex];
		if (ref?.values) {
			Object.assign(patch, hydrateSpectrumProfileValues(ref.values));
		}
	}

	// Looks (no single enable flag — 'off' is treated as a no-op, same as null)
	if (typeof slot.looksSlotIndex === 'number') {
		const ref = state.looksProfileSlots[slot.looksSlotIndex];
		if (ref?.values) {
			Object.assign(
				patch,
				extractLooksProfileSettings(defaults),
				ref.values
			);
		}
	}

	// Particles
	if (slot.particlesSlotIndex === 'off') {
		Object.assign(patch, { particlesEnabled: false });
	} else if (slot.particlesSlotIndex !== null) {
		const ref = state.particlesProfileSlots[slot.particlesSlotIndex];
		if (ref?.values) {
			const particleDefaults = extractParticlesProfileSettings(defaults);
			Object.assign(
				patch,
				hydrateParticlesProfileValues(ref.values, particleDefaults)
			);
		}
	}

	// Rain
	if (slot.rainSlotIndex === 'off') {
		Object.assign(patch, { rainEnabled: false });
	} else if (slot.rainSlotIndex !== null) {
		const ref = state.rainProfileSlots[slot.rainSlotIndex];
		if (ref?.values) {
			Object.assign(
				patch,
				extractRainProfileSettings(defaults),
				ref.values
			);
		}
	}

	// Lights (stage lights + flash)
	if (slot.lightsSlotIndex === 'off') {
		Object.assign(patch, {
			stageLightsEnabled: false,
			flashLightEnabled: false
		});
	} else if (slot.lightsSlotIndex !== null) {
		const ref = state.lightsProfileSlots[slot.lightsSlotIndex];
		if (ref?.values) {
			Object.assign(
				patch,
				extractLightsProfileSettings(defaults),
				ref.values
			);
		}
	}

	// Camera FX (camera motion + screen shake)
	if (slot.cameraFxSlotIndex === 'off') {
		Object.assign(patch, {
			cameraMotionEnabled: false,
			cameraShakeEnabled: false
		});
	} else if (slot.cameraFxSlotIndex !== null) {
		const ref = state.cameraFxProfileSlots[slot.cameraFxSlotIndex];
		if (ref?.values) {
			Object.assign(
				patch,
				extractCameraFxProfileSettings(defaults),
				ref.values
			);
		}
	}

	// Logo
	if (slot.logoSlotIndex === 'off') {
		Object.assign(patch, { logoEnabled: false });
	} else if (slot.logoSlotIndex !== null) {
		const ref = state.logoProfileSlots[slot.logoSlotIndex];
		if (ref?.values) {
			Object.assign(patch, extractLogoProfileSettings(defaults), ref.values, {
				logoEnabled: true
			} as Partial<WallpaperState>);
		}
	}

	// Track title
	if (slot.trackTitleSlotIndex === 'off') {
		Object.assign(patch, {
			audioTrackTitleEnabled: false,
			audioTrackTimeEnabled: false
		});
	} else if (slot.trackTitleSlotIndex !== null) {
		const ref = state.trackTitleProfileSlots[slot.trackTitleSlotIndex];
		if (ref?.values) {
			Object.assign(
				patch,
				extractTrackTitleProfileSettings(defaults),
				ref.values
			);
		}
	}

	return patch;
}
