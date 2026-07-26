import { describe, it, expect } from 'vitest';
import {
	applyRadialSharpness,
	getRadialBaseRadius,
	getRadialShapeDefinition,
	MAX_LOGO_FIT_INFLATION,
	RADIAL_SHAPE_IDS
} from './radialGeometry';

/**
 * Invariants for ALL registered radial shapes.
 *
 * These exist because the previous version of this suite only checked that the
 * factor was finite and ≤ 1, which let every real defect through: shapes that
 * peaked at 76% of the requested radius, hand-written minima that disagreed
 * with the curve they described (the flower family under-reported its trough
 * and cut into the logo), hard clamps that flattened a third of an outline into
 * a dead arc, and four shapes rendering upside down.
 */

const SAMPLES = 2048;
const angleAt = (index: number) => (index / SAMPLES) * Math.PI * 2;

function sample(shapeId: (typeof RADIAL_SHAPE_IDS)[number]) {
	const def = getRadialShapeDefinition(shapeId);
	const factors: number[] = [];
	let min = Infinity;
	let max = -Infinity;
	let minFactor = 0;
	let minAngle = 0;
	let maxAngle = 0;
	for (let i = 0; i < SAMPLES; i++) {
		const angle = angleAt(i);
		const result = def.factor(angle);
		factors.push(result.factor);
		minFactor = result.minFactor;
		if (result.factor < min) {
			min = result.factor;
			minAngle = angle;
		}
		if (result.factor > max) {
			max = result.factor;
			maxAngle = angle;
		}
	}
	return { factors, min, max, minFactor, minAngle, maxAngle };
}

/**
 * A long run of constant radius reads as a straight arc cut across the shape.
 * `circle` is constant by definition and `catEars` is deliberately circular
 * below the ears — everything else must vary.
 */
const CONSTANT_RADIUS_ALLOWED = new Set(['circle', 'catEars']);

/** Shapes built from explicit vertices; corners are the point of them. */
const CORNERED_SHAPES = new Set([
	'square',
	'triangle',
	'diamond',
	'hexagon',
	'octagon',
	'pentagon',
	'bulgedTriangle',
	'bulgedSquare',
	'concaveTriangle',
	'cross',
	'bowtie'
]);

describe('radialGeometry — every shape is finite, normalized and honest', () => {
	for (const shapeId of RADIAL_SHAPE_IDS) {
		it(`${shapeId}: factor stays finite and inside (0, 1]`, () => {
			const { factors, minFactor } = sample(shapeId);
			for (let i = 0; i < factors.length; i++) {
				const factor = factors[i];
				expect(
					Number.isFinite(factor),
					`factor is not finite at ${angleAt(i).toFixed(3)}`
				).toBe(true);
				expect(
					factor > 0,
					`factor ≤ 0 at ${angleAt(i).toFixed(3)}: ${factor}`
				).toBe(true);
				expect(
					factor <= 1.001,
					`factor exceeds 1 at ${angleAt(i).toFixed(3)}: ${factor}`
				).toBe(true);
			}
			expect(Number.isFinite(minFactor) && minFactor > 0).toBe(true);
		});

		it(`${shapeId}: peaks at exactly the requested radius`, () => {
			// Without this every shape fills a different share of the radius the
			// user asked for, so the picker lies about relative size.
			const { max } = sample(shapeId);
			expect(max).toBeCloseTo(1, 2);
		});

		it(`${shapeId}: reported minFactor matches the real trough`, () => {
			// The logo-fit clamp is derived from minFactor. If it drifts above
			// the true minimum the shape cuts into the logo; below it, the shape
			// is inflated for no reason.
			const { min, minFactor } = sample(shapeId);
			expect(minFactor).toBeCloseTo(min, 3);
		});

		it(`${shapeId}: trough stays within the logo-fit inflation budget`, () => {
			// Clearing the logo scales the shape by 1/minFactor. Authoring every
			// shape above this floor is what keeps that scale bounded, so no
			// shape ever has to be blown off-screen or flattened at the tip.
			const { minFactor } = sample(shapeId);
			expect(minFactor).toBeGreaterThanOrEqual(
				1 / MAX_LOGO_FIT_INFLATION
			);
		});

		it(`${shapeId}: has no flattened arc`, () => {
			const { factors, min, max } = sample(shapeId);
			if (CONSTANT_RADIUS_ALLOWED.has(shapeId)) return;
			const constant = factors.filter(
				factor =>
					Math.abs(factor - min) < 1e-6 ||
					Math.abs(factor - max) < 1e-6
			).length;
			// 6% of the perimeter ≈ 21°, far more than a smooth extremum spans.
			expect(
				constant / SAMPLES,
				`${((constant / SAMPLES) * 100).toFixed(1)}% of the outline sits at a constant radius`
			).toBeLessThan(0.06);
		});

		it(`${shapeId}: curves without spikes`, () => {
			const { factors } = sample(shapeId);
			if (CORNERED_SHAPES.has(shapeId)) return;
			let worst = 0;
			for (let i = 0; i < SAMPLES; i++) {
				const previous = factors[(i - 1 + SAMPLES) % SAMPLES];
				const next = factors[(i + 1) % SAMPLES];
				worst = Math.max(
					worst,
					Math.abs(next - 2 * factors[i] + previous)
				);
			}
			// The old `cross` scored 0.23 here with its rounded arms and spiked
			// tips; genuine curves sit two orders of magnitude below that.
			expect(worst).toBeLessThan(0.02);
		});
	}
});

