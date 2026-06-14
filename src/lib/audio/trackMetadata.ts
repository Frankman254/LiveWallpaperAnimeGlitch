import type {
	AudioPlaylistTrack,
	WallpaperState
} from '@/types/wallpaper';
import { formatTrackTitle } from '@/lib/audio/trackTitle';

/** What the now-playing widget actually shows for a track. */
export type ResolvedTrackDisplay = {
	artist: string;
	title: string;
};

export type ParsedTrackName = {
	artist: string;
	title: string;
};

export type ParsedTrackId3 = {
	artist?: string;
	title?: string;
	album?: string;
	/** Cover art, when the file embeds one. Caller persists it as an asset. */
	cover?: { data: Uint8Array; mimeType: string };
};

const ARTIST_TITLE_SEPARATORS = [' - ', ' – ', ' — ', ' _ '];

/**
 * Heuristic split of a filename into artist + title. Recognizes the common
 * "Artist - Title" / "Artist – Title" shapes; anything else becomes the title
 * with an empty artist. Cleaning (extension, separators, encoding) reuses
 * formatTrackTitle so both paths agree.
 */
export function parseTrackNameHeuristic(rawName: string): ParsedTrackName {
	const cleaned = formatTrackTitle(rawName);
	if (!cleaned) return { artist: '', title: '' };

	for (const sep of ARTIST_TITLE_SEPARATORS) {
		const index = cleaned.indexOf(sep);
		if (index > 0 && index < cleaned.length - sep.length) {
			const artist = cleaned.slice(0, index).trim();
			const title = cleaned.slice(index + sep.length).trim();
			if (artist && title) return { artist, title };
		}
	}

	return { artist: '', title: cleaned };
}

/**
 * Reads embedded ID3/Vorbis/MP4 tags from an audio file. `music-metadata` is
 * loaded dynamically so it only enters the bundle when the user opts into the
 * "full" auto source.
 */
export async function parseTrackId3(file: File): Promise<ParsedTrackId3> {
	const { parseBlob } = await import('music-metadata');
	const metadata = await parseBlob(file, { duration: false });
	const common = metadata.common;
	const picture = common.picture?.[0];
	return {
		artist: common.artist?.trim() || undefined,
		title: common.title?.trim() || undefined,
		album: common.album?.trim() || undefined,
		cover: picture
			? {
					data: new Uint8Array(picture.data),
					mimeType: picture.format || 'image/jpeg'
				}
			: undefined
	};
}

type TrackDisplaySettings = Pick<
	WallpaperState,
	| 'trackMetadataMode'
	| 'trackMetadataAutoSource'
	| 'trackManualArtist'
	| 'trackManualTitle'
>;

/**
 * Single source of truth for what the widget renders, used by both the render
 * loop and the editor preview. Manual overrides win in 'manual' mode; auto
 * mode prefers stored tags/heuristic and always falls back to the cleaned
 * filename so the title line is never empty.
 */
export function resolveTrackDisplay(
	track: Pick<
		AudioPlaylistTrack,
		'name' | 'artist' | 'title' | 'manualArtist' | 'manualTitle'
	> | null,
	settings: TrackDisplaySettings
): ResolvedTrackDisplay {
	if (!track) return { artist: '', title: '' };

	const fallback = parseTrackNameHeuristic(track.name);

	if (settings.trackMetadataMode === 'manual') {
		// Per-track override wins; otherwise the global manual fields (usable
		// even without a playlist track); otherwise the filename heuristic.
		return {
			artist:
				(track.manualArtist ?? '').trim() ||
				(settings.trackManualArtist ?? '').trim(),
			title:
				(track.manualTitle ?? '').trim() ||
				(settings.trackManualTitle ?? '').trim() ||
				fallback.title
		};
	}

	// Auto: 'full' prefers stored ID3 tags; 'name' ignores them. Both fall
	// back to the filename heuristic.
	if (settings.trackMetadataAutoSource === 'full') {
		return {
			artist: (track.artist ?? '').trim() || fallback.artist,
			title: (track.title ?? '').trim() || fallback.title
		};
	}

	return fallback;
}
