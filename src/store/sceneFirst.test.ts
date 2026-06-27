import { describe, it, expect, beforeEach } from 'vitest';

const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
	getItem: (k: string) => mem.get(k) ?? null,
	setItem: (k: string, v: string) => void mem.set(k, v),
	removeItem: (k: string) => void mem.delete(k),
	clear: () => void mem.clear()
};

const { useWallpaperStore } = await import('@/store/wallpaperStore');
const { createBackgroundImageItem } = await import('@/lib/backgroundImages');
const { createEmptySceneSlot, resolveEffectiveSceneSlotId } = await import(
	'@/features/scenes/sceneSlot'
);
import type { SpectrumProfileSettings, WallpaperState } from '@/types/wallpaper';

/** A scene that simply forces Spectrum 1 OFF — a cheap, unambiguous marker that
 *  the scene (not an override) was applied. */
function sceneSpectrumOff(name: string) {
	return { ...createEmptySceneSlot(name), spectrumSlotIndex: 'off' as const };
}

function setup() {
	mem.clear();
	const sceneOff = sceneSpectrumOff('Off scene');
	const imgExplicit = createBackgroundImageItem('explicit', null, null, {
		sceneSlotId: sceneOff.id
	});
	const imgDefault = createBackgroundImageItem('default', null);
	const imgOverride = createBackgroundImageItem('override', null, null, {
		spectrumOverride: {
			spectrumBarCount: 48
		} as unknown as SpectrumProfileSettings
	});
	useWallpaperStore.setState({
		spectrumEnabled: true,
		sceneSlots: [sceneOff],
		defaultSceneSlotId: null,
		backgroundImages: [imgExplicit, imgDefault, imgOverride],
		activeImageId: null
	});
	return { sceneOff };
}

describe('Scene-first precedence', () => {
	beforeEach(setup);

	it('resolveEffectiveSceneSlotId: explicit > default > none (pure)', () => {
		const state = useWallpaperStore.getState() as WallpaperState;
		const sceneId = state.sceneSlots[0].id;
		expect(
			resolveEffectiveSceneSlotId({ sceneSlotId: sceneId }, state)
		).toEqual({ sceneSlotId: sceneId, usedDefault: false });
		// No explicit, no default → none.
		expect(
			resolveEffectiveSceneSlotId({ sceneSlotId: null }, state)
		).toEqual({ sceneSlotId: null, usedDefault: false });
		// No explicit, default present → default.
		expect(
			resolveEffectiveSceneSlotId(
				{ sceneSlotId: null },
				{ ...state, defaultSceneSlotId: sceneId }
			)
		).toEqual({ sceneSlotId: sceneId, usedDefault: true });
		// Dangling explicit id falls back to default.
		expect(
			resolveEffectiveSceneSlotId(
				{ sceneSlotId: 'ghost' },
				{ ...state, defaultSceneSlotId: sceneId }
			)
		).toEqual({ sceneSlotId: sceneId, usedDefault: true });
	});

	it('image with a valid sceneSlotId applies that scene', () => {
		useWallpaperStore.getState().setActiveImageId('explicit');
		expect(useWallpaperStore.getState().spectrumEnabled).toBe(false);
		expect(useWallpaperStore.getState().activeSceneSlotId).toBe(
			useWallpaperStore.getState().sceneSlots[0].id
		);
	});

	it('image without sceneSlotId uses the default scene', () => {
		const sceneId = useWallpaperStore.getState().sceneSlots[0].id;
		useWallpaperStore.setState({ defaultSceneSlotId: sceneId });
		useWallpaperStore.getState().setActiveImageId('default');
		expect(useWallpaperStore.getState().spectrumEnabled).toBe(false);
		expect(useWallpaperStore.getState().activeSceneSlotId).toBe(sceneId);
	});

	it('an effective scene wins over legacy per-image overrides', () => {
		const sceneId = useWallpaperStore.getState().sceneSlots[0].id;
		useWallpaperStore.setState({ defaultSceneSlotId: sceneId });
		// imgOverride has no explicit scene → rides the default → scene wins,
		// override ignored.
		useWallpaperStore.getState().setActiveImageId('override');
		expect(useWallpaperStore.getState().spectrumEnabled).toBe(false);
		expect(useWallpaperStore.getState().spectrumBarCount).not.toBe(48);
	});

	it('no effective scene falls back to legacy overrides', () => {
		// No default, override image has no scene → override applies.
		useWallpaperStore.getState().setActiveImageId('override');
		expect(useWallpaperStore.getState().spectrumBarCount).toBe(48);
		expect(useWallpaperStore.getState().activeSceneSlotId).toBeNull();
	});
});

