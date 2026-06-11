import type {
	SpectrumInstance,
	SpectrumInstanceSettings
} from '@/types/wallpaper';
import {
	normalizeSpectrumFamily,
	normalizeSpectrumShape
} from '@/features/spectrum/spectrumControlConfig';
import { DEFAULT_SHOCKWAVE_BAND_THRESHOLDS } from '@/features/spectrum/shockwaveCalibration';

/** Hard cap on simultaneous spectrums (main + extra instances). Raise this
 *  when the editor learns to manage an arbitrary list; everything else is
 *  already instance-count agnostic. */
export const SPECTRUM_MAX_INSTANCES = 2;

/** Identifier of the single extra instance available today ("Spectrum 2").
 *  Future instances should generate unique ids; runtime state is keyed by id. */
export const SECOND_SPECTRUM_INSTANCE_ID = 's2';

export function getSpectrumInstanceRuntimeKey(instanceId: string): string {
	return `instance-${instanceId}`;
}

/**
 * Every per-instance setting, named exactly like the main spectrum's flat
 * store keys. The main spectrum (instance 0) keeps living in the flat
 * WallpaperState keys; extra instances carry this same shape inside
 * `spectrumInstances`, so renderer/placement/color code can run unchanged on
 * `{ ...state, ...instanceSettings }`.
 *
 * Excluded on purpose: `spectrumEnabled` (per-instance `enabled` instead) and
 * the manual-drive keys (`spectrumDriveMode`, `spectrumManual*`) which stay
 * global so the keyboard runtime drives every instance at once.
 */
export const SPECTRUM_INSTANCE_SETTING_KEYS = [
	'spectrumFamily',
	'spectrumFrameMemoryEnabled',
	'spectrumAfterglow',
	'spectrumMotionTrails',
	'spectrumGhostFrames',
	'spectrumFrameHistoryDepth',
	'spectrumGainExpressiveness',
	'spectrumEnvelopeAttack',
	'spectrumEnvelopeRelease',
	'spectrumEnvelopeReactivitySpeed',
	'spectrumEnvelopePeakWindow',
	'spectrumEnvelopePeakFloor',
	'spectrumEnvelopePunch',
	'spectrumPeakRibbonsEnabled',
	'spectrumPeakRibbons',
	'spectrumBassShockwaveEnabled',
	'spectrumBassShockwave',
	'spectrumShockwaveBandMode',
	'spectrumShockwaveBandThresholds',
	'spectrumShockwaveThickness',
	'spectrumShockwaveOpacity',
	'spectrumShockwaveBlur',
	'spectrumShockwaveColorMode',
	'spectrumEnergyBloomEnabled',
	'spectrumEnergyBloom',
	'spectrumPeakRibbonAngle',
	'spectrumFigureRotationSpeed',
	'spectrumOscilloscopeLineWidth',
	'spectrumTunnelRingCount',
	'spectrumTunnelDepthFalloff',
	'spectrumTunnelRingSpacing',
	'spectrumTunnelWallOpacity',
	'spectrumTunnelPulseStrength',
	'spectrumTunnelAlternateRotation',
	'spectrumLiquidLayer1Opacity',
	'spectrumLiquidLayer2Opacity',
	'spectrumLiquidLayer3Opacity',
	'spectrumLiquidLayer1Amp',
	'spectrumLiquidLayer2Amp',
	'spectrumLiquidLayer3Amp',
	'spectrumLiquidLayer1Fill',
	'spectrumLiquidLayer2Fill',
	'spectrumLiquidLayer3Fill',
	'spectrumLiquidLayer1Speed',
	'spectrumLiquidLayer2Speed',
	'spectrumLiquidLayer3Speed',
	'spectrumLiquidLayer1RotationSpeed',
	'spectrumLiquidLayer2RotationSpeed',
	'spectrumLiquidLayer3RotationSpeed',
	'spectrumLiquidLayer1Shape',
	'spectrumLiquidLayer2Shape',
	'spectrumLiquidLayer3Shape',
	'spectrumLiquidLayer1RigidShape',
	'spectrumLiquidLayer2RigidShape',
	'spectrumLiquidLayer3RigidShape',
	'spectrumSpiralTurns',
	'spectrumSpiralOuterRadius',
	'spectrumSpiralTightness',
	'spectrumSpiralShape',
	'spectrumSpiralLogarithmic',
	'spectrumSpiralGradientStroke',
	'spectrumSpiralArms',
	'spectrumSpiralAudioTurns',
	'spectrumSpiralDotShape',
	'spectrumSpiralStrokeWidth',
	'spectrumOscilloscopeScrollSpeed',
	'spectrumOscilloscopeReactiveWidth',
	'spectrumOscilloscopePhosphor',
	'spectrumOscilloscopePhosphorDecay',
	'spectrumOscilloscopeGrid',
	'spectrumOscilloscopeGridDivisions',
	'spectrumMode',
	'spectrumLinearOrientation',
	'spectrumLinearDirection',
	'spectrumRadialShape',
	'spectrumRadialAngle',
	'spectrumRadialFitLogo',
	'spectrumFollowLogo',
	'spectrumLogoGap',
	'spectrumSpan',
	'spectrumInnerRadius',
	'spectrumBarCount',
	'spectrumBarWidth',
	'spectrumMinHeight',
	'spectrumMaxHeight',
	'spectrumSmoothing',
	'spectrumOpacity',
	'spectrumGlowIntensity',
	'spectrumGlowReach',
	'spectrumGlowAudioAmount',
	'spectrumShadowBlur',
	'spectrumPrimaryColor',
	'spectrumSecondaryColor',
	'spectrumColorSource',
	'spectrumColorMode',
	'spectrumBandMode',
	'spectrumAudioSmoothing',
	'spectrumShape',
	'spectrumWaveFillOpacity',
	'spectrumRotationSpeed',
	'spectrumRotationDrive',
	'spectrumRotationAudioAmount',
	'spectrumRotationChannel',
	'spectrumRotationDirection',
	'spectrumRotationSmoothing',
	'spectrumMirror',
	'spectrumPeakHold',
	'spectrumPeakDecay',
	'spectrumPositionX',
	'spectrumPositionY'
] as const satisfies ReadonlyArray<keyof SpectrumInstanceSettings>;

