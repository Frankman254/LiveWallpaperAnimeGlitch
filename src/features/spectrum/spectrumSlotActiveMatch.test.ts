import { describe, expect, it, beforeEach } from 'vitest';

const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
	getItem: (k: string) => mem.get(k) ?? null,
	setItem: (k: string, v: string) => void mem.set(k, v),
	removeItem: (k: string) => void mem.delete(k),
	clear: () => void mem.clear()
};

const { useWallpaperStore } = await import('@/store/wallpaperStore');
const { createDefaultSpectrumInstance } =
	await import('@/features/spectrum/spectrumInstanceModel');
const {
	isSpectrumSlotActiveForTarget,
	selectSpectrumActiveProfileIndexForTarget
} = await import('@/features/spectrum/spectrumTargetProfile');

function threeEmptySlots() {
	return [
		{ name: 'Spectrum 1', values: null },
		{ name: 'Spectrum 2', values: null },
		{ name: 'Spectrum 3', values: null }
	];
}

function reset() {
	mem.clear();
	useWallpaperStore.setState({
		activeSpectrumTarget: 'main',
		spectrumInstances: [createDefaultSpectrumInstance()],
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		spectrumProfileSlots: threeEmptySlots() as any
	});
}

/**
 * The HUD carousel bug: `selectSpectrumActiveProfileIndexForTarget` returns only
 * the first slot matching the live look, so when several slots share a look it
 * collapses them to one index — that's why arrow-stepping "skipped" presets.
 * `isSpectrumSlotActiveForTarget` must be able to confirm a match for EACH such
 * slot so the navigation cursor can stay put on the one the user chose.
 */
describe('isSpectrumSlotActiveForTarget — duplicate-look disambiguation', () => {
	beforeEach(reset);

	it('reports every slot that matches the live look, not just the first', () => {
		const store = useWallpaperStore.getState();

		// Look A → save into slots 0 and 1 (duplicates).
		store.patchSpectrumMain({ spectrumPositionX: 0.5 });
		store.saveSpectrumProfileSlot(0, 'main');
		store.saveSpectrumProfileSlot(1, 'main');

		// Look B → save into slot 2 (distinct).
		store.patchSpectrumMain({ spectrumPositionX: 0.9 });
		store.saveSpectrumProfileSlot(2, 'main');

		// Load slot 1 → live now equals look A (matches slots 0 AND 1).
		store.loadSpectrumProfileSlot(1, 'main');

		const state = useWallpaperStore.getState();

		// Detection collapses duplicates to the first index.
		expect(selectSpectrumActiveProfileIndexForTarget(state, 'main')).toBe(
			0
		);

		// The per-slot helper confirms BOTH duplicates match live state, which is
		// what lets the cursor stay on slot 1 instead of snapping back to slot 0.
		expect(isSpectrumSlotActiveForTarget(state, 'main', 0)).toBe(true);
		expect(isSpectrumSlotActiveForTarget(state, 'main', 1)).toBe(true);
		// The distinct look does not match.
		expect(isSpectrumSlotActiveForTarget(state, 'main', 2)).toBe(false);
	});

	it('returns false for an empty (unsaved) slot', () => {
		const state = useWallpaperStore.getState();
		expect(isSpectrumSlotActiveForTarget(state, 'main', 0)).toBe(false);
	});

	it('returns false when the live look no longer matches the slot', () => {
		const store = useWallpaperStore.getState();
		store.patchSpectrumMain({ spectrumPositionX: 0.5 });
		store.saveSpectrumProfileSlot(0, 'main');
		// Change live look away from the saved slot.
		store.patchSpectrumMain({ spectrumPositionX: 0.1 });

		const state = useWallpaperStore.getState();
		expect(isSpectrumSlotActiveForTarget(state, 'main', 0)).toBe(false);
	});
});
