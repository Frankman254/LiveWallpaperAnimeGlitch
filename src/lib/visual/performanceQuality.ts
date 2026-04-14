import type { PerformanceMode, SpectrumFamily } from '@/types/wallpaper';

/**
 * Coarse quality bucket for spectrum draw + image postprocess.
 * Used to scale shadows, bloom, and buffer history without changing user-facing sliders.
 */
export type VisualQualityTier = 'full' | 'reduced' | 'minimal';

const HEAVY_SPECTRUM_FAMILIES: ReadonlySet<SpectrumFamily> = new Set([
	'tunnel',
	'liquid',
	'orbital',
	'spectrogram'
]);

/**
 * Combines global performance mode with spectrum family cost.
 */
export function resolveSpectrumRenderQuality(
	performanceMode: PerformanceMode,
	spectrumFamily: SpectrumFamily
): VisualQualityTier {
	if (performanceMode === 'low') {
		return HEAVY_SPECTRUM_FAMILIES.has(spectrumFamily) ||
			spectrumFamily === 'oscilloscope'
			? 'minimal'
			: 'reduced';
	}
	if (performanceMode === 'medium') {
		return HEAVY_SPECTRUM_FAMILIES.has(spectrumFamily) ? 'reduced' : 'full';
	}
	return 'full';
}

export function resolveImagePostProcessQuality(
	performanceMode: PerformanceMode
): VisualQualityTier {
	if (performanceMode === 'low') return 'minimal';
	if (performanceMode === 'medium') return 'reduced';
	return 'full';
}

export function spectrumShadowBlurScale(tier: VisualQualityTier): number {
	switch (tier) {
		case 'minimal':
			return 0.32;
		case 'reduced':
			return 0.58;
		default:
			return 1;
	}
}

export function spectrumEnergyBloomScale(tier: VisualQualityTier): number {
	switch (tier) {
		case 'minimal':
			return 0;
		case 'reduced':
			return 0.48;
		default:
			return 1;
	}
}

/** Multiplier for peak-ribbon alpha / shadow (0 = skip ribbons). */
export function spectrumPeakRibbonScale(tier: VisualQualityTier): number {
	switch (tier) {
		case 'minimal':
			return 0;
		case 'reduced':
			return 0.52;
		default:
			return 1;
	}
}

/**
 * Static GPU-ish cost hint for diagnostics (not measured at runtime).
 */
export function getSpectrumFamilyGpuCostHint(
	family: SpectrumFamily
): 'low' | 'medium' | 'high' {
	switch (family) {
		case 'classic':
			return 'low';
		case 'oscilloscope':
			return 'low';
		case 'orbital':
			return 'medium';
		case 'liquid':
		case 'spectrogram':
		case 'tunnel':
			return 'high';
		default:
			return 'medium';
	}
}

export function historyDepthCapForTier(tier: VisualQualityTier): number {
	switch (tier) {
		case 'minimal':
			return 2;
		case 'reduced':
			return 3;
		default:
			return 8;
	}
}
