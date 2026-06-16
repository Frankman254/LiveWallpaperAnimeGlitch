import { describe, it, expect } from 'vitest';
import {
	clamp,
	easeInOut,
	lerp,
	normalizeMousePosition,
	randomBetween
} from './math';

describe('lerp', () => {
	it('returns endpoints at t=0 and t=1', () => {
		expect(lerp(0, 10, 0)).toBe(0);
		expect(lerp(0, 10, 1)).toBe(10);
	});

	it('interpolates the midpoint', () => {
		expect(lerp(0, 10, 0.5)).toBe(5);
		expect(lerp(-4, 4, 0.5)).toBe(0);
	});

	it('extrapolates beyond [0,1]', () => {
		expect(lerp(0, 10, 2)).toBe(20);
		expect(lerp(0, 10, -1)).toBe(-10);
	});
});

describe('clamp', () => {
	it('passes values inside the range untouched', () => {
		expect(clamp(5, 0, 10)).toBe(5);
	});

	it('clamps below the minimum and above the maximum', () => {
		expect(clamp(-3, 0, 10)).toBe(0);
		expect(clamp(42, 0, 10)).toBe(10);
	});

	it('returns the bound when value equals it', () => {
		expect(clamp(0, 0, 10)).toBe(0);
		expect(clamp(10, 0, 10)).toBe(10);
	});
});

describe('normalizeMousePosition', () => {
	it('maps the center to the origin', () => {
		expect(normalizeMousePosition(50, 50, 100, 100)).toEqual([0, 0]);
	});

	it('maps the top-left to (-1, 1) and bottom-right to (1, -1)', () => {
		expect(normalizeMousePosition(0, 0, 100, 100)).toEqual([-1, 1]);
		expect(normalizeMousePosition(100, 100, 100, 100)).toEqual([1, -1]);
	});
});

describe('easeInOut', () => {
	it('pins the endpoints and the midpoint', () => {
		expect(easeInOut(0)).toBe(0);
		expect(easeInOut(1)).toBe(1);
		expect(easeInOut(0.5)).toBeCloseTo(0.5, 10);
	});

	it('is monotonically increasing across the unit interval', () => {
		let prev = easeInOut(0);
		for (let t = 0.05; t <= 1; t += 0.05) {
			const v = easeInOut(t);
			expect(v).toBeGreaterThanOrEqual(prev);
			prev = v;
		}
	});
});

describe('randomBetween', () => {
	it('always stays within [min, max)', () => {
		for (let i = 0; i < 1000; i++) {
			const v = randomBetween(5, 9);
			expect(v).toBeGreaterThanOrEqual(5);
			expect(v).toBeLessThan(9);
		}
	});
});
