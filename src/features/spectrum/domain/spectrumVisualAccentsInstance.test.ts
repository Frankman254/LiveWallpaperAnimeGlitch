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
const { hydrateSpectrumProfileValues } =
	await import('@/features/spectrum/runtime/spectrumProfileHydrate');

describe('spectrum instance visual accent isolation', () => {
	beforeEach(() => {
		mem.clear();
		useWallpaperStore.setState(
			state => ({
				...state,
				spectrumNeonCore: false,
				spectrumRgbSplit: false,
				spectrumInstances: [createDefaultSpectrumInstance()]
			}),
			true
		);
	});

	it('main and instance patches stay independent', () => {
		const instanceId =
			useWallpaperStore.getState().spectrumInstances[0]!.id;

		useWallpaperStore.getState().patchSpectrumMain({
			spectrumNeonCore: true,
			spectrumRgbSplit: true,
			spectrumRgbSplitAmount: 0.9
		});

		const main = useWallpaperStore.getState();
		expect(main.spectrumNeonCore).toBe(true);
		expect(main.spectrumRgbSplit).toBe(true);

		const inst = main.spectrumInstances[0]!;
		expect(inst.spectrumNeonCore).toBe(false);
		expect(inst.spectrumRgbSplit).toBe(false);

		useWallpaperStore.getState().updateSpectrumInstance(instanceId, {
			spectrumNeonCore: true,
			spectrumPeakSparks: true,
			spectrumPeakSparksAmount: 6
		});

		const after = useWallpaperStore.getState();
		expect(after.spectrumNeonCore).toBe(true);
		expect(after.spectrumRgbSplit).toBe(true);
		expect(after.spectrumInstances[0]?.spectrumNeonCore).toBe(true);
		expect(after.spectrumInstances[0]?.spectrumPeakSparks).toBe(true);
		expect(after.spectrumInstances[0]?.spectrumRgbSplit).toBe(false);
	});

	it('profile hydrate round-trips visual accent fields', () => {
		const hydrated = hydrateSpectrumProfileValues({
			spectrumNeonCore: true,
			spectrumNeonCoreIntensity: 0.8,
			spectrumRgbSplit: true,
			spectrumRgbSplitAmount: 0.7,
			spectrumGradientFlow: true,
			spectrumGradientFlowSpeed: 0.5,
			spectrumPeakSparks: true,
			spectrumPeakSparksAmount: 6,
			spectrumEchoTrace: true,
			spectrumEchoTraceCount: 2,
			spectrumManualGlow: true,
			spectrumManualGlowMode: 'core-halo'
		});

		expect(hydrated.spectrumNeonCore).toBe(true);
		expect(hydrated.spectrumNeonCoreIntensity).toBe(0.8);
		expect(hydrated.spectrumRgbSplitAmount).toBe(0.7);
		expect(hydrated.spectrumGradientFlow).toBe(true);
		expect(hydrated.spectrumPeakSparksAmount).toBe(6);
		expect(hydrated.spectrumEchoTraceCount).toBe(2);
		expect(hydrated.spectrumManualGlowMode).toBe('core-halo');
	});
});
