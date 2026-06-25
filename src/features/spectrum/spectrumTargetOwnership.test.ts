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

function reset() {
	mem.clear();
	useWallpaperStore.setState({
		spectrumPositionX: 0,
		spectrumPositionY: 0,
		spectrumFamily: 'classic',
		spectrumManualGlow: false,
		spectrumGlowIntensity: 0.7,
		spectrumInstances: [createDefaultSpectrumInstance()]
	});
}

/**
 * The user's ownership rule, enforced at the store boundary: a per-target write
 * touches ONLY its spectrum; only the explicit Global/Both action touches both.
 */
describe('spectrum target ownership', () => {
	beforeEach(reset);

	it('isolates position changes per target', () => {
		const id = useWallpaperStore.getState().spectrumInstances[0]!.id;
		useWallpaperStore
			.getState()
			.patchSpectrumMain({ spectrumPositionX: 0.5 });
		expect(useWallpaperStore.getState().spectrumPositionX).toBe(0.5);
		expect(
			useWallpaperStore.getState().spectrumInstances[0]?.spectrumPositionX
		).toBe(0);

		useWallpaperStore
			.getState()
			.updateSpectrumInstance(id, { spectrumPositionY: -0.3 });
		expect(useWallpaperStore.getState().spectrumPositionY).toBe(0);
		expect(
			useWallpaperStore.getState().spectrumInstances[0]?.spectrumPositionY
		).toBe(-0.3);
	});

	it('isolates family changes per target', () => {
		const id = useWallpaperStore.getState().spectrumInstances[0]!.id;
		useWallpaperStore
			.getState()
			.updateSpectrumInstance(id, { spectrumFamily: 'spiral' });
		expect(useWallpaperStore.getState().spectrumFamily).toBe('classic');
		expect(
			useWallpaperStore.getState().spectrumInstances[0]?.spectrumFamily
		).toBe('spiral');
	});

	it('isolates glow changes per target', () => {
		useWallpaperStore.getState().patchSpectrumMain({
			spectrumManualGlow: true,
			spectrumGlowIntensity: 2.4
		});
		expect(useWallpaperStore.getState().spectrumManualGlow).toBe(true);
		expect(
			useWallpaperStore.getState().spectrumInstances[0]
				?.spectrumManualGlow
		).toBe(false);
	});

	it('randomizes only the targeted spectrum', () => {
		const instanceBefore = JSON.stringify(
			useWallpaperStore.getState().spectrumInstances[0]
		);
		useWallpaperStore.getState().randomizeSpectrumTarget('main', 'manual');
		// The second spectrum is untouched by a main-target shuffle.
		expect(
			JSON.stringify(useWallpaperStore.getState().spectrumInstances[0])
		).toBe(instanceBefore);

		const mainFamilyBefore = useWallpaperStore.getState().spectrumFamily;
		useWallpaperStore
			.getState()
			.randomizeSpectrumTarget('instance', 'manual');
		expect(useWallpaperStore.getState().spectrumFamily).toBe(
			mainFamilyBefore
		);
	});

	it('resets only the targeted spectrum', () => {
		const id = useWallpaperStore.getState().spectrumInstances[0]!.id;
		useWallpaperStore.getState().patchSpectrumMain({
			spectrumPositionX: 0.8,
			spectrumManualGlow: true
		});
		useWallpaperStore.getState().updateSpectrumInstance(id, {
			spectrumPositionX: 0.5,
			spectrumManualGlow: true
		});

		// Reset the instance only — main keeps its custom values.
		useWallpaperStore.getState().resetSpectrumTarget('instance');
		expect(useWallpaperStore.getState().spectrumPositionX).toBe(0.8);
		expect(useWallpaperStore.getState().spectrumManualGlow).toBe(true);
		expect(
			useWallpaperStore.getState().spectrumInstances[0]?.spectrumPositionX
		).toBe(0);
		expect(
			useWallpaperStore.getState().spectrumInstances[0]
				?.spectrumManualGlow
		).toBe(false);

		// Reset main only — the freshly-defaulted instance stays default.
		useWallpaperStore.getState().resetSpectrumTarget('main');
		expect(useWallpaperStore.getState().spectrumPositionX).toBe(0);
		expect(useWallpaperStore.getState().spectrumManualGlow).toBe(false);
	});

	it('reset-all (global) affects both spectrums', () => {
		const id = useWallpaperStore.getState().spectrumInstances[0]!.id;
		useWallpaperStore
			.getState()
			.patchSpectrumMain({ spectrumPositionX: 0.7 });
		useWallpaperStore
			.getState()
			.updateSpectrumInstance(id, { spectrumPositionX: -0.6 });

		useWallpaperStore.getState().resetSpectrumToDefaults();
		expect(useWallpaperStore.getState().spectrumPositionX).toBe(0);
		expect(
			useWallpaperStore.getState().spectrumInstances[0]?.spectrumPositionX
		).toBe(0);
	});
});
