import { describe, expect, it } from 'vitest';
import { resolveSpectrumVisualAccentsCompat } from './spectrumVisualAccentsCompat';
import { DEFAULT_STATE } from '@/lib/constants';

function compat(
	overrides: Record<string, unknown> = {}
): ReturnType<typeof resolveSpectrumVisualAccentsCompat> {
	return resolveSpectrumVisualAccentsCompat({
		spectrumFamily: DEFAULT_STATE.spectrumFamily,
		spectrumShape: DEFAULT_STATE.spectrumShape,
		spectrumMode: DEFAULT_STATE.spectrumMode,
		spectrumColorMode: DEFAULT_STATE.spectrumColorMode,
		...overrides
	});
}

describe('resolveSpectrumVisualAccentsCompat', () => {
	it('classic wave linear enables wave-only accents', () => {
		const c = compat({
			spectrumFamily: 'classic',
			spectrumShape: 'wave',
			spectrumMode: 'linear'
		});
		expect(c.rgbSplitApplicable).toBe(true);
		expect(c.neonCoreApplicable).toBe(true);
		expect(c.gradientFlowApplicable).toBe(true);
		expect(c.peakSparksApplicable).toBe(true);
		expect(c.echoTraceApplicable).toBe(true);
	});

	it('classic wave radial hides echo trace', () => {
		const c = compat({
			spectrumFamily: 'classic',
			spectrumShape: 'wave',
			spectrumMode: 'radial'
		});
		expect(c.rgbSplitApplicable).toBe(true);
		expect(c.echoTraceApplicable).toBe(false);
		expect(c.peakSparksApplicable).toBe(true);
	});

	it('classic bars linear supports gradient flow with gradient colors', () => {
		const c = compat({
			spectrumFamily: 'classic',
			spectrumShape: 'bars',
			spectrumMode: 'linear',
			spectrumColorMode: 'gradient'
		});
		expect(c.gradientFlowApplicable).toBe(true);
		expect(c.peakSparksApplicable).toBe(true);
		expect(c.rgbSplitApplicable).toBe(false);
	});

	it('classic bars radial hides gradient flow and peak sparks', () => {
		const c = compat({
			spectrumFamily: 'classic',
			spectrumShape: 'bars',
			spectrumMode: 'radial',
			spectrumColorMode: 'gradient'
		});
		expect(c.gradientFlowApplicable).toBe(false);
		expect(c.peakSparksApplicable).toBe(false);
		expect(c.manualGlowApplicable).toBe(true);
	});

	it('classic bars solid color hides gradient flow', () => {
		const c = compat({
			spectrumFamily: 'classic',
			spectrumShape: 'bars',
			spectrumMode: 'linear',
			spectrumColorMode: 'solid'
		});
		expect(c.gradientFlowApplicable).toBe(false);
	});

	it('oscilloscope supports manual glow and neon core only', () => {
		const c = compat({
			spectrumFamily: 'oscilloscope',
			spectrumMode: 'linear'
		});
		expect(c.manualGlowApplicable).toBe(true);
		expect(c.neonCoreApplicable).toBe(true);
		expect(c.rgbSplitApplicable).toBe(false);
		expect(c.gradientFlowApplicable).toBe(false);
		expect(c.peakSparksApplicable).toBe(false);
		expect(c.echoTraceApplicable).toBe(false);
	});

	it('spiral supports manual glow only among accents', () => {
		const c = compat({ spectrumFamily: 'spiral' });
		expect(c.manualGlowApplicable).toBe(true);
		expect(c.neonCoreApplicable).toBe(false);
		expect(c.visualAccentsApplicable).toBe(true);
	});
});
