import type { StateCreator } from 'zustand';
import type { AudioLyricsTrackEntry } from '@/features/lyrics/types';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2];

function mergeTrackEntry(
	current: AudioLyricsTrackEntry | undefined,
	patch: Partial<AudioLyricsTrackEntry>
): AudioLyricsTrackEntry {
	return {
		mode: patch.mode ?? current?.mode ?? 'auto',
		rawText: patch.rawText ?? current?.rawText ?? ''
	};
}

export function createAudioLyricsSlice(
	set: WallpaperSet,
	_get: WallpaperGet,
	_api: WallpaperApi
) {
	return {
		setAudioLyricsEnabled: v => set({ audioLyricsEnabled: v }),
		setAudioLyricsLayoutMode: v => set({ audioLyricsLayoutMode: v }),
		setAudioLyricsUppercase: v => set({ audioLyricsUppercase: v }),
		setAudioLyricsPositionX: v => set({ audioLyricsPositionX: v }),
		setAudioLyricsPositionY: v => set({ audioLyricsPositionY: v }),
		setAudioLyricsWidth: v => set({ audioLyricsWidth: v }),
		setAudioLyricsFontStyle: v => set({ audioLyricsFontStyle: v }),
		setAudioLyricsFontSize: v => set({ audioLyricsFontSize: v }),
		setAudioLyricsLetterSpacing: v => set({ audioLyricsLetterSpacing: v }),
		setAudioLyricsLineHeight: v => set({ audioLyricsLineHeight: v }),
		setAudioLyricsVisibleLineCount: v =>
			set({ audioLyricsVisibleLineCount: Math.round(v) }),
		setAudioLyricsOpacity: v => set({ audioLyricsOpacity: v }),
		setAudioLyricsInactiveOpacity: v =>
			set({ audioLyricsInactiveOpacity: v }),
		setAudioLyricsTimeOffsetMs: v =>
			set({ audioLyricsTimeOffsetMs: Math.round(v) }),
		setAudioLyricsActiveColor: v => set({ audioLyricsActiveColor: v }),
		setAudioLyricsActiveColorSource: v =>
			set({ audioLyricsActiveColorSource: v }),
		setAudioLyricsInactiveColor: v => set({ audioLyricsInactiveColor: v }),
		setAudioLyricsInactiveColorSource: v =>
			set({ audioLyricsInactiveColorSource: v }),
		setAudioLyricsGlowColor: v => set({ audioLyricsGlowColor: v }),
		setAudioLyricsGlowColorSource: v =>
			set({ audioLyricsGlowColorSource: v }),
		setAudioLyricsGlowBlur: v => set({ audioLyricsGlowBlur: v }),
		setAudioLyricsBackdropEnabled: v =>
			set({ audioLyricsBackdropEnabled: v }),
		setAudioLyricsBackdropColor: v => set({ audioLyricsBackdropColor: v }),
		setAudioLyricsBackdropColorSource: v =>
			set({ audioLyricsBackdropColorSource: v }),
		setAudioLyricsBackdropOpacity: v =>
			set({ audioLyricsBackdropOpacity: v }),
		setAudioLyricsBackdropPadding: v =>
			set({ audioLyricsBackdropPadding: v }),
		setAudioLyricsBackdropRadius: v =>
			set({ audioLyricsBackdropRadius: v }),
		upsertAudioLyricsTrackEntry: (assetId, entry) =>
			set(state => ({
				audioLyricsByTrackAssetId: {
					...state.audioLyricsByTrackAssetId,
					[assetId]: mergeTrackEntry(undefined, entry)
				}
			})),
		updateAudioLyricsTrackEntry: (assetId, patch) =>
			set(state => ({
				audioLyricsByTrackAssetId: {
					...state.audioLyricsByTrackAssetId,
					[assetId]: mergeTrackEntry(
						state.audioLyricsByTrackAssetId[assetId],
						patch
					)
				}
			})),
		removeAudioLyricsTrackEntry: assetId =>
			set(state => {
				if (!state.audioLyricsByTrackAssetId[assetId]) return state;
				const nextEntries = { ...state.audioLyricsByTrackAssetId };
				delete nextEntries[assetId];
				return {
					audioLyricsByTrackAssetId: nextEntries
				};
			})
	} satisfies Partial<WallpaperStore>;
}
