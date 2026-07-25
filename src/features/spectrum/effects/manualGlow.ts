import {
	createWaveGradient,
	getColor,
	normalizeSpectrumPhase
} from '../color/spectrumColor';
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
 * Resolves the glow colors for the classic bar/wave families. When
 * `spectrumManualGlow` is off, glow follows the fill (`fallbackColor`) exactly
 * as before. When on, the glow uses its own resolved colors
 * (`spectrumGlowPrimary/SecondaryColor`, already mode-driven by
 * `resolveMainSpectrumState`), decoupled from the fill. `spectrumGlowColorMode`
 * picks how the two colors combine (`solid` = single color) and
 * `spectrumManualGlowMode` picks the core/halo/peaks layout.
 */
export function resolveManualGlow(
	settings: SpectrumSettings,
	t: number,
	fallbackColor: string
): ResolvedManualGlow {
	if (!settings.spectrumManualGlow) {
		return { core: fallbackColor, halo: fallbackColor, peak: null };
	}
	const glowView = asGlowColorSettings(settings);
	const primary = glowView.spectrumPrimaryColor;
	const isSolid = glowView.spectrumColorMode === 'solid';
	// `solid` means exactly one color, so every layout renders monochrome —
	// the second color only exists in the sweeping modes.
	const secondary = isSolid ? primary : glowView.spectrumSecondaryColor;
	// Non-solid modes resolve per position, so a bar at t=0 and one at t=0.8
	// get different colors — that is what makes gradient / rainbow / rotate
	// read as a sweep along the figure instead of one flat mixed tone.
	const colorAt = (phase: number) => getColor(glowView, phase);

	if (settings.spectrumManualGlowMode === 'gradient') {
		const color = isSolid ? primary : colorAt(t);
		return { core: color, halo: color, peak: null };
	}
	if (settings.spectrumManualGlowMode === 'peaks') {
		const color = isSolid ? primary : colorAt(t);
		return { core: color, halo: color, peak: secondary };
	}
	// core-halo: two tones. Solid stays monochrome (historical behaviour); the
	// sweeping modes nudge the halo along the phase so it reads as a second
	// tone instead of duplicating the core.
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
 * Reads the spectrum settings as if the GLOW colors were the fill colors, so
 * every existing color helper (`getColor`, `createWaveGradient`, the gradient
 * stop builders) can drive the glow without a parallel implementation.
 *
 * This is what lets the glow support the same four color modes as the fill:
 * `gradient` used to collapse into a single mixed color — the exact thing a
 * user could already get by typing that color into `solid`.
 */
export function asGlowColorSettings(
	settings: SpectrumSettings
): SpectrumSettings {
	return {
		...settings,
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
	return settings.spectrumManualGlow && settings.spectrumGlowColorMode !== 'solid';
}

/**
 * Canvas gradient for a glow that sweeps along the figure: a conic gradient
 * around the center in radial mode (first color → second color all the way
 * around the contour) and an axis gradient in linear mode. Returns a plain
 * color string when the glow is solid, so callers can always assign the result
 * straight to `strokeStyle`.
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
