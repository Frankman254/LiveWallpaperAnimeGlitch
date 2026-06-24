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

	it('round-trips pixelate and glow switches independently per spectrum', () => {
		const instance = useWallpaperStore.getState().spectrumInstances[0]!;
		useWallpaperStore.getState().patchSpectrumMain({
			spectrumPixelate: true,
			spectrumPixelateScale: 7,
			spectrumManualGlow: true,
			spectrumGlowIntensity: 2.4,
			spectrumGlowColorSource: 'theme',
			spectrumGlowColorMode: 'solid'
		});
		useWallpaperStore.getState().updateSpectrumInstance(instance.id, {
			spectrumPixelate: false,
			spectrumPixelateScale: 2,
			spectrumManualGlow: false,
			spectrumGlowIntensity: 0.25,
			spectrumGlowColorSource: 'image',
			spectrumGlowColorMode: 'gradient'
		});

		useWallpaperStore.getState().saveSpectrumProfileSlot(2);

		const saved =
			useWallpaperStore.getState().spectrumProfileSlots[2].values!;
		expect(saved.spectrumPixelate).toBe(true);
		expect(saved.spectrumPixelateScale).toBe(7);
		expect(saved.spectrumManualGlow).toBe(true);
		expect(saved.spectrumGlowIntensity).toBe(2.4);
		expect(saved.spectrumGlowColorSource).toBe('theme');
		expect(saved.spectrumInstances[0]?.spectrumPixelate).toBe(false);
		expect(saved.spectrumInstances[0]?.spectrumPixelateScale).toBe(2);
		expect(saved.spectrumInstances[0]?.spectrumManualGlow).toBe(false);
		expect(saved.spectrumInstances[0]?.spectrumGlowIntensity).toBe(0.25);
		expect(saved.spectrumInstances[0]?.spectrumGlowColorSource).toBe(
			'image'
		);

		useWallpaperStore.getState().patchSpectrumMain({
			spectrumPixelate: false,
			spectrumManualGlow: false,
			spectrumGlowIntensity: 0.1,
			spectrumGlowColorSource: 'manual'
		});
		useWallpaperStore.getState().updateSpectrumInstance(instance.id, {
			spectrumPixelate: true,
			spectrumManualGlow: true,
			spectrumGlowIntensity: 3,
			spectrumGlowColorSource: 'theme'
		});

		useWallpaperStore.getState().loadSpectrumProfileSlot(2);
		const loaded = useWallpaperStore.getState();
		expect(loaded.spectrumPixelate).toBe(true);
		expect(loaded.spectrumPixelateScale).toBe(7);
		expect(loaded.spectrumManualGlow).toBe(true);
		expect(loaded.spectrumGlowIntensity).toBe(2.4);
		expect(loaded.spectrumGlowColorSource).toBe('theme');
		expect(loaded.spectrumInstances[0]?.spectrumPixelate).toBe(false);
		expect(loaded.spectrumInstances[0]?.spectrumPixelateScale).toBe(2);
		expect(loaded.spectrumInstances[0]?.spectrumManualGlow).toBe(false);
		expect(loaded.spectrumInstances[0]?.spectrumGlowIntensity).toBe(0.25);
		expect(loaded.spectrumInstances[0]?.spectrumGlowColorSource).toBe(
			'image'
		);
	});

	it('round-trips main and second spectrum visibility switches', () => {
		const instance = useWallpaperStore.getState().spectrumInstances[0]!;
		useWallpaperStore
			.getState()
			.setSpectrumInstanceEnabled(instance.id, true);
		useWallpaperStore.getState().setSpectrumMainVisible(false);
		useWallpaperStore.getState().saveSpectrumProfileSlot(1);

		useWallpaperStore.getState().setSpectrumMainVisible(true);
		useWallpaperStore
			.getState()
			.setSpectrumInstanceEnabled(instance.id, false);

		useWallpaperStore.getState().loadSpectrumProfileSlot(1);
		const loaded = useWallpaperStore.getState();
		expect(loaded.spectrumMainVisible).toBe(false);
		expect(loaded.spectrumInstances[0]?.enabled).toBe(true);
	});
});
