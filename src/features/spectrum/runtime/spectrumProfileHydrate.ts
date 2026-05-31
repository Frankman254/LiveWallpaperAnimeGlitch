import { DEFAULT_STATE } from '@/lib/constants';
import { normalizeSpectrumSettings } from '@/features/spectrum/spectrumStateTransforms';
import {
	normalizeSpectrumFamily,
	normalizeSpectrumShape
} from '@/features/spectrum/spectrumControlConfig';
import type { SpectrumProfileSettings } from '@/types/wallpaper';

/**
 * Fills missing spectrum profile fields from defaults (same as applying a preset).
 * Use whenever spectrum settings are merged from partial sources (e.g. scene presets).
 */
export function hydrateSpectrumProfileValues(
	values: Partial<SpectrumProfileSettings>
): SpectrumProfileSettings {
	return normalizeSpectrumSettings({
		// Profile hydration always enables spectrum — profiles define appearance,
		// not visibility. Applying a profile implies you want to see the feature.
		spectrumEnabled: true,
		spectrumFamily: normalizeSpectrumFamily(
			values.spectrumFamily ?? DEFAULT_STATE.spectrumFamily
		),
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
		spectrumPeakRibbons:
			values.spectrumPeakRibbons ?? DEFAULT_STATE.spectrumPeakRibbons,
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
		spectrumEnergyBloom:
			values.spectrumEnergyBloom ?? DEFAULT_STATE.spectrumEnergyBloom,
		spectrumPeakRibbonAngle:
			values.spectrumPeakRibbonAngle ??
			DEFAULT_STATE.spectrumPeakRibbonAngle,
		spectrumFigureRotationSpeed:
			values.spectrumFigureRotationSpeed ??
			DEFAULT_STATE.spectrumFigureRotationSpeed,
		spectrumClonePeakRibbons:
			values.spectrumClonePeakRibbons ??
			DEFAULT_STATE.spectrumClonePeakRibbons,
		spectrumCloneAfterglow:
			values.spectrumCloneAfterglow ??
			DEFAULT_STATE.spectrumCloneAfterglow,
		spectrumCloneMotionTrails:
			values.spectrumCloneMotionTrails ??
			DEFAULT_STATE.spectrumCloneMotionTrails,
		spectrumCloneGhostFrames:
			values.spectrumCloneGhostFrames ??
			DEFAULT_STATE.spectrumCloneGhostFrames,
		spectrumCloneFrameHistoryDepth:
			values.spectrumCloneFrameHistoryDepth ??
			DEFAULT_STATE.spectrumCloneFrameHistoryDepth,
		spectrumCloneGainExpressiveness:
			values.spectrumCloneGainExpressiveness ??
			DEFAULT_STATE.spectrumCloneGainExpressiveness,
		spectrumCloneEnvelopeAttack:
			values.spectrumCloneEnvelopeAttack ??
			DEFAULT_STATE.spectrumCloneEnvelopeAttack,
		spectrumCloneEnvelopeRelease:
			values.spectrumCloneEnvelopeRelease ??
			DEFAULT_STATE.spectrumCloneEnvelopeRelease,
		spectrumCloneEnvelopeReactivitySpeed:
			values.spectrumCloneEnvelopeReactivitySpeed ??
			DEFAULT_STATE.spectrumCloneEnvelopeReactivitySpeed,
		spectrumCloneEnvelopePeakWindow:
			values.spectrumCloneEnvelopePeakWindow ??
			DEFAULT_STATE.spectrumCloneEnvelopePeakWindow,
		spectrumCloneEnvelopePeakFloor:
			values.spectrumCloneEnvelopePeakFloor ??
			DEFAULT_STATE.spectrumCloneEnvelopePeakFloor,
		spectrumCloneEnvelopePunch:
			values.spectrumCloneEnvelopePunch ??
			DEFAULT_STATE.spectrumCloneEnvelopePunch,
		spectrumCloneEnergyBloom:
			values.spectrumCloneEnergyBloom ??
			DEFAULT_STATE.spectrumCloneEnergyBloom,
		spectrumCloneBassShockwave:
			values.spectrumCloneBassShockwave ??
			DEFAULT_STATE.spectrumCloneBassShockwave,
		spectrumCloneShockwaveBandMode:
			values.spectrumCloneShockwaveBandMode ??
			DEFAULT_STATE.spectrumCloneShockwaveBandMode,
		spectrumCloneShockwaveBandThresholds: {
			...DEFAULT_STATE.spectrumCloneShockwaveBandThresholds,
			...values.spectrumCloneShockwaveBandThresholds
		},
		spectrumCloneShockwaveThickness:
			values.spectrumCloneShockwaveThickness ??
			DEFAULT_STATE.spectrumCloneShockwaveThickness,
		spectrumCloneShockwaveOpacity:
			values.spectrumCloneShockwaveOpacity ??
			DEFAULT_STATE.spectrumCloneShockwaveOpacity,
		spectrumCloneShockwaveBlur:
			values.spectrumCloneShockwaveBlur ??
			DEFAULT_STATE.spectrumCloneShockwaveBlur,
		spectrumCloneShockwaveColorMode:
			values.spectrumCloneShockwaveColorMode ??
			DEFAULT_STATE.spectrumCloneShockwaveColorMode,
		spectrumClonePeakRibbonAngle:
			values.spectrumClonePeakRibbonAngle ??
			DEFAULT_STATE.spectrumClonePeakRibbonAngle,
		spectrumCloneFigureRotationSpeed:
			values.spectrumCloneFigureRotationSpeed ??
			DEFAULT_STATE.spectrumCloneFigureRotationSpeed,
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
		spectrumCloneTunnelRingCount:
			values.spectrumCloneTunnelRingCount ??
			DEFAULT_STATE.spectrumCloneTunnelRingCount,
		spectrumCloneTunnelDepthFalloff:
			values.spectrumCloneTunnelDepthFalloff ??
			DEFAULT_STATE.spectrumCloneTunnelDepthFalloff,
		spectrumCloneTunnelRingSpacing:
			values.spectrumCloneTunnelRingSpacing ??
			DEFAULT_STATE.spectrumCloneTunnelRingSpacing,
		spectrumCloneTunnelWallOpacity:
			values.spectrumCloneTunnelWallOpacity ??
			DEFAULT_STATE.spectrumCloneTunnelWallOpacity,
		spectrumCloneTunnelPulseStrength:
			values.spectrumCloneTunnelPulseStrength ??
			DEFAULT_STATE.spectrumCloneTunnelPulseStrength,
		spectrumCloneTunnelAlternateRotation:
			typeof values.spectrumCloneTunnelAlternateRotation === 'boolean'
				? values.spectrumCloneTunnelAlternateRotation
				: DEFAULT_STATE.spectrumCloneTunnelAlternateRotation,
		spectrumCloneLiquidLayer1Opacity:
			values.spectrumCloneLiquidLayer1Opacity ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1Opacity,
		spectrumCloneLiquidLayer2Opacity:
			values.spectrumCloneLiquidLayer2Opacity ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2Opacity,
		spectrumCloneLiquidLayer3Opacity:
			values.spectrumCloneLiquidLayer3Opacity ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3Opacity,
		spectrumCloneLiquidLayer1Amp:
			values.spectrumCloneLiquidLayer1Amp ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1Amp,
		spectrumCloneLiquidLayer2Amp:
			values.spectrumCloneLiquidLayer2Amp ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2Amp,
		spectrumCloneLiquidLayer3Amp:
			values.spectrumCloneLiquidLayer3Amp ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3Amp,
		spectrumCloneLiquidLayer1Fill:
			values.spectrumCloneLiquidLayer1Fill ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1Fill,
		spectrumCloneLiquidLayer2Fill:
			values.spectrumCloneLiquidLayer2Fill ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2Fill,
		spectrumCloneLiquidLayer3Fill:
			values.spectrumCloneLiquidLayer3Fill ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3Fill,
		spectrumCloneLiquidLayer1Speed:
			values.spectrumCloneLiquidLayer1Speed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1Speed,
		spectrumCloneLiquidLayer2Speed:
			values.spectrumCloneLiquidLayer2Speed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2Speed,
		spectrumCloneLiquidLayer3Speed:
			values.spectrumCloneLiquidLayer3Speed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3Speed,
		spectrumCloneLiquidLayer1RotationSpeed:
			values.spectrumCloneLiquidLayer1RotationSpeed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1RotationSpeed,
		spectrumCloneLiquidLayer2RotationSpeed:
			values.spectrumCloneLiquidLayer2RotationSpeed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2RotationSpeed,
		spectrumCloneLiquidLayer3RotationSpeed:
			values.spectrumCloneLiquidLayer3RotationSpeed ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3RotationSpeed,
		spectrumCloneLiquidLayer1Shape:
			values.spectrumCloneLiquidLayer1Shape ??
			DEFAULT_STATE.spectrumCloneLiquidLayer1Shape,
		spectrumCloneLiquidLayer2Shape:
			values.spectrumCloneLiquidLayer2Shape ??
			DEFAULT_STATE.spectrumCloneLiquidLayer2Shape,
		spectrumCloneLiquidLayer3Shape:
			values.spectrumCloneLiquidLayer3Shape ??
			DEFAULT_STATE.spectrumCloneLiquidLayer3Shape,
		spectrumCloneLiquidLayer1RigidShape:
			typeof values.spectrumCloneLiquidLayer1RigidShape === 'boolean'
				? values.spectrumCloneLiquidLayer1RigidShape
				: DEFAULT_STATE.spectrumCloneLiquidLayer1RigidShape,
		spectrumCloneLiquidLayer2RigidShape:
			typeof values.spectrumCloneLiquidLayer2RigidShape === 'boolean'
				? values.spectrumCloneLiquidLayer2RigidShape
				: DEFAULT_STATE.spectrumCloneLiquidLayer2RigidShape,
		spectrumCloneLiquidLayer3RigidShape:
			typeof values.spectrumCloneLiquidLayer3RigidShape === 'boolean'
				? values.spectrumCloneLiquidLayer3RigidShape
				: DEFAULT_STATE.spectrumCloneLiquidLayer3RigidShape,
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
		spectrumCloneSpiralTurns:
			values.spectrumCloneSpiralTurns ??
			DEFAULT_STATE.spectrumCloneSpiralTurns,
		spectrumCloneSpiralOuterRadius:
			values.spectrumCloneSpiralOuterRadius ??
			DEFAULT_STATE.spectrumCloneSpiralOuterRadius,
		spectrumCloneSpiralTightness:
			values.spectrumCloneSpiralTightness ??
			DEFAULT_STATE.spectrumCloneSpiralTightness,
		spectrumCloneSpiralShape:
			values.spectrumCloneSpiralShape ??
			DEFAULT_STATE.spectrumCloneSpiralShape,
		spectrumCloneSpiralLogarithmic:
			values.spectrumCloneSpiralLogarithmic ??
			DEFAULT_STATE.spectrumCloneSpiralLogarithmic,
		spectrumCloneSpiralGradientStroke:
			values.spectrumCloneSpiralGradientStroke ??
			DEFAULT_STATE.spectrumCloneSpiralGradientStroke,
		spectrumCloneSpiralArms:
			values.spectrumCloneSpiralArms ??
			DEFAULT_STATE.spectrumCloneSpiralArms,
		spectrumCloneSpiralAudioTurns:
			values.spectrumCloneSpiralAudioTurns ??
			DEFAULT_STATE.spectrumCloneSpiralAudioTurns,
		spectrumCloneSpiralDotShape:
			values.spectrumCloneSpiralDotShape ??
			DEFAULT_STATE.spectrumCloneSpiralDotShape,
		spectrumCloneSpiralStrokeWidth:
			values.spectrumCloneSpiralStrokeWidth ??
			DEFAULT_STATE.spectrumCloneSpiralStrokeWidth,
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
		spectrumCloneOscilloscopeLineWidth:
			values.spectrumCloneOscilloscopeLineWidth ??
			DEFAULT_STATE.spectrumCloneOscilloscopeLineWidth,
		spectrumCloneOscilloscopeScrollSpeed:
			values.spectrumCloneOscilloscopeScrollSpeed ??
			DEFAULT_STATE.spectrumCloneOscilloscopeScrollSpeed,
		spectrumCloneOscilloscopeReactiveWidth:
			typeof values.spectrumCloneOscilloscopeReactiveWidth === 'boolean'
				? values.spectrumCloneOscilloscopeReactiveWidth
				: DEFAULT_STATE.spectrumCloneOscilloscopeReactiveWidth,
		spectrumCloneOscilloscopePhosphor:
			typeof values.spectrumCloneOscilloscopePhosphor === 'boolean'
				? values.spectrumCloneOscilloscopePhosphor
				: DEFAULT_STATE.spectrumCloneOscilloscopePhosphor,
		spectrumCloneOscilloscopePhosphorDecay:
			values.spectrumCloneOscilloscopePhosphorDecay ??
			DEFAULT_STATE.spectrumCloneOscilloscopePhosphorDecay,
		spectrumCloneOscilloscopeGrid:
			typeof values.spectrumCloneOscilloscopeGrid === 'boolean'
				? values.spectrumCloneOscilloscopeGrid
				: DEFAULT_STATE.spectrumCloneOscilloscopeGrid,
		spectrumCloneOscilloscopeGridDivisions:
			values.spectrumCloneOscilloscopeGridDivisions ??
			DEFAULT_STATE.spectrumCloneOscilloscopeGridDivisions,
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
		spectrumCircularClone:
			values.spectrumCircularClone ?? DEFAULT_STATE.spectrumCircularClone,
		spectrumSpan: values.spectrumSpan ?? DEFAULT_STATE.spectrumSpan,
		spectrumCloneOpacity:
			values.spectrumCloneOpacity ?? DEFAULT_STATE.spectrumCloneOpacity,
		spectrumCloneScale:
			values.spectrumCloneScale ?? DEFAULT_STATE.spectrumCloneScale,
		spectrumCloneGap:
			values.spectrumCloneGap ?? DEFAULT_STATE.spectrumCloneGap,
		spectrumCloneFamily: normalizeSpectrumFamily(
			values.spectrumCloneFamily ?? DEFAULT_STATE.spectrumCloneFamily
		),
		spectrumCloneStyle: normalizeSpectrumShape(
			values.spectrumCloneStyle ?? DEFAULT_STATE.spectrumCloneStyle
		),
		spectrumCloneRadialShape:
			values.spectrumCloneRadialShape ??
			DEFAULT_STATE.spectrumCloneRadialShape,
		spectrumCloneRadialAngle:
			values.spectrumCloneRadialAngle ??
			DEFAULT_STATE.spectrumCloneRadialAngle,
		spectrumClonePositionX:
			values.spectrumClonePositionX ??
			DEFAULT_STATE.spectrumClonePositionX,
		spectrumClonePositionY:
			values.spectrumClonePositionY ??
			DEFAULT_STATE.spectrumClonePositionY,
		spectrumCloneBarCount:
			values.spectrumCloneBarCount ?? DEFAULT_STATE.spectrumCloneBarCount,
		spectrumCloneBarWidth:
			values.spectrumCloneBarWidth ?? DEFAULT_STATE.spectrumCloneBarWidth,
		spectrumCloneMinHeight:
			values.spectrumCloneMinHeight ??
			DEFAULT_STATE.spectrumCloneMinHeight,
		spectrumCloneMaxHeight:
			values.spectrumCloneMaxHeight ??
			DEFAULT_STATE.spectrumCloneMaxHeight,
		spectrumCloneSmoothing:
			values.spectrumCloneSmoothing ??
			DEFAULT_STATE.spectrumCloneSmoothing,
		spectrumCloneGlowIntensity:
			values.spectrumCloneGlowIntensity ??
			DEFAULT_STATE.spectrumCloneGlowIntensity,
		spectrumCloneShadowBlur:
			values.spectrumCloneShadowBlur ??
			DEFAULT_STATE.spectrumCloneShadowBlur,
		spectrumClonePrimaryColor:
			values.spectrumClonePrimaryColor ??
			DEFAULT_STATE.spectrumClonePrimaryColor,
		spectrumCloneSecondaryColor:
			values.spectrumCloneSecondaryColor ??
			DEFAULT_STATE.spectrumCloneSecondaryColor,
		spectrumCloneColorSource:
			values.spectrumCloneColorSource ??
			DEFAULT_STATE.spectrumCloneColorSource,
		spectrumCloneColorMode:
			values.spectrumCloneColorMode ??
			DEFAULT_STATE.spectrumCloneColorMode,
		spectrumCloneBandMode:
			values.spectrumCloneBandMode ?? DEFAULT_STATE.spectrumCloneBandMode,
		spectrumCloneAudioSmoothing:
			values.spectrumCloneAudioSmoothing ??
			DEFAULT_STATE.spectrumCloneAudioSmoothing,
		spectrumCloneRotationSpeed:
			values.spectrumCloneRotationSpeed ??
			DEFAULT_STATE.spectrumCloneRotationSpeed,
		spectrumCloneMirror:
			values.spectrumCloneMirror ?? DEFAULT_STATE.spectrumCloneMirror,
		spectrumClonePeakHold:
			values.spectrumClonePeakHold ?? DEFAULT_STATE.spectrumClonePeakHold,
		spectrumClonePeakDecay:
			values.spectrumClonePeakDecay ??
			DEFAULT_STATE.spectrumClonePeakDecay,
		spectrumCloneFollowLogo:
			values.spectrumCloneFollowLogo ??
			DEFAULT_STATE.spectrumCloneFollowLogo,
		spectrumCloneRadialFitLogo:
			values.spectrumCloneRadialFitLogo ??
			DEFAULT_STATE.spectrumCloneRadialFitLogo,
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
		spectrumRotationSpeed:
			values.spectrumRotationSpeed ?? DEFAULT_STATE.spectrumRotationSpeed,
		spectrumMirror: values.spectrumMirror ?? DEFAULT_STATE.spectrumMirror,
		spectrumPeakHold:
			values.spectrumPeakHold ?? DEFAULT_STATE.spectrumPeakHold,
		spectrumPeakDecay:
			values.spectrumPeakDecay ?? DEFAULT_STATE.spectrumPeakDecay,
		spectrumPositionX:
			values.spectrumPositionX ?? DEFAULT_STATE.spectrumPositionX,
		spectrumPositionY:
			values.spectrumPositionY ?? DEFAULT_STATE.spectrumPositionY,
		spectrumCloneWaveFillOpacity:
			values.spectrumCloneWaveFillOpacity ??
			DEFAULT_STATE.spectrumCloneWaveFillOpacity
	});
}
