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
		spectrumPeakRibbons:
			values.spectrumPeakRibbons ?? DEFAULT_STATE.spectrumPeakRibbons,
		spectrumBassShockwave:
			values.spectrumBassShockwave ?? DEFAULT_STATE.spectrumBassShockwave,
		spectrumShockwaveBandMode:
			values.spectrumShockwaveBandMode ??
			DEFAULT_STATE.spectrumShockwaveBandMode,
		spectrumShockwaveThickness:
			values.spectrumShockwaveThickness ??
			DEFAULT_STATE.spectrumShockwaveThickness,
		spectrumShockwaveOpacity:
			values.spectrumShockwaveOpacity ??
			DEFAULT_STATE.spectrumShockwaveOpacity,
		spectrumShockwaveBlur:
			values.spectrumShockwaveBlur ??
			DEFAULT_STATE.spectrumShockwaveBlur,
		spectrumShockwaveColorMode:
			values.spectrumShockwaveColorMode ??
			DEFAULT_STATE.spectrumShockwaveColorMode,
		spectrumEnergyBloom:
			values.spectrumEnergyBloom ?? DEFAULT_STATE.spectrumEnergyBloom,
		spectrumPeakRibbonAngle:
			values.spectrumPeakRibbonAngle ?? DEFAULT_STATE.spectrumPeakRibbonAngle,
		spectrumClonePeakRibbons:
			values.spectrumClonePeakRibbons ??
			DEFAULT_STATE.spectrumClonePeakRibbons,
		spectrumCloneAfterglow:
			values.spectrumCloneAfterglow ?? DEFAULT_STATE.spectrumCloneAfterglow,
		spectrumCloneMotionTrails:
			values.spectrumCloneMotionTrails ??
			DEFAULT_STATE.spectrumCloneMotionTrails,
		spectrumCloneGhostFrames:
			values.spectrumCloneGhostFrames ??
			DEFAULT_STATE.spectrumCloneGhostFrames,
		spectrumCloneEnergyBloom:
			values.spectrumCloneEnergyBloom ??
			DEFAULT_STATE.spectrumCloneEnergyBloom,
		spectrumCloneBassShockwave:
			values.spectrumCloneBassShockwave ??
			DEFAULT_STATE.spectrumCloneBassShockwave,
		spectrumCloneShockwaveBandMode:
			values.spectrumCloneShockwaveBandMode ??
			DEFAULT_STATE.spectrumCloneShockwaveBandMode,
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
		spectrumOscilloscopeLineWidth:
			values.spectrumOscilloscopeLineWidth ??
			DEFAULT_STATE.spectrumOscilloscopeLineWidth,
		spectrumTunnelRingCount:
			values.spectrumTunnelRingCount ?? DEFAULT_STATE.spectrumTunnelRingCount,
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
		spectrumCloneTunnelRingCount:
			values.spectrumCloneTunnelRingCount ??
			DEFAULT_STATE.spectrumCloneTunnelRingCount,
		spectrumSpectrogramDecay:
			values.spectrumSpectrogramDecay ??
			DEFAULT_STATE.spectrumSpectrogramDecay,
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
		spectrumLogoGap: values.spectrumLogoGap ?? DEFAULT_STATE.spectrumLogoGap,
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
		spectrumCloneBarCount:
			values.spectrumCloneBarCount ?? DEFAULT_STATE.spectrumCloneBarCount,
		spectrumCloneBarWidth:
			values.spectrumCloneBarWidth ?? DEFAULT_STATE.spectrumCloneBarWidth,
		spectrumCloneMinHeight:
			values.spectrumCloneMinHeight ?? DEFAULT_STATE.spectrumCloneMinHeight,
		spectrumCloneMaxHeight:
			values.spectrumCloneMaxHeight ?? DEFAULT_STATE.spectrumCloneMaxHeight,
		spectrumCloneSmoothing:
			values.spectrumCloneSmoothing ?? DEFAULT_STATE.spectrumCloneSmoothing,
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
			values.spectrumCloneColorMode ?? DEFAULT_STATE.spectrumCloneColorMode,
		spectrumCloneBandMode:
			values.spectrumCloneBandMode ?? DEFAULT_STATE.spectrumCloneBandMode,
		spectrumCloneAudioSmoothingEnabled:
			values.spectrumCloneAudioSmoothingEnabled ??
			DEFAULT_STATE.spectrumCloneAudioSmoothingEnabled,
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
			values.spectrumClonePeakDecay ?? DEFAULT_STATE.spectrumClonePeakDecay,
		spectrumCloneFollowLogo:
			values.spectrumCloneFollowLogo ??
			DEFAULT_STATE.spectrumCloneFollowLogo,
		spectrumCloneRadialFitLogo:
			values.spectrumCloneRadialFitLogo ??
			DEFAULT_STATE.spectrumCloneRadialFitLogo,
		spectrumInnerRadius:
			values.spectrumInnerRadius ?? DEFAULT_STATE.spectrumInnerRadius,
		spectrumBarCount: values.spectrumBarCount ?? DEFAULT_STATE.spectrumBarCount,
		spectrumBarWidth: values.spectrumBarWidth ?? DEFAULT_STATE.spectrumBarWidth,
		spectrumMinHeight:
			values.spectrumMinHeight ?? DEFAULT_STATE.spectrumMinHeight,
		spectrumMaxHeight:
			values.spectrumMaxHeight ?? DEFAULT_STATE.spectrumMaxHeight,
		spectrumSmoothing:
			values.spectrumSmoothing ?? DEFAULT_STATE.spectrumSmoothing,
		spectrumOpacity: values.spectrumOpacity ?? DEFAULT_STATE.spectrumOpacity,
		spectrumGlowIntensity:
			values.spectrumGlowIntensity ?? DEFAULT_STATE.spectrumGlowIntensity,
		spectrumShadowBlur:
			values.spectrumShadowBlur ?? DEFAULT_STATE.spectrumShadowBlur,
		spectrumPrimaryColor:
			values.spectrumPrimaryColor ?? DEFAULT_STATE.spectrumPrimaryColor,
		spectrumSecondaryColor:
			values.spectrumSecondaryColor ?? DEFAULT_STATE.spectrumSecondaryColor,
		spectrumColorSource:
			values.spectrumColorSource ?? DEFAULT_STATE.spectrumColorSource,
		spectrumColorMode:
			values.spectrumColorMode ?? DEFAULT_STATE.spectrumColorMode,
		spectrumBandMode:
			values.spectrumBandMode ?? DEFAULT_STATE.spectrumBandMode,
		spectrumAudioSmoothingEnabled:
			values.spectrumAudioSmoothingEnabled ??
			DEFAULT_STATE.spectrumAudioSmoothingEnabled,
		spectrumAudioSmoothing:
			values.spectrumAudioSmoothing ?? DEFAULT_STATE.spectrumAudioSmoothing,
		spectrumShape: normalizeSpectrumShape(
			values.spectrumShape ?? DEFAULT_STATE.spectrumShape
		),
		spectrumWaveFillOpacity:
			values.spectrumWaveFillOpacity ?? DEFAULT_STATE.spectrumWaveFillOpacity,
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
