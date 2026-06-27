import { describe, it, expect, beforeEach } from 'vitest';

const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
	getItem: (k: string) => mem.get(k) ?? null,
	setItem: (k: string, v: string) => void mem.set(k, v),
	removeItem: (k: string) => void mem.delete(k),
	clear: () => void mem.clear()
};

const { useWallpaperStore } = await import('@/store/wallpaperStore');
const { createBackgroundImageItem } = await import('@/lib/backgroundImages');
const { createDefaultSpectrumInstanceSettings, createDefaultSpectrumInstance } =
	await import('@/features/spectrum/spectrumInstanceModel');

describe('per-image Spectrum 2 override', () => {
	beforeEach(() => {
		mem.clear();
		useWallpaperStore.setState({
			spectrumEnabled: true,
			spectrumInstances: [createDefaultSpectrumInstance()]
		});
	});

	it('applies an image Spectrum 2 override to the second instance on activation', () => {
		const imgA = createBackgroundImageItem('a', null, null, {
			spectrumSecondOverride: {
				...createDefaultSpectrumInstanceSettings(),
				spectrumBarCount: 48
			}
		});
		const imgB = createBackgroundImageItem('b', null);
		useWallpaperStore.setState({
			backgroundImages: [imgA, imgB],
			activeImageId: 'b'
		});

		useWallpaperStore.getState().setActiveImageId('a');
		expect(
			useWallpaperStore.getState().spectrumInstances[0]?.spectrumBarCount
		).toBe(48);
	});

	it('capture snapshots the live second-instance look into the active image', () => {
		const imgA = createBackgroundImageItem('a', null);
		useWallpaperStore.setState({
			backgroundImages: [imgA],
			activeImageId: 'a',
			spectrumInstances: [
				{ ...createDefaultSpectrumInstance(), spectrumBarCount: 72 }
			]
		});

		useWallpaperStore.getState().captureImageSecondSpectrumOverride();
		const saved = useWallpaperStore
			.getState()
			.backgroundImages.find(img => img.assetId === 'a')
			?.spectrumSecondOverride;
		expect(saved?.spectrumBarCount).toBe(72);
	});
});
