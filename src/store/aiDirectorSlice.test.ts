import { describe, it, expect, beforeEach } from 'vitest';

const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
	getItem: (k: string) => mem.get(k) ?? null,
	setItem: (k: string, v: string) => void mem.set(k, v),
	removeItem: (k: string) => void mem.delete(k),
	clear: () => void mem.clear()
};

const { useWallpaperStore } = await import('@/store/wallpaperStore');
const { partializeWallpaperStore } =
	await import('@/store/wallpaperStorePersistence');
const { draftFromSignature, draftWithIntent } =
	await import('@/features/aiDirector/sceneDraft');
import type { ImageSignature } from '@/features/aiDirector/analysis/imageSignature';
import type { WallpaperState } from '@/types/wallpaper';

function signature(partial: Partial<ImageSignature> = {}): ImageSignature {
	return {
		palette: [
			{ hex: '#ff2fd0', weight: 0.6 },
			{ hex: '#2ff0ff', weight: 0.4 }
		],
		luma: 0.4,
		saturation: 0.8,
		contrast: 0.7,
		edgeDensity: 0.6,
		colorCount: 12,
		isPixelArt: false,
		aspect: 16 / 9,
		version: 1,
		...partial
	};
}

/** Keys a draft is expected to drive, sampled across every family. */
const WATCHED = [
	'spectrumBarCount',
	'spectrumSmoothing',
	'spectrumPrimaryColor',
	'spectrumGlowIntensity',
	'particlesEnabled',
	'particleCount',
	'particleColor1',
	'rainEnabled',
	'stageLightsEnabled',
	'filterVignette',
	'scanlinesEnabled',
	'cameraMotionEnabled'
] as const;

function watched() {
	const state = useWallpaperStore.getState() as unknown as Record<
		string,
		unknown
	>;
	return Object.fromEntries(WATCHED.map(key => [key, state[key]]));
}

