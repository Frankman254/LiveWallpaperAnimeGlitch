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
	extractRainProfileSettings,
	extractTrackTitleProfileSettings,
	extractLogoProfileSettings
} from '@/lib/featureProfiles';
import { hydrateSpectrumProfileValues } from '@/features/spectrum/runtime/spectrumProfileHydrate';
import { DEFAULT_STATE } from '@/lib/constants';
import type { SceneSlot, WallpaperState } from '@/types/wallpaper';

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
		logoSlotIndex: null,
		trackTitleSlotIndex: null
	};
}

/**
 * Clamp a slot index reference so it still points to a valid slot in
 * `slotsLength`. Out-of-range indices collapse to `null` so downstream code
 * does not crash on stale references.
 */
export function normalizeSlotRef(
	ref: number | null | undefined,
	slotsLength: number
): number | null {
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
 * Resolve every non-null ref of a Scene slot into a state patch. A null ref
 * means "do not touch this subsystem": keys from that feature are simply
 * absent from the returned patch.
 */
export function buildSceneSlotActivationPatch(
	state: WallpaperState,
	slot: SceneSlot
): Partial<WallpaperState> {
	const patch: Partial<WallpaperState> = {};

	if (slot.spectrumSlotIndex !== null) {
		const ref = state.spectrumProfileSlots[slot.spectrumSlotIndex];
		if (ref?.values) {
			Object.assign(patch, hydrateSpectrumProfileValues(ref.values));
		}
	}

	if (slot.looksSlotIndex !== null) {
		const ref = state.looksProfileSlots[slot.looksSlotIndex];
		if (ref?.values) {
			const defaults = extractLooksProfileSettings(
				DEFAULT_STATE as WallpaperState
			);
			Object.assign(patch, defaults, ref.values);
		}
	}

	if (slot.particlesSlotIndex !== null) {
		const ref = state.particlesProfileSlots[slot.particlesSlotIndex];
		if (ref?.values) {
			const defaults = extractParticlesProfileSettings(
				DEFAULT_STATE as WallpaperState
			);
			Object.assign(patch, defaults, ref.values);
		}
	}

	if (slot.rainSlotIndex !== null) {
		const ref = state.rainProfileSlots[slot.rainSlotIndex];
		if (ref?.values) {
			const defaults = extractRainProfileSettings(
				DEFAULT_STATE as WallpaperState
			);
			Object.assign(patch, defaults, ref.values);
		}
	}

	if (slot.logoSlotIndex !== null) {
		const ref = state.logoProfileSlots[slot.logoSlotIndex];
		if (ref?.values) {
			const defaults = extractLogoProfileSettings(
				DEFAULT_STATE as WallpaperState
			);
			Object.assign(patch, defaults, ref.values, {
				logoEnabled: true
			} as Partial<WallpaperState>);
		}
	}

	if (slot.trackTitleSlotIndex !== null) {
		const ref = state.trackTitleProfileSlots[slot.trackTitleSlotIndex];
		if (ref?.values) {
			const defaults = extractTrackTitleProfileSettings(
				DEFAULT_STATE as WallpaperState
			);
			Object.assign(patch, defaults, ref.values);
		}
	}

	return patch;
}
