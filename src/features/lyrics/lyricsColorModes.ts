import {
	completeRotatePalette,
	DEFAULT_BACKGROUND_PALETTE,
	DEFAULT_RAINBOW_PALETTE,
	resolveModeDrivenColors
} from '@/lib/backgroundPalette';
import { getRotateRgbPhase } from '@/features/spectrum/color/spectrumColor';
import type { BackgroundPalette } from '@/lib/backgroundPalette';
import type { ColorSourceMode } from '@/types/wallpaper';
import type { LyricsLayerColorMode } from './types';

/**
 * Solid / gradient / rainbow paints for a lyric layer's fill, stroke and glow.
 *
 * Spectrum owns both the rainbow palette (`DEFAULT_RAINBOW_PALETTE`, the list
 * `addGradientStops()` lays down for its `rainbow` mode) and the manual /
 * image / theme source resolution (`resolveModeDrivenColors`). This module
 * reuses both instead of inventing parallel ones, and mirrors Spectrum's stop
 * distribution so a rainbow lyric line reads like a rainbow bar.
 *
 * `visible-rotate` is Spectrum's animated mode and is driven by the SAME clock
 * (`getRotateRgbPhase`). It is expressed as a static rainbow paint plus a
 * `hue-rotate()` filter applied at draw time rather than as time-varying color
 * stops: the lyrics line renderer bakes each styled line into an offscreen
 * canvas, so a paint that changed every frame would invalidate that cache on
 * every frame (and re-run the halo blur with it). Rotating the hue of the
 * already-cached pixels gives the same cycling rainbow for free.
 */

export type LyricsColorSlot = {
	source?: ColorSourceMode;
	mode?: LyricsLayerColorMode;
	/** Manual first stop; also the solid color and the legacy single value. */
	primary: string;
	/** Manual second stop. */
	secondary?: string;
};

/** Palettes the image/theme sources sample from. */
export type LyricsPalettes = {
	background: BackgroundPalette;
	theme: BackgroundPalette;
};

export type ResolvedLyricsColorSlot = {
	mode: LyricsLayerColorMode;
	primary: string;
	secondary: string;
	rainbow: string[];
};

/** Legacy configs carry no mode at all — they must behave as solid. */
export function resolveLyricsColorMode(
	mode: LyricsLayerColorMode | undefined
): LyricsLayerColorMode {
	return mode === 'gradient' ||
		mode === 'rainbow' ||
		mode === 'visible-rotate' ||
		mode === 'complete-rotate'
		? mode
		: 'solid';
}

/** Legacy configs carry no source either — manual is the historical behaviour. */
export function resolveLyricsColorSource(
	source: ColorSourceMode | undefined
): ColorSourceMode {
	return source === 'image' || source === 'theme' ? source : 'manual';
}

/** True when the paint cannot be expressed as a plain CSS color string. */
export function isMultiColorLyricsMode(
	mode: LyricsLayerColorMode | undefined
): boolean {
	return resolveLyricsColorMode(mode) !== 'solid';
}

/**
 * Collapses a slot + the live palettes into the concrete colors to paint with.
 *
 * With `image` / `theme` the two gradient stops and the rainbow palette all come
 * from the wallpaper (or editor theme) palette, exactly as Spectrum resolves
 * its own — so a lyric line can follow the artwork the same way a bar does.
 */
export function resolveLyricsColorSlot(
	slot: LyricsColorSlot,
	palettes?: LyricsPalettes
): ResolvedLyricsColorSlot {
	const mode = resolveLyricsColorMode(slot.mode);
	const source = resolveLyricsColorSource(slot.source);
	const background = palettes?.background ?? DEFAULT_BACKGROUND_PALETTE;
	const theme = palettes?.theme ?? DEFAULT_BACKGROUND_PALETTE;
	const resolved = resolveModeDrivenColors(
		source,
		slot.primary,
		// A gradient whose second stop was never set would otherwise collapse
		// into a solid; the panel seeds it, this keeps the renderer honest for
		// configs that predate the seeding.
		slot.secondary ?? slot.primary,
		background,
		theme
	);
	return {
		mode,
		primary: resolved.primaryColor,
		secondary: resolved.secondaryColor,
		rainbow:
			resolved.rainbowColors.length > 0
				? resolved.rainbowColors
				: [...DEFAULT_RAINBOW_PALETTE]
	};
}

/**
 * Ordered color stops for a resolved slot. Solid yields a single entry,
 * gradient two, rainbow the whole palette.
 */
export function resolveLyricsColorStops(
	resolved: ResolvedLyricsColorSlot
): string[] {
	// `complete-rotate` adds the achromatic extremes so the sweep also passes
	// through pure black and pure white.
	if (resolved.mode === 'complete-rotate') {
		return completeRotatePalette(resolved.rainbow);
	}
	// Rotate paints the same palette; only the hue-rotate filter differs.
	if (resolved.mode === 'rainbow' || resolved.mode === 'visible-rotate') {
		return [...resolved.rainbow];
	}
	if (resolved.mode === 'gradient') {
		return [resolved.primary, resolved.secondary];
	}
	return [resolved.primary];
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
 * A `fillStyle` / `strokeStyle`-ready paint spanning `left`..`right`.
 *
 * Solid returns the plain color string so the existing (cheaper, and
 * pixel-identical) code path is untouched.
 */
export function createLyricsHorizontalPaint(
	ctx: CanvasRenderingContext2D,
	resolved: ResolvedLyricsColorSlot,
	left: number,
	right: number
): string | CanvasGradient {
	const stops = resolveLyricsColorStops(resolved);
	if (stops.length <= 1) return stops[0] ?? resolved.primary;
	// A zero-width run would make createLinearGradient degenerate; a solid
	// first stop is the honest fallback.
	if (!(right > left)) return stops[0]!;
	const gradient = ctx.createLinearGradient(left, 0, right, 0);
	for (const [offset, color] of resolveLyricsColorStopOffsets(stops)) {
		gradient.addColorStop(offset, color);
	}
	return gradient;
}

/**
 * CSS filter that animates a `visible-rotate` slot, or `null` for every static
 * mode. Applied when the paint is DRAWN (not when it is built), which is what
 * keeps the cached line canvases valid across frames.
 *
 * Caveat: fill and border share one cached canvas in the native renderer, so a
 * rotating fill also rotates a saturated border's hue (an achromatic border —
 * black, white, grey — is unaffected). The glow has its own canvas and rotates
 * independently.
 */
export function resolveLyricsRotateFilter(
	resolved: ResolvedLyricsColorSlot
): string | null {
	if (
		resolved.mode !== 'visible-rotate' &&
		resolved.mode !== 'complete-rotate'
	) {
		return null;
	}
	return `hue-rotate(${(getRotateRgbPhase() * 360).toFixed(1)}deg)`;
}

/** Composes an optional rotate filter with an optional blur, for `ctx.filter`. */
export function composeLyricsFilter(
	...parts: Array<string | null | undefined>
): string {
	const active = parts.filter((part): part is string => Boolean(part));
	return active.length > 0 ? active.join(' ') : 'none';
}

/**
 * Stable identity of a resolved slot, for the offscreen line-render cache: the
 * paint is baked into the cached canvas, so anything that changes it must
 * change the key.
 */
export function lyricsColorSlotCacheKey(
	resolved: ResolvedLyricsColorSlot
): string {
	return resolveLyricsColorStops(resolved).join(',');
}
