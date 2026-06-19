/**
 * Synthetic height buffers for deterministic Spectrum FX validation (dev-only).
 */
export type SpectrumFxWavePreset =
	| 'sine'
	| 'kick-peaks'
	| 'alternating'
	| 'rolling'
	| 'silence'
	| 'fixed-radial';

export function fillSyntheticHeights(
	out: Float32Array,
	preset: SpectrumFxWavePreset,
	maxHeight: number,
	frame: number
): void {
	const n = out.length;
	if (n === 0) return;
	switch (preset) {
		case 'silence':
			out.fill(maxHeight * 0.08);
			return;
		case 'sine':
			for (let i = 0; i < n; i++) {
				const t = i / Math.max(n - 1, 1);
				out[i] =
					maxHeight *
					(0.22 +
						0.68 *
							Math.abs(Math.sin(t * Math.PI * 4 + frame * 0.07)));
			}
			return;
		case 'kick-peaks':
			for (let i = 0; i < n; i++) {
				const kick = i % 16 === 0 ? 1 : i % 8 === 0 ? 0.55 : 0.15;
				out[i] = maxHeight * kick;
			}
			return;
		case 'alternating':
			for (let i = 0; i < n; i++) {
				out[i] = maxHeight * (i % 2 === 0 ? 0.85 : 0.18);
			}
			return;
		case 'rolling':
			for (let i = 0; i < n; i++) {
				const t = (i / n + frame * 0.012) % 1;
				out[i] =
					maxHeight *
					(0.25 + 0.65 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2)));
			}
			return;
		case 'fixed-radial':
			for (let i = 0; i < n; i++) {
				const t = i / n;
				out[i] =
					maxHeight *
					(0.35 +
						0.45 * Math.sin(t * Math.PI * 6) +
						0.12 * Math.cos(t * Math.PI * 14));
			}
			return;
	}
}

export type SpectrumFxScenario =
	| 'baseline'
	| 'manual-glow'
	| 'neon-core'
	| 'rgb-split'
	| 'gradient-flow'
	| 'peak-sparks'
	| 'echo-trace'
	| 'all-accents';

export function applyFxScenario(
	base: Record<string, unknown>,
	scenario: SpectrumFxScenario
): Record<string, unknown> {
	const off = {
		spectrumManualGlow: false,
		spectrumNeonCore: false,
		spectrumRgbSplit: false,
		spectrumGradientFlow: false,
		spectrumPeakSparks: false,
		spectrumEchoTrace: false
	};
	const max = {
		spectrumManualGlow: true,
		spectrumManualGlowMode: 'core-halo',
		spectrumNeonCore: true,
		spectrumNeonCoreIntensity: 1,
		spectrumNeonCoreWidth: 0.55,
		spectrumRgbSplit: true,
		spectrumRgbSplitAmount: 1,
		spectrumGradientFlow: true,
		spectrumGradientFlowSpeed: 1,
		spectrumGradientFlowAudio: false,
		spectrumPeakSparks: true,
		spectrumPeakSparksAmount: 8,
		spectrumPeakSparksSize: 5,
		spectrumPeakSparksThreshold: 0.35,
		spectrumEchoTrace: true,
		spectrumEchoTraceCount: 2,
		spectrumEchoTraceOpacity: 0.65,
		spectrumEchoTraceOffset: 10,
		spectrumEchoTraceDecay: 0.75
	};
	switch (scenario) {
		case 'baseline':
			return { ...base, ...off };
		case 'manual-glow':
			return { ...base, ...off, spectrumManualGlow: true };
		case 'neon-core':
			return {
				...base,
				...off,
				...max,
				spectrumNeonCore: true,
				spectrumManualGlow: false,
				spectrumRgbSplit: false,
				spectrumGradientFlow: false,
				spectrumPeakSparks: false,
				spectrumEchoTrace: false
			};
		case 'rgb-split':
			return {
				...base,
				...off,
				spectrumRgbSplit: true,
				spectrumRgbSplitAmount: 1
			};
		case 'gradient-flow':
			return {
				...base,
				...off,
				spectrumGradientFlow: true,
				spectrumGradientFlowSpeed: 1
			};
		case 'peak-sparks':
			return {
				...base,
				...off,
				spectrumPeakSparks: true,
				spectrumPeakSparksAmount: 8,
				spectrumPeakSparksSize: 5,
				spectrumPeakSparksThreshold: 0.35
			};
		case 'echo-trace':
			return {
				...base,
				...off,
				...max,
				spectrumEchoTrace: true,
				spectrumManualGlow: false,
				spectrumNeonCore: false,
				spectrumRgbSplit: false,
				spectrumGradientFlow: false,
				spectrumPeakSparks: false
			};
		case 'all-accents':
			return { ...base, ...max };
	}
}
