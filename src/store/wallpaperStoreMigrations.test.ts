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

describe('migrateWallpaperStore v103 legacy pruning', () => {
	it('splits saved legacy Motion bundles into particles + rain slots and drops the key', () => {
		const migrated = migrateWallpaperStore(
			{
				motionProfileSlots: [
					{ name: 'Empty', values: null },
					{
						name: 'My Vibe',
						values: {
							particleCount: 321,
							particleOpacity: 0.66,
							rainEnabled: true,
							rainDropCount: 777
						}
					}
				]
			},
			102
		);

		expect(
			(migrated as Record<string, unknown>).motionProfileSlots
		).toBeUndefined();
		const particlesSlot = migrated.particlesProfileSlots.find(
			slot => slot.name === 'My Vibe'
		);
		expect(particlesSlot?.values?.particleCount).toBe(321);
		expect(particlesSlot?.values?.particleOpacity).toBe(0.66);
		const rainSlot = migrated.rainProfileSlots.find(
			slot => slot.name === 'My Vibe'
		);
		expect(rainSlot?.values?.rainDropCount).toBe(777);
		// Empty slots (values: null) are not converted.
		expect(
			migrated.particlesProfileSlots.some(slot => slot.name === 'Empty')
		).toBe(false);
	});

	it('does not re-convert Motion bundles for stores already at v103+', () => {
		const migrated = migrateWallpaperStore(
			{
				motionProfileSlots: [
					{ name: 'Stale', values: { particleCount: 9 } }
				]
			},
			103
		);
		expect(
			migrated.particlesProfileSlots.some(slot => slot.name === 'Stale')
		).toBe(false);
		expect(
			(migrated as Record<string, unknown>).motionProfileSlots
		).toBeUndefined();
	});

	it('preserves per-image Spectrum 2 overrides as named S2 profile slots and strips the key', () => {
		const migrated = migrateWallpaperStore(
			{
				backgroundImages: [
					{
						assetId: 'img-1',
						name: 'Sunset',
						url: null,
						spectrumSecondOverride: { spectrumOpacity: 0.42 }
					}
				]
			},
			102
		);

		const slot = migrated.spectrumSecondProfileSlots.find(
			s => s.name === 'S2 · Sunset'
		);
		expect(slot?.values?.spectrumOpacity).toBe(0.42);
		for (const image of migrated.backgroundImages) {
			expect(
				(image as unknown as Record<string, unknown>)
					.spectrumSecondOverride
			).toBeUndefined();
		}
	});
});
