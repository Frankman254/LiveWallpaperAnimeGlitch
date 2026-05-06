import type {
	AudioPlaylistTrack,
	WallpaperState
} from '@/types/wallpaper';

type ActiveTrackState = Pick<
	WallpaperState,
	'audioTracks' | 'activeAudioTrackId' | 'audioFileAssetId'
>;

export function resolveActiveAudioTrack(
	state: Pick<ActiveTrackState, 'audioTracks' | 'activeAudioTrackId'>
): AudioPlaylistTrack | null {
	return (
		state.audioTracks.find(track => track.id === state.activeAudioTrackId) ??
		null
	);
}

export function resolveActiveAudioAssetId(
	state: ActiveTrackState
): string | null {
	return resolveActiveAudioTrack(state)?.assetId ?? state.audioFileAssetId;
}
