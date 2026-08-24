import { DEFAULT_RAINBOW_PALETTE } from '@/lib/backgroundPalette';
import type { LyricsLayerColorMode } from './types';

/**
 * Solid / gradient / rainbow paints for lyric layers.
 *
 * Spectrum owns the rainbow palette (`DEFAULT_RAINBOW_PALETTE`, the same list
 * `addGradientStops()` lays down for its `rainbow` mode) — this module reuses
 * it instead of inventing a second one, and mirrors Spectrum's stop
 * distribution so a rainbow line reads like a rainbow bar.
 *
 * Spectrum's *animated* mode is `visible-rotate`, which lyrics do not expose:
 * the static `rainbow` mode is the one being mirrored here, so nothing in this
 * module depends on time and every result is cacheable.
 *
 * Kept free of canvas state beyond `createLinearGradient` so the stop maths
 * can be unit-tested without a real 2D context.
 */

export type LyricsColorPaintConfig = {
	mode?: LyricsLayerColorMode;
	/** First stop; also the solid color and the legacy single-color value. */
	primary: string;
	/** Second stop. Falls back to `primary` when a gradient has no second color yet. */
	secondary?: string;
};

/** Legacy configs carry no mode at all — they must behave as solid. */
export function resolveLyricsColorMode(
	mode: LyricsLayerColorMode | undefined
): LyricsLayerColorMode {
	return mode === 'gradient' || mode === 'rainbow' ? mode : 'solid';
}

/** True when the paint cannot be expressed as a plain CSS color string. */
export function isMultiColorLyricsMode(
	mode: LyricsLayerColorMode | undefined
): boolean {
	return resolveLyricsColorMode(mode) !== 'solid';
}

/**
 * Ordered color stops for a config. Solid yields a single entry, gradient two,
 * rainbow the shared Spectrum palette.
 */
export function resolveLyricsColorStops(
	config: LyricsColorPaintConfig
): string[] {
	const mode = resolveLyricsColorMode(config.mode);
	if (mode === 'rainbow') return [...DEFAULT_RAINBOW_PALETTE];
	if (mode === 'gradient') {
		return [config.primary, config.secondary ?? config.primary];
	}
	return [config.primary];
}

/**
 * Positions each stop evenly across 0..1, the same distribution Spectrum uses
 * for its rainbow gradient.
 */
export function resolveLyricsColorStopOffsets(
	stops: string[]
): Array<[number, string]> {
	if (stops.length <= 1) {
		return [[0, stops[0] ?? '#ffffff']];
	}
	return stops.map(
		(color, index) =>
			[index / (stops.length - 1), color] as [number, string]
	);
}

/**
 * A `fillStyle`-ready paint spanning `left`..`right` horizontally.
 *
 * Solid returns the plain color string so the existing (cheaper, and
 * pixel-identical) code path is untouched.
 */
export function createLyricsHorizontalPaint(
	ctx: CanvasRenderingContext2D,
	config: LyricsColorPaintConfig,
	left: number,
	right: number
): string | CanvasGradient {
	const stops = resolveLyricsColorStops(config);
	if (stops.length <= 1) return stops[0] ?? config.primary;
	// A zero-width run would make createLinearGradient degenerate; a solid
	// first stop is the honest fallback.
	if (!(right > left)) return stops[0]!;
	const gradient = ctx.createLinearGradient(left, 0, right, 0);
	for (const [offset, color] of resolveLyricsColorStopOffsets(stops)) {
		gradient.addColorStop(offset, color);
	}
	return gradient;
}
