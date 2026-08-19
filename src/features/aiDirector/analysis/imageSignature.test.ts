import { describe, it, expect } from 'vitest';
import {
	computeImageSignature,
	IMAGE_SIGNATURE_VERSION
} from './imageSignature';

/** Build an RGBA buffer from a per-pixel colour function. */
function buffer(
	width: number,
	height: number,
	at: (x: number, y: number) => [number, number, number, number]
) {
	const pixels = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const [r, g, b, a] = at(x, y);
			const i = (y * width + x) * 4;
			pixels[i] = r;
			pixels[i + 1] = g;
			pixels[i + 2] = b;
			pixels[i + 3] = a;
		}
	}
	return { pixels, width, height };
}

const solid = (r: number, g: number, b: number, size = 16) =>
	buffer(size, size, () => [r, g, b, 255]);

describe('computeImageSignature', () => {
	it('is deterministic', () => {
		const source = buffer(16, 16, (x, y) => [x * 16, y * 16, 128, 255]);
		expect(computeImageSignature(source)).toEqual(
			computeImageSignature(source)
		);
	});

	it('returns a safe empty signature for degenerate input', () => {
		const empty = computeImageSignature({
			pixels: new Uint8ClampedArray(0),
			width: 0,
			height: 0
		});
		expect(empty.palette).toEqual([]);
		expect(empty.luma).toBe(0);
		expect(empty.aspect).toBe(1);
		expect(empty.version).toBe(IMAGE_SIGNATURE_VERSION);
	});

	it('reads luma from black through white', () => {
		expect(computeImageSignature(solid(0, 0, 0)).luma).toBeCloseTo(0, 5);
		expect(computeImageSignature(solid(255, 255, 255)).luma).toBeCloseTo(
			1,
			5
		);
		expect(computeImageSignature(solid(128, 128, 128)).luma).toBeCloseTo(
			0.5,
			1
		);
	});

	it('separates saturated from greyscale', () => {
		expect(computeImageSignature(solid(255, 0, 0)).saturation).toBeCloseTo(
			1,
			2
		);
		expect(
			computeImageSignature(solid(128, 128, 128)).saturation
		).toBeCloseTo(0, 5);
	});

	it('scores a flat image as zero contrast and a checkerboard as high', () => {
		const flat = computeImageSignature(solid(90, 90, 90));
		const checker = computeImageSignature(
			buffer(16, 16, (x, y) =>
				(x + y) % 2 === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255]
			)
		);
		expect(flat.contrast).toBeCloseTo(0, 5);
		expect(flat.edgeDensity).toBeCloseTo(0, 5);
		expect(checker.contrast).toBeGreaterThan(0.9);
		expect(checker.edgeDensity).toBeGreaterThan(0.9);
	});

	it('ranks a smooth gradient below a checkerboard on edge density', () => {
		const gradient = computeImageSignature(
			buffer(32, 32, x => [x * 8, x * 8, x * 8, 255])
		);
		const checker = computeImageSignature(
			buffer(32, 32, (x, y) =>
				(x + y) % 2 === 0 ? [0, 0, 0, 255] : [255, 255, 255, 255]
			)
		);
		expect(gradient.edgeDensity).toBeLessThan(checker.edgeDensity);
	});

	it('ignores transparent pixels', () => {
		// Half red, half fully transparent green. The green must not pull luma
		// or the palette — a transparent border is not part of the image.
		const half = buffer(16, 16, (_x, y) =>
			y < 8 ? [255, 0, 0, 255] : [0, 255, 0, 0]
		);
		const signature = computeImageSignature(half);
		expect(signature.palette).toHaveLength(1);
		expect(signature.palette[0].hex).toBe('#ff0000');
		expect(signature.palette[0].weight).toBeCloseTo(1, 5);
	});

	it('extracts dominant colours ordered by coverage', () => {
		// 3/4 blue, 1/4 orange.
		const source = buffer(16, 16, (_x, y) =>
			y < 12 ? [20, 40, 200, 255] : [230, 140, 30, 255]
		);
		const { palette } = computeImageSignature(source);
		expect(palette.length).toBeGreaterThanOrEqual(2);
		expect(palette[0].weight).toBeCloseTo(0.75, 1);
		expect(palette[1].weight).toBeCloseTo(0.25, 1);
		expect(palette[0].weight).toBeGreaterThan(palette[1].weight);
	});

	it('merges near-identical colours into one palette entry', () => {
		// Sixteen barely-distinguishable blues must not fill all five slots.
		const source = buffer(16, 16, (_x, y) => [20, 40, 200 + y, 255]);
		const { palette } = computeImageSignature(source);
		expect(palette).toHaveLength(1);
	});

	it('flags hard-edged, few-colour art as pixel art', () => {
		const sprite = computeImageSignature(
			buffer(32, 32, (x, y) =>
				(Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0
					? [240, 60, 90, 255]
					: [20, 30, 60, 255]
			)
		);
		expect(sprite.colorCount).toBeLessThanOrEqual(8);
		expect(sprite.isPixelArt).toBe(true);
	});

	it('does not flag dense two-colour noise as pixel art', () => {
		// Regression: a hard-edge *ratio* alone flags this (almost every
		// neighbour pair is an edge) even though it is the opposite of pixel
		// art. Real sprites have large flat blocks; noise has none.
		const noise = computeImageSignature(
			buffer(64, 64, (x, y) =>
				(x + y) % 2 === 0 ? [255, 40, 40, 255] : [16, 0, 16, 255]
			)
		);
		expect(noise.colorCount).toBeLessThanOrEqual(4);
		expect(noise.edgeDensity).toBeGreaterThan(0.9);
		expect(noise.isPixelArt).toBe(false);
	});

	it('flags a coarse sprite whose blocks are large relative to the frame', () => {
		// The other half of the same regression: 8px blocks mean most pairs sit
		// inside a flat block, so the hard-edge ratio is low — but this is
		// unmistakably pixel art.
		const sprite = computeImageSignature(
			buffer(64, 64, (x, y) => {
				const palette: Array<[number, number, number]> = [
					[20, 20, 40],
					[255, 47, 208],
					[47, 240, 255],
					[255, 225, 77]
				];
				const [r, g, b] =
					palette[
						(Math.floor(x / 8) * 3 + Math.floor(y / 8) * 5) % 4
					];
				return [r, g, b, 255];
			})
		);
		expect(sprite.colorCount).toBeLessThanOrEqual(8);
		expect(sprite.isPixelArt).toBe(true);
	});

	it('does not flag a smooth many-colour gradient as pixel art', () => {
		const photo = computeImageSignature(
			buffer(64, 64, (x, y) => [x * 4, y * 4, (x + y) * 2, 255])
		);
		expect(photo.colorCount).toBeGreaterThan(64);
		expect(photo.isPixelArt).toBe(false);
	});

	it('reports the source aspect, not the analysis buffer aspect', () => {
		const signature = computeImageSignature({
			...solid(10, 10, 10, 16),
			sourceWidth: 1920,
			sourceHeight: 1080
		});
		expect(signature.aspect).toBeCloseTo(16 / 9, 3);
	});
});
