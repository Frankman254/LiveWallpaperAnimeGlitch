import { describe, expect, it } from 'vitest';
import {
	buildWallpaperSettingsExport,
	parseWallpaperSettingsJson
} from './projectSettings';
import { DEFAULT_STATE } from '@/lib/constants';
import { FACTORY_DEFAULT_STATE } from '@/lib/factoryDefaults';
import { WORKSPACE_ONLY_KEYS } from './workspaceKeys';
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

describe('workspace state never travels inside a project', () => {
	/**
	 * Editor chrome used to be exported wholesale: opening someone else's
	 * project replaced your theme, UI scale, sidebar, HUD placement and every
	 * diagnostic toggle with theirs.
	 *
	 * Expectations are read from the factory defaults rather than hardcoded,
	 * because that is exactly what an export/import must fall back to — and it
	 * keeps the test honest if a default ever changes.
	 */
	const factory = FACTORY_DEFAULT_STATE as unknown as Record<string, unknown>;

	/** Values deliberately different from the factory default for each key. */
	const authorWorkspace = () => {
		const patch: Record<string, unknown> = {};
		for (const key of WORKSPACE_ONLY_KEYS as readonly string[]) {
			const value = factory[key];
			if (typeof value === 'boolean') patch[key] = !value;
			else if (typeof value === 'number') patch[key] = value + 7.25;
			else if (typeof value === 'string') patch[key] = `author-${value}`;
			else if (value === null) patch[key] = 'author-set';
		}
		return patch;
	};

	it('does not carry the author’s editor chrome in the export', () => {
		const authored = authorWorkspace();
		const exported = buildWallpaperSettingsExport({
			...DEFAULT_STATE,
			...authored,
			// A real project value, to prove the export still works.
			spectrumBarCount: 96
		} as never);
		const state = exported.state as unknown as Record<string, unknown>;

		expect(state.spectrumBarCount).toBe(96);
		for (const key of Object.keys(authored)) {
			expect(state[key], `${key} leaked into the export`).not.toEqual(
				authored[key]
			);
			expect(state[key], `${key} is not the local default`).toEqual(
				factory[key]
			);
		}
	});

	it('does not overwrite the reader’s editor chrome on import', () => {
		const authored = authorWorkspace();
		// A payload that still carries the author's chrome — an older export,
		// or a hand-edited file. The import must ignore it entirely.
		const tampered = {
			format: 'lwag-settings',
			version: 1,
			state: { ...DEFAULT_STATE, ...authored, spectrumBarCount: 96 }
		};

		const imported = parseWallpaperSettingsJson(
			JSON.stringify(tampered)
		) as unknown as Record<string, unknown>;

		expect(imported.spectrumBarCount).toBe(96);
		for (const key of Object.keys(authored)) {
			expect(imported[key], `${key} was overwritten on import`).toEqual(
				factory[key]
			);
		}
	});

	it('still imports every project value', () => {
		const json = JSON.stringify(
			buildWallpaperSettingsExport({
				...DEFAULT_STATE,
				spectrumBarCount: 96,
				spectrumRadialSharpness: 0.55,
				logoBaseSize: 240,
				defaultSceneSlotId: 'scene-x'
			} as never)
		);
		const imported = parseWallpaperSettingsJson(json);

		expect(imported.spectrumBarCount).toBe(96);
		expect(imported.spectrumRadialSharpness).toBe(0.55);
		expect(imported.logoBaseSize).toBe(240);
		expect(imported.defaultSceneSlotId).toBe('scene-x');
	});
});
