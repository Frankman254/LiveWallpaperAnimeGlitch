import { describe, it, expect } from 'vitest';
import type { WallpaperState } from '@/types/wallpaper';
import { isLayerFilterInert } from '@/features/audioLayers/render/audioLayerFrameRenderer';

/** Every dial at the value that means "do nothing". */
const IDENTITY = {
	filterOpacity: 1,
	filterBrightness: 1,
	filterContrast: 1,
	filterSaturation: 1,
	filterBlur: 0,
	filterHueRotate: 0,
	rgbShift: 0,
	noiseIntensity: 0
} as unknown as WallpaperState;

const inert = (over: Partial<WallpaperState> = {}, scanline = 0) =>
	isLayerFilterInert({ ...IDENTITY, ...over } as WallpaperState, scanline);

describe('isLayerFilterInert', () => {
	it('skips the offscreen round-trip when nothing would change', () => {
		expect(inert()).toBe(true);
	});

	// A false positive here silently drops the user's Looks settings, so every
	// dial is checked on its own rather than trusting the combined expression.
	it.each([
		['filterOpacity', { filterOpacity: 0.5 }],
		['filterBrightness', { filterBrightness: 1.2 }],
		['filterContrast', { filterContrast: 0.8 }],
		['filterSaturation', { filterSaturation: 1.4 }],
		['filterBlur', { filterBlur: 2 }],
		['filterHueRotate', { filterHueRotate: 15 }],
		['rgbShift', { rgbShift: 0.01 }],
		['noiseIntensity', { noiseIntensity: 0.1 }]
	])('keeps the filter pass when %s is off identity', (_label, over) => {
		expect(inert(over as Partial<WallpaperState>)).toBe(false);
	});

	it('keeps the filter pass when scanlines are actually drawing', () => {
		expect(inert({}, 0.3)).toBe(false);
		expect(inert({}, 0)).toBe(true);
	});
});
