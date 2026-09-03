import type { SpectrumProfileSettings } from '@/types/wallpaper';
import { DEFAULT_SHOCKWAVE_BAND_THRESHOLDS } from '@/features/spectrum/shockwaveCalibration';

/** Shared high-contrast demo palette for Visual Accents showcase profiles. */
const DEMO_COLORS = {
	primary: '#00ffff',
	secondary: '#ff00ff',
	glowPrimary: '#00ffff',
	glowSecondary: '#ff00ff'
} as const;

function baseClassicWaveLinear(): Partial<SpectrumProfileSettings> {
	return {
		spectrumEnabled: true,
		spectrumFamily: 'classic',
		spectrumShape: 'wave',
		spectrumMode: 'linear',
		spectrumLinearOrientation: 'horizontal',
		spectrumLinearDirection: 'normal',
		spectrumPrimaryColor: DEMO_COLORS.primary,
		spectrumSecondaryColor: DEMO_COLORS.secondary,
		spectrumColorSource: 'manual',
		spectrumColorMode: 'gradient',
		spectrumBarCount: 128,
		spectrumBarWidth: 4,
		spectrumMaxHeight: 200,
		spectrumMinHeight: 6,
		spectrumWaveFillOpacity: 0.22,
		spectrumGlowIntensity: 1.4,
		spectrumShadowBlur: 22,
		spectrumOpacity: 0.95,
		spectrumSpan: 0.9,
		spectrumFrameMemoryEnabled: false,
		spectrumGhostFrames: 0,
		spectrumMotionTrails: 0,
		spectrumAfterglow: 0,
		spectrumShockwaveBandThresholds: {
			...DEFAULT_SHOCKWAVE_BAND_THRESHOLDS
		}
	};
}

/** Neon + RGB split + gradient flow — glitch-forward demo. */
export const SPECTRUM_PROFILE_NEON_GLITCH: Partial<SpectrumProfileSettings> = {
	...baseClassicWaveLinear(),
	spectrumManualGlow: true,
	spectrumManualGlowMode: 'core-halo',
	spectrumNeonCore: true,
	spectrumNeonCoreIntensity: 1,
	spectrumNeonCoreWidth: 0.5,
	spectrumRgbSplit: true,
	spectrumRgbSplitAmount: 0.85,
	spectrumGradientFlow: true,
	spectrumGradientFlowSpeed: 0.75,
	spectrumGradientFlowAudio: true,
	spectrumPeakSparks: false,
	spectrumEchoTrace: false
};

/** Echo + sparks — motion accent demo. */
export const SPECTRUM_PROFILE_ECHO_SPARKS: Partial<SpectrumProfileSettings> = {
	...baseClassicWaveLinear(),
	spectrumManualGlow: false,
	spectrumNeonCore: false,
	spectrumRgbSplit: false,
	spectrumGradientFlow: false,
	spectrumPeakSparks: true,
	spectrumPeakSparksAmount: 8,
	spectrumPeakSparksSize: 5,
	spectrumPeakSparksThreshold: 0.35,
	spectrumEchoTrace: true,
	spectrumEchoTraceCount: 2,
	spectrumEchoTraceOpacity: 0.6,
	spectrumEchoTraceOffset: 10,
	spectrumEchoTraceDecay: 0.78
};

export const SPECTRUM_VISUAL_ACCENTS_DEMO_PROFILE_SLOTS = [
	{ name: 'Neon Glitch (FX demo)', values: SPECTRUM_PROFILE_NEON_GLITCH },
	{ name: 'Echo Sparks (FX demo)', values: SPECTRUM_PROFILE_ECHO_SPARKS }
] as const;
