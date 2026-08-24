import type { LyrixaLyricsBundleEnvelope } from './lyrixaBundleTypes';

export type AudioLyricsSourceMode = 'auto' | 'lrc' | 'plain';
export type LyrixaRenderMode = 'bundle' | 'editor';

/**
 * Color modes a lyric layer can paint its text / halo with. Deliberately a
 * subset of `SpectrumColorMode`: the lyrics layers only expose the three modes
 * that make sense on a text run, and reuse Spectrum's rainbow palette so both
 * subsystems stay visually consistent.
 */
export type LyricsLayerColorMode = 'solid' | 'gradient' | 'rainbow';

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
	/** Absent (legacy configs) behaves exactly like `'solid'`. */
	textColorMode?: LyricsLayerColorMode;
	/** Second gradient stop; ignored unless `textColorMode === 'gradient'`. */
	textColorSecondary?: string;
	glowColorMode?: LyricsLayerColorMode;
	/** Second gradient stop; ignored unless `glowColorMode === 'gradient'`. */
	glowColorSecondary?: string;
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
