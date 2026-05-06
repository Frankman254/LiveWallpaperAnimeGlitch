export type AudioLyricsSourceMode = 'auto' | 'lrc' | 'plain';

export interface AudioLyricsTrackEntry {
	mode: AudioLyricsSourceMode;
	rawText: string;
}

export interface ParsedLyricsLine {
	text: string;
	startTime: number;
	endTime: number;
}

export interface ParsedLyricsDocument {
	mode: Exclude<AudioLyricsSourceMode, 'auto'>;
	hasTimestamps: boolean;
	metadata: Record<string, string>;
	lines: ParsedLyricsLine[];
}
