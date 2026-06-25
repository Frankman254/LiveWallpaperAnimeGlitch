import { DEFAULT_STATE } from '@/lib/constants';
import { normalizeSpectrumSettings } from '@/features/spectrum/spectrumStateTransforms';
import {
	normalizeSpectrumFamily,
	normalizeSpectrumShape
} from '@/features/spectrum/spectrumControlConfig';
import type {
	SpectrumInstance,
	SpectrumProfileSettings
} from '@/types/wallpaper';
import {
	convertLegacySpectrumCloneState,
	createDefaultSpectrumInstance,
	hasLegacySpectrumCloneData
} from '@/features/spectrum/spectrumInstanceModel';

/**
 * Fills missing spectrum profile fields from defaults (same as applying a preset).
 * Use whenever spectrum settings are merged from partial sources (e.g. scene presets).
 */
export function hydrateSpectrumProfileValues(
	values: Partial<SpectrumProfileSettings>
): SpectrumProfileSettings {
	return normalizeSpectrumSettings({
		// Loading a spectrum profile enables the master feature, while preserving
		// the per-layer visibility stored by the profile (main visible +
		// spectrumInstances[].enabled).
		spectrumEnabled: true,
		spectrumMainVisible:
			values.spectrumMainVisible ?? DEFAULT_STATE.spectrumMainVisible,
		spectrumFamily: normalizeSpectrumFamily(
			values.spectrumFamily ?? DEFAULT_STATE.spectrumFamily
		),
		// Back-compat: slots/scenes saved before this enable flag existed have no
		// `spectrumFrameMemoryEnabled`. Infer it from the intensity values so an
		// old profile that used afterglow/ghost/trails keeps rendering instead of
		// silently going dark; an all-zero profile stays off.
		spectrumFrameMemoryEnabled:
			values.spectrumFrameMemoryEnabled ??
			((values.spectrumAfterglow ?? 0) > 0 ||
				(values.spectrumGhostFrames ?? 0) > 0 ||
				(values.spectrumMotionTrails ?? 0) > 0),
		spectrumAfterglow:
			values.spectrumAfterglow ?? DEFAULT_STATE.spectrumAfterglow,
		spectrumMotionTrails:
			values.spectrumMotionTrails ?? DEFAULT_STATE.spectrumMotionTrails,
		spectrumGhostFrames:
			values.spectrumGhostFrames ?? DEFAULT_STATE.spectrumGhostFrames,
		spectrumFrameHistoryDepth:
			values.spectrumFrameHistoryDepth ??
			DEFAULT_STATE.spectrumFrameHistoryDepth,
		spectrumGainExpressiveness:
			values.spectrumGainExpressiveness ??
			DEFAULT_STATE.spectrumGainExpressiveness,
		spectrumEnvelopeAttack:
			values.spectrumEnvelopeAttack ??
			DEFAULT_STATE.spectrumEnvelopeAttack,
		spectrumEnvelopeRelease:
			values.spectrumEnvelopeRelease ??
			DEFAULT_STATE.spectrumEnvelopeRelease,
		spectrumEnvelopeReactivitySpeed:
			values.spectrumEnvelopeReactivitySpeed ??
			DEFAULT_STATE.spectrumEnvelopeReactivitySpeed,
		spectrumEnvelopePeakWindow:
			values.spectrumEnvelopePeakWindow ??
			DEFAULT_STATE.spectrumEnvelopePeakWindow,
		spectrumEnvelopePeakFloor:
			values.spectrumEnvelopePeakFloor ??
			DEFAULT_STATE.spectrumEnvelopePeakFloor,
		spectrumEnvelopePunch:
			values.spectrumEnvelopePunch ?? DEFAULT_STATE.spectrumEnvelopePunch,
		spectrumPeakRibbonsEnabled:
			values.spectrumPeakRibbonsEnabled ??
			(values.spectrumPeakRibbons ?? 0) > 0,
		spectrumPeakRibbons:
			values.spectrumPeakRibbons ?? DEFAULT_STATE.spectrumPeakRibbons,
		spectrumBassShockwaveEnabled:
			values.spectrumBassShockwaveEnabled ??
			(values.spectrumBassShockwave ?? 0) > 0,
		spectrumBassShockwave:
			values.spectrumBassShockwave ?? DEFAULT_STATE.spectrumBassShockwave,
		spectrumShockwaveBandMode:
			values.spectrumShockwaveBandMode ??
			DEFAULT_STATE.spectrumShockwaveBandMode,
		spectrumShockwaveBandThresholds: {
			...DEFAULT_STATE.spectrumShockwaveBandThresholds,
			...values.spectrumShockwaveBandThresholds
		},
		spectrumShockwaveThickness:
			values.spectrumShockwaveThickness ??
			DEFAULT_STATE.spectrumShockwaveThickness,
		spectrumShockwaveOpacity:
			values.spectrumShockwaveOpacity ??
			DEFAULT_STATE.spectrumShockwaveOpacity,
		spectrumShockwaveBlur:
			values.spectrumShockwaveBlur ?? DEFAULT_STATE.spectrumShockwaveBlur,
		spectrumShockwaveColorMode:
			values.spectrumShockwaveColorMode ??
			DEFAULT_STATE.spectrumShockwaveColorMode,
		spectrumEnergyBloomEnabled:
			values.spectrumEnergyBloomEnabled ??
			(values.spectrumEnergyBloom ?? 0) > 0,
		spectrumEnergyBloom:
			values.spectrumEnergyBloom ?? DEFAULT_STATE.spectrumEnergyBloom,
		spectrumPeakRibbonAngle:
			values.spectrumPeakRibbonAngle ??
			DEFAULT_STATE.spectrumPeakRibbonAngle,
		spectrumFigureRotationSpeed:
			values.spectrumFigureRotationSpeed ??
			DEFAULT_STATE.spectrumFigureRotationSpeed,
		spectrumOscilloscopeLineWidth:
			values.spectrumOscilloscopeLineWidth ??
			DEFAULT_STATE.spectrumOscilloscopeLineWidth,
		spectrumTunnelRingCount:
			values.spectrumTunnelRingCount ??
			DEFAULT_STATE.spectrumTunnelRingCount,
		spectrumTunnelDepthFalloff:
			values.spectrumTunnelDepthFalloff ??
			DEFAULT_STATE.spectrumTunnelDepthFalloff,
		spectrumTunnelRingSpacing:
			values.spectrumTunnelRingSpacing ??
			DEFAULT_STATE.spectrumTunnelRingSpacing,
		spectrumTunnelWallOpacity:
			values.spectrumTunnelWallOpacity ??
			DEFAULT_STATE.spectrumTunnelWallOpacity,
		spectrumTunnelPulseStrength:
			values.spectrumTunnelPulseStrength ??
			DEFAULT_STATE.spectrumTunnelPulseStrength,
		spectrumTunnelAlternateRotation:
			values.spectrumTunnelAlternateRotation ??
			DEFAULT_STATE.spectrumTunnelAlternateRotation,
		spectrumLiquidLayer1Opacity:
			values.spectrumLiquidLayer1Opacity ??
			DEFAULT_STATE.spectrumLiquidLayer1Opacity,
		spectrumLiquidLayer2Opacity:
			values.spectrumLiquidLayer2Opacity ??
			DEFAULT_STATE.spectrumLiquidLayer2Opacity,
		spectrumLiquidLayer3Opacity:
			values.spectrumLiquidLayer3Opacity ??
			DEFAULT_STATE.spectrumLiquidLayer3Opacity,
		spectrumLiquidLayer1Amp:
			values.spectrumLiquidLayer1Amp ??
			DEFAULT_STATE.spectrumLiquidLayer1Amp,
		spectrumLiquidLayer2Amp:
			values.spectrumLiquidLayer2Amp ??
			DEFAULT_STATE.spectrumLiquidLayer2Amp,
		spectrumLiquidLayer3Amp:
			values.spectrumLiquidLayer3Amp ??
			DEFAULT_STATE.spectrumLiquidLayer3Amp,
		spectrumLiquidLayer1Fill:
			values.spectrumLiquidLayer1Fill ??
			DEFAULT_STATE.spectrumLiquidLayer1Fill,
		spectrumLiquidLayer2Fill:
			values.spectrumLiquidLayer2Fill ??
			DEFAULT_STATE.spectrumLiquidLayer2Fill,
		spectrumLiquidLayer3Fill:
			values.spectrumLiquidLayer3Fill ??
			DEFAULT_STATE.spectrumLiquidLayer3Fill,
		spectrumLiquidLayer1Speed:
			values.spectrumLiquidLayer1Speed ??
			DEFAULT_STATE.spectrumLiquidLayer1Speed,
		spectrumLiquidLayer2Speed:
			values.spectrumLiquidLayer2Speed ??
			DEFAULT_STATE.spectrumLiquidLayer2Speed,
		spectrumLiquidLayer3Speed:
			values.spectrumLiquidLayer3Speed ??
			DEFAULT_STATE.spectrumLiquidLayer3Speed,
		spectrumLiquidLayer1RotationSpeed:
			values.spectrumLiquidLayer1RotationSpeed ??
			DEFAULT_STATE.spectrumLiquidLayer1RotationSpeed,
		spectrumLiquidLayer2RotationSpeed:
			values.spectrumLiquidLayer2RotationSpeed ??
			DEFAULT_STATE.spectrumLiquidLayer2RotationSpeed,
		spectrumLiquidLayer3RotationSpeed:
			values.spectrumLiquidLayer3RotationSpeed ??
			DEFAULT_STATE.spectrumLiquidLayer3RotationSpeed,
		spectrumLiquidLayer1Shape:
			values.spectrumLiquidLayer1Shape ??
			DEFAULT_STATE.spectrumLiquidLayer1Shape,
		spectrumLiquidLayer2Shape:
			values.spectrumLiquidLayer2Shape ??
			DEFAULT_STATE.spectrumLiquidLayer2Shape,
		spectrumLiquidLayer3Shape:
			values.spectrumLiquidLayer3Shape ??
			DEFAULT_STATE.spectrumLiquidLayer3Shape,
		spectrumLiquidLayer1RigidShape:
			typeof values.spectrumLiquidLayer1RigidShape === 'boolean'
				? values.spectrumLiquidLayer1RigidShape
				: DEFAULT_STATE.spectrumLiquidLayer1RigidShape,
		spectrumLiquidLayer2RigidShape:
			typeof values.spectrumLiquidLayer2RigidShape === 'boolean'
				? values.spectrumLiquidLayer2RigidShape
				: DEFAULT_STATE.spectrumLiquidLayer2RigidShape,
		spectrumLiquidLayer3RigidShape:
			typeof values.spectrumLiquidLayer3RigidShape === 'boolean'
				? values.spectrumLiquidLayer3RigidShape
				: DEFAULT_STATE.spectrumLiquidLayer3RigidShape,
		spectrumSpiralTurns:
			values.spectrumSpiralTurns ?? DEFAULT_STATE.spectrumSpiralTurns,
		spectrumSpiralOuterRadius:
			values.spectrumSpiralOuterRadius ??
			DEFAULT_STATE.spectrumSpiralOuterRadius,
		spectrumSpiralTightness:
			values.spectrumSpiralTightness ??
			DEFAULT_STATE.spectrumSpiralTightness,
		spectrumSpiralShape:
			values.spectrumSpiralShape ?? DEFAULT_STATE.spectrumSpiralShape,
		spectrumSpiralLogarithmic:
			values.spectrumSpiralLogarithmic ??
			DEFAULT_STATE.spectrumSpiralLogarithmic,
		spectrumSpiralGradientStroke:
			values.spectrumSpiralGradientStroke ??
			DEFAULT_STATE.spectrumSpiralGradientStroke,
		spectrumSpiralArms:
			values.spectrumSpiralArms ?? DEFAULT_STATE.spectrumSpiralArms,
		spectrumSpiralAudioTurns:
			values.spectrumSpiralAudioTurns ??
			DEFAULT_STATE.spectrumSpiralAudioTurns,
		spectrumSpiralDotShape:
			values.spectrumSpiralDotShape ??
			DEFAULT_STATE.spectrumSpiralDotShape,
		spectrumSpiralStrokeWidth:
			values.spectrumSpiralStrokeWidth ??
			DEFAULT_STATE.spectrumSpiralStrokeWidth,
		spectrumOscilloscopeScrollSpeed:
			values.spectrumOscilloscopeScrollSpeed ??
			DEFAULT_STATE.spectrumOscilloscopeScrollSpeed,
		spectrumOscilloscopeReactiveWidth:
			typeof values.spectrumOscilloscopeReactiveWidth === 'boolean'
				? values.spectrumOscilloscopeReactiveWidth
				: DEFAULT_STATE.spectrumOscilloscopeReactiveWidth,
		spectrumOscilloscopePhosphor:
			typeof values.spectrumOscilloscopePhosphor === 'boolean'
				? values.spectrumOscilloscopePhosphor
				: DEFAULT_STATE.spectrumOscilloscopePhosphor,
		spectrumOscilloscopePhosphorDecay:
			values.spectrumOscilloscopePhosphorDecay ??
			DEFAULT_STATE.spectrumOscilloscopePhosphorDecay,
		spectrumOscilloscopeGrid:
			typeof values.spectrumOscilloscopeGrid === 'boolean'
				? values.spectrumOscilloscopeGrid
				: DEFAULT_STATE.spectrumOscilloscopeGrid,
		spectrumOscilloscopeGridDivisions:
			values.spectrumOscilloscopeGridDivisions ??
			DEFAULT_STATE.spectrumOscilloscopeGridDivisions,
		spectrumDriveMode:
			values.spectrumDriveMode ?? DEFAULT_STATE.spectrumDriveMode,
		spectrumManualSections:
			values.spectrumManualSections ??
			DEFAULT_STATE.spectrumManualSections,
		spectrumManualAddWeight:
			values.spectrumManualAddWeight ??
			DEFAULT_STATE.spectrumManualAddWeight,
		spectrumManualAttack:
			values.spectrumManualAttack ?? DEFAULT_STATE.spectrumManualAttack,
		spectrumManualRelease:
			values.spectrumManualRelease ?? DEFAULT_STATE.spectrumManualRelease,
		spectrumMode: values.spectrumMode ?? DEFAULT_STATE.spectrumMode,
		spectrumLinearOrientation:
			values.spectrumLinearOrientation ??
			DEFAULT_STATE.spectrumLinearOrientation,
		spectrumLinearDirection:
			values.spectrumLinearDirection ??
			DEFAULT_STATE.spectrumLinearDirection,
		spectrumRadialShape:
			values.spectrumRadialShape ?? DEFAULT_STATE.spectrumRadialShape,
		spectrumRadialAngle:
			values.spectrumRadialAngle ?? DEFAULT_STATE.spectrumRadialAngle,
		spectrumRadialFitLogo:
			values.spectrumRadialFitLogo ?? DEFAULT_STATE.spectrumRadialFitLogo,
		spectrumFollowLogo:
			values.spectrumFollowLogo ?? DEFAULT_STATE.spectrumFollowLogo,
		spectrumLogoGap:
			values.spectrumLogoGap ?? DEFAULT_STATE.spectrumLogoGap,
		spectrumSpan: values.spectrumSpan ?? DEFAULT_STATE.spectrumSpan,
		spectrumScale: values.spectrumScale ?? DEFAULT_STATE.spectrumScale,
		spectrumInnerRadius:
			values.spectrumInnerRadius ?? DEFAULT_STATE.spectrumInnerRadius,
		spectrumBarCount:
			values.spectrumBarCount ?? DEFAULT_STATE.spectrumBarCount,
		spectrumBarWidth:
			values.spectrumBarWidth ?? DEFAULT_STATE.spectrumBarWidth,
		spectrumMinHeight:
			values.spectrumMinHeight ?? DEFAULT_STATE.spectrumMinHeight,
		spectrumMaxHeight:
			values.spectrumMaxHeight ?? DEFAULT_STATE.spectrumMaxHeight,
		spectrumSmoothing:
			values.spectrumSmoothing ?? DEFAULT_STATE.spectrumSmoothing,
		spectrumOpacity:
			values.spectrumOpacity ?? DEFAULT_STATE.spectrumOpacity,
		spectrumGlowIntensity:
			values.spectrumGlowIntensity ?? DEFAULT_STATE.spectrumGlowIntensity,
		spectrumGlowReach:
			values.spectrumGlowReach ?? DEFAULT_STATE.spectrumGlowReach,
		spectrumGlowAudioAmount:
			values.spectrumGlowAudioAmount ??
			DEFAULT_STATE.spectrumGlowAudioAmount,
		spectrumShadowBlur:
			values.spectrumShadowBlur ?? DEFAULT_STATE.spectrumShadowBlur,
		spectrumPrimaryColor:
			values.spectrumPrimaryColor ?? DEFAULT_STATE.spectrumPrimaryColor,
		spectrumSecondaryColor:
			values.spectrumSecondaryColor ??
			DEFAULT_STATE.spectrumSecondaryColor,
		spectrumColorSource:
			values.spectrumColorSource ?? DEFAULT_STATE.spectrumColorSource,
		spectrumColorMode:
			values.spectrumColorMode ?? DEFAULT_STATE.spectrumColorMode,
		spectrumManualGlow:
			values.spectrumManualGlow ?? DEFAULT_STATE.spectrumManualGlow,
		spectrumManualGlowMode:
			values.spectrumManualGlowMode ??
			DEFAULT_STATE.spectrumManualGlowMode,
		spectrumGlowColorSource: values.spectrumGlowColorSource ?? 'manual',
		spectrumGlowColorMode: values.spectrumGlowColorMode ?? 'gradient',
		spectrumGlowPrimaryColor:
			values.spectrumGlowPrimaryColor ??
			values.spectrumPrimaryColor ??
			DEFAULT_STATE.spectrumGlowPrimaryColor,
		spectrumGlowSecondaryColor:
			values.spectrumGlowSecondaryColor ??
			values.spectrumSecondaryColor ??
			DEFAULT_STATE.spectrumGlowSecondaryColor,
		spectrumPixelate:
			values.spectrumPixelate ?? DEFAULT_STATE.spectrumPixelate,
		spectrumPixelateScale:
			values.spectrumPixelateScale ?? DEFAULT_STATE.spectrumPixelateScale,
		spectrumLedCellSize:
			values.spectrumLedCellSize ?? DEFAULT_STATE.spectrumLedCellSize,
		spectrumLedCellGap:
			values.spectrumLedCellGap ?? DEFAULT_STATE.spectrumLedCellGap,
		spectrumLedAngle:
			values.spectrumLedAngle ?? DEFAULT_STATE.spectrumLedAngle,
		spectrumLedShape:
			values.spectrumLedShape ?? DEFAULT_STATE.spectrumLedShape,
		spectrumRgbSplit:
			values.spectrumRgbSplit ?? DEFAULT_STATE.spectrumRgbSplit,
		spectrumRgbSplitAmount:
			values.spectrumRgbSplitAmount ??
			DEFAULT_STATE.spectrumRgbSplitAmount,
		spectrumNeonCore:
			values.spectrumNeonCore ?? DEFAULT_STATE.spectrumNeonCore,
		spectrumNeonCoreIntensity:
			values.spectrumNeonCoreIntensity ??
			DEFAULT_STATE.spectrumNeonCoreIntensity,
		spectrumNeonCoreWidth:
			values.spectrumNeonCoreWidth ?? DEFAULT_STATE.spectrumNeonCoreWidth,
		spectrumGradientFlow:
			values.spectrumGradientFlow ?? DEFAULT_STATE.spectrumGradientFlow,
		spectrumGradientFlowSpeed:
			values.spectrumGradientFlowSpeed ??
			DEFAULT_STATE.spectrumGradientFlowSpeed,
		spectrumGradientFlowAudio:
			values.spectrumGradientFlowAudio ??
			DEFAULT_STATE.spectrumGradientFlowAudio,
		spectrumGradientFlowDirection:
			values.spectrumGradientFlowDirection ??
			DEFAULT_STATE.spectrumGradientFlowDirection,
		spectrumPeakSparks:
			values.spectrumPeakSparks ?? DEFAULT_STATE.spectrumPeakSparks,
		spectrumPeakSparksAmount:
			values.spectrumPeakSparksAmount ??
			DEFAULT_STATE.spectrumPeakSparksAmount,
		spectrumPeakSparksSize:
			values.spectrumPeakSparksSize ??
			DEFAULT_STATE.spectrumPeakSparksSize,
		spectrumPeakSparksThreshold:
			values.spectrumPeakSparksThreshold ??
			DEFAULT_STATE.spectrumPeakSparksThreshold,
		spectrumEchoTrace:
			values.spectrumEchoTrace ?? DEFAULT_STATE.spectrumEchoTrace,
		spectrumEchoTraceCount:
			values.spectrumEchoTraceCount ??
			DEFAULT_STATE.spectrumEchoTraceCount,
		spectrumEchoTraceOpacity:
			values.spectrumEchoTraceOpacity ??
			DEFAULT_STATE.spectrumEchoTraceOpacity,
		spectrumEchoTraceOffset:
			values.spectrumEchoTraceOffset ??
			DEFAULT_STATE.spectrumEchoTraceOffset,
		spectrumEchoTraceDecay:
			values.spectrumEchoTraceDecay ??
			DEFAULT_STATE.spectrumEchoTraceDecay,
		spectrumBandMode:
			values.spectrumBandMode ?? DEFAULT_STATE.spectrumBandMode,
		spectrumAudioSmoothing:
			values.spectrumAudioSmoothing ??
			DEFAULT_STATE.spectrumAudioSmoothing,
		spectrumShape: normalizeSpectrumShape(
			values.spectrumShape ?? DEFAULT_STATE.spectrumShape
		),
		spectrumWaveFillOpacity:
			values.spectrumWaveFillOpacity ??
			DEFAULT_STATE.spectrumWaveFillOpacity,
		spectrumRotationSpeed: Math.abs(
			values.spectrumRotationSpeed ?? DEFAULT_STATE.spectrumRotationSpeed
		),
		spectrumRotationDrive:
			values.spectrumRotationDrive ?? DEFAULT_STATE.spectrumRotationDrive,
		spectrumRotationAudioAmount:
			values.spectrumRotationAudioAmount ??
			DEFAULT_STATE.spectrumRotationAudioAmount,
		spectrumRotationChannel:
			values.spectrumRotationChannel ??
			DEFAULT_STATE.spectrumRotationChannel,
		spectrumRotationDirection:
			values.spectrumRotationDirection ??
			((values.spectrumRotationSpeed ??
				DEFAULT_STATE.spectrumRotationSpeed) < 0
				? 'ccw'
				: 'cw'),
		spectrumRotationSmoothing:
			values.spectrumRotationSmoothing ??
			DEFAULT_STATE.spectrumRotationSmoothing,
		spectrumRotationInvertOnLowEnergy:
			values.spectrumRotationInvertOnLowEnergy ??
			DEFAULT_STATE.spectrumRotationInvertOnLowEnergy,
		spectrumRotationInvertThreshold:
			values.spectrumRotationInvertThreshold ??
			DEFAULT_STATE.spectrumRotationInvertThreshold,
		spectrumRotationInvertHoldMs:
			values.spectrumRotationInvertHoldMs ??
			DEFAULT_STATE.spectrumRotationInvertHoldMs,
		spectrumMirror: values.spectrumMirror ?? DEFAULT_STATE.spectrumMirror,
		spectrumPeakHold:
			values.spectrumPeakHold ?? DEFAULT_STATE.spectrumPeakHold,
		spectrumPeakDecay:
			values.spectrumPeakDecay ?? DEFAULT_STATE.spectrumPeakDecay,
		spectrumPositionX:
			values.spectrumPositionX ?? DEFAULT_STATE.spectrumPositionX,
		spectrumPositionY:
			values.spectrumPositionY ?? DEFAULT_STATE.spectrumPositionY,
		spectrumInstances: hydrateSpectrumInstances(values)
	});
}

/**
 * Hydrates the extra-instance list of a profile. Three shapes can arrive:
 * current profiles carry `spectrumInstances`; profiles saved before store v86
 * carry flat legacy `spectrumClone*` keys instead (converted wholesale); and
 * partial sources with neither get the default (disabled) instance.
 */
function hydrateSpectrumInstances(
	values: Partial<SpectrumProfileSettings>
): SpectrumInstance[] {
	if (Array.isArray(values.spectrumInstances)) {
		return values.spectrumInstances.map(instance => ({
			...createDefaultSpectrumInstance(),
			...instance
		}));
	}
	const legacySource = values as Record<string, unknown>;
	if (hasLegacySpectrumCloneData(legacySource)) {
		return [convertLegacySpectrumCloneState(legacySource)];
	}
	return [createDefaultSpectrumInstance()];
}
