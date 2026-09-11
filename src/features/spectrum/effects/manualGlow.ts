import {
	createWaveGradient,
	getColor,
	normalizeSpectrumPhase
} from '../color/spectrumColor';
import type { SpectrumColorInput } from '../color/spectrumColor';
import type { SpectrumLinearOrientation } from '@/types/wallpaper';
import type { SpectrumSettings } from '../runtime/spectrumRuntime';

export type ResolvedManualGlow = {
	/** shadowColor for the solid core pass. */
	core: string;
	/** color for the outer halo pass. */
	halo: string;
	/** peak-marker color override, or null to keep the default white. */
	peak: string | null;
};

/**
 * Resolves glow colors for the classic bar/wave families: off, glow follows the
 * fill (`fallbackColor`); on, it uses its own palette, with `spectrumGlowColorMode`
 * picking the combination and `spectrumManualGlowMode` the core/halo/peaks layout.
 */
export function resolveManualGlow(
	settings: SpectrumSettings,
	t: number,
	fallbackColor: string
): ResolvedManualGlow {
	if (!settings.spectrumManualGlow) {
		return { core: fallbackColor, halo: fallbackColor, peak: null };
	}
	const glowView = glowColorView(settings);
	const primary = glowView.spectrumPrimaryColor;
	const isSolid = glowView.spectrumColorMode === 'solid';
	// `solid` means exactly one color: every layout renders monochrome.
	const secondary = isSolid ? primary : glowView.spectrumSecondaryColor;
	// Non-solid modes resolve per position — that is what makes gradient /
	// rainbow / rotate read as a sweep along the figure.
	const colorAt = (phase: number) => getColor(glowView, phase);

	if (settings.spectrumManualGlowMode === 'gradient') {
		const color = isSolid ? primary : colorAt(t);
		return { core: color, halo: color, peak: null };
	}
	if (settings.spectrumManualGlowMode === 'peaks') {
		const color = isSolid ? primary : colorAt(t);
		return { core: color, halo: color, peak: secondary };
	}
	// core-halo: two tones. Solid stays monochrome; sweeping modes nudge the
	// halo along the phase so it reads as a second tone.
	return {
		core: isSolid ? primary : colorAt(t),
		halo: isSolid
			? primary
			: colorAt(normalizeSpectrumPhase(t) + GLOW_HALO_PHASE_OFFSET),
		peak: null
	};
}

/** How far the core-halo halo trails the core in the sweeping color modes. */
const GLOW_HALO_PHASE_OFFSET = 0.12;

/**
 * Reads spectrum settings as if the GLOW colors were the fill colors, so every
 * color helper (`getColor`, `createWaveGradient`, stop builders) can drive the
 * glow without a parallel implementation — and it supports the fill's modes.
 */
export function asGlowColorSettings(
	settings: SpectrumSettings
): SpectrumSettings {
	return { ...settings, ...glowColorView(settings) };
}

/**
 * The five colour fields, remapped to the glow's — without cloning the other
 * ~150. This is the per-bar path: never clone the full settings here.
 * `asGlowColorSettings` wraps it for the once-per-figure gradient builders.
 */
function glowColorView(settings: SpectrumSettings): SpectrumColorInput {
	return {
		spectrumMode: settings.spectrumMode,
		spectrumColorMode: settings.spectrumGlowColorMode,
		spectrumPrimaryColor:
			settings.spectrumGlowPrimaryColor ?? settings.spectrumPrimaryColor,
		spectrumSecondaryColor:
			settings.spectrumGlowSecondaryColor ??
			settings.spectrumSecondaryColor,
		spectrumRainbowColors:
			settings.spectrumGlowRainbowColors ?? settings.spectrumRainbowColors
	};
}

/** True when the glow paints a sweep (gradient / rainbow / rotate), not a flat color. */
export function glowUsesColorSweep(settings: SpectrumSettings): boolean {
	return (
		settings.spectrumManualGlow &&
		settings.spectrumGlowColorMode !== 'solid'
	);
}

/**
 * Canvas gradient for a sweeping glow: conic around the center in radial mode,
 * axis gradient in linear; a plain color string when solid, so callers can
 * assign the result straight to `strokeStyle`.
 */
export function createGlowGradient(
	ctx: CanvasRenderingContext2D,
	canvas: HTMLCanvasElement,
	settings: SpectrumSettings,
	orientation: SpectrumLinearOrientation | 'radial',
	cx?: number,
	cy?: number,
	radius?: number,
	angleOffset = 0
): CanvasGradient | string {
	return createWaveGradient(
		ctx,
		canvas,
		asGlowColorSettings(settings),
		orientation,
		cx,
		cy,
		radius,
		angleOffset
	);
}
