import type { StateCreator } from 'zustand';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import type { AudioPlaylistTrack, AudioMixMode } from '@/types/wallpaper';

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2];

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
			set(state => ({
				audioTracks: state.audioTracks.filter(t => t.id !== id),
				activeAudioTrackId:
					state.activeAudioTrackId === id
						? null
						: state.activeAudioTrackId
			})),
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
		setAudioMixMode: (v: AudioMixMode) => set({ audioMixMode: v })
	} satisfies Partial<WallpaperStore>;
}
