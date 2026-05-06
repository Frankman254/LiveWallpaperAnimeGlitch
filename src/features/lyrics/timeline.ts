import type { ParsedLyricsDocument } from './types';
import { formatLrcTimestamp } from './parser';

export interface LyricsTimelineClip {
	id: string;
	text: string;
	startTime: number;
}

export interface LyricsTimelineWindow {
	startTime: number;
	endTime: number;
}

const MIN_GAP_SECONDS = 0.08;
const DEFAULT_LAST_LINE_DURATION = 3;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function sortLyricsTimelineClips(
	clips: readonly LyricsTimelineClip[]
): LyricsTimelineClip[] {
	return [...clips].sort((a, b) => a.startTime - b.startTime);
}

export function createTimelineClipsFromDocument(
	document: ParsedLyricsDocument
): LyricsTimelineClip[] {
	return document.lines.map((line, index) => ({
		id: `lyric-${index}`,
		text: line.text,
		startTime: Math.max(0, line.startTime)
	}));
}

export function getTimelineWindowForClip(
	clips: readonly LyricsTimelineClip[],
	index: number,
	durationSec: number
): LyricsTimelineWindow {
	const sorted = sortLyricsTimelineClips(clips);
	const clip = sorted[index];
	if (!clip) {
		return { startTime: 0, endTime: Math.max(0, durationSec) };
	}
	const nextStart = sorted[index + 1]?.startTime;
	const trackEnd =
		durationSec > 0
			? durationSec
			: clip.startTime + DEFAULT_LAST_LINE_DURATION;
	const endTime = Math.max(
		clip.startTime + MIN_GAP_SECONDS,
		nextStart ?? trackEnd
	);
	return {
		startTime: clip.startTime,
		endTime
	};
}

export function moveTimelineClip(
	clips: readonly LyricsTimelineClip[],
	clipId: string,
	targetStartTime: number,
	durationSec: number
): LyricsTimelineClip[] {
	const sorted = sortLyricsTimelineClips(clips);
	const index = sorted.findIndex(clip => clip.id === clipId);
	if (index < 0) return sorted;

	const previous = sorted[index - 1];
	const next = sorted[index + 1];
	const minStart = previous
		? previous.startTime + MIN_GAP_SECONDS
		: 0;
	const maxStart =
		next?.startTime != null
			? next.startTime - MIN_GAP_SECONDS
			: durationSec > 0
				? durationSec
				: Number.POSITIVE_INFINITY;

	const nextStartTime = clamp(targetStartTime, minStart, maxStart);
	return sorted.map(clip =>
		clip.id === clipId
			? {
					...clip,
					startTime: nextStartTime
				}
			: clip
	);
}

export function resizeTimelineClipStart(
	clips: readonly LyricsTimelineClip[],
	clipId: string,
	targetStartTime: number,
	durationSec: number
): LyricsTimelineClip[] {
	return moveTimelineClip(clips, clipId, targetStartTime, durationSec);
}

export function resizeTimelineClipEnd(
	clips: readonly LyricsTimelineClip[],
	clipId: string,
	targetEndTime: number,
	durationSec: number
): LyricsTimelineClip[] {
	const sorted = sortLyricsTimelineClips(clips);
	const index = sorted.findIndex(clip => clip.id === clipId);
	if (index < 0) return sorted;
	const next = sorted[index + 1];
	if (!next) return sorted;

	const clip = sorted[index]!;
	const following = sorted[index + 2];
	const minNextStart = clip.startTime + MIN_GAP_SECONDS;
	const maxNextStart =
		following?.startTime != null
			? following.startTime - MIN_GAP_SECONDS
			: durationSec > 0
				? durationSec
				: Number.POSITIVE_INFINITY;

	const nextStartTime = clamp(targetEndTime, minNextStart, maxNextStart);
	return sorted.map(item =>
		item.id === next.id
			? {
					...item,
					startTime: nextStartTime
				}
			: item
	);
}

export function chooseTimelineTickInterval(
	pxPerSecond: number,
	targetPx = 72
): number {
	const candidates = [0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
	for (const candidate of candidates) {
		if (candidate * pxPerSecond >= targetPx) return candidate;
	}
	return candidates[candidates.length - 1]!;
}

export function formatTimelineTime(seconds: number): string {
	const safeSeconds = Math.max(0, seconds);
	const minutes = Math.floor(safeSeconds / 60);
	const secs = safeSeconds % 60;
	return `${minutes}:${secs.toFixed(2).padStart(5, '0')}`;
}

export function serializeTimelineClipsToLrc(
	clips: readonly LyricsTimelineClip[],
	metadata: Record<string, string>
): string {
	const sorted = sortLyricsTimelineClips(clips);
	const preferredKeys = ['ti', 'ar', 'al', 'by', 'offset', 'length'];
	const metadataKeys = [
		...preferredKeys.filter(key => metadata[key]),
		...Object.keys(metadata)
			.filter(key => !preferredKeys.includes(key))
			.sort((a, b) => a.localeCompare(b))
	];

	const metadataLines = metadataKeys.map(
		key => `[${key}:${metadata[key] ?? ''}]`
	);
	const clipLines = sorted.map(
		clip => `${formatLrcTimestamp(clip.startTime)} ${clip.text}`.trimEnd()
	);

	return [...metadataLines, ...clipLines].join('\n').trim();
}
