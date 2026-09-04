import type { WallpaperState } from '@/types/wallpaper';
import { createDefaultSpectrumInstance } from './spectrumInstanceModel';
import { DEFAULT_SHOCKWAVE_BAND_THRESHOLDS } from './shockwaveCalibration';
import { DEFAULT_SPECTRUM_LIQUID_LAYERS } from '../presets/spectrumLiquidLayers';

/**
 * Factory defaults for every spectrum key of `WallpaperState`.
 *
 * These used to live inline in `lib/constants.ts`, which forced the domain to
 * import `DEFAULT_STATE` back out of `lib/` to hydrate a profile — a genuine
 * runtime cycle (`spectrumProfileHydrate -> lib/constants -> lib/featureProfiles
 * -> spectrumProfileHydrate`) that crashed module initialisation whenever the
 * load order shifted. Owning the values here breaks it: `lib/constants` now
 * spreads this in, and nothing inside the domain reaches back up.
 *
 * `spectrumProfileSlots` / `spectrumSecondProfileSlots` deliberately stay in
 * `lib/constants`: they are built by `lib/featureProfiles`, which itself calls
 * into this domain, so moving them here would just re-open the cycle.
 *
 * The identity helper keeps the exact literal types of the object (so
 * `spectrumFamily` stays `'classic'`, not `string`) while still checking every
 * key and value against `WallpaperState`. A typo or a stale key fails to
 * compile here rather than silently drifting from the store.
 */
const spectrumDefaults = <T extends Partial<WallpaperState>>(value: T): T =>
	value;

