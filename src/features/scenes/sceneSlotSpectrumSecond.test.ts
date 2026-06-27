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
const { buildSceneSlotActivationPatch, createEmptySceneSlot } = await import(
	'@/features/scenes/sceneSlot'
);
const { createDefaultSpectrumInstance } = await import(
	'@/features/spectrum/spectrumInstanceModel'
);
import type {
	SceneSlot,
	SpectrumProfileSettings,
	WallpaperState
} from '@/types/wallpaper';

function stateWith(partial: Partial<WallpaperState>): WallpaperState {
	return {
		spectrumProfileSlots: [],
		spectrumSecondProfileSlots: [],
		spectrumInstances: [createDefaultSpectrumInstance()],
		...partial
	} as unknown as WallpaperState;
}

/** A slot value whose Spectrum 2 portion (instances[0]) carries a marker. */
function secondSlot(barCount: number): SpectrumProfileSettings {
	return {
		spectrumInstances: [
			{
				...createDefaultSpectrumInstance(),
				enabled: true,
				spectrumBarCount: barCount
			}
		]
	} as unknown as SpectrumProfileSettings;
}

/** A slot value whose flat keys + bundled instance portion both carry markers
 *  (legacy dual-format Spectrum 1 slot). */
function mainSlot(
	mainBarCount: number,
	bundledSecondBarCount: number
): SpectrumProfileSettings {
	return {
		spectrumBarCount: mainBarCount,
		spectrumInstances: [
			{
				...createDefaultSpectrumInstance(),
				enabled: true,
				spectrumBarCount: bundledSecondBarCount
			}
		]
	} as unknown as SpectrumProfileSettings;
}

describe('scene Spectrum 2 coupling', () => {
	it('applies the Spectrum 2 slot to the second instance, independent of Spectrum 1', () => {
		const slot: SceneSlot = {
			...createEmptySceneSlot('S2'),
			spectrumSecondSlotIndex: 0
		};
		const state = stateWith({
			spectrumSecondProfileSlots: [{ name: 'S2', values: secondSlot(48) }]
		});

		const patch = buildSceneSlotActivationPatch(state, slot);
		expect(patch.spectrumInstances?.[0]?.spectrumBarCount).toBe(48);
		expect(patch.spectrumInstances?.[0]?.enabled).toBe(true);
		expect(patch.spectrumEnabled).toBe(true);
	});

	it("'off' disables only the second instance", () => {
		const slot: SceneSlot = {
			...createEmptySceneSlot('S2 off'),
			spectrumSecondSlotIndex: 'off'
		};
		const state = stateWith({
			spectrumInstances: [
				{ ...createDefaultSpectrumInstance(), enabled: true }
			]
		});

		const patch = buildSceneSlotActivationPatch(state, slot);
		expect(patch.spectrumInstances?.[0]?.enabled).toBe(false);
	});

	it('back-compat: a null Spectrum 2 ref lets Spectrum 1 drive the bundled portion', () => {
		const slot: SceneSlot = {
			...createEmptySceneSlot('legacy'),
			spectrumSlotIndex: 0,
			spectrumSecondSlotIndex: null
		};
		const state = stateWith({
			spectrumProfileSlots: [{ name: 'Dual', values: mainSlot(40, 56) }]
		});

		const patch = buildSceneSlotActivationPatch(state, slot);
		// Spectrum 1's flat look applied…
		expect(patch.spectrumBarCount).toBe(40);
		// …and its bundled instance portion still drives Spectrum 2 (no override).
		expect(patch.spectrumInstances?.[0]?.spectrumBarCount).toBe(56);
	});

	it('Spectrum 2 slot overrides the bundled Spectrum 1 portion when both are set', () => {
		const slot: SceneSlot = {
			...createEmptySceneSlot('both'),
			spectrumSlotIndex: 0,
			spectrumSecondSlotIndex: 0
		};
		const state = stateWith({
			spectrumProfileSlots: [{ name: 'Dual', values: mainSlot(40, 56) }],
			spectrumSecondProfileSlots: [{ name: 'S2', values: secondSlot(72) }]
		});

		const patch = buildSceneSlotActivationPatch(state, slot);
		expect(patch.spectrumBarCount).toBe(40); // Spectrum 1 flat
		expect(patch.spectrumInstances?.[0]?.spectrumBarCount).toBe(72); // S2 wins
	});
});
