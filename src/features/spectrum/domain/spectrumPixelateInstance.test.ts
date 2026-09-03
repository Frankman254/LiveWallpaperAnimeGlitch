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
const { isPixelatePostProcessActive } =
	await import('@/features/spectrum/pixelArtHelpers');

describe('spectrum pixelate per-instance isolation', () => {
	beforeEach(() => {
		mem.clear();
		useWallpaperStore.setState(
			state => ({
				...state,
				spectrumPixelate: false,
				spectrumPixelateScale: 4,
				spectrumInstances: [createDefaultSpectrumInstance()]
			}),
			true
		);
	});

	it('keeps pixelate on the main spectrum out of the second instance', () => {
		useWallpaperStore.getState().patchSpectrumMain({
			spectrumPixelate: true,
			spectrumPixelateScale: 6
		});

		const state = useWallpaperStore.getState();
		expect(state.spectrumPixelate).toBe(true);
		expect(state.spectrumPixelateScale).toBe(6);
		// Second instance must NOT inherit the main pixelate settings.
		expect(state.spectrumInstances[0]?.spectrumPixelate).toBe(false);
	});

	it('keeps pixelate on the second instance out of the main spectrum', () => {
		const id = useWallpaperStore.getState().spectrumInstances[0]!.id;
		useWallpaperStore.getState().updateSpectrumInstance(id, {
			spectrumPixelate: true,
			spectrumPixelateScale: 3
		});

		const state = useWallpaperStore.getState();
		expect(state.spectrumPixelate).toBe(false);
		expect(state.spectrumInstances[0]?.spectrumPixelate).toBe(true);
		expect(state.spectrumInstances[0]?.spectrumPixelateScale).toBe(3);
	});

	it('lets the two instances hold different pixelate scales independently', () => {
		const id = useWallpaperStore.getState().spectrumInstances[0]!.id;
		useWallpaperStore.getState().patchSpectrumMain({
			spectrumPixelate: true,
			spectrumPixelateScale: 8
		});
		useWallpaperStore.getState().updateSpectrumInstance(id, {
			spectrumPixelate: true,
			spectrumPixelateScale: 2
		});

		const state = useWallpaperStore.getState();
		expect(state.spectrumPixelateScale).toBe(8);
		expect(state.spectrumInstances[0]?.spectrumPixelateScale).toBe(2);
	});

	it('treats the disabled / scale<=1 path as inactive (near-zero overhead)', () => {
		expect(
			isPixelatePostProcessActive({
				spectrumPixelate: false,
				spectrumPixelateScale: 8
			})
		).toBe(false);
		expect(
			isPixelatePostProcessActive({
				spectrumPixelate: true,
				spectrumPixelateScale: 1
			})
		).toBe(false);
		expect(
			isPixelatePostProcessActive({
				spectrumPixelate: true,
				spectrumPixelateScale: 4
			})
		).toBe(true);
	});
});
