import { DEFAULT_STATE } from '@/lib/constants';
import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';
import {
	resolveSpectrumVisualAccentsCompat,
	type SpectrumVisualAccentsCompat
} from '@/features/spectrum/spectrumVisualAccentsCompat';
import { applyFxScenario, type SpectrumFxScenario } from './syntheticWaveData';

export type SpectrumFxLabMode =
	| 'classic-wave-linear'
	| 'classic-wave-radial'
	| 'classic-bars-linear'
	| 'classic-bars-radial'
	| 'oscilloscope-linear'
	| 'oscilloscope-radial';

export const SPECTRUM_FX_LAB_MODES: SpectrumFxLabMode[] = [
	'classic-wave-linear',
	'classic-wave-radial',
	'classic-bars-linear',
	'classic-bars-radial',
	'oscilloscope-linear',
	'oscilloscope-radial'
];

export const SPECTRUM_FX_SCENARIOS: SpectrumFxScenario[] = [
	'baseline',
	'manual-glow',
	'neon-core',
	'rgb-split',
	'gradient-flow',
	'peak-sparks',
	'echo-trace',
	'all-accents'
];

export function labModeLabel(mode: SpectrumFxLabMode): string {
	return mode.replace(/-/g, ' ');
}

export function buildLabBaseSettings(
	mode: SpectrumFxLabMode
): SpectrumSettings {
	const isOscilloscope = mode.startsWith('oscilloscope');
	const isBars = mode.includes('bars');
	const isRadial = mode.endsWith('radial');

	return {
		...DEFAULT_STATE,
		spectrumFamily: isOscilloscope ? 'oscilloscope' : 'classic',
		spectrumShape: isBars ? 'bars' : 'wave',
		spectrumMode: isRadial ? 'radial' : 'linear',
		spectrumLinearOrientation: 'horizontal',
		spectrumPrimaryColor: '#00ffff',
		spectrumSecondaryColor: '#ff00ff',
		spectrumColorMode: 'gradient',
		spectrumBarCount: 128,
		spectrumBarWidth: 4,
		spectrumMaxHeight: 140,
		spectrumMinHeight: 4,
		spectrumWaveFillOpacity: 0.25,
		spectrumGlowIntensity: 1.2,
		spectrumShadowBlur: 18,
		spectrumInnerRadius: 48,
		spectrumSpan: 0.85,
		spectrumOpacity: 0.95,
		spectrumOscilloscopePhosphor: false,
		spectrumOscilloscopeGrid: false,
		spectrumPeakHold: true,
		performanceMode: 'high'
	} as SpectrumSettings;
}

export function resolveLabCompat(
	mode: SpectrumFxLabMode
): SpectrumVisualAccentsCompat {
	return resolveSpectrumVisualAccentsCompat(buildLabBaseSettings(mode));
}

export function isScenarioSupportedForMode(
	scenario: SpectrumFxScenario,
	mode: SpectrumFxLabMode
): boolean {
	if (scenario === 'baseline') return true;
	const compat = resolveLabCompat(mode);
	switch (scenario) {
		case 'manual-glow':
			return compat.manualGlowApplicable;
		case 'neon-core':
			return compat.neonCoreApplicable;
		case 'rgb-split':
			return compat.rgbSplitApplicable;
		case 'gradient-flow':
			return compat.gradientFlowApplicable;
		case 'peak-sparks':
			return compat.peakSparksApplicable;
		case 'echo-trace':
			return compat.echoTraceApplicable;
		case 'all-accents':
			return (
				compat.manualGlowApplicable ||
				compat.neonCoreApplicable ||
				compat.rgbSplitApplicable ||
				compat.gradientFlowApplicable ||
				compat.peakSparksApplicable ||
				compat.echoTraceApplicable
			);
	}
}

export function listSupportedScenarios(
	mode: SpectrumFxLabMode
): SpectrumFxScenario[] {
	return SPECTRUM_FX_SCENARIOS.filter(scenario =>
		isScenarioSupportedForMode(scenario, mode)
	);
}

export function buildLabSettings(
	scenario: SpectrumFxScenario,
	mode: SpectrumFxLabMode
): SpectrumSettings {
	const base = buildLabBaseSettings(mode);
	if (!isScenarioSupportedForMode(scenario, mode)) {
		return applyFxScenario(base, 'baseline') as SpectrumSettings;
	}
	if (scenario === 'all-accents') {
		return applyFxScenarioForCompat(base, mode) as SpectrumSettings;
	}
	return applyFxScenario(base, scenario) as SpectrumSettings;
}

/** Enable only accents compatible with the selected lab mode. */
export function applyFxScenarioForCompat(
	base: SpectrumSettings,
	mode: SpectrumFxLabMode
): SpectrumSettings {
	const compat = resolveLabCompat(mode);
	const off = applyFxScenario(base, 'baseline') as SpectrumSettings;
	const max = applyFxScenario(base, 'all-accents') as SpectrumSettings;
	return {
		...off,
		...(compat.manualGlowApplicable
			? {
					spectrumManualGlow: max.spectrumManualGlow,
					spectrumManualGlowMode: max.spectrumManualGlowMode
				}
			: {}),
		...(compat.neonCoreApplicable
			? {
					spectrumNeonCore: max.spectrumNeonCore,
					spectrumNeonCoreIntensity: max.spectrumNeonCoreIntensity,
					spectrumNeonCoreWidth: max.spectrumNeonCoreWidth
				}
			: {}),
		...(compat.rgbSplitApplicable
			? {
					spectrumRgbSplit: max.spectrumRgbSplit,
					spectrumRgbSplitAmount: max.spectrumRgbSplitAmount
				}
			: {}),
		...(compat.gradientFlowApplicable
			? {
					spectrumGradientFlow: max.spectrumGradientFlow,
					spectrumGradientFlowSpeed: max.spectrumGradientFlowSpeed,
					spectrumGradientFlowAudio: max.spectrumGradientFlowAudio
				}
			: {}),
		...(compat.peakSparksApplicable
			? {
					spectrumPeakSparks: max.spectrumPeakSparks,
					spectrumPeakSparksAmount: max.spectrumPeakSparksAmount,
					spectrumPeakSparksSize: max.spectrumPeakSparksSize,
					spectrumPeakSparksThreshold: max.spectrumPeakSparksThreshold
				}
			: {}),
		...(compat.echoTraceApplicable
			? {
					spectrumEchoTrace: max.spectrumEchoTrace,
					spectrumEchoTraceCount: max.spectrumEchoTraceCount,
					spectrumEchoTraceOpacity: max.spectrumEchoTraceOpacity,
					spectrumEchoTraceOffset: max.spectrumEchoTraceOffset,
					spectrumEchoTraceDecay: max.spectrumEchoTraceDecay
				}
			: {})
	};
}
