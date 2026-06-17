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
 * as before. When on, the fill keeps its color-source color but the glow uses
 * the two raw manual colors (carried as `spectrumGlowPrimary/SecondaryColor`,
 * independent of `spectrumColorSource`), split per the selected mode.
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
	const secondary =
		settings.spectrumGlowSecondaryColor ?? settings.spectrumSecondaryColor;
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
