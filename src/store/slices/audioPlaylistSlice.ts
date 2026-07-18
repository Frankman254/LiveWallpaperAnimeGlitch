import type { StateCreator } from 'zustand';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import type {
	AudioPlaylistTrack,
	AudioMixMode,
	AudioTransitionStyle
} from '@/types/wallpaper';

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2];

type AudioTrackRemovalState = Pick<
	WallpaperStore,
	| 'audioTracks'
	| 'activeAudioTrackId'
	| 'queuedAudioTrackId'
	| 'audioLyricsByTrackAssetId'
>;

export function buildAudioTrackRemovalPatch(
	state: AudioTrackRemovalState,
	id: string
): Partial<AudioTrackRemovalState> {
	const removedTrack = state.audioTracks.find(track => track.id === id);
	if (!removedTrack) return {};

	const audioTracks = state.audioTracks.filter(track => track.id !== id);
	let audioLyricsByTrackAssetId = state.audioLyricsByTrackAssetId;
	const assetStillUsed = audioTracks.some(
		track => track.assetId === removedTrack.assetId
	);
	if (
		!assetStillUsed &&
		state.audioLyricsByTrackAssetId[removedTrack.assetId]
	) {
		audioLyricsByTrackAssetId = {
			...state.audioLyricsByTrackAssetId
		};
		delete audioLyricsByTrackAssetId[removedTrack.assetId];
	}

	return {
		audioTracks,
		activeAudioTrackId:
			state.activeAudioTrackId === id ? null : state.activeAudioTrackId,
		queuedAudioTrackId:
			state.queuedAudioTrackId === id ? null : state.queuedAudioTrackId,
		audioLyricsByTrackAssetId
	};
}

export function createAudioPlaylistSlice(
	set: WallpaperSet,
	_get: WallpaperGet,
	_api: WallpaperApi
) {
	return {
		setAudioTracks: (tracks: AudioPlaylistTrack[]) =>
			set({ audioTracks: tracks }),
		addAudioTrack: (track: AudioPlaylistTrack) =>
			set(state => ({ audioTracks: [...state.audioTracks, track] })),
		removeAudioTrack: (id: string) =>
			set(state => buildAudioTrackRemovalPatch(state, id)),
		updateAudioTrack: (id: string, patch: Partial<AudioPlaylistTrack>) =>
			set(state => ({
				audioTracks: state.audioTracks.map(t =>
					t.id === id ? { ...t, ...patch } : t
				)
			})),
		moveAudioTrack: (fromIndex: number, toIndex: number) =>
			set(state => {
				const tracks = [...state.audioTracks];
				const [removed] = tracks.splice(fromIndex, 1);
				if (removed) tracks.splice(toIndex, 0, removed);
				return { audioTracks: tracks };
			}),
		setActiveAudioTrackId: (id: string | null) =>
			set({ activeAudioTrackId: id }),
		setQueuedAudioTrackId: (id: string | null) =>
			set({ queuedAudioTrackId: id }),
		setAudioCrossfadeEnabled: (v: boolean) =>
			set({ audioCrossfadeEnabled: v }),
		setAudioCrossfadeSeconds: (v: number) =>
			set({ audioCrossfadeSeconds: v }),
		setAudioAutoAdvance: (v: boolean) => set({ audioAutoAdvance: v }),
		setAudioMixMode: (v: AudioMixMode) => set({ audioMixMode: v }),
		setAudioTransitionStyle: (v: AudioTransitionStyle) =>
			set({ audioTransitionStyle: v }),
		setMediaSessionEnabled: (v: boolean) => set({ mediaSessionEnabled: v })
	} satisfies Partial<WallpaperStore>;
}