/** Defaults mirror the legacy circular-clone defaults (with its 0.9 scale
 *  multiplier folded into heights/spiral radius) so a fresh instance looks
 *  exactly like the old default clone. */
export function createDefaultSpectrumInstanceSettings(): SpectrumInstanceSettings {
	return {
		spectrumFamily: 'classic',
		spectrumFrameMemoryEnabled: false,
		spectrumAfterglow: 0,
		spectrumMotionTrails: 0,
		spectrumGhostFrames: 0,
		spectrumFrameHistoryDepth: 1,
		spectrumGainExpressiveness: 0.5,
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
		spectrumTunnelRingCount: 0,
		spectrumTunnelDepthFalloff: 0.62,
		spectrumTunnelRingSpacing: 0.5,
		spectrumTunnelWallOpacity: 0.32,
		spectrumTunnelPulseStrength: 0.55,
		spectrumTunnelAlternateRotation: false,
		spectrumLiquidLayer1Opacity: 0.55,
		spectrumLiquidLayer2Opacity: 0.78,
		spectrumLiquidLayer3Opacity: 1,
		spectrumLiquidLayer1Amp: 1,
		spectrumLiquidLayer2Amp: 0.65,
		spectrumLiquidLayer3Amp: 0.35,
		spectrumLiquidLayer1Fill: 0.85,
		spectrumLiquidLayer2Fill: 0.65,
		spectrumLiquidLayer3Fill: 0.45,
		spectrumLiquidLayer1Speed: 1,
		spectrumLiquidLayer2Speed: 0.75,
		spectrumLiquidLayer3Speed: 0.5,
		spectrumLiquidLayer1RotationSpeed: 0,
		spectrumLiquidLayer2RotationSpeed: 0,
		spectrumLiquidLayer3RotationSpeed: 0,
		spectrumLiquidLayer1Shape: 'circle',
		spectrumLiquidLayer2Shape: 'circle',
		spectrumLiquidLayer3Shape: 'circle',
		spectrumLiquidLayer1RigidShape: false,
		spectrumLiquidLayer2RigidShape: false,
		spectrumLiquidLayer3RigidShape: false,
		spectrumSpiralTurns: 4,
		spectrumSpiralOuterRadius: 0.405,
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
		spectrumMode: 'radial',
		spectrumLinearOrientation: 'horizontal',
		spectrumLinearDirection: 'normal',
		spectrumRadialShape: 'circle',
		spectrumRadialAngle: 0,
		spectrumRadialFitLogo: true,
		spectrumFollowLogo: true,
		spectrumLogoGap: 8,
		spectrumSpan: 1,
		spectrumInnerRadius: 80,
		spectrumBarCount: 96,
		spectrumBarWidth: 2,
		spectrumMinHeight: 1.8,
		spectrumMaxHeight: 86.4,
		spectrumSmoothing: 0.78,
		spectrumOpacity: 0.72,
		spectrumGlowIntensity: 0.7,
		spectrumGlowReach: 1,
		spectrumGlowAudioAmount: 0,
		spectrumShadowBlur: 16,
		spectrumPrimaryColor: '#00ffff',
		spectrumSecondaryColor: '#ff00ff',
		spectrumColorSource: 'manual',
		spectrumColorMode: 'gradient',
		spectrumBandMode: 'auto',
		spectrumAudioSmoothing: 0.18,
		spectrumShape: 'bars',
		spectrumWaveFillOpacity: 0.28,
		spectrumRotationSpeed: 0,
		spectrumRotationDrive: 'fixed',
		spectrumRotationAudioAmount: 1.2,
		spectrumRotationChannel: 'full',
		spectrumRotationDirection: 'cw',
		spectrumRotationSmoothing: 0.85,
		spectrumMirror: true,
		spectrumPeakHold: true,
		spectrumPeakDecay: 0.003,
		spectrumPositionX: 0,
		spectrumPositionY: 0
	};
}

