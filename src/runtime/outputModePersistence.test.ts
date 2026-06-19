import { describe, expect, it } from 'vitest';
import { partializeWallpaperStore } from '@/store/wallpaperStorePersistence';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import { DEFAULT_STATE } from '@/lib/constants';

describe('presentation mode persistence boundary', () => {
	it('partializeWallpaperStore does not include runtime UI mode fields', () => {
		const partial = partializeWallpaperStore({
			...DEFAULT_STATE
		} as unknown as WallpaperStore);
		expect(partial).not.toHaveProperty('runtimeUiMode');
		expect(partial).not.toHaveProperty('presentationMode');
		expect(partial).not.toHaveProperty('outputMode');
	});
});