describe('aiDirectorSlice', () => {
	beforeEach(() => {
		useWallpaperStore.setState({
			sceneSlots: [],
			activeSceneSlotId: null,
			aiDraft: null,
			aiPreviewActive: false,
			aiPreviewSnapshot: null
		});
		useWallpaperStore.getState().reset();
		useWallpaperStore.setState({ sceneSlots: [], activeSceneSlotId: null });
	});

	it('starts with no draft and no preview', () => {
		const state = useWallpaperStore.getState();
		expect(state.aiDraft).toBeNull();
		expect(state.aiPreviewActive).toBe(false);
		expect(state.aiPreviewSnapshot).toBeNull();
	});

	it('never persists try-on state', () => {
		// A half-previewed draft surviving a reload would show settings the user
		// never accepted, with no snapshot left to undo them.
		useWallpaperStore
			.getState()
			.previewAiDraft(draftFromSignature(signature()));
		const persisted = partializeWallpaperStore(
			useWallpaperStore.getState()
		) as Record<string, unknown>;

		expect(useWallpaperStore.getState().aiPreviewActive).toBe(true);
		expect('aiDraft' in persisted).toBe(false);
		expect('aiPreviewActive' in persisted).toBe(false);
		expect('aiPreviewSnapshot' in persisted).toBe(false);
	});

	it('preview changes the live look and revert restores it exactly', () => {
		const before = watched();

		useWallpaperStore
			.getState()
			.previewAiDraft(draftFromSignature(signature()));
		const previewed = watched();
		expect(previewed).not.toEqual(before);
		expect(useWallpaperStore.getState().aiPreviewActive).toBe(true);

		useWallpaperStore.getState().revertAiPreview();
		expect(watched()).toEqual(before);
		expect(useWallpaperStore.getState().aiPreviewActive).toBe(false);
		expect(useWallpaperStore.getState().aiPreviewSnapshot).toBeNull();
		// The draft survives so the user can tweak and try again.
		expect(useWallpaperStore.getState().aiDraft).not.toBeNull();
	});

	it('reverting after several previews returns to the user state, not a draft', () => {
		const before = watched();
		const store = useWallpaperStore.getState();

		store.previewAiDraft(draftFromSignature(signature()));
		store.previewAiDraft(
			draftFromSignature(
				signature({
					saturation: 0.05,
					contrast: 0.05,
					edgeDensity: 0.02
				})
			)
		);
		store.previewAiDraft(
			draftFromSignature(signature({ isPixelArt: true, colorCount: 5 }))
		);
		useWallpaperStore.getState().revertAiPreview();

		expect(watched()).toEqual(before);
	});

	it('discard reverts and drops the draft', () => {
		const before = watched();
		useWallpaperStore
			.getState()
			.previewAiDraft(draftFromSignature(signature()));
		useWallpaperStore.getState().discardAiDraft();

		expect(watched()).toEqual(before);
		expect(useWallpaperStore.getState().aiDraft).toBeNull();
	});

	it('commits what was previewed — byte for byte', () => {
		// The whole point of the three-step flow: the user approves a look on
		// screen, and that exact look is what gets stored.
		const draft = draftFromSignature(signature());
		useWallpaperStore.getState().previewAiDraft(draft);
		const previewed = watched();

		const result = useWallpaperStore.getState().commitAiDraft('AI scene');
		expect(result).not.toBeNull();

		// The screen did not change on commit.
		expect(watched()).toEqual(previewed);

		// Drift away, then re-apply the saved scene: it reproduces the preview.
		useWallpaperStore.setState({
			particleCount: 3,
			spectrumBarCount: 24,
			spectrumSmoothing: 0.1
		} as Partial<WallpaperState>);
		useWallpaperStore.getState().applySceneSlotById(result!.sceneId);

		expect(watched()).toEqual(previewed);
	});

	it('commits a draft that was never previewed by applying it first', () => {
		const draft = draftFromSignature(signature());
		const result = useWallpaperStore.getState().commitAiDraft('Direct');

		expect(result).toBeNull(); // no draft set yet

		useWallpaperStore.getState().setAiDraft(draft);
		const committed = useWallpaperStore.getState().commitAiDraft('Direct');
		expect(committed).not.toBeNull();

		const applied = watched();
		useWallpaperStore.setState({
			particleCount: 1
		} as Partial<WallpaperState>);
		useWallpaperStore.getState().applySceneSlotById(committed!.sceneId);
		expect(watched()).toEqual(applied);
	});

	it('clears try-on state after commit and leaves the scene active', () => {
		useWallpaperStore
			.getState()
			.previewAiDraft(draftFromSignature(signature()));
		const result = useWallpaperStore.getState().commitAiDraft();

		const state = useWallpaperStore.getState();
		expect(state.aiDraft).toBeNull();
		expect(state.aiPreviewActive).toBe(false);
		expect(state.aiPreviewSnapshot).toBeNull();
		expect(state.activeSceneSlotId).toBe(result!.sceneId);
	});

	it('binds the committed scene to the draft image', () => {
		useWallpaperStore.setState({
			backgroundImages: [{ assetId: 'img-1', sceneSlotId: null } as never]
		});
		const draft = { ...draftFromSignature(signature(), 'img-1') };

		useWallpaperStore.getState().previewAiDraft(draft);
		const result = useWallpaperStore.getState().commitAiDraft('Bound');

		const image = useWallpaperStore
			.getState()
			.backgroundImages.find(i => i.assetId === 'img-1');
		expect(image?.sceneSlotId).toBe(result!.sceneId);
	});

	it('honours bindToImage: false', () => {
		useWallpaperStore.setState({
			backgroundImages: [{ assetId: 'img-2', sceneSlotId: null } as never]
		});
		useWallpaperStore
			.getState()
			.previewAiDraft(draftFromSignature(signature(), 'img-2'));
		useWallpaperStore.getState().commitAiDraft('Unbound', false);

		const image = useWallpaperStore
			.getState()
			.backgroundImages.find(i => i.assetId === 'img-2');
		expect(image?.sceneSlotId).toBeNull();
	});

	it('re-previews after the intent is edited by hand', () => {
		const draft = draftFromSignature(signature());
		useWallpaperStore.getState().previewAiDraft(draft);
		const auto = watched();

		const edited = draftWithIntent(
			draft,
			{ ...draft.intent, weight: draft.intent.weight > 0.5 ? 0 : 1 },
			'model'
		);
		useWallpaperStore.getState().previewAiDraft(edited);

		expect(watched().spectrumBarCount).not.toBe(auto.spectrumBarCount);
		expect(useWallpaperStore.getState().aiDraft?.source).toBe('model');
	});

	it('is a no-op when previewing or reverting with nothing to do', () => {
		expect(() =>
			useWallpaperStore.getState().previewAiDraft()
		).not.toThrow();
		expect(() =>
			useWallpaperStore.getState().revertAiPreview()
		).not.toThrow();
		expect(useWallpaperStore.getState().aiPreviewActive).toBe(false);
	});
});
