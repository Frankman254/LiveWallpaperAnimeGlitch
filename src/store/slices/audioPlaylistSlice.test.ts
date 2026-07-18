import { describe, expect, it } from 'vitest';
import type {
	AudioLyricsTrackEntry,
	AudioPlaylistTrack
} from '@/types/wallpaper';
import { buildAudioTrackRemovalPatch } from './audioPlaylistSlice';

function track(id: string, assetId: string): AudioPlaylistTrack {
	return {
		id,
		assetId,
		name: `${id}.mp3`,
		mimeType: 'audio/mpeg',
		volume: 1,
		loop: false,
		enabled: true
	};
}

const lyrics = { rawText: '[00:00.00]test' } as AudioLyricsTrackEntry;

describe('buildAudioTrackRemovalPatch', () => {
	it('removes orphaned lyrics and clears active/queued references', () => {
		const patch = buildAudioTrackRemovalPatch(
			{
				audioTracks: [track('a', 'asset-a'), track('b', 'asset-b')],
				activeAudioTrackId: 'a',
				queuedAudioTrackId: 'a',
				audioLyricsByTrackAssetId: {
					'asset-a': lyrics,
					'asset-b': lyrics
				}
			},
			'a'
		);

		expect(patch.audioTracks?.map(item => item.id)).toEqual(['b']);
		expect(patch.activeAudioTrackId).toBeNull();
		expect(patch.queuedAudioTrackId).toBeNull();
		expect(patch.audioLyricsByTrackAssetId).toEqual({ 'asset-b': lyrics });
	});

	it('keeps lyrics while another track still references the same asset', () => {
		const entries = { shared: lyrics };
		const patch = buildAudioTrackRemovalPatch(
			{
				audioTracks: [track('a', 'shared'), track('b', 'shared')],
				activeAudioTrackId: 'b',
				queuedAudioTrackId: null,
				audioLyricsByTrackAssetId: entries
			},
			'a'
		);

		expect(patch.audioLyricsByTrackAssetId).toBe(entries);
		expect(patch.activeAudioTrackId).toBe('b');
	});
});
