import { mixHexColors, normalizeSpectrumPhase } from '../color/spectrumColor';
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
	const primary =
		settings.spectrumGlowPrimaryColor ?? settings.spectrumPrimaryColor;
	// `solid` collapses to a single color so every layout renders monochrome.
	const secondary =
		settings.spectrumGlowColorMode === 'solid'
			? primary
			: (settings.spectrumGlowSecondaryColor ??
				settings.spectrumSecondaryColor);
	if (settings.spectrumManualGlowMode === 'gradient') {
		const mixed = mixHexColors(
			primary,
			secondary,
			normalizeSpectrumPhase(t)
		);
		return { core: mixed, halo: mixed, peak: null };
	}
	if (settings.spectrumManualGlowMode === 'peaks') {
		return { core: primary, halo: primary, peak: secondary };
	}
	return { core: primary, halo: secondary, peak: null };
}
