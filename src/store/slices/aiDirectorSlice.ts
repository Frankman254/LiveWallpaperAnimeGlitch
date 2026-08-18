import type { StateCreator } from 'zustand';
import {
	buildDraftPatch,
	snapshotForPatch,
	type SceneDraft
} from '@/features/aiDirector/sceneDraft';
import { invalidateSpectrumPresetMorph } from '@/features/spectrum/runtime/spectrumPresetTransition';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2];

/**
 * Try-on state for the AI Director. None of this is persisted (see the
 * denylist in `partializeWallpaperStore`): a half-previewed draft surviving a
 * reload would leave the user looking at settings they never accepted, with no
 * snapshot left to undo them.
 *
 * The flow is deliberately three-step — preview, then commit or revert —
 * because a scene that applied itself the moment it was generated would give
 * the user no way back to what they had.
 */
export function createAiDirectorSlice(
	set: WallpaperSet,
	get: WallpaperGet,
	_api: WallpaperApi
) {
	return {
		aiDraft: null,
		aiPreviewActive: false,
		aiPreviewSnapshot: null,

		setAiDraft: (draft: SceneDraft | null) => set({ aiDraft: draft }),

		/**
		 * Apply the draft to live state so it renders and reacts to audio.
		 *
		 * Re-previewing restores the original snapshot first, so the snapshot
		 * always holds the user's own settings rather than the previous
		 * preview's — otherwise stepping through several drafts would make
		 * revert return to a draft instead of to reality.
		 */
		previewAiDraft: (draft?: SceneDraft) => {
			const state = get();
			const target = draft ?? state.aiDraft;
			if (!target) return;

			const base =
				state.aiPreviewActive && state.aiPreviewSnapshot
					? { ...state, ...state.aiPreviewSnapshot }
					: state;

			const patch = buildDraftPatch(base, target.compiled);
			invalidateSpectrumPresetMorph();
			set({
				...(patch as Partial<WallpaperStore>),
				aiDraft: target,
				aiPreviewActive: true,
				aiPreviewSnapshot:
					state.aiPreviewActive && state.aiPreviewSnapshot
						? state.aiPreviewSnapshot
						: snapshotForPatch(state, patch)
			});
		},

		/** Put back exactly what the preview overwrote. Keeps the draft so the
		 *  user can tweak and preview again. */
		revertAiPreview: () => {
			const { aiPreviewActive, aiPreviewSnapshot } = get();
			if (!aiPreviewActive || !aiPreviewSnapshot) return;
			invalidateSpectrumPresetMorph();
			set({
				...(aiPreviewSnapshot as Partial<WallpaperStore>),
				aiPreviewActive: false,
				aiPreviewSnapshot: null
			});
		},

		/** Drop the draft entirely, reverting first if it is on screen. */
		discardAiDraft: () => {
			get().revertAiPreview();
			set({ aiDraft: null });
		},

		/**
		 * Save the previewed look as a real Scene.
		 *
		 * Commit captures the LIVE state rather than re-deriving values from the
		 * draft. That is what makes "what you previewed is what you saved" true
		 * by construction instead of by two code paths agreeing. If the draft
		 * was never previewed we apply it first, so the same guarantee holds.
		 *
		 * `bindToImage` links the new Scene to the draft's image, which is what
		 * makes "changing the image loads its spectrum and effects" work — the
		 * scene runtime already handles the rest.
		 */
		commitAiDraft: (name?: string, bindToImage = true) => {
			const state = get();
			const draft = state.aiDraft;
			if (!draft) return null;

			if (!state.aiPreviewActive) get().previewAiDraft(draft);

			const captured = get().captureSceneSlotFromCurrent(name);
			if (!captured) return null;

			if (bindToImage && draft.assetId) {
				get().setBackgroundImageSceneSlotId(
					draft.assetId,
					captured.sceneId
				);
			}

			// The previewed look stays on screen and is now backed by a saved
			// scene, so there is nothing left to revert to.
			set({
				aiDraft: null,
				aiPreviewActive: false,
				aiPreviewSnapshot: null,
				activeSceneSlotId: captured.sceneId
			});
			return captured;
		}
	} satisfies Partial<WallpaperStore>;
}
