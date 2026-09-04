import { DEFAULT_SPECTRUM_STATE } from '@/features/spectrum/domain/spectrumDefaults';
import { normalizeSpectrumSettings } from '@/features/spectrum/domain/spectrumStateTransforms';
import {
	normalizeSpectrumFamily,
	normalizeSpectrumShape
} from '@/features/spectrum/domain/spectrumControlConfig';
import type {
	SpectrumInstance,
	SpectrumProfileSettings
} from '@/types/wallpaper';
import {
	convertLegacySpectrumCloneState,
	createDefaultSpectrumInstance,
	hasLegacySpectrumCloneData
} from '@/features/spectrum/domain/spectrumInstanceModel';

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
			values.spectrumMainVisible ??
			DEFAULT_SPECTRUM_STATE.spectrumMainVisible,
		spectrumFamily: normalizeSpectrumFamily(
			values.spectrumFamily ?? DEFAULT_SPECTRUM_STATE.spectrumFamily
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
			values.spectrumAfterglow ??
			DEFAULT_SPECTRUM_STATE.spectrumAfterglow,
		spectrumMotionTrails:
			values.spectrumMotionTrails ??
			DEFAULT_SPECTRUM_STATE.spectrumMotionTrails,
		spectrumGhostFrames:
			values.spectrumGhostFrames ??
			DEFAULT_SPECTRUM_STATE.spectrumGhostFrames,
		spectrumFrameHistoryDepth:
			values.spectrumFrameHistoryDepth ??
			DEFAULT_SPECTRUM_STATE.spectrumFrameHistoryDepth,
		spectrumGainExpressiveness:
			values.spectrumGainExpressiveness ??
			DEFAULT_SPECTRUM_STATE.spectrumGainExpressiveness,
		spectrumEnvelopeAttack:
			values.spectrumEnvelopeAttack ??
			DEFAULT_SPECTRUM_STATE.spectrumEnvelopeAttack,
		spectrumEnvelopeRelease:
			values.spectrumEnvelopeRelease ??
			DEFAULT_SPECTRUM_STATE.spectrumEnvelopeRelease,
		spectrumEnvelopeReactivitySpeed:
			values.spectrumEnvelopeReactivitySpeed ??
			DEFAULT_SPECTRUM_STATE.spectrumEnvelopeReactivitySpeed,
		spectrumEnvelopePeakWindow:
			values.spectrumEnvelopePeakWindow ??
			DEFAULT_SPECTRUM_STATE.spectrumEnvelopePeakWindow,
		spectrumEnvelopePeakFloor:
			values.spectrumEnvelopePeakFloor ??
			DEFAULT_SPECTRUM_STATE.spectrumEnvelopePeakFloor,
		spectrumEnvelopePunch:
			values.spectrumEnvelopePunch ??
			DEFAULT_SPECTRUM_STATE.spectrumEnvelopePunch,
		spectrumPeakRibbonsEnabled:
			values.spectrumPeakRibbonsEnabled ??
			(values.spectrumPeakRibbons ?? 0) > 0,
		spectrumPeakRibbons:
			values.spectrumPeakRibbons ??
			DEFAULT_SPECTRUM_STATE.spectrumPeakRibbons,
		spectrumBassShockwaveEnabled:
			values.spectrumBassShockwaveEnabled ??
			(values.spectrumBassShockwave ?? 0) > 0,
		spectrumBassShockwave:
			values.spectrumBassShockwave ??
			DEFAULT_SPECTRUM_STATE.spectrumBassShockwave,
		spectrumShockwaveBandMode:
			values.spectrumShockwaveBandMode ??
			DEFAULT_SPECTRUM_STATE.spectrumShockwaveBandMode,
		spectrumShockwaveBandThresholds: {
			...DEFAULT_SPECTRUM_STATE.spectrumShockwaveBandThresholds,
			...values.spectrumShockwaveBandThresholds
		},
		spectrumShockwaveThickness:
			values.spectrumShockwaveThickness ??
			DEFAULT_SPECTRUM_STATE.spectrumShockwaveThickness,
		spectrumShockwaveOpacity:
			values.spectrumShockwaveOpacity ??
			DEFAULT_SPECTRUM_STATE.spectrumShockwaveOpacity,
		spectrumShockwaveBlur:
			values.spectrumShockwaveBlur ??
			DEFAULT_SPECTRUM_STATE.spectrumShockwaveBlur,
		spectrumShockwaveColorMode:
			values.spectrumShockwaveColorMode ??
			DEFAULT_SPECTRUM_STATE.spectrumShockwaveColorMode,
		spectrumEnergyBloomEnabled:
			values.spectrumEnergyBloomEnabled ??
			(values.spectrumEnergyBloom ?? 0) > 0,
		spectrumEnergyBloom:
			values.spectrumEnergyBloom ??
			DEFAULT_SPECTRUM_STATE.spectrumEnergyBloom,
		spectrumPeakRibbonAngle:
			values.spectrumPeakRibbonAngle ??
			DEFAULT_SPECTRUM_STATE.spectrumPeakRibbonAngle,
		spectrumFigureRotationSpeed:
			values.spectrumFigureRotationSpeed ??
			DEFAULT_SPECTRUM_STATE.spectrumFigureRotationSpeed,
		spectrumOscilloscopeLineWidth:
			values.spectrumOscilloscopeLineWidth ??
			DEFAULT_SPECTRUM_STATE.spectrumOscilloscopeLineWidth,
		spectrumTunnelRingCount:
			values.spectrumTunnelRingCount ??
			DEFAULT_SPECTRUM_STATE.spectrumTunnelRingCount,
		spectrumTunnelDepthFalloff:
			values.spectrumTunnelDepthFalloff ??
			DEFAULT_SPECTRUM_STATE.spectrumTunnelDepthFalloff,
		spectrumTunnelRingSpacing:
			values.spectrumTunnelRingSpacing ??
			DEFAULT_SPECTRUM_STATE.spectrumTunnelRingSpacing,
		spectrumTunnelWallOpacity:
			values.spectrumTunnelWallOpacity ??
			DEFAULT_SPECTRUM_STATE.spectrumTunnelWallOpacity,
		spectrumTunnelPulseStrength:
			values.spectrumTunnelPulseStrength ??
			DEFAULT_SPECTRUM_STATE.spectrumTunnelPulseStrength,
		spectrumTunnelAlternateRotation:
			values.spectrumTunnelAlternateRotation ??
			DEFAULT_SPECTRUM_STATE.spectrumTunnelAlternateRotation,
		spectrumLiquidLayer1Opacity:
			values.spectrumLiquidLayer1Opacity ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer1Opacity,
		spectrumLiquidLayer2Opacity:
			values.spectrumLiquidLayer2Opacity ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer2Opacity,
		spectrumLiquidLayer3Opacity:
			values.spectrumLiquidLayer3Opacity ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer3Opacity,
		spectrumLiquidLayer1Amp:
			values.spectrumLiquidLayer1Amp ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer1Amp,
		spectrumLiquidLayer2Amp:
			values.spectrumLiquidLayer2Amp ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer2Amp,
		spectrumLiquidLayer3Amp:
			values.spectrumLiquidLayer3Amp ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer3Amp,
		spectrumLiquidLayer1Fill:
			values.spectrumLiquidLayer1Fill ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer1Fill,
		spectrumLiquidLayer2Fill:
			values.spectrumLiquidLayer2Fill ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer2Fill,
		spectrumLiquidLayer3Fill:
			values.spectrumLiquidLayer3Fill ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer3Fill,
		spectrumLiquidLayer1Speed:
			values.spectrumLiquidLayer1Speed ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer1Speed,
		spectrumLiquidLayer2Speed:
			values.spectrumLiquidLayer2Speed ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer2Speed,
		spectrumLiquidLayer3Speed:
			values.spectrumLiquidLayer3Speed ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer3Speed,
		spectrumLiquidLayer1RotationSpeed:
			values.spectrumLiquidLayer1RotationSpeed ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer1RotationSpeed,
		spectrumLiquidLayer2RotationSpeed:
			values.spectrumLiquidLayer2RotationSpeed ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer2RotationSpeed,
		spectrumLiquidLayer3RotationSpeed:
			values.spectrumLiquidLayer3RotationSpeed ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer3RotationSpeed,
		spectrumLiquidLayer1Shape:
			values.spectrumLiquidLayer1Shape ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer1Shape,
		spectrumLiquidLayer2Shape:
			values.spectrumLiquidLayer2Shape ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer2Shape,
		spectrumLiquidLayer3Shape:
			values.spectrumLiquidLayer3Shape ??
			DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer3Shape,
		spectrumLiquidLayer1RigidShape:
			typeof values.spectrumLiquidLayer1RigidShape === 'boolean'
				? values.spectrumLiquidLayer1RigidShape
				: DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer1RigidShape,
		spectrumLiquidLayer2RigidShape:
			typeof values.spectrumLiquidLayer2RigidShape === 'boolean'
				? values.spectrumLiquidLayer2RigidShape
				: DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer2RigidShape,
		spectrumLiquidLayer3RigidShape:
			typeof values.spectrumLiquidLayer3RigidShape === 'boolean'
				? values.spectrumLiquidLayer3RigidShape
				: DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer3RigidShape,
		spectrumLiquidLayer1Pixelate:
			typeof values.spectrumLiquidLayer1Pixelate === 'boolean'
				? values.spectrumLiquidLayer1Pixelate
				: DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer1Pixelate,
		spectrumLiquidLayer2Pixelate:
			typeof values.spectrumLiquidLayer2Pixelate === 'boolean'
				? values.spectrumLiquidLayer2Pixelate
				: DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer2Pixelate,
		spectrumLiquidLayer3Pixelate:
			typeof values.spectrumLiquidLayer3Pixelate === 'boolean'
				? values.spectrumLiquidLayer3Pixelate
				: DEFAULT_SPECTRUM_STATE.spectrumLiquidLayer3Pixelate,
		spectrumSpiralTurns:
			values.spectrumSpiralTurns ??
			DEFAULT_SPECTRUM_STATE.spectrumSpiralTurns,
		spectrumSpiralOuterRadius:
			values.spectrumSpiralOuterRadius ??
			DEFAULT_SPECTRUM_STATE.spectrumSpiralOuterRadius,
		spectrumSpiralTightness:
			values.spectrumSpiralTightness ??
			DEFAULT_SPECTRUM_STATE.spectrumSpiralTightness,
		spectrumSpiralShape:
			values.spectrumSpiralShape ??
			DEFAULT_SPECTRUM_STATE.spectrumSpiralShape,
		spectrumSpiralLogarithmic:
			values.spectrumSpiralLogarithmic ??
			DEFAULT_SPECTRUM_STATE.spectrumSpiralLogarithmic,
		spectrumSpiralGradientStroke:
			values.spectrumSpiralGradientStroke ??
			DEFAULT_SPECTRUM_STATE.spectrumSpiralGradientStroke,
		spectrumSpiralArms:
			values.spectrumSpiralArms ??
			DEFAULT_SPECTRUM_STATE.spectrumSpiralArms,
		spectrumSpiralAudioTurns:
			values.spectrumSpiralAudioTurns ??
			DEFAULT_SPECTRUM_STATE.spectrumSpiralAudioTurns,
		spectrumSpiralDotShape:
			values.spectrumSpiralDotShape ??
			DEFAULT_SPECTRUM_STATE.spectrumSpiralDotShape,
		spectrumSpiralStrokeWidth:
			values.spectrumSpiralStrokeWidth ??
			DEFAULT_SPECTRUM_STATE.spectrumSpiralStrokeWidth,
		spectrumOscilloscopeScrollSpeed:
			values.spectrumOscilloscopeScrollSpeed ??
			DEFAULT_SPECTRUM_STATE.spectrumOscilloscopeScrollSpeed,
		spectrumOscilloscopeReactiveWidth:
			typeof values.spectrumOscilloscopeReactiveWidth === 'boolean'
				? values.spectrumOscilloscopeReactiveWidth
				: DEFAULT_SPECTRUM_STATE.spectrumOscilloscopeReactiveWidth,
		spectrumOscilloscopePhosphor:
			typeof values.spectrumOscilloscopePhosphor === 'boolean'
				? values.spectrumOscilloscopePhosphor
				: DEFAULT_SPECTRUM_STATE.spectrumOscilloscopePhosphor,
		spectrumOscilloscopePhosphorDecay:
			values.spectrumOscilloscopePhosphorDecay ??
			DEFAULT_SPECTRUM_STATE.spectrumOscilloscopePhosphorDecay,
		spectrumOscilloscopeGrid:
			typeof values.spectrumOscilloscopeGrid === 'boolean'
				? values.spectrumOscilloscopeGrid
				: DEFAULT_SPECTRUM_STATE.spectrumOscilloscopeGrid,
		spectrumOscilloscopeGridDivisions:
			values.spectrumOscilloscopeGridDivisions ??
			DEFAULT_SPECTRUM_STATE.spectrumOscilloscopeGridDivisions,
		spectrumDriveMode:
			values.spectrumDriveMode ??
			DEFAULT_SPECTRUM_STATE.spectrumDriveMode,
		spectrumManualSections:
			values.spectrumManualSections ??
			DEFAULT_SPECTRUM_STATE.spectrumManualSections,
		spectrumManualAddWeight:
			values.spectrumManualAddWeight ??
			DEFAULT_SPECTRUM_STATE.spectrumManualAddWeight,
		spectrumManualAttack:
			values.spectrumManualAttack ??
			DEFAULT_SPECTRUM_STATE.spectrumManualAttack,
		spectrumManualRelease:
			values.spectrumManualRelease ??
			DEFAULT_SPECTRUM_STATE.spectrumManualRelease,
		spectrumMode:
			values.spectrumMode ?? DEFAULT_SPECTRUM_STATE.spectrumMode,
		spectrumLinearOrientation:
			values.spectrumLinearOrientation ??
			DEFAULT_SPECTRUM_STATE.spectrumLinearOrientation,
		spectrumLinearDirection:
			values.spectrumLinearDirection ??
			DEFAULT_SPECTRUM_STATE.spectrumLinearDirection,
		spectrumRadialShape:
			values.spectrumRadialShape ??
			DEFAULT_SPECTRUM_STATE.spectrumRadialShape,
		spectrumRadialAngle:
			values.spectrumRadialAngle ??
			DEFAULT_SPECTRUM_STATE.spectrumRadialAngle,
		spectrumRadialSharpness:
			values.spectrumRadialSharpness ??
			DEFAULT_SPECTRUM_STATE.spectrumRadialSharpness,
		spectrumRadialFitLogo:
			values.spectrumRadialFitLogo ??
			DEFAULT_SPECTRUM_STATE.spectrumRadialFitLogo,
		spectrumFollowLogo:
			values.spectrumFollowLogo ??
			DEFAULT_SPECTRUM_STATE.spectrumFollowLogo,
		spectrumLogoGap:
			values.spectrumLogoGap ?? DEFAULT_SPECTRUM_STATE.spectrumLogoGap,
		spectrumSpan:
			values.spectrumSpan ?? DEFAULT_SPECTRUM_STATE.spectrumSpan,
		spectrumScale:
			values.spectrumScale ?? DEFAULT_SPECTRUM_STATE.spectrumScale,
		spectrumInnerRadius:
			values.spectrumInnerRadius ??
			DEFAULT_SPECTRUM_STATE.spectrumInnerRadius,
		spectrumBarCount:
			values.spectrumBarCount ?? DEFAULT_SPECTRUM_STATE.spectrumBarCount,
		spectrumBarWidth:
			values.spectrumBarWidth ?? DEFAULT_SPECTRUM_STATE.spectrumBarWidth,
		spectrumMinHeight:
			values.spectrumMinHeight ??
			DEFAULT_SPECTRUM_STATE.spectrumMinHeight,
		spectrumMaxHeight:
			values.spectrumMaxHeight ??
			DEFAULT_SPECTRUM_STATE.spectrumMaxHeight,
		spectrumSmoothing:
			values.spectrumSmoothing ??
			DEFAULT_SPECTRUM_STATE.spectrumSmoothing,
		spectrumOpacity:
			values.spectrumOpacity ?? DEFAULT_SPECTRUM_STATE.spectrumOpacity,
		spectrumGlowIntensity:
			values.spectrumGlowIntensity ??
			DEFAULT_SPECTRUM_STATE.spectrumGlowIntensity,
		spectrumGlowReach:
			values.spectrumGlowReach ??
			DEFAULT_SPECTRUM_STATE.spectrumGlowReach,
		spectrumGlowAudioAmount:
			values.spectrumGlowAudioAmount ??
			DEFAULT_SPECTRUM_STATE.spectrumGlowAudioAmount,
		spectrumShadowBlur:
			values.spectrumShadowBlur ??
			DEFAULT_SPECTRUM_STATE.spectrumShadowBlur,
		spectrumPrimaryColor:
			values.spectrumPrimaryColor ??
			DEFAULT_SPECTRUM_STATE.spectrumPrimaryColor,
		spectrumSecondaryColor:
			values.spectrumSecondaryColor ??
			DEFAULT_SPECTRUM_STATE.spectrumSecondaryColor,
		spectrumColorSource:
			values.spectrumColorSource ??
			DEFAULT_SPECTRUM_STATE.spectrumColorSource,
		spectrumColorMode:
			values.spectrumColorMode ??
			DEFAULT_SPECTRUM_STATE.spectrumColorMode,
		spectrumManualGlow:
			values.spectrumManualGlow ??
			DEFAULT_SPECTRUM_STATE.spectrumManualGlow,
		spectrumManualGlowMode:
			values.spectrumManualGlowMode ??
			DEFAULT_SPECTRUM_STATE.spectrumManualGlowMode,
		spectrumGlowColorSource: values.spectrumGlowColorSource ?? 'manual',
		spectrumGlowColorMode: values.spectrumGlowColorMode ?? 'gradient',
		spectrumGlowPrimaryColor:
			values.spectrumGlowPrimaryColor ??
			values.spectrumPrimaryColor ??
			DEFAULT_SPECTRUM_STATE.spectrumGlowPrimaryColor,
		spectrumGlowSecondaryColor:
			values.spectrumGlowSecondaryColor ??
			values.spectrumSecondaryColor ??
			DEFAULT_SPECTRUM_STATE.spectrumGlowSecondaryColor,
		spectrumPixelate:
			values.spectrumPixelate ?? DEFAULT_SPECTRUM_STATE.spectrumPixelate,
		spectrumPixelateScale:
			values.spectrumPixelateScale ??
			DEFAULT_SPECTRUM_STATE.spectrumPixelateScale,
		spectrumLedCellSize:
			values.spectrumLedCellSize ??
			DEFAULT_SPECTRUM_STATE.spectrumLedCellSize,
		spectrumLedCellGap:
			values.spectrumLedCellGap ??
			DEFAULT_SPECTRUM_STATE.spectrumLedCellGap,
		spectrumLedAngle:
			values.spectrumLedAngle ?? DEFAULT_SPECTRUM_STATE.spectrumLedAngle,
		spectrumLedShape:
			values.spectrumLedShape ?? DEFAULT_SPECTRUM_STATE.spectrumLedShape,
		spectrumRgbSplit:
			values.spectrumRgbSplit ?? DEFAULT_SPECTRUM_STATE.spectrumRgbSplit,
		spectrumRgbSplitAmount:
			values.spectrumRgbSplitAmount ??
			DEFAULT_SPECTRUM_STATE.spectrumRgbSplitAmount,
		spectrumNeonCore:
			values.spectrumNeonCore ?? DEFAULT_SPECTRUM_STATE.spectrumNeonCore,
		spectrumNeonCoreIntensity:
			values.spectrumNeonCoreIntensity ??
			DEFAULT_SPECTRUM_STATE.spectrumNeonCoreIntensity,
		spectrumNeonCoreWidth:
			values.spectrumNeonCoreWidth ??
			DEFAULT_SPECTRUM_STATE.spectrumNeonCoreWidth,
		spectrumGradientFlow:
			values.spectrumGradientFlow ??
			DEFAULT_SPECTRUM_STATE.spectrumGradientFlow,
		spectrumGradientFlowSpeed:
			values.spectrumGradientFlowSpeed ??
			DEFAULT_SPECTRUM_STATE.spectrumGradientFlowSpeed,
		spectrumGradientFlowAudio:
			values.spectrumGradientFlowAudio ??
			DEFAULT_SPECTRUM_STATE.spectrumGradientFlowAudio,
		spectrumGradientFlowDirection:
			values.spectrumGradientFlowDirection ??
			DEFAULT_SPECTRUM_STATE.spectrumGradientFlowDirection,
		spectrumPeakSparks:
			values.spectrumPeakSparks ??
			DEFAULT_SPECTRUM_STATE.spectrumPeakSparks,
		spectrumPeakSparksAmount:
			values.spectrumPeakSparksAmount ??
			DEFAULT_SPECTRUM_STATE.spectrumPeakSparksAmount,
		spectrumPeakSparksSize:
			values.spectrumPeakSparksSize ??
			DEFAULT_SPECTRUM_STATE.spectrumPeakSparksSize,
		spectrumPeakSparksThreshold:
			values.spectrumPeakSparksThreshold ??
			DEFAULT_SPECTRUM_STATE.spectrumPeakSparksThreshold,
		spectrumEchoTrace:
			values.spectrumEchoTrace ??
			DEFAULT_SPECTRUM_STATE.spectrumEchoTrace,
		spectrumEchoTraceCount:
			values.spectrumEchoTraceCount ??
			DEFAULT_SPECTRUM_STATE.spectrumEchoTraceCount,
		spectrumEchoTraceOpacity:
			values.spectrumEchoTraceOpacity ??
			DEFAULT_SPECTRUM_STATE.spectrumEchoTraceOpacity,
		spectrumEchoTraceOffset:
			values.spectrumEchoTraceOffset ??
			DEFAULT_SPECTRUM_STATE.spectrumEchoTraceOffset,
		spectrumEchoTraceDecay:
			values.spectrumEchoTraceDecay ??
			DEFAULT_SPECTRUM_STATE.spectrumEchoTraceDecay,
		spectrumBandMode:
			values.spectrumBandMode ?? DEFAULT_SPECTRUM_STATE.spectrumBandMode,
		spectrumAudioSmoothing:
			values.spectrumAudioSmoothing ??
			DEFAULT_SPECTRUM_STATE.spectrumAudioSmoothing,
		spectrumShape: normalizeSpectrumShape(
			values.spectrumShape ?? DEFAULT_SPECTRUM_STATE.spectrumShape
		),
		spectrumWaveFillOpacity:
			values.spectrumWaveFillOpacity ??
			DEFAULT_SPECTRUM_STATE.spectrumWaveFillOpacity,
		spectrumRotationSpeed: Math.abs(
			values.spectrumRotationSpeed ??
				DEFAULT_SPECTRUM_STATE.spectrumRotationSpeed
		),
		spectrumRotationDrive:
			values.spectrumRotationDrive ??
			DEFAULT_SPECTRUM_STATE.spectrumRotationDrive,
		spectrumRotationAudioAmount:
			values.spectrumRotationAudioAmount ??
			DEFAULT_SPECTRUM_STATE.spectrumRotationAudioAmount,
		spectrumRotationChannel:
			values.spectrumRotationChannel ??
			DEFAULT_SPECTRUM_STATE.spectrumRotationChannel,
		spectrumRotationDirection:
			values.spectrumRotationDirection ??
			((values.spectrumRotationSpeed ??
				DEFAULT_SPECTRUM_STATE.spectrumRotationSpeed) < 0
				? 'ccw'
				: 'cw'),
		spectrumRotationSmoothing:
			values.spectrumRotationSmoothing ??
			DEFAULT_SPECTRUM_STATE.spectrumRotationSmoothing,
		spectrumRotationInvertOnLowEnergy:
			values.spectrumRotationInvertOnLowEnergy ??
			DEFAULT_SPECTRUM_STATE.spectrumRotationInvertOnLowEnergy,
		spectrumRotationInvertThreshold:
			values.spectrumRotationInvertThreshold ??
			DEFAULT_SPECTRUM_STATE.spectrumRotationInvertThreshold,
		spectrumRotationInvertHoldMs:
			values.spectrumRotationInvertHoldMs ??
			DEFAULT_SPECTRUM_STATE.spectrumRotationInvertHoldMs,
		spectrumMirror:
			values.spectrumMirror ?? DEFAULT_SPECTRUM_STATE.spectrumMirror,
		spectrumPeakHold:
			values.spectrumPeakHold ?? DEFAULT_SPECTRUM_STATE.spectrumPeakHold,
		spectrumPeakDecay:
			values.spectrumPeakDecay ??
			DEFAULT_SPECTRUM_STATE.spectrumPeakDecay,
		spectrumPositionX:
			values.spectrumPositionX ??
			DEFAULT_SPECTRUM_STATE.spectrumPositionX,
		spectrumPositionY:
			values.spectrumPositionY ??
			DEFAULT_SPECTRUM_STATE.spectrumPositionY,
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
