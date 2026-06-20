import { describe, expect, it, beforeEach } from 'vitest';

const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
	getItem: (k: string) => mem.get(k) ?? null,
	setItem: (k: string, v: string) => void mem.set(k, v),
	removeItem: (k: string) => void mem.delete(k),
	clear: () => void mem.clear()
};

const { useWallpaperStore } = await import('@/store/wallpaperStore');
const { selectSpectrumActiveProfileIndex } =
	await import('@/lib/featureProfiles');
const { createDefaultSpectrumInstance } =
	await import('@/features/spectrum/spectrumInstanceModel');
import type { WallpaperState } from '@/types/wallpaper';

function activeIndex(): number {
	return selectSpectrumActiveProfileIndex(
		useWallpaperStore.getState() as unknown as WallpaperState
	);
}

describe('selectSpectrumActiveProfileIndex (profile reactivity)', () => {
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

	it('marks the saved slot active, then inactive after a setting changes', () => {
		useWallpaperStore.getState().saveSpectrumProfileSlot(0);
		expect(activeIndex()).toBe(0);

		const before = useWallpaperStore.getState().spectrumGainExpressiveness;
		useWallpaperStore.setState({
			spectrumGainExpressiveness: before + 0.1
		});
		expect(activeIndex()).toBe(-1);
	});

	it('restores active state after loading the slot', () => {
		useWallpaperStore.getState().saveSpectrumProfileSlot(1);
		expect(activeIndex()).toBe(1);

		const before = useWallpaperStore.getState().spectrumGainExpressiveness;
		useWallpaperStore.setState({
			spectrumGainExpressiveness: before + 0.1
		});
		expect(activeIndex()).toBe(-1);

		useWallpaperStore.getState().loadSpectrumProfileSlot(1);
		expect(activeIndex()).toBe(1);
	});

	it('round-trips independent instance settings', () => {
		useWallpaperStore.getState().saveSpectrumProfileSlot(0);
		expect(activeIndex()).toBe(0);

		// A change to a spectrum instance (part of the profile snapshot) must
		// drop the active indicator, then restore on load.
		const instance = useWallpaperStore.getState().spectrumInstances[0]!;
		useWallpaperStore.setState({
			spectrumInstances: [
				{ ...instance, spectrumBarCount: instance.spectrumBarCount + 4 }
			]
		});
		expect(activeIndex()).toBe(-1);

		useWallpaperStore.getState().loadSpectrumProfileSlot(0);
		expect(activeIndex()).toBe(0);
	});
});
