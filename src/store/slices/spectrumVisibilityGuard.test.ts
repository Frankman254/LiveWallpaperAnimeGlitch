import { describe, expect, it } from 'vitest';

const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
	getItem: (k: string) => mem.get(k) ?? null,
	setItem: (k: string, v: string) => void mem.set(k, v),
	removeItem: (k: string) => void mem.delete(k),
	clear: () => mem.clear()
};

const { useWallpaperStore } = await import('@/store/wallpaperStore');

describe('spectrum visibility guard — both cannot be disabled', () => {
	it('refuses to hide the main spectrum when no instance is enabled', () => {
		const s = useWallpaperStore.getState();
		const id = s.spectrumInstances[0]!.id;
		s.setSpectrumInstanceEnabled(id, false); // start from default-off instance
		s.setSpectrumMainVisible(true);

		s.setSpectrumMainVisible(false); // would leave both off -> blocked
		expect(useWallpaperStore.getState().spectrumMainVisible).toBe(true);
	});

	it('allows hiding main once an instance is enabled, then guards the instance', () => {
		const s = useWallpaperStore.getState();
		const id = s.spectrumInstances[0]!.id;
		s.setSpectrumMainVisible(true);
		s.setSpectrumInstanceEnabled(id, true);

		s.setSpectrumMainVisible(false);
		expect(useWallpaperStore.getState().spectrumMainVisible).toBe(false);

		// Now the instance is the only visible one — disabling it is blocked.
		s.setSpectrumInstanceEnabled(id, false);
		expect(useWallpaperStore.getState().spectrumInstances[0].enabled).toBe(
			true
		);
	});
});