export const DEFAULT_SPECTRUM_STATE = spectrumDefaults({
	spectrumEnabled: true,
	spectrumMainVisible: true,
	spectrumInstances: [createDefaultSpectrumInstance()],
	spectrumFamily: 'classic',
	spectrumFrameMemoryEnabled: false,
	spectrumAfterglow: 0,
	spectrumMotionTrails: 0,
	spectrumGhostFrames: 0,
	spectrumFrameHistoryDepth: 1,
	spectrumGainExpressiveness: 0.5,
	// Defaults preserve the previously hardcoded envelope shape used by
	// CircularSpectrum.energyEnvelope.tick().
	spectrumEnvelopeAttack: 0.52,
	spectrumEnvelopeRelease: 0.12,
	spectrumEnvelopeReactivitySpeed: 1.55,
	spectrumEnvelopePeakWindow: 1.8,
	spectrumEnvelopePeakFloor: 0.06,
	spectrumEnvelopePunch: 0.04,
	spectrumPeakRibbonsEnabled: false,
	spectrumPeakRibbons: 0,
	spectrumBassShockwaveEnabled: false,
	spectrumBassShockwave: 0,
	spectrumShockwaveBandMode: 'bass',
	spectrumShockwaveBandThresholds: {
		...DEFAULT_SHOCKWAVE_BAND_THRESHOLDS
	},
	spectrumShockwaveThickness: 1,
	spectrumShockwaveOpacity: 1,
	spectrumShockwaveBlur: 1,
	spectrumShockwaveColorMode: 'cycle',
	spectrumEnergyBloomEnabled: false,
	spectrumEnergyBloom: 0,
	spectrumPeakRibbonAngle: 0,
	spectrumFigureRotationSpeed: 0,
	spectrumOscilloscopeLineWidth: 2,
	spectrumTunnelRingCount: 12,
	spectrumTunnelDepthFalloff: 0.62,
	spectrumTunnelRingSpacing: 0.5,
	spectrumTunnelWallOpacity: 0.32,
	spectrumTunnelPulseStrength: 0.55,
	spectrumTunnelAlternateRotation: false,
	...DEFAULT_SPECTRUM_LIQUID_LAYERS,
	spectrumSpiralTurns: 4,
	spectrumSpiralOuterRadius: 0.45,
	spectrumSpiralTightness: 1,
	spectrumSpiralShape: 'circle',
	spectrumSpiralLogarithmic: false,
	spectrumSpiralGradientStroke: false,
	spectrumSpiralArms: 1,
	spectrumSpiralAudioTurns: 0,
	spectrumSpiralDotShape: 'circle',
	spectrumSpiralStrokeWidth: 1,
	spectrumOscilloscopeScrollSpeed: 2,
	spectrumOscilloscopeReactiveWidth: true,
	spectrumOscilloscopePhosphor: true,
	spectrumOscilloscopePhosphorDecay: 0.12,
	spectrumOscilloscopeGrid: false,
	spectrumOscilloscopeGridDivisions: 8,
	spectrumDriveMode: 'audio',
	spectrumManualSections: 8,
	spectrumManualAddWeight: 0.6,
	spectrumManualAttack: 0.035,
	spectrumManualRelease: 0.15,
	spectrumManualBindings: [
		'1',
		'2',
		'3',
		'4',
		'5',
		'6',
		'7',
		'8',
		'9',
		'0',
		'-',
		'='
	],
	showSpectrumManualHud: true,
	spectrumMode: 'radial',
	spectrumLinearOrientation: 'horizontal',
	spectrumLinearDirection: 'normal',
	spectrumRadialShape: 'circle',
	spectrumRadialAngle: 0,
	spectrumRadialSharpness: 0,
	spectrumRadialFitLogo: true,
	spectrumFollowLogo: true,
	spectrumLogoGap: 8,
	spectrumSpan: 1,
	spectrumScale: 1,
	spectrumInnerRadius: 80,
	spectrumBarCount: 128,
	spectrumBarWidth: 2,
	spectrumMinHeight: 2,
	spectrumMaxHeight: 120,
	spectrumSmoothing: 0.75,
	spectrumOpacity: 0.9,
	spectrumGlowIntensity: 0.8,
	spectrumGlowReach: 1,
	spectrumGlowAudioAmount: 0,
	spectrumShadowBlur: 18,
	spectrumPrimaryColor: '#00ffff',
	spectrumSecondaryColor: '#ff00ff',
	spectrumColorSource: 'manual',
	spectrumColorMode: 'gradient',
	spectrumManualGlow: false,
	spectrumManualGlowMode: 'core-halo',
	spectrumGlowColorSource: 'manual',
	spectrumGlowColorMode: 'gradient',
	spectrumGlowPrimaryColor: '#00ffff',
	spectrumGlowSecondaryColor: '#ff00ff',
	spectrumPixelate: false,
	spectrumPixelateScale: 4,
	spectrumLedCellSize: 1,
	spectrumLedCellGap: 0.28,
	spectrumLedAngle: 0,
	spectrumLedShape: 'square',
	spectrumRgbSplit: false,
	spectrumRgbSplitAmount: 0.5,
	spectrumNeonCore: false,
	spectrumNeonCoreIntensity: 0.85,
	spectrumNeonCoreWidth: 0.35,
	spectrumGradientFlow: false,
	spectrumGradientFlowSpeed: 0.5,
	spectrumGradientFlowAudio: true,
	spectrumGradientFlowDirection: 'forward',
	spectrumPeakSparks: false,
	spectrumPeakSparksAmount: 6,
	spectrumPeakSparksSize: 3,
	spectrumPeakSparksThreshold: 0.45,
	spectrumEchoTrace: false,
	spectrumEchoTraceCount: 1,
	spectrumEchoTraceOpacity: 0.45,
	spectrumEchoTraceOffset: 6,
	spectrumEchoTraceDecay: 0.72,
	spectrumBandMode: 'auto',
	spectrumAudioSmoothing: 0.18,
	spectrumShape: 'bars',
	spectrumWaveFillOpacity: 0.28,
	spectrumRotationSpeed: 0,
	spectrumMirror: true,
	spectrumPeakHold: true,
	spectrumPeakDecay: 0.003,
	spectrumPositionX: 0,
	spectrumPositionY: 0,

	// Rotation drive. These eight sat at the far end of `DEFAULT_STATE`, under a
	// "Task 1" heading well below the Spectrum section — a hundred-odd lines from
	// the `spectrumRotationSpeed` they modify. Reunited here.
	spectrumRotationDrive: 'fixed',
	spectrumRotationAudioAmount: 1.2,
	spectrumRotationChannel: 'full',
	spectrumRotationDirection: 'cw',
	spectrumRotationSmoothing: 0.85,
	spectrumRotationInvertOnLowEnergy: false,
	spectrumRotationInvertThreshold: 0.08,
	spectrumRotationInvertHoldMs: 180
});
