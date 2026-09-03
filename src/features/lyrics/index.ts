/**
 * Lyrics domain — public surface (model + runtime).
 *
 * The authoring tool is Lyrixa; this app does not edit lyrics. What lives here
 * is the import contract for a `.lyrixa` bundle, the parsing of plain/LRC text,
 * the colour-mode resolution shared by the renderer and the editor, and the
 * canvas overlay that draws it.
 *
 * See docs/architecture/ARCHITECTURE.md §3 (Ownership).
 *
 * Layout:
 *   domain/    bundle envelope + types, LRC/plain parser, colour modes, cache.
 *              Pure — no React, no store, no canvas.
 *   runtime/   the canvas overlay and the bundle renderer.
 *   controls/  the lyrics editor tab (exported from `./ui`, not here).
 *
 * Like `features/spectrum`, the React surface is a separate entry point so
 * pure consumers never pull components into their module graph.
 */

// ── domain: vocabulary ──────────────────────────────────────────────────────
export type {
	AudioLyricsSourceMode,
	AudioLyricsTrackEntry,
	LyricsLayerColorMode,
	LyrixaLayerOverride,
	LyrixaLayerOverrideMap,
	LyrixaRenderMode,
	ParsedLyricsDocument,
	ParsedLyricsLine
} from './domain/types';
export type * from './domain/lyrixaBundleTypes';

// ── domain: the Lyrixa import contract ──────────────────────────────────────
export {
	parseLyrixaLyricsBundleEnvelope,
	hasRenderableLyrixaBundle,
	resolveLyrixaBundleActiveLines,
	resolveLyrixaBundlePreviewText,
	mergeLyrixaVisualStyle,
	translationLayerIds,
	hasTranslationLayer,
	translationLanguages
} from './domain/lyrixaBundle';

// ── domain: plain / LRC text ────────────────────────────────────────────────
export {
	hasLrcTimestamps,
	normalizePlainLyricsLines,
	resolveLyricsDocument,
	findActiveLyricsLineIndex,
	formatLrcTimestamp
} from './domain/parser';
export { getCachedLyricsDocument } from './domain/cache';

// ── domain: colour modes (shared by renderer and editor) ────────────────────
export {
	resolveLyricsColorMode,
	resolveLyricsColorSource,
	isMultiColorLyricsMode,
	resolveLyricsColorSlot,
	resolveLyricsColorStops,
	resolveLyricsColorStopOffsets,
	createLyricsHorizontalPaint,
	isRotatingLyricsMode,
	resolveLyricsRotationStep,
	rotationStepToPhase,
	LYRICS_ROTATION_STEPS
} from './domain/lyricsColorModes';
export type {
	LyricsColorSlot,
	LyricsPalettes,
	ResolvedLyricsColorSlot
} from './domain/lyricsColorModes';

// ── runtime: the canvas draw path ───────────────────────────────────────────
export {
	drawLyricsOverlay,
	resolveBackdropAnimation
} from './runtime/LyricsOverlay';
export type { LyricsAnimationSample } from './runtime/LyricsOverlay';
export { drawLyrixaLyricsBundle } from './runtime/lyrixaBundleRenderer';
