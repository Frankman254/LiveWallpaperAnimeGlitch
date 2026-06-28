import { describe, it, expect } from 'vitest';
import {
	RADIAL_SHAPE_IDS,
	getRadialShapeDefinition
} from './radialGeometry';

/**
 * Sanity checks for ALL registered radial shapes.
 * Each factor function must:
 *   - return finite values (no NaN, no Infinity)
 *   - stay in (0, 1] (no canvas clipping, no zero-radius crash)
 *   - have a positive minFactor
 */
describe('radialGeometry — all shapes produce valid factor values', () => {
	const ANGLES = Array.from({ length: 72 }, (_, i) => (i * Math.PI * 2) / 72);

	for (const shapeId of RADIAL_SHAPE_IDS) {
		it(`${shapeId}: factor is finite and in (0, 1] for 72 sample angles`, () => {
			const def = getRadialShapeDefinition(shapeId);
			for (const angle of ANGLES) {
				const result = def.factor(angle);
				expect(
					Number.isFinite(result.factor),
					`factor is not finite at angle ${angle.toFixed(3)}`
				).toBe(true);
				expect(
					result.factor > 0,
					`factor ≤ 0 at angle ${angle.toFixed(3)}: ${result.factor}`
				).toBe(true);
				expect(
					result.factor <= 1.0001, // tiny float tolerance
					`factor exceeds 1 at angle ${angle.toFixed(3)}: ${result.factor}`
				).toBe(true);
				expect(
					Number.isFinite(result.minFactor) && result.minFactor > 0,
					`minFactor invalid: ${result.minFactor}`
				).toBe(true);
			}
		});
	}
});
