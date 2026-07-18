import { describe, expect, it } from 'vitest';
import { resolveLiquidGlassBands } from './liquidGlass';

describe('resolveLiquidGlassBands', () => {
	it('uses quality-aware band counts', () => {
		expect(resolveLiquidGlassBands(20, 1.2, 'low')).toHaveLength(2);
		expect(resolveLiquidGlassBands(20, 1.2, 'medium')).toHaveLength(3);
		expect(resolveLiquidGlassBands(20, 1.2, 'high')).toHaveLength(4);
	});

	it('decreases refraction and Fresnel toward the transparent centre', () => {
		const bands = resolveLiquidGlassBands(24, 1.4, 'high');
		expect(bands[0]?.magnify).toBeCloseTo(1.4);
		expect(bands.at(-1)?.magnify).toBeCloseTo(1);
		expect(bands[0]?.fresnel).toBeGreaterThan(bands.at(-1)?.fresnel ?? 1);
		for (let index = 1; index < bands.length; index += 1) {
			expect(bands[index]?.outerInset).toBeCloseTo(
				bands[index - 1]?.innerInset ?? 0
			);
		}
	});
});
