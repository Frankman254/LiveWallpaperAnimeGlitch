import type {
	AudioLyricsSourceMode,
	AudioLyricsTrackEntry,
	ParsedLyricsDocument,
	ParsedLyricsLine
} from './types';

const LRC_TIMESTAMP = /\[(\d{1,3}):(\d{2}(?:\.\d{1,3})?)\]/g;
const PURE_METADATA = /^\[([a-zA-Z_]+):([^\]]*)\]$/;
const LINE_BREAK = /\r\n|\r|\n/;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function hasLrcTimestamps(input: string): boolean {
	LRC_TIMESTAMP.lastIndex = 0;
	return LRC_TIMESTAMP.test(input);
}

export function normalizePlainLyricsLines(input: string): string[] {
	if (!input.trim()) return [];
	return input
		.split(LINE_BREAK)
		.map(line => line.replace(LRC_TIMESTAMP, '').trim())
		.filter(line => line.length > 0 && !PURE_METADATA.test(line))
		.map(line => line.replace(/[\t ]+/g, ' ').trim());
}

function parseLrcDocument(input: string): ParsedLyricsDocument {
	const rawLines = input.split(LINE_BREAK);
	const metadata: Record<string, string> = {};
	const parsedLines: Array<{ text: string; startTime: number }> = [];

	for (const rawLine of rawLines) {
		const line = rawLine.trim();
		if (!line) continue;

		LRC_TIMESTAMP.lastIndex = 0;
		const metaMatch = PURE_METADATA.exec(line);
		if (metaMatch && !LRC_TIMESTAMP.test(line)) {
			const key = metaMatch[1]?.toLowerCase() ?? '';
			if (key) {
				metadata[key] = metaMatch[2]?.trim() ?? '';
			}
			continue;
		}

		LRC_TIMESTAMP.lastIndex = 0;
		let lastMatchEnd = 0;
		const timestamps: number[] = [];
		let match: RegExpExecArray | null = null;
		while ((match = LRC_TIMESTAMP.exec(line)) !== null) {
			const minutes = Number.parseInt(match[1] ?? '0', 10);
			const seconds = Number.parseFloat(match[2] ?? '0');
			timestamps.push(minutes * 60 + seconds);
			lastMatchEnd = match.index + match[0].length;
		}

		if (timestamps.length === 0) continue;
		const text = line
			.slice(lastMatchEnd)
			.trim()
			.replace(/[\t ]+/g, ' ');
		for (const timestamp of timestamps) {
			parsedLines.push({
				startTime: timestamp,
				text
			});
		}
	}

	parsedLines.sort((a, b) => a.startTime - b.startTime);
	const lines: ParsedLyricsLine[] = parsedLines.map((line, index) => ({
		text: line.text,
		startTime: line.startTime,
		endTime:
			parsedLines[index + 1]?.startTime ??
			Math.max(line.startTime + 4, line.startTime + 0.001)
	}));

	return {
		mode: 'lrc',
		hasTimestamps: true,
		metadata,
		lines
	};
}

function parsePlainDocument(
	input: string,
	durationSec: number
): ParsedLyricsDocument {
	const plainLines = normalizePlainLyricsLines(input);
	if (plainLines.length === 0) {
		return {
			mode: 'plain',
			hasTimestamps: false,
			metadata: {},
			lines: []
		};
	}

	const safeDuration = durationSec > 0 ? durationSec : plainLines.length * 4;
	const segmentDuration = safeDuration / Math.max(plainLines.length, 1);
	const lines: ParsedLyricsLine[] = plainLines.map((text, index) => {
		const startTime = index * segmentDuration;
		const endTime =
			index === plainLines.length - 1
				? safeDuration
				: (index + 1) * segmentDuration;
		return {
			text,
			startTime,
			endTime: Math.max(endTime, startTime + 0.001)
		};
	});

	return {
		mode: 'plain',
		hasTimestamps: false,
		metadata: {},
		lines
	};
}

export function resolveLyricsDocument(
	entry: AudioLyricsTrackEntry | null | undefined,
	durationSec: number
): ParsedLyricsDocument {
	if (!entry?.rawText.trim()) {
		return {
			mode: 'plain',
			hasTimestamps: false,
			metadata: {},
			lines: []
		};
	}

	const requestedMode: AudioLyricsSourceMode = entry.mode ?? 'auto';
	const effectiveMode =
		requestedMode === 'auto'
			? hasLrcTimestamps(entry.rawText)
				? 'lrc'
				: 'plain'
			: requestedMode;

	return effectiveMode === 'lrc'
		? parseLrcDocument(entry.rawText)
		: parsePlainDocument(entry.rawText, durationSec);
}

export function findActiveLyricsLineIndex(
	lines: ParsedLyricsLine[],
	timeSec: number,
	hasTimestamps = true
): number {
	if (lines.length === 0) return -1;
	const clampedTime = Math.max(0, timeSec);
	if (hasTimestamps && clampedTime < lines[0]!.startTime) {
		return -1;
	}
	for (let index = lines.length - 1; index >= 0; index -= 1) {
		if (clampedTime >= lines[index]!.startTime) {
			return clamp(index, 0, lines.length - 1);
		}
	}
	return hasTimestamps ? -1 : 0;
}

export function formatLrcTimestamp(timeSec: number): string {
	const totalCentiseconds = Math.max(0, Math.round(timeSec * 100));
	const minutes = Math.floor(totalCentiseconds / 6000);
	const seconds = Math.floor((totalCentiseconds % 6000) / 100);
	const centiseconds = totalCentiseconds % 100;
	return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}]`;
}
