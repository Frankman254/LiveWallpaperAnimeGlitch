import type { ColorSourceMode } from '@/types/wallpaper';
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
	glowIntensity?: number;
	blurAmount?: number;
	// ── Fill (Active Line) ────────────────────────────────────────────────
	textColor?: string;
	/** Absent (legacy configs) behaves exactly like `'solid'`. */
	textColorMode?: LyricsLayerColorMode;
	/** Second gradient stop; ignored unless `textColorMode === 'gradient'`. */
	textColorSecondary?: string;
	/** Absent behaves like `'manual'`, the historical behaviour. */
	textColorSource?: ColorSourceMode;
	// ── Stroke (border) ───────────────────────────────────────────────────
	strokeColor?: string;
	strokeColorMode?: LyricsLayerColorMode;
	strokeColorSecondary?: string;
	strokeColorSource?: ColorSourceMode;
	/** Per-layer width; falls back to the global lyrics stroke width. */
	strokeWidth?: number;
	// ── Glow ──────────────────────────────────────────────────────────────
	glowColor?: string;
	glowColorMode?: LyricsLayerColorMode;
	/** Second gradient stop; ignored unless `glowColorMode === 'gradient'`. */
	glowColorSecondary?: string;
	glowColorSource?: ColorSourceMode;
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
