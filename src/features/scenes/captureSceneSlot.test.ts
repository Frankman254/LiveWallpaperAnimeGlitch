import { describe, it, expect } from 'vitest';

// localStorage shim + store warm-up: importing the store first evaluates the
// shared module graph (constants ↔ featureProfiles ↔ hydrate) in the same order
// the app uses, avoiding a cold-import TDZ on this isolated test file.
const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
	getItem: (k: string) => mem.get(k) ?? null,
	setItem: (k: string, v: string) => void mem.set(k, v),
	removeItem: (k: string) => void mem.delete(k),
	clear: () => void mem.clear()
};

await import('@/store/wallpaperStore');
const { captureSceneSlot, ALL_SCENE_CAPTURE_KINDS } =
	await import('@/features/scenes/captureSceneSlot');
const { buildSceneSlotActivationPatch } =
	await import('@/features/scenes/sceneSlot');
const { DEFAULT_STATE } = await import('@/lib/constants');
const { MAX_PARTICLES_SLOT_COUNT, createProfileSlotId } =
	await import('@/lib/featureProfiles');
import type { WallpaperState } from '@/types/wallpaper';

/** A full, realistic state — the extract* helpers read across many keys. */
function baseState(partial: Partial<WallpaperState> = {}): WallpaperState {
	return {
		...(DEFAULT_STATE as WallpaperState),
		sceneSlots: [],
		spectrumProfileSlots: [],
		spectrumSecondProfileSlots: [],
		looksProfileSlots: [],
		particlesProfileSlots: [],
		rainProfileSlots: [],
		lightsProfileSlots: [],
		cameraFxProfileSlots: [],
		logoProfileSlots: [],
		trackTitleProfileSlots: [],
		...partial
	} as WallpaperState;
}

