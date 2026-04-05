import { useEffect } from 'react';
import { restoreWallpaperAssets } from '@/hooks/useRestoreWallpaperAssets';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { partializeWallpaperStore } from '@/store/wallpaperStorePersistence';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

const PREVIEW_SYNC_CHANNEL = 'lwag-preview-sync';
const PREVIEW_SYNC_REQUEST = 'request-snapshot';
const PREVIEW_SYNC_STATE = 'state-snapshot';

type PreviewSyncSnapshot = Partial<WallpaperStore>;

type PreviewSyncMessage =
	| {
			type: typeof PREVIEW_SYNC_REQUEST;
	  }
	| {
			type: typeof PREVIEW_SYNC_STATE;
			snapshot: PreviewSyncSnapshot;
	  };

function createPreviewSyncSnapshot(state: WallpaperStore): PreviewSyncSnapshot {
	return {
		...partializeWallpaperStore(state),
		imageUrl: state.imageUrl,
		imageUrls: [...state.imageUrls],
		globalBackgroundUrl: state.globalBackgroundUrl,
		logoUrl: state.logoUrl,
		backgroundImages: state.backgroundImages.map(image => ({
			...image
		})),
		overlays: state.overlays.map(overlay => ({
			...overlay
		}))
	};
}

async function rehydratePreviewState(): Promise<void> {
	await useWallpaperStore.persist.rehydrate();
	await restoreWallpaperAssets();
}

function applyPreviewSyncSnapshot(snapshot: PreviewSyncSnapshot): void {
	useWallpaperStore.setState(snapshot);
}

export function useBroadcastWallpaperChanges(): void {
	useEffect(() => {
		const channel =
			typeof BroadcastChannel !== 'undefined'
				? new BroadcastChannel(PREVIEW_SYNC_CHANNEL)
				: null;

		let raf = 0;
		let queuedSnapshot: PreviewSyncSnapshot | null = null;

		const publishSnapshot = (snapshot: PreviewSyncSnapshot) => {
			channel?.postMessage({
				type: PREVIEW_SYNC_STATE,
				snapshot
			} satisfies PreviewSyncMessage);
		};

		const unsubscribe = useWallpaperStore.subscribe(state => {
			const snapshot = createPreviewSyncSnapshot(state);
			queuedSnapshot = snapshot;
			if (raf) cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				if (queuedSnapshot) publishSnapshot(queuedSnapshot);
				queuedSnapshot = null;
				raf = 0;
			});
		});

		const handleChannelMessage = (
			event: MessageEvent<PreviewSyncMessage>
		) => {
			if (event.data?.type === PREVIEW_SYNC_REQUEST) {
				publishSnapshot(
					createPreviewSyncSnapshot(useWallpaperStore.getState())
				);
			}
		};

		channel?.addEventListener('message', handleChannelMessage);

		return () => {
			if (raf) cancelAnimationFrame(raf);
			unsubscribe();
			channel?.removeEventListener('message', handleChannelMessage);
			channel?.close();
		};
	}, []);
}

export function useReceiveWallpaperChanges({
	enableStorageFallback = true
}: {
	enableStorageFallback?: boolean;
} = {}): void {
	useEffect(() => {
		let isSyncing = false;
		let needsAnotherPass = false;
		let receivedRemoteSnapshot = false;

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

		const channel =
			typeof BroadcastChannel !== 'undefined'
				? new BroadcastChannel(PREVIEW_SYNC_CHANNEL)
				: null;
		const handleChannelMessage = (
			event: MessageEvent<PreviewSyncMessage>
		) => {
			if (event.data?.type === PREVIEW_SYNC_STATE) {
				receivedRemoteSnapshot = true;
				applyPreviewSyncSnapshot(event.data.snapshot);
			}
		};

		const handleStorage = (event: StorageEvent) => {
			if (event.key === 'lwag-state') {
				void runSync();
			}
		};

		if (enableStorageFallback) {
			window.addEventListener('storage', handleStorage);
		}
		channel?.addEventListener('message', handleChannelMessage);

		const requestSnapshot = () => {
			channel?.postMessage({
				type: PREVIEW_SYNC_REQUEST
			} satisfies PreviewSyncMessage);
		};

		requestSnapshot();

		const requestTimer = window.setInterval(() => {
			if (receivedRemoteSnapshot) return;
			requestSnapshot();
		}, 120);

		const fallbackTimer = enableStorageFallback
			? window.setTimeout(() => {
					if (!receivedRemoteSnapshot) {
						void runSync();
					}
				}, 350)
			: null;

		return () => {
			window.clearInterval(requestTimer);
			if (fallbackTimer !== null) {
				window.clearTimeout(fallbackTimer);
			}
			if (enableStorageFallback) {
				window.removeEventListener('storage', handleStorage);
			}
			channel?.removeEventListener('message', handleChannelMessage);
			channel?.close();
		};
	}, [enableStorageFallback]);
}
