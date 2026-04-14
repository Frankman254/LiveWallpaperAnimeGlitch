import { DEFAULT_STATE } from '@/lib/constants';
import { normalizeSpectrumShape } from '@/features/spectrum/spectrumControlConfig';
import type { SpectrumProfileSettings } from '@/types/wallpaper';

/**
 * Fills missing spectrum profile fields from defaults (same as applying a preset).
 * Use whenever spectrum settings are merged from partial sources (e.g. scene presets).
 */
export function hydrateSpectrumProfileValues(
	values: Partial<SpectrumProfileSettings>
): SpectrumProfileSettings {
	return {
		spectrumEnabled:
			values.spectrumEnabled ?? DEFAULT_STATE.spectrumEnabled,
		spectrumFamily:
			values.spectrumFamily ?? DEFAULT_STATE.spectrumFamily,
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
		spectrumEnergyBloom:
			values.spectrumEnergyBloom ?? DEFAULT_STATE.spectrumEnergyBloom,
		spectrumOscilloscopeLineWidth:
			values.spectrumOscilloscopeLineWidth ??
			DEFAULT_STATE.spectrumOscilloscopeLineWidth,
		spectrumTunnelRingCount:
			values.spectrumTunnelRingCount ?? DEFAULT_STATE.spectrumTunnelRingCount,
		spectrumSpectrogramDecay:
			values.spectrumSpectrogramDecay ??
			DEFAULT_STATE.spectrumSpectrogramDecay,
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
	};
}