describe('radialGeometry — screen orientation', () => {
	// Canvas Y grows downward, so sin(angle) > 0 is the BOTTOM of the screen.
	// Reading it as a maths axis silently flipped four shapes upside down before
	// they were retired. `catEars` is the only shape left with a top/bottom
	// asymmetry, so it is what now guards the convention.
	it('cat ears point up, not down', () => {
		const { maxAngle } = sample('catEars');
		expect(Math.sin(maxAngle)).toBeLessThan(0);
	});
});

describe('radialGeometry — logo fit', () => {
	const RADIUS = 120;

	for (const shapeId of RADIAL_SHAPE_IDS) {
		it(`${shapeId}: never enters the logo and never blows up`, () => {
			for (let i = 0; i < 512; i++) {
				const angle = (i / 512) * Math.PI * 2;
				const radius = getRadialBaseRadius(
					shapeId,
					RADIUS,
					angle,
					0,
					RADIUS
				);
				expect(
					radius,
					`${shapeId} dips inside the logo at ${angle.toFixed(3)}`
				).toBeGreaterThanOrEqual(RADIUS - 1e-6);
				expect(
					radius,
					`${shapeId} is inflated past the cap at ${angle.toFixed(3)}`
				).toBeLessThanOrEqual(RADIUS * MAX_LOGO_FIT_INFLATION + 1e-6);
			}
		});
	}

	it('leaves the radius alone when the toggle is off', () => {
		const withoutFit = getRadialBaseRadius('star', RADIUS, 1.1, 0);
		const { factor } = getRadialShapeDefinition('star').factor(1.1);
		expect(withoutFit).toBeCloseTo(RADIUS * factor, 6);
	});
});

describe('radialGeometry — sharp points', () => {
	it('is an exact no-op at zero', () => {
		for (const shapeId of RADIAL_SHAPE_IDS) {
			const def = getRadialShapeDefinition(shapeId);
			for (let i = 0; i < 64; i++) {
				const angle = (i / 64) * Math.PI * 2;
				const { factor, minFactor } = def.factor(angle);
				expect(applyRadialSharpness(factor, minFactor, 0)).toBe(factor);
			}
		}
	});

	it('keeps every shape inside its own bounds at full sharpness', () => {
		// The logo-fit guarantee is derived from minFactor, so sharpening must
		// not push the outline below it — or above the requested radius.
		for (const shapeId of RADIAL_SHAPE_IDS) {
			const def = getRadialShapeDefinition(shapeId);
			for (const sharpness of [0.25, 0.5, 1]) {
				for (let i = 0; i < 256; i++) {
					const angle = (i / 256) * Math.PI * 2;
					const { factor, minFactor } = def.factor(angle);
					const sharpened = applyRadialSharpness(
						factor,
						minFactor,
						sharpness
					);
					expect(sharpened).toBeGreaterThanOrEqual(minFactor - 1e-9);
					expect(sharpened).toBeLessThanOrEqual(1.001);
				}
			}
		}
	});

	it('narrows lobes without moving the peak', () => {
		const def = getRadialShapeDefinition('star3');
		const peak = def.factor(0);
		expect(
			applyRadialSharpness(peak.factor, peak.minFactor, 1)
		).toBeCloseTo(peak.factor, 6);

		// A point halfway down a lobe must pull in toward the trough.
		const flank = def.factor(0.5);
		expect(
			applyRadialSharpness(flank.factor, flank.minFactor, 1)
		).toBeLessThan(flank.factor);
	});

	it('leaves the circle alone — it has no lobes to sharpen', () => {
		const { factor, minFactor } =
			getRadialShapeDefinition('circle').factor(0.7);
		expect(applyRadialSharpness(factor, minFactor, 1)).toBe(factor);
	});
});

describe('radialGeometry — retired shapes', () => {
	// Retired in v106: each needed something a polar radius cannot express —
	// a true cusp, or a concave bite a ray crosses twice — so every version of
	// them was a blob wearing the wrong name.
	const RETIRED = ['cardioid', 'drop', 'heart', 'shield', 'moon', 'wings'];

	for (const shapeId of RETIRED) {
		it(`no longer offers ${shapeId}`, () => {
			expect(RADIAL_SHAPE_IDS).not.toContain(shapeId);
		});
	}

	it('falls back to a circle for an unknown id', () => {
		const definition = getRadialShapeDefinition(
			'cardioid' as (typeof RADIAL_SHAPE_IDS)[number]
		);
		expect(definition.id).toBe('circle');
	});
});