export function createDefaultSpectrumInstance(): SpectrumInstance {
	return {
		id: SECOND_SPECTRUM_INSTANCE_ID,
		enabled: false,
		...createDefaultSpectrumInstanceSettings()
	};
}

/** Maps each instance key to its legacy `spectrumClone*` counterpart (null =
 *  the legacy clone had no own value and inherited the main spectrum's). */
const LEGACY_CLONE_KEY_OVERRIDES: Partial<
	Record<(typeof SPECTRUM_INSTANCE_SETTING_KEYS)[number], string | null>
> = {
	spectrumShape: 'spectrumCloneStyle',
	spectrumLogoGap: 'spectrumCloneGap',
	spectrumMode: null,
	spectrumLinearOrientation: null,
	spectrumLinearDirection: null,
	spectrumSpan: null,
	spectrumInnerRadius: null
};

function legacyCloneKeyFor(
	key: (typeof SPECTRUM_INSTANCE_SETTING_KEYS)[number]
): string | null {
	if (key in LEGACY_CLONE_KEY_OVERRIDES) {
		return LEGACY_CLONE_KEY_OVERRIDES[key] ?? null;
	}
	return key.replace(/^spectrum/, 'spectrumClone');
}

export function hasLegacySpectrumCloneData(
	source: Record<string, unknown>
): boolean {
	return (
		source.spectrumCircularClone !== undefined ||
		source.spectrumCloneOpacity !== undefined ||
		source.spectrumCloneFamily !== undefined
	);
}

/**
 * Builds the "Spectrum 2" instance from any object still carrying the legacy
 * flat `spectrumClone*` keys (persisted stores < v86, old profile slots,
 * scene presets, imported bundles). Mirrors the old getCloneSpectrumState
 * math: the clone scale multiplier is folded into heights / spiral radius,
 * and the keys the clone used to inherit from the main spectrum (span, inner
 * radius, linear layout) are copied from the source's main values.
 */
export function convertLegacySpectrumCloneState(
	source: Record<string, unknown>
): SpectrumInstance {
	const settings = createDefaultSpectrumInstanceSettings() as unknown as Record<
		string,
		unknown
	>;
	for (const key of SPECTRUM_INSTANCE_SETTING_KEYS) {
		const legacyKey = legacyCloneKeyFor(key);
		const value = legacyKey === null ? source[key] : source[legacyKey];
		if (value !== undefined) settings[key] = value;
	}
	// The legacy clone rendered radial-only regardless of the main mode.
	settings.spectrumMode = 'radial';
	settings.spectrumFamily = normalizeSpectrumFamily(
		settings.spectrumFamily as SpectrumInstanceSettings['spectrumFamily']
	);
	settings.spectrumShape = normalizeSpectrumShape(
		settings.spectrumShape as SpectrumInstanceSettings['spectrumShape']
	);

	const rawScale = source.spectrumCloneScale;
	const scale = typeof rawScale === 'number' && Number.isFinite(rawScale)
		? rawScale
		: 0.9;
	const num = (v: unknown, fallback: number): number =>
		typeof v === 'number' && Number.isFinite(v) ? v : fallback;
	settings.spectrumMinHeight = Math.max(
		1,
		num(settings.spectrumMinHeight, 2) * Math.max(0.5, scale)
	);
	settings.spectrumMaxHeight = Math.max(
		12,
		num(settings.spectrumMaxHeight, 96) * scale
	);
	settings.spectrumSpiralOuterRadius =
		num(settings.spectrumSpiralOuterRadius, 0.45) * Math.max(0.2, scale);
	settings.spectrumBarWidth = Math.max(1, num(settings.spectrumBarWidth, 2));
	settings.spectrumRotationSpeed = Math.abs(
		num(settings.spectrumRotationSpeed, 0)
	);

	return {
		id: SECOND_SPECTRUM_INSTANCE_ID,
		enabled: source.spectrumCircularClone === true,
		...(settings as unknown as SpectrumInstanceSettings)
	};
}
