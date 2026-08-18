import { describe, it, expect } from 'vitest';
import { hexToHsl, hslToHex, hueDistance, makeReadable } from './colorMath';
import { deriveEnergy, heuristicIntent } from './heuristicIntent';
import { compileIntent } from './compileIntent';
import { parseSceneIntent } from './sceneIntent';
import type { ImageSignature } from '../analysis/imageSignature';

function signature(partial: Partial<ImageSignature> = {}): ImageSignature {
	return {
		palette: [{ hex: '#3366cc', weight: 1 }],
		luma: 0.5,
		saturation: 0.5,
		contrast: 0.5,
		edgeDensity: 0.5,
		colorCount: 500,
		isPixelArt: false,
		aspect: 16 / 9,
		version: 1,
		...partial
	};
}

describe('colorMath', () => {
	it('round-trips hex through HSL', () => {
		for (const hex of [
			'#ff0000',
			'#00ff00',
			'#0000ff',
			'#808080',
			'#123456'
		]) {
			expect(hslToHex(hexToHsl(hex))).toBe(hex);
		}
	});

	it('measures hue distance as the shortest arc', () => {
		expect(hueDistance(10, 350)).toBe(20);
		expect(hueDistance(0, 180)).toBe(180);
		expect(hueDistance(90, 90)).toBe(0);
	});

	it('lifts near-black and near-white into a readable band', () => {
		// A spectrum tinted with an image's own near-black is invisible against
		// that same image — this clamp is what prevents that.
		//
		// The band holds only up to 8-bit quantization: hslToHex rounds each
		// channel, which can pull the round-tripped lightness ~0.5/255 below the
		// requested bound. That is inherent to storing colours as hex, so the
		// assertion carries the same tolerance.
		const QUANTIZATION = 1 / 255;
		for (const hex of ['#000000', '#050505', '#ffffff', '#fdfdfd']) {
			const { l } = hexToHsl(makeReadable(hex));
			expect(l).toBeGreaterThanOrEqual(0.45 - QUANTIZATION);
			expect(l).toBeLessThanOrEqual(0.7 + QUANTIZATION);
		}
	});

	it('gives a flat grey some saturation so it renders as a colour', () => {
		expect(hexToHsl(makeReadable('#777777')).s).toBeGreaterThanOrEqual(
			0.45
		);
	});

	it('preserves the hue it was given', () => {
		const hue = hexToHsl('#2b7fd4').h;
		expect(
			hueDistance(hexToHsl(makeReadable('#2b7fd4')).h, hue)
		).toBeLessThan(2);
	});
});

describe('deriveEnergy', () => {
	it('ranks a calm frame below a loud one', () => {
		const calm = deriveEnergy(
			signature({ saturation: 0.1, contrast: 0.1, edgeDensity: 0.05 })
		);
		const loud = deriveEnergy(
			signature({ saturation: 0.95, contrast: 0.9, edgeDensity: 0.85 })
		);
		expect(calm).toBeLessThan(0.2);
		expect(loud).toBeGreaterThan(0.8);
		expect(calm).toBeLessThan(loud);
	});

	it('stays inside 0..1 for extreme signatures', () => {
		expect(
			deriveEnergy(
				signature({ saturation: 1, contrast: 1, edgeDensity: 1 })
			)
		).toBeLessThanOrEqual(1);
		expect(
			deriveEnergy(
				signature({ saturation: 0, contrast: 0, edgeDensity: 0 })
			)
		).toBeGreaterThanOrEqual(0);
	});
});

describe('heuristicIntent', () => {
	it('always produces an intent that survives its own validator', () => {
		const cases = [
			signature(),
			signature({ palette: [] }),
			signature({ saturation: 0, luma: 0, contrast: 0, edgeDensity: 0 }),
			signature({ saturation: 1, luma: 1, contrast: 1, edgeDensity: 1 }),
			signature({ isPixelArt: true, colorCount: 6 })
		];
		for (const sig of cases) {
			const intent = heuristicIntent(sig);
			const { rejected } = parseSceneIntent(intent);
			expect(rejected).toEqual([]);
			// And it must compile without blowing a range.
			expect(() => compileIntent(intent)).not.toThrow();
		}
	});

	it('is deterministic', () => {
		const sig = signature({ saturation: 0.7, contrast: 0.3 });
		expect(heuristicIntent(sig)).toEqual(heuristicIntent(sig));
	});

	it('picks the retro grid for pixel art and a CRT look', () => {
		const intent = heuristicIntent(
			signature({ isPixelArt: true, colorCount: 8 })
		);
		expect(intent.spectrumShape).toBe('pixel');
		expect(intent.looks).toBe('crt');
	});

	it('gives a calm image a smooth family and a loud one a hard one', () => {
		const calm = heuristicIntent(
			signature({ saturation: 0.05, contrast: 0.1, edgeDensity: 0.05 })
		);
		const loud = heuristicIntent(
			signature({ saturation: 1, contrast: 0.95, edgeDensity: 0.9 })
		);
		expect(calm.spectrumFamily).toBe('liquid');
		expect(calm.spectrumShape).toBe('wave');
		expect(calm.lights).toBe('off');
		expect(loud.spectrumShape).toBe('blocks');
		expect(loud.lights).toBe('concert');
	});

	it('separates the palette hues even from a one-colour image', () => {
		// A two-tone sprite must not yield three identical colours, or the
		// gradient and accent do nothing.
		const intent = heuristicIntent(
			signature({
				palette: [{ hex: '#cc3344', weight: 1 }],
				saturation: 0.6
			})
		);
		const hues = [
			hexToHsl(intent.palette.primary).h,
			hexToHsl(intent.palette.secondary).h,
			hexToHsl(intent.palette.accent).h
		];
		expect(hueDistance(hues[0], hues[1])).toBeGreaterThan(20);
		expect(hueDistance(hues[0], hues[2])).toBeGreaterThan(20);
	});

	it('builds a triad from a monochrome source instead of three greys', () => {
		const intent = heuristicIntent(
			signature({
				palette: [
					{ hex: '#222222', weight: 0.7 },
					{ hex: '#888888', weight: 0.3 }
				],
				saturation: 0.02
			})
		);
		const hues = [
			hexToHsl(intent.palette.primary).h,
			hexToHsl(intent.palette.secondary).h,
			hexToHsl(intent.palette.accent).h
		];
		expect(hueDistance(hues[0], hues[1])).toBeGreaterThan(60);
		expect(hueDistance(hues[0], hues[2])).toBeGreaterThan(30);
	});

	it('prefers a vivid minority colour over a muddy dominant one', () => {
		// The classic anime frame: mostly dark background, one neon accent.
		const intent = heuristicIntent(
			signature({
				palette: [
					{ hex: '#141414', weight: 0.85 },
					{ hex: '#ff2fd0', weight: 0.15 }
				],
				saturation: 0.4
			})
		);
		expect(
			hueDistance(
				hexToHsl(intent.palette.primary).h,
				hexToHsl('#ff2fd0').h
			)
		).toBeLessThan(20);
	});
});
