import { describe, expect, it } from 'vitest';
import {
	buildWallpaperSettingsExport,
	parseWallpaperSettingsJson
} from './projectSettings';
import { DEFAULT_STATE } from '@/lib/constants';
import type { WallpaperState } from '@/types/wallpaper';

describe('project settings export normalization', () => {
	it('does not export an active runtime visual transition', () => {
		const exportEnvelope = buildWallpaperSettingsExport({
			activeImageId: 'img-a',
			visualTransition: {
				id: 'vt-runtime',
				fromImageId: 'img-a',
				toImageId: 'img-b',
				startedAtMs: 1000,
				durationMs: 420,
				easing: 'smoothstep',
				subsystems: ['spectrum']
			}
		} as Partial<WallpaperState>);

		expect(exportEnvelope.state.visualTransition).toBeNull();
	});
});

describe('project import — nullable settings survive the round trip', () => {
	/**
	 * `getCompatibleStateValue` dispatches on the TYPE of the factory default.
	 * A `null` default has no type, so these keys fell through to `undefined`
	 * and were dropped — losing the active scene, setlist, look and playlist
	 * position every time a user re-imported their own project.
	 */
	const NULLABLE_SETTINGS = {
		defaultSceneSlotId: 'scene-a',
		activeSceneSlotId: 'scene-a',
		activeSetlistId: 'setlist-1',
		activeFilterLookId: 'look-7',
		activeAudioTrackId: 'track-3',
		queuedAudioTrackId: 'track-4'
		// `imageFocusX/Y` are deliberately excluded: they mirror the ACTIVE
		// IMAGE's focus rather than standing alone, so they are re-derived on
		// both export and import by design.
	} as const;

	it('keeps every nullable setting through export → import', () => {
		const exported = buildWallpaperSettingsExport({
			...DEFAULT_STATE,
			...NULLABLE_SETTINGS
		});
		const imported = parseWallpaperSettingsJson(JSON.stringify(exported));

		for (const [key, value] of Object.entries(NULLABLE_SETTINGS)) {
			expect(
				(imported as unknown as Record<string, unknown>)[key],
				`${key} was dropped on import`
			).toBe(value);
		}
	});

	it('still accepts an explicit null', () => {
		const exported = buildWallpaperSettingsExport({
			...DEFAULT_STATE,
			defaultSceneSlotId: null,
			activeSetlistId: null
		});
		const imported = parseWallpaperSettingsJson(JSON.stringify(exported));

		expect(imported.defaultSceneSlotId).toBeNull();
		expect(imported.activeSetlistId).toBeNull();
	});

	it('leaves a nullable object setting intact', () => {
		const exported = buildWallpaperSettingsExport({
			...DEFAULT_STATE,
			customFilterLookSettings: { saturation: 1.7 } as never
		});
		const imported = parseWallpaperSettingsJson(JSON.stringify(exported));

		expect(imported.customFilterLookSettings).toMatchObject({
			saturation: 1.7
		});
	});
});
