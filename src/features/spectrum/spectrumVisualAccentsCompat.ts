import type { SpectrumSettings } from '@/features/spectrum/runtime/spectrumRuntime';

export type SpectrumVisualAccentsCompat = {
	manualGlowApplicable: boolean;
	supportsPeaksGlow: boolean;
	rgbSplitApplicable: boolean;
	neonCoreApplicable: boolean;
	gradientFlowApplicable: boolean;
	peakSparksApplicable: boolean;
	echoTraceApplicable: boolean;
	visualAccentsApplicable: boolean;
};

export function resolveSpectrumVisualAccentsCompat(
	sp: Pick<
		SpectrumSettings,
		| 'spectrumFamily'
		| 'spectrumShape'
		| 'spectrumMode'
		| 'spectrumColorMode'
	>
): SpectrumVisualAccentsCompat {
	const isClassic = sp.spectrumFamily === 'classic';
	const isOscilloscope = sp.spectrumFamily === 'oscilloscope';
	const isRadial = sp.spectrumMode === 'radial';
	const isClassicWave = isClassic && sp.spectrumShape === 'wave';
	const isClassicBars = isClassic && sp.spectrumShape === 'bars';

	const manualGlowApplicable =
		(isClassic &&
			(sp.spectrumShape === 'bars' || sp.spectrumShape === 'wave')) ||
		sp.spectrumFamily === 'spiral' ||
		sp.spectrumFamily === 'oscilloscope' ||
		sp.spectrumFamily === 'tunnel' ||
		sp.spectrumFamily === 'liquid' ||
		sp.spectrumFamily === 'orbital';

	return {
		manualGlowApplicable,
		supportsPeaksGlow: isClassic && sp.spectrumShape === 'bars',
		rgbSplitApplicable: isClassicWave,
		neonCoreApplicable: isClassicWave || isOscilloscope,
		gradientFlowApplicable:
			isClassicWave ||
			(isClassicBars &&
				(sp.spectrumColorMode === 'gradient' ||
					sp.spectrumColorMode === 'rainbow' ||
					sp.spectrumColorMode === 'visible-rotate')),
		peakSparksApplicable: isClassicWave || isClassicBars,
		echoTraceApplicable: isClassicWave && !isRadial,
		visualAccentsApplicable:
			manualGlowApplicable ||
			isClassicWave ||
			isClassicBars ||
			isOscilloscope
	};
}
