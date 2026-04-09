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

function sanitizePreviewSyncValue<T>(value: T): T {
	if (
		value == null ||
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean'
	) {
		return value;
	}

	if (typeof value === 'function' || typeof value === 'symbol') {
		return undefined as T;
	}

	if (Array.isArray(value)) {
		return value
			.map(entry => sanitizePreviewSyncValue(entry))
			.filter(entry => entry !== undefined) as T;
	}

	if (value instanceof Date) {
		return new Date(value.getTime()) as T;
	}

	if (typeof value === 'object') {
		const next: Record<string, unknown> = {};
		for (const [key, entry] of Object.entries(
			value as Record<string, unknown>
		)) {
			const sanitizedEntry = sanitizePreviewSyncValue(entry);
			if (sanitizedEntry !== undefined) {
				next[key] = sanitizedEntry;
			}
		}
		return next as T;
	}

	return undefined as T;
}

function createAssetSignature(state: Partial<WallpaperStore>): string {
	const backgroundIds = Array.isArray(state.backgroundImages)
		? state.backgroundImages
				.map(image => image?.assetId ?? '')
				.filter(Boolean)
				.join('|')
		: Array.isArray(state.imageIds)
			? state.imageIds.join('|')
			: '';
	const overlayIds = Array.isArray(state.overlays)
		? state.overlays
				.map(overlay => `${overlay?.id ?? ''}:${overlay?.assetId ?? ''}`)
				.filter(Boolean)
				.join('|')
		: '';

	return [
		backgroundIds,
		state.activeImageId ?? '',
		state.logoId ?? '',
		state.globalBackgroundId ?? '',
		overlayIds
	].join('::');
}

function createPreviewSyncSnapshot(state: WallpaperStore): PreviewSyncSnapshot {
	return sanitizePreviewSyncValue({
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
	});
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
		let lastSerializedSnapshot = JSON.stringify(
			createPreviewSyncSnapshot(useWallpaperStore.getState())
		);

		const publishSnapshot = (snapshot: PreviewSyncSnapshot) => {
			channel?.postMessage({
				type: PREVIEW_SYNC_STATE,
				snapshot
			} satisfies PreviewSyncMessage);
		};

		const unsubscribe = useWallpaperStore.subscribe(state => {
			const snapshot = createPreviewSyncSnapshot(state);
			const nextSerializedSnapshot = JSON.stringify(snapshot);
			if (nextSerializedSnapshot === lastSerializedSnapshot) return;

			lastSerializedSnapshot = nextSerializedSnapshot;
			if (raf) cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				publishSnapshot(snapshot);
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

export function useReceiveWallpaperChanges(): void {
	useEffect(() => {
		let isSyncing = false;
		let needsAnotherPass = false;
		let receivedRemoteSnapshot = false;
		let restoredAssetsFromRemoteSnapshot = false;
		let lastAssetSignature = createAssetSignature(
			useWallpaperStore.getState()
		);

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
		const handleChannelMessage = (
			event: MessageEvent<PreviewSyncMessage>
		) => {
			if (event.data?.type === PREVIEW_SYNC_STATE) {
				receivedRemoteSnapshot = true;
				applyPreviewSyncSnapshot(event.data.snapshot);
				const nextAssetSignature = createAssetSignature(
					useWallpaperStore.getState()
				);
				if (
					!restoredAssetsFromRemoteSnapshot ||
					nextAssetSignature !== lastAssetSignature
				) {
					restoredAssetsFromRemoteSnapshot = true;
					lastAssetSignature = nextAssetSignature;
					void restoreWallpaperAssets();
				}
			}
		};

		// Only use storage event as fallback when BroadcastChannel is unavailable.
		// When BroadcastChannel is active it provides real-time snapshots with
		// inline asset URLs; triggering full IndexedDB rehydration on every
		// localStorage write would be redundant and expensive.
		if (!channel) {
			window.addEventListener('storage', handleStorage);
		}
		channel?.addEventListener('message', handleChannelMessage);
		channel?.postMessage({
			type: PREVIEW_SYNC_REQUEST
		} satisfies PreviewSyncMessage);
		const fallbackTimer = window.setTimeout(() => {
			if (!receivedRemoteSnapshot) {
				void runSync();
			}
		}, 600);

		return () => {
			window.clearTimeout(fallbackTimer);
			if (!channel) {
				window.removeEventListener('storage', handleStorage);
			}
			channel?.removeEventListener('message', handleChannelMessage);
			channel?.close();
		};
	}, []);
}
