import { describe, expect, it } from 'vitest';
import {
	buildLabSettings,
	isScenarioSupportedForMode,
	listSupportedScenarios,
	resolveLabCompat
} from '@/dev/spectrumFxLab/spectrumFxLabConfig';
import {
	createFreshLabRuntime,
	resetSpectrumFxLabRuntime
} from '@/dev/spectrumFxLab/spectrumFxLabRuntime';
import { LabDrawMetricTracker } from '@/dev/spectrumFxLab/spectrumFxLabMetrics';
import {
	SPECTRUM_VISUAL_ACCENTS_DEMO_PROFILE_SLOTS,
	SPECTRUM_PROFILE_NEON_GLITCH,
	SPECTRUM_PROFILE_ECHO_SPARKS
} from '@/features/spectrum/spectrumVisualAccentsDemoProfiles';
import { createDefaultSpectrumProfileSlots } from '@/lib/featureProfiles';

describe('spectrumFxLab config', () => {
	it('filters scenarios per mode via compat', () => {
		const wave = listSupportedScenarios('classic-wave-linear');
		expect(wave).toContain('rgb-split');
		expect(wave).toContain('echo-trace');

		const scope = listSupportedScenarios('oscilloscope-linear');
		expect(scope).toContain('neon-core');
		expect(scope).not.toContain('rgb-split');
		expect(scope).not.toContain('peak-sparks');

		const barsRadial = listSupportedScenarios('classic-bars-radial');
		expect(barsRadial).toContain('manual-glow');
		expect(barsRadial).not.toContain('gradient-flow');
		expect(barsRadial).not.toContain('peak-sparks');
	});

	it('all-accents only enables compatible flags', () => {
		const settings = buildLabSettings('all-accents', 'oscilloscope-linear');
		expect(settings.spectrumNeonCore).toBe(true);
		expect(settings.spectrumRgbSplit).toBe(false);
		expect(settings.spectrumPeakSparks).toBe(false);
	});

	it('unsupported scenario falls back to baseline settings', () => {
		const settings = buildLabSettings('echo-trace', 'oscilloscope-linear');
		expect(settings.spectrumEchoTrace).toBe(false);
	});

	it('classic bars linear supports peak sparks scenario', () => {
		expect(
			isScenarioSupportedForMode('peak-sparks', 'classic-bars-linear')
		).toBe(true);
		const settings = buildLabSettings('peak-sparks', 'classic-bars-linear');
		expect(settings.spectrumPeakSparks).toBe(true);
	});
});

describe('spectrumFxLab runtime isolation', () => {
	it('reset clears echo history counters', () => {
		const runtime = createFreshLabRuntime();
		runtime.echoTraceFrameCount = 3;
		runtime.echoTraceBuffers = [new Float32Array(4)];
		resetSpectrumFxLabRuntime(runtime);
		expect(runtime.echoTraceFrameCount).toBe(0);
		expect(runtime.echoTraceBuffers).toBeUndefined();
	});

	it('separate runtimes do not share echo buffers', () => {
		const off = createFreshLabRuntime();
		const on = createFreshLabRuntime();
		on.echoTraceBuffers = [new Float32Array([1, 2, 3])];
		on.echoTraceFrameCount = 2;
		expect(off.echoTraceBuffers).toBeUndefined();
		expect(off.echoTraceFrameCount).toBeUndefined();
	});
});

describe('spectrumFxLab metrics', () => {
	it('tracks rolling averages separately for off and on', () => {
		const tracker = new LabDrawMetricTracker(4);
		tracker.pushOff(1);
		tracker.pushOff(3);
		tracker.setBaselineAvg(tracker.offAvgMs);
		tracker.pushOn(5);
		tracker.pushOn(7);
		expect(tracker.offAvgMs).toBe(2);
		expect(tracker.onAvgMs).toBe(6);
		expect(tracker.onDeltaMs).toBe(4);
	});
});

describe('visual accents demo profiles', () => {
	it('exports expected accent values', () => {
		expect(SPECTRUM_PROFILE_NEON_GLITCH.spectrumRgbSplit).toBe(true);
		expect(SPECTRUM_PROFILE_NEON_GLITCH.spectrumNeonCore).toBe(true);
		expect(SPECTRUM_PROFILE_ECHO_SPARKS.spectrumEchoTrace).toBe(true);
		expect(SPECTRUM_PROFILE_ECHO_SPARKS.spectrumPeakSparks).toBe(true);
	});

	it('registers demo profiles in default slots 7 and 8', () => {
		const slots = createDefaultSpectrumProfileSlots();
		expect(slots[6]?.name).toBe(
			SPECTRUM_VISUAL_ACCENTS_DEMO_PROFILE_SLOTS[0].name
		);
		expect(slots[7]?.name).toBe(
			SPECTRUM_VISUAL_ACCENTS_DEMO_PROFILE_SLOTS[1].name
		);
		expect(slots[6]?.values?.spectrumRgbSplit).toBe(true);
		expect(slots[7]?.values?.spectrumEchoTrace).toBe(true);
	});
});

describe('resolveLabCompat', () => {
	it('oscilloscope radial matches linear accent support', () => {
		const linear = resolveLabCompat('oscilloscope-linear');
		const radial = resolveLabCompat('oscilloscope-radial');
		expect(linear.neonCoreApplicable).toBe(radial.neonCoreApplicable);
		expect(linear.rgbSplitApplicable).toBe(false);
	});
});
