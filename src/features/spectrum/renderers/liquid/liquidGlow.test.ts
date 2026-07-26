import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE } from '@/lib/constants';
import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import { computeLiquidGlowBlur } from './liquidRenderer';

/**
 * Guards the fix for "Glow Reach and Shadow Blur do nothing on Liquid": the
 * caps used to attenuate the user's request by the layer stack, so at default
 * settings a 3-layer liquid asked for ~8px of blur and every slider move
 * disappeared under the ceiling. These assertions fail if any of the three
 * glow dials stops producing a visible change over its own range.
 */
function settings(patch: Partial<SpectrumSettings> = {}): SpectrumSettings {
	return {
		...DEFAULT_STATE,
		performanceMode: 'high',
		...patch
	} as unknown as SpectrumSettings;
}

const FRONT_LAYER = 1;
const THREE_LAYERS = 3;

describe('computeLiquidGlowBlur', () => {
	it('responds across the whole Shadow Blur range with 3 layers', () => {
		const at = (shadowBlur: number) =>
			computeLiquidGlowBlur(
				settings({ spectrumShadowBlur: shadowBlur }),
				FRONT_LAYER,
				false,
				THREE_LAYERS
			);
		expect(at(0)).toBe(0);
		expect(at(18)).toBeGreaterThan(at(6));
		expect(at(40)).toBeGreaterThan(at(18));
		// The top of the slider must still read as brighter than the middle.
		expect(at(60)).toBeGreaterThan(at(30));
	});

	it('responds to Glow Reach at default blur', () => {
		const at = (reach: number) =>
			computeLiquidGlowBlur(
				settings({ spectrumGlowReach: reach }),
				FRONT_LAYER,
				false,
				THREE_LAYERS
			);
		expect(at(2)).toBeGreaterThan(at(1));
		expect(at(3)).toBeGreaterThan(at(2));
	});

	it('responds to Glow intensity at default blur', () => {
		const at = (intensity: number) =>
			computeLiquidGlowBlur(
				settings({ spectrumGlowIntensity: intensity }),
				FRONT_LAYER,
				false,
				THREE_LAYERS
			);
		expect(at(0)).toBe(0);
		expect(at(1.5)).toBeGreaterThan(at(0.8));
		expect(at(3)).toBeGreaterThan(at(1.5));
	});

	it('keeps rigid layers responsive too, on a tighter ceiling', () => {
		const rigid = (shadowBlur: number) =>
			computeLiquidGlowBlur(
				settings({ spectrumShadowBlur: shadowBlur }),
				FRONT_LAYER,
				true,
				THREE_LAYERS
			);
		expect(rigid(24)).toBeGreaterThan(rigid(8));
		expect(rigid(60)).toBeLessThan(
			computeLiquidGlowBlur(
				settings({ spectrumShadowBlur: 60 }),
				FRONT_LAYER,
				false,
				THREE_LAYERS
			)
		);
	});

	it('caps hard enough that a maxed preset cannot melt the frame', () => {
		const maxed = computeLiquidGlowBlur(
			settings({
				spectrumShadowBlur: 60,
				spectrumGlowIntensity: 3,
				spectrumGlowReach: 3
			}),
			FRONT_LAYER,
			false,
			THREE_LAYERS
		);
		expect(maxed).toBeLessThanOrEqual(90);
	});

	it('shrinks the ceiling on low performance mode', () => {
		const maxed = (performanceMode: 'high' | 'low') =>
			computeLiquidGlowBlur(
				settings({
					performanceMode,
					spectrumShadowBlur: 60,
					spectrumGlowIntensity: 3
				}),
				FRONT_LAYER,
				false,
				THREE_LAYERS
			);
		expect(maxed('low')).toBeLessThan(maxed('high'));
	});
});
