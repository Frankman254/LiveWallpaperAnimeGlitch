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
const { hydrateSpectrumProfileValues } =
	await import('@/features/spectrum/runtime/spectrumProfileHydrate');
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

	it('stores the main look in flat keys and the second look in instances[0]', () => {
		const instance = useWallpaperStore.getState().spectrumInstances[0]!;
		useWallpaperStore.getState().patchSpectrumMain({
			spectrumPixelate: true,
			spectrumPixelateScale: 7
		});
		useWallpaperStore.getState().updateSpectrumInstance(instance.id, {
			spectrumPixelate: false,
			spectrumPixelateScale: 2
		});

		// A single slot carries an independent portion per spectrum.
		useWallpaperStore.getState().saveSpectrumProfileSlot(0, 'main');
		useWallpaperStore.getState().saveSpectrumProfileSlot(0, 'instance');

		const slot =
			useWallpaperStore.getState().spectrumProfileSlots[0].values!;
		expect(slot.spectrumPixelate).toBe(true); // Spectrum 1 portion (flat)
		expect(slot.spectrumPixelateScale).toBe(7);
		expect(slot.spectrumInstances[0]?.spectrumPixelate).toBe(false); // S2 portion
		expect(slot.spectrumInstances[0]?.spectrumPixelateScale).toBe(2);
	});

	it('loads each target portion independently from one slot', () => {
		const id = useWallpaperStore.getState().spectrumInstances[0]!.id;
		useWallpaperStore.getState().patchSpectrumMain({
			spectrumPixelate: true,
			spectrumPixelateScale: 8
		});
		useWallpaperStore.getState().updateSpectrumInstance(id, {
			spectrumPixelate: false,
			spectrumPixelateScale: 3
		});
		useWallpaperStore.getState().saveSpectrumProfileSlot(0, 'main');
		useWallpaperStore.getState().saveSpectrumProfileSlot(0, 'instance');

		// Scramble both live looks.
		useWallpaperStore.getState().patchSpectrumMain({
			spectrumPixelate: false,
			spectrumPixelateScale: 2
		});
		useWallpaperStore.getState().updateSpectrumInstance(id, {
			spectrumPixelate: true,
			spectrumPixelateScale: 6
		});

		// Loading into 'instance' restores only the second-spectrum portion.
		useWallpaperStore.getState().loadSpectrumProfileSlot(0, 'instance');
		let state = useWallpaperStore.getState();
		expect(state.spectrumPixelate).toBe(false); // main untouched
		expect(state.spectrumPixelateScale).toBe(2);
		expect(state.spectrumInstances[0]?.spectrumPixelate).toBe(false);
		expect(state.spectrumInstances[0]?.spectrumPixelateScale).toBe(3);

		// Loading into 'main' restores only the main portion.
		useWallpaperStore.getState().loadSpectrumProfileSlot(0, 'main');
		state = useWallpaperStore.getState();
		expect(state.spectrumPixelate).toBe(true);
		expect(state.spectrumPixelateScale).toBe(8);
	});

	it('regression: loading a legacy dual slot reads the right portion per target', () => {
		// A slot saved by the OLD dual system: flat keys describe Spectrum 1
		// (linear), spectrumInstances[0] describes Spectrum 2 (radial). Loading
		// must NOT flatten Spectrum 2 to the main (linear) look.
		const dualSlot = hydrateSpectrumProfileValues({
			spectrumMode: 'linear',
			spectrumInstances: [
				{
					...createDefaultSpectrumInstance(),
					enabled: true,
					spectrumMode: 'radial'
				}
			]
		});
		useWallpaperStore.setState({
			spectrumInstances: [createDefaultSpectrumInstance()],
			spectrumProfileSlots: [{ name: 'Dual', values: dualSlot }]
		});

		useWallpaperStore.getState().loadSpectrumProfileSlot(0, 'instance');
		expect(
			useWallpaperStore.getState().spectrumInstances[0]?.spectrumMode
		).toBe('radial');

		useWallpaperStore.getState().loadSpectrumProfileSlot(0, 'main');
		expect(useWallpaperStore.getState().spectrumMode).toBe('linear');
	});
});
