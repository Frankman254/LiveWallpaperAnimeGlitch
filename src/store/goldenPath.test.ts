import { beforeEach, describe, expect, it } from 'vitest';
import { useWallpaperStore } from '@/store/wallpaperStore';
import {
	buildWallpaperSettingsExport,
	parseWallpaperSettingsJson
} from '@/lib/projectSettings';
import { migrateWallpaperStore } from './wallpaperStoreMigrations';
import { partializeWallpaperStore } from './wallpaperStorePersistence';
import { STORE_PERSIST_VERSION } from '@/lib/version';
import { emptyProfileSlot, profileSlot } from '@/lib/testing/fixtures';
import type { SpectrumProfileSettings } from '@/types/wallpaper';

/**
 * Product-level round trip: build a real project in the store, persist it the
 * way the app does, reload it, export it, reset, re-import, and check the
 * project is still the same project.
 *
 * Unit tests cover each hop in isolation; this exists because the hops are
 * where configuration actually goes missing — a value that survives
 * `migrate` but not `partialize`, or survives export but not import, is
 * invisible until a user reopens their work.
 */

const spectrumSlot = (name: string, values: Partial<SpectrumProfileSettings>) =>
	profileSlot(name, values as SpectrumProfileSettings);

/** The persist round trip the app performs: partialize → JSON → migrate. */
function saveAndReload() {
	const persisted = JSON.parse(
		JSON.stringify(partializeWallpaperStore(useWallpaperStore.getState()))
	);
	return migrateWallpaperStore(persisted, STORE_PERSIST_VERSION);
}

/** Everything the golden path asserts on, in one comparable shape. */
function projectShape(state: {
	backgroundImages: readonly { assetId: string }[];
	spectrumProfileSlots: readonly { id: string; name: string }[];
	spectrumSecondProfileSlots: readonly { id: string; name: string }[];
	sceneSlots: readonly { id: string; spectrumSlotId: unknown }[];
	spectrumRadialShape: string;
	spectrumRadialSharpness: number;
	spectrumInstances: readonly { spectrumRadialSharpness: number }[];
	logoBaseSize: number;
	audioLyricsFontSize: number;
	defaultSceneSlotId: string | null;
}) {
	// Banks are padded to a default length with fresh empty slots, so only the
	// slots this project actually authored are compared.
	const authored = (slots: readonly { id: string; name: string }[]) =>
		slots
			.filter(
				slot =>
					slot.name.startsWith('S1 ') || slot.name.startsWith('S2 ')
			)
			.map(slot => `${slot.id}:${slot.name}`);

	return {
		images: state.backgroundImages.map(i => i.assetId),
		s1Slots: authored(state.spectrumProfileSlots),
		s2Slots: authored(state.spectrumSecondProfileSlots),
		sceneBinding: state.sceneSlots.map(s => `${s.id}->${s.spectrumSlotId}`),
		radialShape: state.spectrumRadialShape,
		s1Sharpness: state.spectrumRadialSharpness,
		s2Sharpness: state.spectrumInstances[0]?.spectrumRadialSharpness,
		logoBaseSize: state.logoBaseSize,
		lyricsFontSize: state.audioLyricsFontSize,
		defaultScene: state.defaultSceneSlotId
	};
}

/**
 * Steps 1-11 of the flow: a project with images, both spectrums configured
 * differently, logo, lyrics, a scene and its bindings.
 */
function buildProject() {
	const store = useWallpaperStore.getState();

	useWallpaperStore.setState({
		// 2. images
		backgroundImages: [
			{
				assetId: 'img-a',
				url: null,
				thumbnailUrl: null,
				originalFileName: 'a.png',
				enabled: true
			},
			{
				assetId: 'img-b',
				url: null,
				thumbnailUrl: null,
				originalFileName: 'b.png',
				enabled: true
			}
		] as never,
		activeImageId: 'img-a',

		// 3. audio
		audioFileLoop: true,

		// 4-5. Spectrum 1 + its own profile bank
		spectrumEnabled: true,
		spectrumMode: 'radial',
		spectrumRadialShape: 'star6',
		spectrumRadialSharpness: 0.4,
		spectrumOpacity: 0.6,
		spectrumProfileSlots: [
			spectrumSlot('S1 Look', { spectrumBarCount: 96 }),
			emptyProfileSlot('S1 Spare')
		] as never,

		// 6-7. Spectrum 2 with a DIFFERENT look and its own bank
		spectrumInstances: [
			{
				...store.spectrumInstances[0],
				id: 'inst-2',
				enabled: true,
				spectrumRadialShape: 'cross',
				spectrumRadialSharpness: 0.9,
				spectrumOpacity: 0.25
			}
		] as never,
		spectrumSecondProfileSlots: [
			spectrumSlot('S2 Look', { spectrumBarCount: 32 }),
			emptyProfileSlot('S2 Spare')
		] as never,

		// 8. logo
		logoEnabled: true,
		logoBaseSize: 220,

		// 9. lyrics
		audioLyricsEnabled: true,
		audioLyricsFontSize: 55,

		// 10-11. scene + bindings
		sceneSlots: [
			{
				id: 'scene-a',
				name: 'Scene A',
				spectrumSlotId: 'slot-S1 Look',
				spectrumSecondSlotId: 'slot-S2 Look',
				looksSlotId: null,
				particlesSlotId: 'off',
				rainSlotId: null,
				lightsSlotId: null,
				cameraFxSlotId: null,
				logoSlotId: null,
				trackTitleSlotId: null
			}
		] as never,
		defaultSceneSlotId: 'scene-a'
	});
}

