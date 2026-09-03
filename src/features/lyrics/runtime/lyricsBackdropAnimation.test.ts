import { describe, expect, it } from 'vitest';
import { resolveBackdropAnimation } from './LyricsOverlay';

const SAMPLE = { alpha: 1, scale: 1, offsetX: 0, offsetY: 0 };

describe('resolveBackdropAnimation', () => {
	it('follows the most visible line, so the box fades WITH the text', () => {
		const follow = resolveBackdropAnimation(
			[
				{ ...SAMPLE, alpha: 0.1 },
				{ ...SAMPLE, alpha: 0.6, offsetY: -12 },
				{ ...SAMPLE, alpha: 0.3 }
			],
			{ follow: true, layerScale: 1, layerOpacity: 1 }
		);
		expect(follow.alphaScale).toBeCloseTo(0.6);
		expect(follow.offsetY).toBe(-12);
	});

	it('reaches zero as the line finishes, instead of popping out', () => {
		// The old code painted a fixed alpha, so the box stayed solid through
		// the whole out-transition and then disappeared in one frame.
		const fading = resolveBackdropAnimation([{ ...SAMPLE, alpha: 0.02 }], {
			follow: true,
			layerScale: 1,
			layerOpacity: 1
		});
		expect(fading.alphaScale).toBeCloseTo(0.02);
	});

	it('divides out the layer scale, which the box geometry already has', () => {
		const follow = resolveBackdropAnimation([{ ...SAMPLE, scale: 3 }], {
			follow: true,
			layerScale: 1.5,
			layerOpacity: 1
		});
		expect(follow.scale).toBeCloseTo(2);
	});

	it('divides out the layer opacity for the same reason', () => {
		const follow = resolveBackdropAnimation([{ ...SAMPLE, alpha: 0.25 }], {
			follow: true,
			layerScale: 1,
			layerOpacity: 0.5
		});
		expect(follow.alphaScale).toBeCloseTo(0.5);
	});

	it('stays rigid when the user turns the sync off', () => {
		expect(
			resolveBackdropAnimation(
				[{ alpha: 0.1, scale: 2, offsetX: 40, offsetY: -40 }],
				{ follow: false, layerScale: 1, layerOpacity: 1 }
			)
		).toEqual({ alphaScale: 1, scale: 1, offsetX: 0, offsetY: 0 });
	});

	it('is a no-op with no lines at all', () => {
		expect(
			resolveBackdropAnimation([], {
				follow: true,
				layerScale: 1,
				layerOpacity: 1
			})
		).toEqual({ alphaScale: 1, scale: 1, offsetX: 0, offsetY: 0 });
	});

	it('never lets a scale of zero divide by zero', () => {
		const follow = resolveBackdropAnimation([{ ...SAMPLE, scale: 1 }], {
			follow: true,
			layerScale: 0,
			layerOpacity: 0
		});
		expect(Number.isFinite(follow.scale)).toBe(true);
		expect(Number.isFinite(follow.alphaScale)).toBe(true);
	});
});
