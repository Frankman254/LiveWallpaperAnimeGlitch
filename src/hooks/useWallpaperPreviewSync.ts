import { useEffect } from 'react';
import { restoreWallpaperAssets } from '@/hooks/useRestoreWallpaperAssets';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { partializeWallpaperStore } from '@/store/wallpaperStorePersistence';

const PREVIEW_SYNC_CHANNEL = 'lwag-preview-sync';
const PREVIEW_SYNC_EVENT = 'wallpaper-state-changed';

async function rehydratePreviewState(): Promise<void> {
	await useWallpaperStore.persist.rehydrate();
	await restoreWallpaperAssets();
}

export function useBroadcastWallpaperChanges(): void {
	useEffect(() => {
		const channel =
			typeof BroadcastChannel !== 'undefined'
				? new BroadcastChannel(PREVIEW_SYNC_CHANNEL)
				: null;

		let timer: ReturnType<typeof setTimeout> | null = null;
		let lastSerializedSnapshot = JSON.stringify(
			partializeWallpaperStore(useWallpaperStore.getState())
		);

		const unsubscribe = useWallpaperStore.subscribe(state => {
			const nextSerializedSnapshot = JSON.stringify(
				partializeWallpaperStore(state)
			);
			if (nextSerializedSnapshot === lastSerializedSnapshot) return;
			lastSerializedSnapshot = nextSerializedSnapshot;

			if (timer !== null) clearTimeout(timer);
			timer = setTimeout(() => {
				channel?.postMessage(PREVIEW_SYNC_EVENT);
			}, 60);
		});

		return () => {
			if (timer !== null) clearTimeout(timer);
			unsubscribe();
			channel?.close();
		};
	}, []);
}

export function useReceiveWallpaperChanges(): void {
	useEffect(() => {
		let isSyncing = false;
		let needsAnotherPass = false;

		const runSync = async () => {
			if (isSyncing) {
				needsAnotherPass = true;
				return;
			}

			isSyncing = true;
			do {
				needsAnotherPass = false;
				await rehydratePreviewState();
			} while (needsAnotherPass);
			isSyncing = false;
		};

		const handleStorage = (event: StorageEvent) => {
			if (event.key === 'lwag-state') {
				void runSync();
			}
		};

		const channel =
			typeof BroadcastChannel !== 'undefined'
				? new BroadcastChannel(PREVIEW_SYNC_CHANNEL)
				: null;
		const handleChannelMessage = (event: MessageEvent<string>) => {
			if (event.data === PREVIEW_SYNC_EVENT) {
				void runSync();
			}
		};

		window.addEventListener('storage', handleStorage);
		channel?.addEventListener('message', handleChannelMessage);

		return () => {
			window.removeEventListener('storage', handleStorage);
			channel?.removeEventListener('message', handleChannelMessage);
			channel?.close();
		};
	}, []);
}
