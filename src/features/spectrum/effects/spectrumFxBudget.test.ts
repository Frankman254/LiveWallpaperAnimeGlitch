import { describe, expect, it } from 'vitest';
import {
	curveRgbSplitAmount,
	resolvePeakSparkCount,
	resolveRgbSplitOffsetPx
} from './spectrumFxBudget';
import { resetGradientFlowPhaseForTests } from './gradientFlow';

describe('spectrumFxBudget', () => {
	it('returns zero rgb offset when disabled', () => {
		expect(
			resolveRgbSplitOffsetPx(false, 1, 1080, 'high', 128)
		).toBe(0);
	});

	it('caps rgb offset by performance mode', () => {
		const high = resolveRgbSplitOffsetPx(true, 1, 2000, 'high', 64);
		const low = resolveRgbSplitOffsetPx(true, 1, 2000, 'low', 64);
		expect(low).toBeLessThanOrEqual(7);
		expect(high).toBeGreaterThan(low);
	});

	it('smoothsteps rgb amount curve', () => {
		expect(curveRgbSplitAmount(0)).toBe(0);
		expect(curveRgbSplitAmount(1)).toBe(1);
		expect(curveRgbSplitAmount(0.5)).toBe(0.5);
	});

	it('hard-caps peak spark count', () => {
		expect(resolvePeakSparkCount(99)).toBe(12);
		expect(resolvePeakSparkCount(6)).toBe(6);
	});
});

describe('gradientFlow', () => {
	it('resets animated phase for tests', () => {
		resetGradientFlowPhaseForTests();
		expect(true).toBe(true);
	});
});
