import type { LyrixaLyricsBundleEnvelope } from './lyrixaBundleTypes';

export type AudioLyricsSourceMode = 'auto' | 'lrc' | 'plain';
export type LyrixaRenderMode = 'bundle' | 'editor';

export interface LyrixaLayerOverride {
	visible?: boolean;
	positionOffsetX?: number;
	positionOffsetY?: number;
	scale?: number;
	opacity?: number;
	textColor?: string;
	glowColor?: string;
	glowIntensity?: number;
	blurAmount?: number;
}

export type LyrixaLayerOverrideMap = Record<string, LyrixaLayerOverride>;

export interface AudioLyricsTrackEntry {
	mode: AudioLyricsSourceMode;
	rawText: string;
	lyrixaBundle?: LyrixaLyricsBundleEnvelope | null;
	lyrixaRenderMode?: LyrixaRenderMode;
	lyrixaLayerOverrides?: LyrixaLayerOverrideMap;
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