describe('Scene-first actions', () => {
	beforeEach(setup);

	it('setDefaultSceneSlot re-applies + transitions an image riding the default', () => {
		const sceneId = useWallpaperStore.getState().sceneSlots[0].id;
		useWallpaperStore.getState().setActiveImageId('default');
		useWallpaperStore.setState({
			spectrumEnabled: true,
			visualTransition: null
		});
		useWallpaperStore.getState().setDefaultSceneSlot(sceneId);
		expect(useWallpaperStore.getState().defaultSceneSlotId).toBe(sceneId);
		expect(useWallpaperStore.getState().spectrumEnabled).toBe(false);
		expect(useWallpaperStore.getState().visualTransition).not.toBeNull();
	});

	it('setDefaultSceneSlot does not re-apply over an explicit-scene image', () => {
		useWallpaperStore.getState().setActiveImageId('explicit');
		const second = sceneSpectrumOff('Another');
		useWallpaperStore.setState({
			sceneSlots: [...useWallpaperStore.getState().sceneSlots, second],
			spectrumEnabled: true,
			visualTransition: null
		});
		useWallpaperStore.getState().setDefaultSceneSlot(second.id);
		// The active image has its own scene → default change leaves it alone.
		expect(useWallpaperStore.getState().visualTransition).toBeNull();
	});

	it('assignSceneToImage assigns without copying config', () => {
		const sceneId = useWallpaperStore.getState().sceneSlots[0].id;
		useWallpaperStore.getState().assignSceneToImage('override', sceneId);
		const img = useWallpaperStore
			.getState()
			.backgroundImages.find(i => i.assetId === 'override');
		expect(img?.sceneSlotId).toBe(sceneId);
		// The image keeps its (now-ignored) override blob — not copied/cleared.
		expect(img?.spectrumOverride).not.toBeNull();
	});

	it('setImageUseDefaultScene clears the explicit scene', () => {
		useWallpaperStore.getState().setImageUseDefaultScene('explicit');
		const img = useWallpaperStore
			.getState()
			.backgroundImages.find(i => i.assetId === 'explicit');
		expect(img?.sceneSlotId).toBeNull();
	});

	it('duplicateScene clones name + references with a new id', () => {
		const src = useWallpaperStore.getState().sceneSlots[0];
		useWallpaperStore.getState().duplicateScene(src.id);
		const scenes = useWallpaperStore.getState().sceneSlots;
		expect(scenes).toHaveLength(2);
		const copy = scenes[1];
		expect(copy.id).not.toBe(src.id);
		expect(copy.name).toBe(`${src.name} copy`);
		expect(copy.spectrumSlotIndex).toBe(src.spectrumSlotIndex);
	});

	it('removeSceneSlot clears the default + image bindings that used it', () => {
		const sceneId = useWallpaperStore.getState().sceneSlots[0].id;
		useWallpaperStore.setState({ defaultSceneSlotId: sceneId });
		useWallpaperStore.getState().removeSceneSlot(sceneId);
		expect(useWallpaperStore.getState().defaultSceneSlotId).toBeNull();
		const explicit = useWallpaperStore
			.getState()
			.backgroundImages.find(i => i.assetId === 'explicit');
		expect(explicit?.sceneSlotId).toBeNull();
	});
});
