import { describe, expect, it } from 'vitest';
import { partializeWallpaperStore } from './wallpaperStorePersistence';
import type { WallpaperStore } from './wallpaperStoreTypes';

function stateWith(overrides: Partial<WallpaperStore>): WallpaperStore {
	return {
		backgroundImages: [],
		overlays: [],
		...overrides
	} as unknown as WallpaperStore;
}

describe('partializeWallpaperStore', () => {
	it('strips per-image blob url AND base64 thumbnail from the persisted snapshot', () => {
		// Base64 thumbnails (canvas.toDataURL) are the localStorage-quota bomb:
		// persisting them silently fails the whole write, so a reload loses all
		// state and falls back to the demo scene.
		const state = stateWith({
			backgroundImages: [
				{
					assetId: 'img-1',
					url: 'blob:http://x/abc',
					thumbnailUrl: 'data:image/webp;base64,' + 'A'.repeat(5000),
					enabled: true
				}
			] as unknown as WallpaperStore['backgroundImages']
		});

		const result = partializeWallpaperStore(state);
		const persisted = result.backgroundImages?.[0];

		expect(persisted?.url).toBeNull();
		expect(persisted?.thumbnailUrl).toBeNull();
		// Non-derived metadata must survive (it's how the image is restored).
		expect(persisted?.assetId).toBe('img-1');
		expect(persisted?.enabled).toBe(true);
	});

	it('drops transient/session-only fields from the snapshot', () => {
		const result = partializeWallpaperStore(
			stateWith({
				imageUrl: 'blob:x',
				audioCaptureState: 'active',
				visualTransition: {
					id: 'vt-test',
					fromImageId: 'a',
					toImageId: 'b',
					startedAtMs: 10,
					durationMs: 420,
					easing: 'smoothstep',
					subsystems: ['spectrum']
				}
			} as Partial<WallpaperStore>)
		);
		expect('imageUrl' in result).toBe(false);
		expect('audioCaptureState' in result).toBe(false);
		expect('visualTransition' in result).toBe(false);
	});
});
