import { describe, expect, it } from 'vitest';
import {
	createDefaultSpectrumInstance,
	SPECTRUM_INSTANCE_SETTING_KEYS
} from '@/features/spectrum/spectrumInstanceModel';
import type { SpectrumInstance } from '@/types/wallpaper';
import { migrateWallpaperStore } from './wallpaperStoreMigrations';

describe('migrateWallpaperStore spectrum instances', () => {
	it('backfills every current Spectrum 2 key without overwriting saved values', () => {
		const legacyInstance = {
			id: 'legacy-s2',
			enabled: true,
			spectrumOpacity: 0.37
		} as Partial<SpectrumInstance> as SpectrumInstance;
		const migrated = migrateWallpaperStore(
			{ spectrumInstances: [legacyInstance] },
			90
		);
		const instance = migrated.spectrumInstances[0];

		expect(instance?.spectrumOpacity).toBe(0.37);
		expect(instance?.spectrumScale).toBe(
			createDefaultSpectrumInstance().spectrumScale
		);
		for (const key of SPECTRUM_INSTANCE_SETTING_KEYS) {
			expect(instance?.[key], key).not.toBeUndefined();
		}
	});
});
