import {
	completeRotatePalette,
	DEFAULT_BACKGROUND_PALETTE,
	DEFAULT_RAINBOW_PALETTE,
	resolveModeDrivenColors
} from '@/lib/backgroundPalette';
import {
	getRotateRgbPhase,
	sampleWrappedPaletteColor
} from '@/features/spectrum/color/spectrumColor';
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
 * `visible-rotate` and `complete-rotate` are the animated modes, driven by the
 * SAME clock as Spectrum (`getRotateRgbPhase`). They shift the palette along
 * the paint, exactly like `addGradientStops` does for Spectrum, so black and
 * white bands physically travel across the text rather than sitting still.
 *
 * The phase is QUANTIZED (`resolveLyricsRotationStep`) because the lyrics line
 * renderer bakes each styled line into an offscreen canvas: a continuously
 * varying paint would re-bake every line on every frame. Stepping it lets the
 * renderer re-bake only when the step actually changes.
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
	right: number,
	/** 0..1 shift of the palette along the run; drives the rotating modes. */
	phase = 0
): string | CanvasGradient {
	const stops = resolveLyricsColorStops(resolved);
	if (stops.length <= 1) return stops[0] ?? resolved.primary;
	// A zero-width run would make createLinearGradient degenerate; a solid
	// first stop is the honest fallback.
	if (!(right > left)) return stops[0]!;
	const gradient = ctx.createLinearGradient(left, 0, right, 0);
	if (phase !== 0) {
		// Wrapped sampling, same as Spectrum's rotate: the whole palette slides
		// along the run and rejoins itself at the ends.
		const steps = Math.max(6, stops.length * 2);
		for (let index = 0; index <= steps; index += 1) {
			const stop = index / steps;
			gradient.addColorStop(
				stop,
				sampleWrappedPaletteColor(stops, stop + phase)
			);
		}
		return gradient;
	}
	for (const [offset, color] of resolveLyricsColorStopOffsets(stops)) {
		gradient.addColorStop(offset, color);
	}
	return gradient;
}

/** True for the modes whose paint moves over time. */
export function isRotatingLyricsMode(
	mode: LyricsLayerColorMode | undefined
): boolean {
	const resolved = resolveLyricsColorMode(mode);
	return resolved === 'visible-rotate' || resolved === 'complete-rotate';
}

/**
 * Number of distinct phases a rotation is quantized into. Each step re-bakes
 * the affected cached lines, so this trades animation smoothness against how
 * often that happens; 24 steps over the 4.8s cycle is one re-bake every 200ms.
 */
export const LYRICS_ROTATION_STEPS = 24;

/**
 * Current quantized rotation step, or `null` when the slot does not animate.
 * Feeding this into the cache lets a rotating line re-bake ~5 times a second
 * instead of 60.
 */
export function resolveLyricsRotationStep(
	resolved: ResolvedLyricsColorSlot
): number | null {
	if (!isRotatingLyricsMode(resolved.mode)) return null;
	return Math.floor(getRotateRgbPhase() * LYRICS_ROTATION_STEPS);
}

/** Step index back to the 0..1 phase the paint should be built at. */
export function rotationStepToPhase(step: number | null): number {
	return step === null
		? 0
		: (step % LYRICS_ROTATION_STEPS) / LYRICS_ROTATION_STEPS;
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

/** Every mode a lyrics color slot offers, in the order the UI shows them. */
export const LYRICS_COLOR_MODES: LyricsLayerColorMode[] = [
	'solid',
	'gradient',
	'rainbow',
	'visible-rotate',
	'complete-rotate'
];

/** Same wording Spectrum uses for the animated modes. */
export function lyricsColorModeLabel(mode: LyricsLayerColorMode): string {
	if (mode === 'visible-rotate') return 'Rotate RGB';
	if (mode === 'complete-rotate') return 'Complete RGB';
	return mode[0]!.toUpperCase() + mode.slice(1);
}

/**
 * Second stop seeded when a slot is switched to Gradient. Without it the stored
 * value stays undefined (or equal to the primary) while the picker *displays* a
 * fallback, so the gradient silently collapses into a solid.
 */
export function seedSecondaryColor(primary: string): string {
	return primary.toLowerCase() === '#ffffff' ? '#000000' : '#ffffff';
}
