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
			],
			// Spectrum 2 owns an independent slot array (v97+).
			spectrumSecondProfileSlots: [
				{ name: 'A2', values: null },
				{ name: 'B2', values: null },
				{ name: 'C2', values: null }
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

	it('stores the main look in its own array and the second look in the second array', () => {
		const instance = useWallpaperStore.getState().spectrumInstances[0]!;
		useWallpaperStore.getState().patchSpectrumMain({
			spectrumPixelate: true,
			spectrumPixelateScale: 7,
			spectrumLedCellSize: 1.4,
			spectrumLedCellGap: 0.35,
			spectrumLedAngle: 12,
			spectrumLedShape: 'diamond'
		});
		useWallpaperStore.getState().updateSpectrumInstance(instance.id, {
			spectrumPixelate: false,
			spectrumPixelateScale: 2,
			spectrumLedCellSize: 0.8,
			spectrumLedCellGap: 0.1,
			spectrumLedAngle: -30,
			spectrumLedShape: 'circle'
		});

		// Each spectrum writes into its OWN slot array.
		useWallpaperStore.getState().saveSpectrumProfileSlot(0, 'main');
		useWallpaperStore.getState().saveSpectrumProfileSlot(0, 'instance');

		const mainSlot =
			useWallpaperStore.getState().spectrumProfileSlots[0].values!;
		expect(mainSlot.spectrumPixelate).toBe(true); // Spectrum 1 portion (flat)
		expect(mainSlot.spectrumPixelateScale).toBe(7);
		expect(mainSlot.spectrumLedCellSize).toBe(1.4);
		expect(mainSlot.spectrumLedCellGap).toBe(0.35);
		expect(mainSlot.spectrumLedAngle).toBe(12);
		expect(mainSlot.spectrumLedShape).toBe('diamond');

		const secondSlot =
			useWallpaperStore.getState().spectrumSecondProfileSlots[0].values!;
		expect(secondSlot.spectrumInstances[0]?.spectrumPixelate).toBe(false); // S2 portion
		expect(secondSlot.spectrumInstances[0]?.spectrumPixelateScale).toBe(2);
		expect(secondSlot.spectrumInstances[0]?.spectrumLedCellSize).toBe(0.8);
		expect(secondSlot.spectrumInstances[0]?.spectrumLedCellGap).toBe(0.1);
		expect(secondSlot.spectrumInstances[0]?.spectrumLedAngle).toBe(-30);
		expect(secondSlot.spectrumInstances[0]?.spectrumLedShape).toBe(
			'circle'
		);
	});

	it('loads each target portion independently from its own array', () => {
		const id = useWallpaperStore.getState().spectrumInstances[0]!.id;
		useWallpaperStore.getState().patchSpectrumMain({
			spectrumPixelate: true,
			spectrumPixelateScale: 8,
			spectrumLedCellSize: 1.8,
			spectrumLedCellGap: 0.45,
			spectrumLedAngle: 18,
			spectrumLedShape: 'rounded'
		});
		useWallpaperStore.getState().updateSpectrumInstance(id, {
			spectrumPixelate: false,
			spectrumPixelateScale: 3,
			spectrumLedCellSize: 0.7,
			spectrumLedCellGap: 0.2,
			spectrumLedAngle: -45,
			spectrumLedShape: 'circle'
		});
		useWallpaperStore.getState().saveSpectrumProfileSlot(0, 'main');
		useWallpaperStore.getState().saveSpectrumProfileSlot(0, 'instance');

		// Scramble both live looks.
		useWallpaperStore.getState().patchSpectrumMain({
			spectrumPixelate: false,
			spectrumPixelateScale: 2,
			spectrumLedCellSize: 3,
			spectrumLedCellGap: 0.9,
			spectrumLedAngle: 90,
			spectrumLedShape: 'diamond'
		});
		useWallpaperStore.getState().updateSpectrumInstance(id, {
			spectrumPixelate: true,
			spectrumPixelateScale: 6,
			spectrumLedCellSize: 2.4,
			spectrumLedCellGap: 0.8,
			spectrumLedAngle: 60,
			spectrumLedShape: 'square'
		});

		// Loading into 'instance' restores only the second-spectrum portion.
		useWallpaperStore.getState().loadSpectrumProfileSlot(0, 'instance');
		let state = useWallpaperStore.getState();
		expect(state.spectrumPixelate).toBe(false); // main untouched
		expect(state.spectrumPixelateScale).toBe(2);
		expect(state.spectrumLedCellSize).toBe(3);
		expect(state.spectrumLedCellGap).toBe(0.9);
		expect(state.spectrumLedAngle).toBe(90);
		expect(state.spectrumLedShape).toBe('diamond');
		expect(state.spectrumInstances[0]?.spectrumPixelate).toBe(false);
		expect(state.spectrumInstances[0]?.spectrumPixelateScale).toBe(3);
		expect(state.spectrumInstances[0]?.spectrumLedCellSize).toBe(0.7);
		expect(state.spectrumInstances[0]?.spectrumLedCellGap).toBe(0.2);
		expect(state.spectrumInstances[0]?.spectrumLedAngle).toBe(-45);
		expect(state.spectrumInstances[0]?.spectrumLedShape).toBe('circle');

		// Loading into 'main' restores only the main portion.
		useWallpaperStore.getState().loadSpectrumProfileSlot(0, 'main');
		state = useWallpaperStore.getState();
		expect(state.spectrumPixelate).toBe(true);
		expect(state.spectrumPixelateScale).toBe(8);
		expect(state.spectrumLedCellSize).toBe(1.8);
		expect(state.spectrumLedCellGap).toBe(0.45);
		expect(state.spectrumLedAngle).toBe(18);
		expect(state.spectrumLedShape).toBe('rounded');
	});

	it('each spectrum loads from its own slot array without interfering', () => {
		// Spectrum 1's slot describes a linear look; Spectrum 2's slot (a
		// separate array) describes a radial look. Loading one must not touch
		// the other.
		const mainSlot = hydrateSpectrumProfileValues({
			spectrumMode: 'linear'
		});
		const secondSlot = hydrateSpectrumProfileValues({
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
			spectrumProfileSlots: [{ name: 'Main', values: mainSlot }],
			spectrumSecondProfileSlots: [{ name: 'Second', values: secondSlot }]
		});

		useWallpaperStore.getState().loadSpectrumProfileSlot(0, 'instance');
		expect(
			useWallpaperStore.getState().spectrumInstances[0]?.spectrumMode
		).toBe('radial');

		useWallpaperStore.getState().loadSpectrumProfileSlot(0, 'main');
		expect(useWallpaperStore.getState().spectrumMode).toBe('linear');
	});
});
