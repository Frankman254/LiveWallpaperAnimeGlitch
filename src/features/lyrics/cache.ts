import { getLruEntry, setLruEntry } from '@/lib/lruCache';
import { resolveLyricsDocument } from './parser';
import type { AudioLyricsTrackEntry, ParsedLyricsDocument } from './types';

const LYRICS_CACHE_LIMIT = 12;
const lyricsCache = new Map<string, ParsedLyricsDocument>();

export function getCachedLyricsDocument(
	entry: AudioLyricsTrackEntry | null | undefined,
	durationSec: number
): ParsedLyricsDocument {
	const cacheKey = `${entry?.mode ?? 'none'}::${durationSec.toFixed(3)}::${entry?.rawText ?? ''}`;
	const cached = getLruEntry(lyricsCache, cacheKey);
	if (cached) return cached;
	const resolved = resolveLyricsDocument(entry, durationSec);
	setLruEntry(lyricsCache, cacheKey, resolved, LYRICS_CACHE_LIMIT);
	return resolved;
}
