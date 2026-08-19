/**
 * Waiting for the persisted store to finish loading.
 *
 * Persisted state lives in IndexedDB, which is asynchronous: for the first tick
 * after mount the store still holds factory defaults, and only then does the
 * saved project land. Anything that reads state **once, on mount** — rather
 * than subscribing — must wait, or it silently acts on an empty project.
 *
 * This is not hypothetical. Asset restoration read `backgroundImages` in a
 * mount effect, found the pool empty, and did nothing; hydration then delivered
 * every saved image with no URL and no thumbnail, so a full pool rendered as a
 * grid of blank tiles. The images were never lost — they were simply never
 * re-linked to their blobs.
 */
import { useWallpaperStore } from '@/store/wallpaperStore';

/**
 * Resolves once the persisted state has been applied (immediately if it
 * already has). Never rejects: a storage failure still finishes hydration, and
 * a caller that waits forever would be worse than one acting on defaults.
 */
export function whenStoreHydrated(): Promise<void> {
	if (useWallpaperStore.persist.hasHydrated()) return Promise.resolve();
	return new Promise(resolve => {
		const unsubscribe = useWallpaperStore.persist.onFinishHydration(() => {
			unsubscribe();
			resolve();
		});
	});
}

/**
 * Run `task` once the store is hydrated. Returns a cancel function so a caller
 * that unmounts first does not fire against a dead component.
 */
export function runWhenStoreHydrated(task: () => void): () => void {
	let cancelled = false;
	void whenStoreHydrated().then(() => {
		if (!cancelled) task();
	});
	return () => {
		cancelled = true;
	};
}
