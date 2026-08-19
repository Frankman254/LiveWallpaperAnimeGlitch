import 'fake-indexeddb/auto';
import { describe, it, expect, vi } from 'vitest';

const local = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
	getItem: (k: string) => local.get(k) ?? null,
	setItem: (k: string, v: string) => void local.set(k, v),
	removeItem: (k: string) => void local.delete(k),
	clear: () => void local.clear()
};

const { useWallpaperStore } = await import('@/store/wallpaperStore');
const { whenStoreHydrated, runWhenStoreHydrated } =
	await import('./storeHydration');

describe('storeHydration', () => {
	it('resolves once the store has hydrated', async () => {
		await expect(whenStoreHydrated()).resolves.toBeUndefined();
		expect(useWallpaperStore.persist.hasHydrated()).toBe(true);
	});

	it('resolves immediately when hydration already finished', async () => {
		await whenStoreHydrated();
		const before = Date.now();
		await whenStoreHydrated();
		expect(Date.now() - before).toBeLessThan(50);
	});

	it('runs the task after hydration', async () => {
		const task = vi.fn();
		runWhenStoreHydrated(task);
		await whenStoreHydrated();
		await Promise.resolve();
		expect(task).toHaveBeenCalledTimes(1);
	});

	it('does not run a cancelled task', async () => {
		// An unmounted component must not fire against dead state.
		const task = vi.fn();
		const cancel = runWhenStoreHydrated(task);
		cancel();
		await whenStoreHydrated();
		await Promise.resolve();
		expect(task).not.toHaveBeenCalled();
	});

	it('sees the persisted pool, not factory defaults', async () => {
		// The regression this guards: reading backgroundImages on mount found an
		// empty pool, so asset restoration silently did nothing and every saved
		// image rendered as a blank tile.
		await whenStoreHydrated();
		useWallpaperStore.setState({
			backgroundImages: [
				{ assetId: 'img-1', url: null } as never,
				{ assetId: 'img-2', url: null } as never
			]
		});

		let seen = 0;
		runWhenStoreHydrated(() => {
			seen = useWallpaperStore.getState().backgroundImages.length;
		});
		await Promise.resolve();
		expect(seen).toBe(2);
	});
});
