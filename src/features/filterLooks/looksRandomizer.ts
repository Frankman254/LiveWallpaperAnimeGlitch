/**
 * "Randomize look" generator. Produces a believable filter/glitch/cinematic
 * combination — values stay inside the real slider ranges and the screen never
 * goes invisible (brightness/contrast/opacity windows are deliberately tame).
 */

import {
	FILTER_RANGES,
	IMAGE_EFFECT_RANGES,
	SCANLINE_RANGES
} from '@/config/ranges';
import {
	randomChance,
	randomChoice,
	randomInRange,
	snapToRange
} from '@/lib/randomize';
import type { ScanlineMode, WallpaperState } from '@/types/wallpaper';

type LooksRandomPatch = Partial<
	Pick<
		WallpaperState,
		| 'filterOpacity'
		| 'filterBrightness'
		| 'filterContrast'
		| 'filterSaturation'
		| 'filterBlur'
		| 'filterHueRotate'
		| 'filterVignette'
		| 'filterBloom'
		| 'filterLumaThreshold'
		| 'filterLensWarp'
		| 'filterHeatDistortion'
		| 'rgbShift'
		| 'noiseIntensity'
		| 'scanlinesEnabled'
		| 'scanlineIntensity'
		| 'scanlineMode'
		| 'scanlineSpacing'
		| 'scanlineThickness'
		| 'activeFilterLookId'
	>
>;

const SCANLINE_MODES: ScanlineMode[] = ['always', 'pulse', 'burst', 'beat'];

export function generateRandomLooksProfile(): LooksRandomPatch {
	// Tone — kept near neutral so the wallpaper stays watchable. We bias toward
	// the readable middle of each range instead of the dark/blown-out extremes.
	const bloom = randomChance(0.55)
		? randomInRange(FILTER_RANGES.bloom, { min: 0.15, max: 0.9 })
		: 0;

	const scanlinesEnabled = randomChance(0.4);

	return {
		// Opacity stays high — a low filter opacity barely applies the look.
		filterOpacity: randomInRange(FILTER_RANGES.opacity, {
			min: 0.85,
			max: 1
		}),
		filterBrightness: randomInRange(FILTER_RANGES.brightness, {
			min: 0.85,
			max: 1.35
		}),
		filterContrast: randomInRange(FILTER_RANGES.contrast, {
			min: 0.9,
			max: 1.45
		}),
		filterSaturation: randomInRange(FILTER_RANGES.saturation, {
			min: 0.7,
			max: 1.9
		}),
		// Blur is mostly off — heavy blur makes the scene unusable. Occasional
		// light haze only.
		filterBlur: randomChance(0.3)
			? randomInRange(FILTER_RANGES.blur, { min: 0.5, max: 2.5 })
			: 0,
		filterHueRotate: randomInRange(FILTER_RANGES.hueRotate),
		filterVignette: randomChance(0.6)
			? randomInRange(FILTER_RANGES.vignette, { min: 0.1, max: 0.55 })
			: 0,
		filterBloom: bloom,
		// Bloom needs a luma threshold to have anything to lift; keep it 0 when
		// bloom is off so the slider pairing always makes sense.
		filterLumaThreshold:
			bloom > 0
				? randomInRange(FILTER_RANGES.lumaThreshold, {
						min: 0.3,
						max: 0.7
					})
				: 0,
		filterLensWarp: randomChance(0.25)
			? randomInRange(FILTER_RANGES.lensWarp, { min: 0.03, max: 0.18 })
			: 0,
		filterHeatDistortion: randomChance(0.25)
			? randomInRange(FILTER_RANGES.heatDistortion, {
					min: 0.05,
					max: 0.35
				})
			: 0,
		// Glitch — subtle by default so text/logos stay legible.
		rgbShift: randomChance(0.5)
			? randomInRange(IMAGE_EFFECT_RANGES.rgbShift, {
					min: 0.002,
					max: 0.014
				})
			: 0,
		noiseIntensity: randomChance(0.4)
			? randomInRange(IMAGE_EFFECT_RANGES.noiseIntensity, {
					min: 0.03,
					max: 0.22
				})
			: 0,
		scanlinesEnabled,
		scanlineIntensity: scanlinesEnabled
			? randomInRange(SCANLINE_RANGES.intensity, { min: 0.15, max: 0.5 })
			: 0,
		scanlineMode: randomChoice(SCANLINE_MODES),
		scanlineSpacing: snapToRange(
			randomInRange(SCANLINE_RANGES.spacing, { min: 300, max: 900 }),
			SCANLINE_RANGES.spacing
		),
		scanlineThickness: randomInRange(SCANLINE_RANGES.thickness, {
			min: 0.5,
			max: 2.5
		}),
		// This is a hand-rolled combination, not one of the named look packs.
		activeFilterLookId: null
	};
}
