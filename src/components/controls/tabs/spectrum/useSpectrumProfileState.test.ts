import { describe, expect, it, beforeEach } from 'vitest';

const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
	getItem: (k: string) => mem.get(k) ?? null,
	setItem: (k: string, v: string) => void mem.set(k, v),
	removeItem: (k: string) => void mem.delete(k),
	clear: () => void mem.clear()
};

const { useWallpaperStore } = await import('@/store/wallpaperStore');
const { selectSpectrumActiveProfileIndexForTarget } =
	await import('@/features/spectrum/spectrumTargetProfile');
const { createDefaultSpectrumInstance } =
	await import('@/features/spectrum/spectrumInstanceModel');
import type { WallpaperState } from '@/types/wallpaper';
import type { SpectrumProfileTarget } from '@/features/spectrum/spectrumTargetProfile';

function activeIndex(target: SpectrumProfileTarget): number {
	return selectSpectrumActiveProfileIndexForTarget(
		useWallpaperStore.getState() as unknown as WallpaperState,
		target
	);
}

describe('target-aware spectrum profiles', () => {
	beforeEach(() => {
		mem.clear();
		useWallpaperStore.setState({
			spectrumInstances: [createDefaultSpectrumInstance()],
			spectrumProfileSlots: [
				{ name: 'A', values: null },
				{ name: 'B', values: null },
				{ name: 'C', values: null }
			]
		});
	});

	it('marks a slot active for the saved target, then inactive after a change', () => {
		useWallpaperStore.getState().saveSpectrumProfileSlot(0, 'main');
		expect(activeIndex('main')).toBe(0);

		const before = useWallpaperStore.getState().spectrumGainExpressiveness;
		useWallpaperStore.setState({
			spectrumGainExpressiveness: before + 0.1
		});
		expect(activeIndex('main')).toBe(-1);

		useWallpaperStore.getState().loadSpectrumProfileSlot(0, 'main');
		expect(activeIndex('main')).toBe(0);
	});

	it('saving from main captures only the main look (instance edits are ignored)', () => {
		useWallpaperStore.getState().saveSpectrumProfileSlot(0, 'main');
		expect(activeIndex('main')).toBe(0);

		// Editing the second spectrum must NOT drop the main active indicator:
		// a main-target profile does not describe the instance.
		const instance = useWallpaperStore.getState().spectrumInstances[0]!;
		useWallpaperStore.getState().updateSpectrumInstance(instance.id, {
			spectrumBarCount: instance.spectrumBarCount + 8
		});
		expect(activeIndex('main')).toBe(0);
	});

	it('keeps main and instance pixelate/glow independent on save+load', () => {
		const instance = useWallpaperStore.getState().spectrumInstances[0]!;
		useWallpaperStore.getState().patchSpectrumMain({
			spectrumPixelate: true,
			spectrumPixelateScale: 7,
			spectrumManualGlow: true
		});
		useWallpaperStore.getState().updateSpectrumInstance(instance.id, {
			spectrumPixelate: false,
			spectrumPixelateScale: 2,
			spectrumManualGlow: false
		});

		// Slot 0 stores the MAIN template, slot 1 stores the INSTANCE template.
		useWallpaperStore.getState().saveSpectrumProfileSlot(0, 'main');
		useWallpaperStore.getState().saveSpectrumProfileSlot(1, 'instance');

		const slotMain =
			useWallpaperStore.getState().spectrumProfileSlots[0].values!;
		const slotInstance =
			useWallpaperStore.getState().spectrumProfileSlots[1].values!;
		expect(slotMain.spectrumPixelate).toBe(true);
		expect(slotMain.spectrumPixelateScale).toBe(7);
		expect(slotInstance.spectrumPixelate).toBe(false);
		expect(slotInstance.spectrumPixelateScale).toBe(2);
	});

	it('loads a profile into the current target only', () => {
		// Save a punchy MAIN look into slot 0.
		useWallpaperStore.getState().patchSpectrumMain({
			spectrumPixelate: true,
			spectrumPixelateScale: 8
		});
		useWallpaperStore.getState().saveSpectrumProfileSlot(0, 'main');

		// Reset main to a different look so we can observe the load.
		useWallpaperStore.getState().patchSpectrumMain({
			spectrumPixelate: false,
			spectrumPixelateScale: 4
		});

		// Loading into the INSTANCE target must apply to the instance and leave
		// the main spectrum untouched.
		useWallpaperStore.getState().loadSpectrumProfileSlot(0, 'instance');
		const state = useWallpaperStore.getState();
		expect(state.spectrumPixelate).toBe(false);
		expect(state.spectrumInstances[0]?.spectrumPixelate).toBe(true);
		expect(state.spectrumInstances[0]?.spectrumPixelateScale).toBe(8);
		expect(state.spectrumInstances[0]?.enabled).toBe(true);
	});
});
