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

	it('v104: converts index-based scene bindings to the ids of the slots they pointed at', () => {
		const migrated = migrateWallpaperStore(
			{
				spectrumProfileSlots: [
					{ name: 'Spec A', values: { spectrumBarCount: 11 } },
					{ name: 'Spec B', values: { spectrumBarCount: 22 } }
				],
				looksProfileSlots: [{ name: 'Look A', values: null }],
				sceneSlots: [
					{
						id: 'scene-1',
						name: 'Legacy scene',
						spectrumSlotIndex: 1,
						looksSlotIndex: 0,
						particlesSlotIndex: 'off',
						rainSlotIndex: null
					}
				]
			} as never,
			103
		);

		const scene = migrated.sceneSlots[0]!;
		// The binding must point at the SAME slot the index pointed at…
		expect(scene.spectrumSlotId).toBe(migrated.spectrumProfileSlots[1]!.id);
		expect(scene.looksSlotId).toBe(migrated.looksProfileSlots[0]!.id);
		// …and 3-state semantics survive.
		expect(scene.particlesSlotId).toBe('off');
		expect(scene.rainSlotId).toBeNull();
		// Every slot got a stable id minted.
		for (const slot of migrated.spectrumProfileSlots) {
			expect(slot.id).toBeTruthy();
		}
	});

	it('v104: converts per-image slot indexes to ids and keeps id-based refs intact', () => {
		const migrated = migrateWallpaperStore(
			{
				logoProfileSlots: [
					{ name: 'Logo A', values: null },
					{ name: 'Logo B', values: { logoScale: 2 } }
				],
				backgroundImages: [
					{
						assetId: 'img-1',
						name: 'Pic',
						url: null,
						logoProfileSlotIndex: 1
					}
				]
			} as never,
			103
		);

		expect(migrated.backgroundImages[0]!.logoProfileSlotId).toBe(
			migrated.logoProfileSlots[1]!.id
		);
	});

	it('v104: id-based refs pass through untouched (idempotent re-migration)', () => {
		const once = migrateWallpaperStore(
			{
				spectrumProfileSlots: [
					{ name: 'Spec A', values: { spectrumBarCount: 11 } }
				],
				sceneSlots: [
					{ id: 'scene-1', name: 'S', spectrumSlotIndex: 0 }
				]
			} as never,
			103
		);
		const boundId = once.sceneSlots[0]!.spectrumSlotId;
		const twice = migrateWallpaperStore(
			JSON.parse(JSON.stringify(once)) as never,
			104
		);
		expect(twice.sceneSlots[0]!.spectrumSlotId).toBe(boundId);
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
