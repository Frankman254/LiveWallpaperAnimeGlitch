import { describe, expect, it } from 'vitest';
import type { WallpaperState } from '@/types/wallpaper';
import {
	collectReferencedProjectAssets,
	createProjectId
} from './projectSyncCoordinator';

function stateWithAssets(): WallpaperState {
	return {
		backgroundImages: [{ assetId: 'shared' }, { assetId: 'bg-2' }],
		globalBackgroundId: 'global',
		overlays: [{ assetId: 'overlay' }],
		logoId: 'shared',
		audioFileAssetId: 'legacy-audio',
		audioTracks: [
			{ assetId: 'track', coverAssetId: 'cover' },
			{ assetId: 'track', coverAssetId: 'cover' }
		]
	} as WallpaperState;
}

describe('project sync coordinator', () => {
	it('collects every referenced blob once, including track covers', () => {
		expect(collectReferencedProjectAssets(stateWithAssets())).toEqual([
			{ assetId: 'shared', kind: 'image' },
			{ assetId: 'bg-2', kind: 'image' },
			{ assetId: 'global', kind: 'image' },
			{ assetId: 'overlay', kind: 'overlay' },
			{ assetId: 'legacy-audio', kind: 'audio' },
			{ assetId: 'track', kind: 'audio' },
			{ assetId: 'cover', kind: 'image' }
		]);
	});

	it('creates UUID-shaped project ids', () => {
		expect(createProjectId()).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
		);
	});
});
