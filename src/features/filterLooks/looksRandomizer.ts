import { randomChoice, randomFloat } from '@/lib/randomize';
import type { WallpaperState } from '@/types/wallpaper';
import { FILTER_LOOK_PRESETS, type FilterLookSettings } from './filterLooks';

type LooksRandomPatch = FilterLookSettings &
	Pick<WallpaperState, 'activeFilterLookId'>;

function mix(a: number, b: number, amount: number): number {
	return Number((a + (b - a) * amount).toFixed(4));
}

/**
 * Produces a coherent variation by crossfading two curated factory looks.
 * Categorical and envelope values come from a real preset as one unit, so a
 * roll cannot create the disconnected combinations the old raw-value generator
 * produced.
 */
export function generateRandomLooksProfile(): LooksRandomPatch {
	const first = randomChoice(FILTER_LOOK_PRESETS);
	const alternatives = FILTER_LOOK_PRESETS.filter(
		preset => preset.id !== first.id
	);
	const second = randomChoice(alternatives);
	const amount = randomFloat(0.28, 0.72);
	const audio = randomChoice([first.settings, second.settings]);
	const scanlines = randomChoice([first.settings, second.settings]);

	return {
		filterOpacity: mix(
			first.settings.filterOpacity,
			second.settings.filterOpacity,
			amount
		),
		filterBrightness: mix(
			first.settings.filterBrightness,
			second.settings.filterBrightness,
			amount
		),
		filterContrast: mix(
			first.settings.filterContrast,
			second.settings.filterContrast,
			amount
		),
		filterSaturation: mix(
			first.settings.filterSaturation,
			second.settings.filterSaturation,
			amount
		),
		filterBlur: mix(
			first.settings.filterBlur,
			second.settings.filterBlur,
			amount
		),
		filterHueRotate: randomChoice([
			first.settings.filterHueRotate,
			second.settings.filterHueRotate
		]),
		filterVignette: mix(
			first.settings.filterVignette,
			second.settings.filterVignette,
			amount
		),
		filterBloom: mix(
			first.settings.filterBloom,
			second.settings.filterBloom,
			amount
		),
		filterLumaThreshold: mix(
			first.settings.filterLumaThreshold,
			second.settings.filterLumaThreshold,
			amount
		),
		filterLensWarp: mix(
			first.settings.filterLensWarp,
			second.settings.filterLensWarp,
			amount
		),
		filterHeatDistortion: mix(
			first.settings.filterHeatDistortion,
			second.settings.filterHeatDistortion,
			amount
		),
		rgbShift: mix(
			first.settings.rgbShift,
			second.settings.rgbShift,
			amount
		),
		rgbShiftAudioReactive: audio.rgbShiftAudioReactive,
		rgbShiftAudioSensitivity: audio.rgbShiftAudioSensitivity,
		rgbShiftAudioChannel: audio.rgbShiftAudioChannel,
		rgbShiftAudioSmoothing: audio.rgbShiftAudioSmoothing,
		rgbShiftAudioAttack: audio.rgbShiftAudioAttack,
		rgbShiftAudioRelease: audio.rgbShiftAudioRelease,
		rgbShiftAudioReactivitySpeed: audio.rgbShiftAudioReactivitySpeed,
		rgbShiftAudioPeakWindow: audio.rgbShiftAudioPeakWindow,
		rgbShiftAudioPeakFloor: audio.rgbShiftAudioPeakFloor,
		rgbShiftAudioPunch: audio.rgbShiftAudioPunch,
		noiseIntensity: mix(
			first.settings.noiseIntensity,
			second.settings.noiseIntensity,
			amount
		),
		scanlinesEnabled: scanlines.scanlinesEnabled,
		scanlineIntensity: scanlines.scanlineIntensity,
		scanlineMode: scanlines.scanlineMode,
		scanlineSpacing: scanlines.scanlineSpacing,
		scanlineThickness: scanlines.scanlineThickness,
		activeFilterLookId: null
	};
}
