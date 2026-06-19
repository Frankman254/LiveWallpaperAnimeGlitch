import { describe, expect, it } from 'vitest';
import {
	computePixelateSmallSize,
	isPixelatePostProcessActive,
	normalizePixelateScale,
	quantizePixelBarCells,
	resolveClassicRadialShapeFallback
} from './pixelArtHelpers';

describe('pixelArtHelpers', () => {
	it('normalizes pixelate scale', () => {
		expect(normalizePixelateScale(4.6)).toBe(5);
		expect(normalizePixelateScale(undefined)).toBe(1);
	});

	it('detects active pixelate post-process', () => {
		expect(
			isPixelatePostProcessActive({
				spectrumPixelate: true,
				spectrumPixelateScale: 4
			})
		).toBe(true);
		expect(
			isPixelatePostProcessActive({
				spectrumPixelate: false,
				spectrumPixelateScale: 8
			})
		).toBe(false);
		expect(
			isPixelatePostProcessActive({
				spectrumPixelate: true,
				spectrumPixelateScale: 1
			})
		).toBe(false);
	});

	it('computes offscreen downsample dimensions', () => {
		expect(computePixelateSmallSize(1920, 1080, 4)).toEqual({
			width: 480,
			height: 270
		});
	});

	it('falls back pixel shape to bars in radial mode', () => {
		expect(resolveClassicRadialShapeFallback('pixel')).toBe('bars');
		expect(resolveClassicRadialShapeFallback('wave')).toBe('wave');
	});

	it('quantizes LED cell count with safety cap', () => {
		expect(quantizePixelBarCells(120, 10)).toBe(12);
		expect(quantizePixelBarCells(5000, 10, 256)).toBe(256);
	});
});