describe('captureSceneSlot', () => {
	it('binds every requested subsystem to a freshly appended slot', () => {
		const state = baseState({
			particlesEnabled: true,
			rainEnabled: true,
			logoEnabled: true,
			spectrumEnabled: true,
			stageLightsEnabled: true,
			cameraMotionEnabled: true,
			audioTrackTitleEnabled: true
		});

		const { scene, slotPatch, skipped } = captureSceneSlot(state, 'Test');

		expect(skipped).toEqual([]);
		expect(scene.name).toBe('Test');
		// Every ref is a real slot id, not 'off' and not null.
		for (const ref of [
			scene.spectrumSlotId,
			scene.looksSlotId,
			scene.particlesSlotId,
			scene.rainSlotId,
			scene.lightsSlotId,
			scene.cameraFxSlotId,
			scene.logoSlotId,
			scene.trackTitleSlotId
		]) {
			expect(typeof ref).toBe('string');
			expect(ref).not.toBe('off');
		}
		// The values landed in the feature arrays, never on the scene itself.
		expect(slotPatch.particlesProfileSlots).toHaveLength(1);
		expect(slotPatch.particlesProfileSlots?.[0].values).toBeTruthy();
		expect(Object.keys(scene)).not.toContain('values');
	});

	it('round-trips: applying the captured scene restores the captured values', () => {
		const state = baseState({
			particlesEnabled: true,
			particleCount: 137,
			rainEnabled: true,
			logoEnabled: true
		} as Partial<WallpaperState>);

		const { scene, slotPatch } = captureSceneSlot(state, 'RT');

		// The scene + its new slots now live in state, and the user has since
		// drifted away from the captured look.
		const later = baseState({
			...slotPatch,
			particlesEnabled: true,
			particleCount: 12,
			rainEnabled: true,
			logoEnabled: true
		} as Partial<WallpaperState>);

		const patch = buildSceneSlotActivationPatch(later, scene);
		expect(patch.particleCount).toBe(137);
	});

	it("records a disabled subsystem as 'off' so applying re-disables it", () => {
		const state = baseState({
			particlesEnabled: false,
			rainEnabled: false,
			logoEnabled: false,
			spectrumEnabled: false,
			stageLightsEnabled: false,
			flashLightEnabled: false,
			cameraMotionEnabled: false,
			cameraShakeEnabled: false,
			audioTrackTitleEnabled: false,
			audioTrackTimeEnabled: false
		});

		const { scene, slotPatch } = captureSceneSlot(state);

		expect(scene.particlesSlotId).toBe('off');
		expect(scene.rainSlotId).toBe('off');
		expect(scene.logoSlotId).toBe('off');
		expect(scene.spectrumSlotId).toBe('off');
		expect(scene.lightsSlotId).toBe('off');
		expect(scene.cameraFxSlotId).toBe('off');
		expect(scene.trackTitleSlotId).toBe('off');
		// 'off' needs no storage.
		expect(slotPatch.particlesProfileSlots).toBeUndefined();

		// And the round-trip actually turns them back off — this is the reason
		// 'off' exists: loading a logo slot force-enables the logo.
		const patch = buildSceneSlotActivationPatch(baseState(), scene);
		expect(patch.logoEnabled).toBe(false);
		expect(patch.particlesEnabled).toBe(false);
	});

	it('treats lights/cameraFx/trackTitle as on when either switch is on', () => {
		const state = baseState({
			stageLightsEnabled: false,
			flashLightEnabled: true,
			cameraMotionEnabled: false,
			cameraShakeEnabled: true,
			audioTrackTitleEnabled: false,
			audioTrackTimeEnabled: true
		});
		const { scene } = captureSceneSlot(state);
		expect(scene.lightsSlotId).not.toBe('off');
		expect(scene.cameraFxSlotId).not.toBe('off');
		expect(scene.trackTitleSlotId).not.toBe('off');
	});

	it("never emits 'off' for looks, which has no master switch", () => {
		const { scene } = captureSceneSlot(baseState());
		expect(scene.looksSlotId).not.toBe('off');
		expect(typeof scene.looksSlotId).toBe('string');
	});

	it('reuses a matching slot instead of appending a duplicate', () => {
		const state = baseState({ particlesEnabled: true });
		const first = captureSceneSlot(state, 'A');

		// Second capture of the *same* look, with the first capture's slots in
		// state. Nothing new should be appended.
		const second = captureSceneSlot(
			baseState({ ...first.slotPatch, particlesEnabled: true }),
			'B'
		);

		expect(second.slotPatch.particlesProfileSlots).toBeUndefined();
		expect(second.reused).toContain('particles');
		expect(second.created).not.toContain('particles');
		expect(second.scene.particlesSlotId).toBe(
			first.slotPatch.particlesProfileSlots?.[0].id
		);
	});

	it('skips a family at its slot cap instead of dropping values silently', () => {
		const full = Array.from(
			{ length: MAX_PARTICLES_SLOT_COUNT },
			(_, i) => ({
				id: createProfileSlotId(),
				name: `p${i}`,
				values: null
			})
		);
		const state = baseState({
			particlesEnabled: true,
			particlesProfileSlots: full
		} as Partial<WallpaperState>);

		const { scene, skipped, slotPatch } = captureSceneSlot(state);

		expect(skipped).toContain('particles');
		expect(scene.particlesSlotId).toBeNull();
		expect(slotPatch.particlesProfileSlots).toBeUndefined();
	});

	it('leaves unrequested kinds null so applying preserves them', () => {
		const state = baseState({ particlesEnabled: true, logoEnabled: true });
		const { scene, slotPatch } = captureSceneSlot(state, 'Partial', {
			particles: true
		});

		expect(typeof scene.particlesSlotId).toBe('string');
		expect(scene.logoSlotId).toBeNull();
		expect(scene.looksSlotId).toBeNull();
		expect(scene.spectrumSlotId).toBeNull();
		expect(slotPatch.logoProfileSlots).toBeUndefined();

		// A null ref must not appear in the activation patch at all.
		const patch = buildSceneSlotActivationPatch(baseState(), scene);
		expect('logoEnabled' in patch).toBe(false);
	});

	it('captures each spectrum into its own slot array', () => {
		const state = baseState({ spectrumEnabled: true });
		const { scene, slotPatch } = captureSceneSlot(state, 'S', {
			...ALL_SCENE_CAPTURE_KINDS
		});

		// Spectrum 2 is disabled by default → 'off', and only Spectrum 1 stores.
		expect(typeof scene.spectrumSlotId).toBe('string');
		expect(slotPatch.spectrumProfileSlots).toHaveLength(1);
		expect(slotPatch.spectrumSecondProfileSlots).toBeUndefined();
		expect(scene.spectrumSecondSlotId).toBe('off');
	});
});
