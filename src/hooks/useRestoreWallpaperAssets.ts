import { useEffect } from 'react';
import { restoreWallpaperAssets } from '@/services/restoreWallpaperAssets';
import { runWhenStoreHydrated } from '@/store/storeHydration';

export function useRestoreWallpaperAssets(enabled = true): void {
	useEffect(() => {
		if (!enabled) return;
		// MUST wait for hydration. Persisted state loads from IndexedDB
		// asynchronously, so on mount the store still holds factory defaults —
		// an empty pool. Restoring at that moment finds nothing to restore and
		// returns, and the saved images then arrive with `url: null` and no
		// thumbnail: a full pool rendering as blank tiles. The blobs are fine;
		// they just never get re-linked.
		return runWhenStoreHydrated(() => {
			void restoreWallpaperAssets();
		});
	}, [enabled]);
}
