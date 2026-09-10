import { describe, it, expect } from 'vitest';
import { suggestBackgroundAutoFit } from './backgroundAutoFit';
import {
	getImageBaseSize,
	getRotatedHalfExtents,
	resolveMinimumCoverScale
} from './resolveImageTransform';

// Node-env viewport is irrelevant here: the domain functions take the
// viewport explicitly, so everything below is pure arithmetic.

describe('suggestBackgroundAutoFit', () => {
	it('stores an honest cover fit for a portrait image in a landscape viewport', () => {
		const s = suggestBackgroundAutoFit(1920, 1080, 1080, 1920);

		// The point of the fix: a cover base full-bleeds at scale 1.0, so
		// the stored fitMode says what is actually drawn.
		expect(s.fitMode).toBe('cover');
		expect(s.scale).toBeCloseTo(1.0, 5);
		expect(s.positionX).toBe(0);
		expect(s.positionY).toBe(0);

		// A 'contain' base would need a fake inflated scale (~3.16) to
		// bleed past the edges — exactly the dishonesty this removes.
		const containScale = resolveMinimumCoverScale(
			1920,
			1080,
			1080,
			1920,
			'contain'
		);
		expect(containScale).toBeGreaterThan(3);
	});

	it('the suggested pair covers the viewport on its own, without the keep-covered clamp', () => {
		const s = suggestBackgroundAutoFit(1920, 1080, 1080, 1920);
		const base = getImageBaseSize(1920, 1080, 1080, 1920, 'cover');
		const drawnW = base.width * s.scale;
		const drawnH = base.height * s.scale;

		// Rotation 0: the axis-aligned edges must reach past every side.
		expect(drawnW).toBeGreaterThanOrEqual(1920);
		expect(drawnH).toBeGreaterThanOrEqual(1080);
	});

	it('rotation 45 lowers the required scale while keeping full coverage', () => {
		// Rotation is in degrees (getRotatedHalfExtents contract).
		const s = suggestBackgroundAutoFit(1920, 1080, 1080, 1920, 45);

		// A rotated portrait's bounding box is wider than the portrait, so
		// less scale is needed than the upright 1.0.
		expect(s.fitMode).toBe('cover');
		expect(s.scale).toBeLessThan(1.0);

		const base = getImageBaseSize(1920, 1080, 1080, 1920, 'cover');
		const { halfW, halfH } = getRotatedHalfExtents(
			base.width * s.scale,
			base.height * s.scale,
			45
		);
		expect(halfW * 2).toBeGreaterThanOrEqual(1920);
		expect(halfH * 2).toBeGreaterThanOrEqual(1080);
	});

	it('clamps degenerate inputs to a positive scale', () => {
		const s = suggestBackgroundAutoFit(1920, 1080, 0, 0);
		expect(s.scale).toBeGreaterThan(0);
		expect(s.scale).toBeLessThanOrEqual(100);
	});
});
