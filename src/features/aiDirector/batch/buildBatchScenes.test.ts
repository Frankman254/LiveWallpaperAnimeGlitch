import { describe, it, expect } from 'vitest';

const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
	getItem: (k: string) => mem.get(k) ?? null,
	setItem: (k: string, v: string) => void mem.set(k, v),
	removeItem: (k: string) => void mem.delete(k),
	clear: () => void mem.clear()
};

await import('@/store/wallpaperStore');
const { buildBatchScenes } = await import('./buildBatchScenes');
const { buildSceneSlotActivationPatch } =
	await import('@/features/scenes/sceneSlot');
const { defaultSceneIntent } = await import('../intent/sceneIntent');
const { DEFAULT_STATE } = await import('@/lib/constants');
import type { SceneIntent } from '../intent/sceneIntent';
import type { WallpaperState } from '@/types/wallpaper';

function baseState(): WallpaperState {
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
		trackTitleProfileSlots: []
	} as WallpaperState;
}

function entry(
	assetId: string,
	clusterIndex: number,
	intent: Partial<SceneIntent> = {}
) {
	return {
		assetId,
		clusterIndex,
		intent: { ...defaultSceneIntent(), ...intent }
	};
}

describe('buildBatchScenes', () => {
	it('does not mutate the state it is given', () => {
		const state = baseState();
		const before = JSON.stringify({
			scenes: state.sceneSlots,
			spectrum: state.spectrumProfileSlots
		});
		buildBatchScenes(state, [entry('a', 0), entry('b', 0)]);
		expect(
			JSON.stringify({
				scenes: state.sceneSlots,
				spectrum: state.spectrumProfileSlots
			})
		).toBe(before);
	});

	it('creates one scene per image, bound by assetId', () => {
		const result = buildBatchScenes(baseState(), [
			entry('img-1', 0),
			entry('img-2', 0),
			entry('img-3', 1)
		]);

		expect(result.scenes).toHaveLength(3);
		expect(result.bindings.map(b => b.assetId)).toEqual([
			'img-1',
			'img-2',
			'img-3'
		]);
		for (const binding of result.bindings) {
			expect(result.scenes.some(s => s.id === binding.sceneId)).toBe(
				true
			);
		}
	});

	it('names scenes by cluster and member', () => {
		const result = buildBatchScenes(baseState(), [
			entry('a', 0),
			entry('b', 0),
			entry('c', 1)
		]);
		expect(result.scenes.map(s => s.name)).toEqual([
			'AI 1·1',
			'AI 1·2',
			'AI 2·1'
		]);
	});

	it('shares slots between images that compile to the same look', () => {
		// Twenty identical intents must not create twenty spectrum slots — that
		// is exactly what would exhaust the caps on a real pool.
		const entries = Array.from({ length: 20 }, (_, i) =>
			entry(`img-${i}`, 0)
		);
		const result = buildBatchScenes(baseState(), entries);

		expect(result.scenes).toHaveLength(20);
		expect(result.slotPatch.spectrumProfileSlots).toHaveLength(1);
		expect(result.slotPatch.looksProfileSlots).toHaveLength(1);
		// All twenty scenes point at that single slot.
		const spectrumRefs = new Set(result.scenes.map(s => s.spectrumSlotId));
		expect(spectrumRefs.size).toBe(1);
	});

	it('creates distinct slots for genuinely different looks', () => {
		const result = buildBatchScenes(baseState(), [
			entry('calm', 0, { energy: 0, spectrumShape: 'wave' }),
			entry('loud', 1, { energy: 1, spectrumShape: 'blocks' })
		]);
		expect(result.scenes[0].spectrumSlotId).not.toBe(
			result.scenes[1].spectrumSlotId
		);
	});

	it('produces scenes that resolve against the post-batch state', () => {
		// The acid test: apply the batch's slot patch, then activate a scene and
		// confirm it yields the look that was compiled for that image.
		const state = baseState();
		const result = buildBatchScenes(state, [
			entry('a', 0, { energy: 0, weight: 0 }),
			entry('b', 0, { energy: 1, weight: 1 })
		]);

		const after = { ...state, ...result.slotPatch } as WallpaperState;
		const patchA = buildSceneSlotActivationPatch(after, result.scenes[0]);
		const patchB = buildSceneSlotActivationPatch(after, result.scenes[1]);

		expect(patchA.spectrumBarCount).toBeDefined();
		expect(patchB.spectrumBarCount).toBeDefined();
		// weight 0 → many thin bars; weight 1 → few wide ones.
		expect(patchA.spectrumBarCount).toBeGreaterThan(
			patchB.spectrumBarCount as number
		);
	});

	it('honours the scene cap and reports what it skipped', () => {
		const entries = Array.from({ length: 12 }, (_, i) =>
			entry(`img-${i}`, 0)
		);
		const result = buildBatchScenes(baseState(), entries, { maxScenes: 5 });

		expect(result.scenes).toHaveLength(5);
		expect(result.bindings).toHaveLength(5);
		expect(result.skipped).toHaveLength(7);
		expect(result.skipped[0].kinds).toContain('scene-cap');
	});

	it('handles an empty batch', () => {
		const result = buildBatchScenes(baseState(), []);
		expect(result.scenes).toEqual([]);
		expect(result.bindings).toEqual([]);
		expect(result.slotPatch).toEqual({});
	});
});