describe('golden path — build, save, reload, export, reset, import', () => {
	beforeEach(() => {
		buildProject();
	});

	it('12-14. survives a save + reload round trip unchanged', () => {
		const before = projectShape(useWallpaperStore.getState());
		const reloaded = saveAndReload();

		expect(projectShape(reloaded)).toEqual(before);
	});

	it('15-18. survives export → reset → import unchanged', () => {
		const before = projectShape(useWallpaperStore.getState());

		// 15. export
		const json = JSON.stringify(buildWallpaperSettingsExport());

		// 16. reset — wipe the store back to a blank-ish project
		useWallpaperStore.setState({
			backgroundImages: [],
			sceneSlots: [],
			defaultSceneSlotId: null,
			spectrumRadialShape: 'circle',
			spectrumRadialSharpness: 0,
			logoBaseSize: 80,
			audioLyricsFontSize: 20
		} as never);
		expect(useWallpaperStore.getState().backgroundImages).toHaveLength(0);

		// 17. import
		const imported = parseWallpaperSettingsJson(json);
		useWallpaperStore.setState(imported);

		// 18. same project
		expect(projectShape(useWallpaperStore.getState())).toEqual(before);
	});

	it('keeps Spectrum 1 and Spectrum 2 different across the whole trip', () => {
		const reloaded = saveAndReload();

		// The two must not converge at any hop — that is the bleed this
		// project has hit before.
		expect(reloaded.spectrumRadialShape).toBe('star6');
		expect(reloaded.spectrumInstances[0]?.spectrumRadialShape).toBe(
			'cross'
		);
		expect(reloaded.spectrumRadialSharpness).toBe(0.4);
		expect(reloaded.spectrumInstances[0]?.spectrumRadialSharpness).toBe(
			0.9
		);
		expect(reloaded.spectrumOpacity).toBe(0.6);
		expect(reloaded.spectrumInstances[0]?.spectrumOpacity).toBe(0.25);

		// Separate banks, separate ids.
		const s1Ids = reloaded.spectrumProfileSlots.map(s => s.id);
		const s2Ids = reloaded.spectrumSecondProfileSlots.map(s => s.id);
		expect(s1Ids.some(id => s2Ids.includes(id))).toBe(false);
		expect(
			reloaded.spectrumProfileSlots.find(s => s.name === 'S1 Look')
				?.values
		).toMatchObject({ spectrumBarCount: 96 });
		expect(
			reloaded.spectrumSecondProfileSlots.find(s => s.name === 'S2 Look')
				?.values
		).toMatchObject({ spectrumBarCount: 32 });
	});

	it('keeps scene bindings pointing at the same slots after a round trip', () => {
		const reloaded = saveAndReload();
		const scene = reloaded.sceneSlots.find(s => s.id === 'scene-a');

		expect(scene?.spectrumSlotId).toBe('slot-S1 Look');
		expect(scene?.spectrumSecondSlotId).toBe('slot-S2 Look');
		expect(scene?.particlesSlotId).toBe('off');
		expect(scene?.rainSlotId).toBeNull();
		expect(reloaded.defaultSceneSlotId).toBe('scene-a');

		// The bound slots still exist in their own banks.
		expect(
			reloaded.spectrumProfileSlots.some(
				s => s.id === scene?.spectrumSlotId
			)
		).toBe(true);
		expect(
			reloaded.spectrumSecondProfileSlots.some(
				s => s.id === scene?.spectrumSecondSlotId
			)
		).toBe(true);
	});

	it('is stable across repeated save/reload cycles', () => {
		// Persist churn is where slow drift shows up: a value re-defaulted on
		// every load looks fine once and wrong after a week of use.
		let state = saveAndReload();
		const first = projectShape(state);
		for (let i = 0; i < 3; i++) {
			state = migrateWallpaperStore(
				JSON.parse(
					JSON.stringify(partializeWallpaperStore(state as never))
				),
				STORE_PERSIST_VERSION
			);
		}
		expect(projectShape(state)).toEqual(first);
	});

	it('exports a payload that records the schema version it was written at', () => {
		const envelope = buildWallpaperSettingsExport();
		expect(envelope.storePersistVersion).toBe(STORE_PERSIST_VERSION);
		expect(envelope.state.spectrumRadialSharpness).toBe(0.4);
	});

	it('19-21. presentation mode does not disturb the project state', () => {
		// Route changes are UI-only: nothing in the persisted project may move.
		const before = projectShape(useWallpaperStore.getState());
		const store = useWallpaperStore.getState();

		store.setActiveSpectrumTarget?.('instance');
		store.setControlPanelActiveTab?.('spectrum');

		expect(projectShape(useWallpaperStore.getState())).toEqual(before);

		// And those UI-only keys stay out of the persisted payload.
		const persisted = partializeWallpaperStore(
			useWallpaperStore.getState()
		) as Record<string, unknown>;
		expect(persisted.activeSpectrumTarget).toBeUndefined();
		expect(persisted.controlPanelActiveTab).toBeUndefined();
		expect(persisted.audioCaptureState).toBeUndefined();
	});
});
