/**
 * Calibration tab — centralised reactivity controls with editable ranges.
 *
 * Every parameter declared here gets:
 *   1. A slider in the Calibration tab (under its group).
 *   2. A per-parameter editable min/max/step override (persisted in store).
 *   3. Inclusion in the calibration profile slots (save/load named bundles).
 *   4. A "suggested" value applied by the "Apply suggested calibration" button.
 *
 * The `key` MUST match a numeric field on WallpaperState and a setter on
 * WallpaperStore named `set<PascalCase(key)>`. The CalibrationTab uses that
 * convention to read/write generically.
 */

import type { WallpaperState } from '@/types/wallpaper';
import type { TranslationKey } from '@/lib/i18n/en';
import type { SliderRange } from '@/config/ranges';
import {
	AUDIO_ROUTING_RANGES,
	IMAGE_EFFECT_RANGES,
	IMAGE_RANGES,
	LOGO_RANGES,
	PARTICLE_RANGES,
	SPECTRUM_RANGES
} from '@/config/ranges';

export type CalibrationGroupId =
	| 'logo'
	| 'bgZoom'
	| 'bgReactive'
	| 'glitch'
	| 'audio'
	| 'particles';

/**
 * Per-group "Sintético" toggle state for the Calibration tab. When a group is
 * `true`, the element it calibrates is driven by a synthetic test pulse instead
 * of the live audio channel (see `syntheticKickValue`). Ephemeral — not
 * persisted, so it always starts off after a reload.
 */
export type CalibrationSyntheticGroups = Partial<
	Record<CalibrationGroupId, boolean>
>;

export interface CalibrationParam {
	/** Field name on WallpaperState (used to derive setter as `set${Pascal(key)}`). */
	key: keyof WallpaperState & string;
	/** i18n key — resolve with `useT()` at render time. */
	labelKey: TranslationKey;
	group: CalibrationGroupId;
	hintKey?: TranslationKey;
	defaultRange: SliderRange;
	/** Decimal places for slider value display (default 2). */
	precision?: number;
}

export interface CalibrationGroupMeta {
	id: CalibrationGroupId;
	labelKey: TranslationKey;
	descriptionKey: TranslationKey;
}

export const CALIBRATION_GROUPS: ReadonlyArray<CalibrationGroupMeta> = [
	{
		id: 'logo',
		labelKey: 'calibration_group_logo',
		descriptionKey: 'calibration_group_logo_description'
	},
	{
		id: 'bgZoom',
		labelKey: 'calibration_group_bgZoom',
		descriptionKey: 'calibration_group_bgZoom_description'
	},
	{
		id: 'bgReactive',
		labelKey: 'calibration_group_bgReactive',
		descriptionKey: 'calibration_group_bgReactive_description'
	},
	{
		id: 'glitch',
		labelKey: 'calibration_group_glitch',
		descriptionKey: 'calibration_group_glitch_description'
	},
	{
		id: 'audio',
		labelKey: 'calibration_group_audio',
		descriptionKey: 'calibration_group_audio_description'
	},
	{
		id: 'particles',
		labelKey: 'calibration_group_particles',
		descriptionKey: 'calibration_group_particles_description'
	}
];

export const CALIBRATION_PARAMS: ReadonlyArray<CalibrationParam> = [
	// ─── Logo ──────────────────────────────────────────────────────────────────
	{
		key: 'logoAudioSmoothing',
		labelKey: 'calibration_param_logoAudioSmoothing',
		group: 'logo',
		hintKey: 'calibration_param_logoAudioSmoothing_hint',
		defaultRange: AUDIO_ROUTING_RANGES.selectedChannelSmoothing
	},
	{
		key: 'logoAudioSensitivity',
		labelKey: 'calibration_param_logoAudioSensitivity',
		group: 'logo',
		hintKey: 'calibration_param_logoAudioSensitivity_hint',
		defaultRange: LOGO_RANGES.audioSensitivity
	},
	{
		key: 'logoMinScale',
		labelKey: 'calibration_param_logoMinScale',
		group: 'logo',
		hintKey: 'calibration_param_logoMinScale_hint',
		defaultRange: LOGO_RANGES.minScale
	},
	{
		key: 'logoMaxScale',
		labelKey: 'calibration_param_logoMaxScale',
		group: 'logo',
		hintKey: 'calibration_param_logoMaxScale_hint',
		defaultRange: LOGO_RANGES.maxScale
	},
	{
		key: 'logoReactiveScaleIntensity',
		labelKey: 'calibration_param_logoReactiveScaleIntensity',
		group: 'logo',
		hintKey: 'calibration_param_logoReactiveScaleIntensity_hint',
		defaultRange: LOGO_RANGES.reactiveScaleIntensity
	},
	{
		key: 'logoReactivitySpeed',
		labelKey: 'calibration_param_logoReactivitySpeed',
		group: 'logo',
		hintKey: 'calibration_param_logoReactivitySpeed_hint',
		defaultRange: LOGO_RANGES.reactivitySpeed
	},
	{
		key: 'logoAttack',
		labelKey: 'calibration_param_logoAttack',
		group: 'logo',
		hintKey: 'calibration_param_logoAttack_hint',
		defaultRange: LOGO_RANGES.attack
	},
	{
		key: 'logoRelease',
		labelKey: 'calibration_param_logoRelease',
		group: 'logo',
		hintKey: 'calibration_param_logoRelease_hint',
		defaultRange: LOGO_RANGES.release
	},
	{
		key: 'logoPunch',
		labelKey: 'calibration_param_logoPunch',
		group: 'logo',
		hintKey: 'calibration_param_logoPunch_hint',
		defaultRange: LOGO_RANGES.punch
	},
	{
		key: 'logoPeakWindow',
		labelKey: 'calibration_param_logoPeakWindow',
		group: 'logo',
		hintKey: 'calibration_param_logoPeakWindow_hint',
		defaultRange: LOGO_RANGES.peakWindow
	},
	{
		key: 'logoPeakFloor',
		labelKey: 'calibration_param_logoPeakFloor',
		group: 'logo',
		hintKey: 'calibration_param_logoPeakFloor_hint',
		defaultRange: LOGO_RANGES.peakFloor
	},

	// ─── BG Zoom (envelope) ────────────────────────────────────────────────────
	{
		key: 'imageAudioSmoothing',
		labelKey: 'calibration_param_imageAudioSmoothing',
		group: 'bgZoom',
		hintKey: 'calibration_param_imageAudioSmoothing_hint',
		defaultRange: AUDIO_ROUTING_RANGES.selectedChannelSmoothing
	},
	{
		key: 'imageAudioReactiveDecay',
		labelKey: 'calibration_param_imageAudioReactiveDecay',
		group: 'bgZoom',
		hintKey: 'calibration_param_imageAudioReactiveDecay_hint',
		defaultRange: { min: 0, max: 1, step: 0.01 }
	},
	{
		key: 'imageBassScaleIntensity',
		labelKey: 'calibration_param_imageBassScaleIntensity',
		group: 'bgZoom',
		hintKey: 'calibration_param_imageBassScaleIntensity_hint',
		defaultRange: IMAGE_RANGES.bassIntensity
	},
	{
		key: 'imageBassAttack',
		labelKey: 'calibration_param_imageBassAttack',
		group: 'bgZoom',
		hintKey: 'calibration_param_imageBassAttack_hint',
		defaultRange: LOGO_RANGES.attack
	},
	{
		key: 'imageBassRelease',
		labelKey: 'calibration_param_imageBassRelease',
		group: 'bgZoom',
		hintKey: 'calibration_param_imageBassRelease_hint',
		defaultRange: LOGO_RANGES.release
	},
	{
		key: 'imageBassReactivitySpeed',
		labelKey: 'calibration_param_imageBassReactivitySpeed',
		group: 'bgZoom',
		hintKey: 'calibration_param_imageBassReactivitySpeed_hint',
		defaultRange: LOGO_RANGES.reactivitySpeed
	},
	{
		key: 'imageBassPeakWindow',
		labelKey: 'calibration_param_imageBassPeakWindow',
		group: 'bgZoom',
		hintKey: 'calibration_param_imageBassPeakWindow_hint',
		defaultRange: LOGO_RANGES.peakWindow
	},
	{
		key: 'imageBassPeakFloor',
		labelKey: 'calibration_param_imageBassPeakFloor',
		group: 'bgZoom',
		hintKey: 'calibration_param_imageBassPeakFloor_hint',
		defaultRange: LOGO_RANGES.peakFloor
	},
	{
		key: 'imageBassPunch',
		labelKey: 'calibration_param_imageBassPunch',
		group: 'bgZoom',
		hintKey: 'calibration_param_imageBassPunch_hint',
		defaultRange: LOGO_RANGES.punch
	},
	{
		key: 'imageBassReactiveScaleIntensity',
		labelKey: 'calibration_param_imageBassReactiveScaleIntensity',
		group: 'bgZoom',
		hintKey: 'calibration_param_imageBassReactiveScaleIntensity_hint',
		defaultRange: { min: 0.01, max: 2.5, step: 0.01 }
	},

	// ─── BG Opacity / Blur reactive ────────────────────────────────────────────
	{
		key: 'imageOpacityReactiveAmount',
		labelKey: 'calibration_param_imageOpacityReactiveAmount',
		group: 'bgReactive',
		hintKey: 'calibration_param_imageOpacityReactiveAmount_hint',
		defaultRange: IMAGE_RANGES.audioOpacityAmount
	},
	{
		key: 'imageOpacityReactiveThreshold',
		labelKey: 'calibration_param_imageOpacityReactiveThreshold',
		group: 'bgReactive',
		hintKey: 'calibration_param_imageOpacityReactiveThreshold_hint',
		defaultRange: IMAGE_RANGES.audioReactiveThreshold
	},
	{
		key: 'imageOpacityReactiveSoftness',
		labelKey: 'calibration_param_imageOpacityReactiveSoftness',
		group: 'bgReactive',
		hintKey: 'calibration_param_imageOpacityReactiveSoftness_hint',
		defaultRange: IMAGE_RANGES.audioReactiveSoftness
	},
	{
		key: 'imageBlurReactiveAmount',
		labelKey: 'calibration_param_imageBlurReactiveAmount',
		group: 'bgReactive',
		hintKey: 'calibration_param_imageBlurReactiveAmount_hint',
		defaultRange: IMAGE_RANGES.audioBlurAmount
	},
	{
		key: 'imageBlurReactiveThreshold',
		labelKey: 'calibration_param_imageBlurReactiveThreshold',
		group: 'bgReactive',
		hintKey: 'calibration_param_imageBlurReactiveThreshold_hint',
		defaultRange: IMAGE_RANGES.audioReactiveThreshold
	},
	{
		key: 'imageBlurReactiveSoftness',
		labelKey: 'calibration_param_imageBlurReactiveSoftness',
		group: 'bgReactive',
		hintKey: 'calibration_param_imageBlurReactiveSoftness_hint',
		defaultRange: IMAGE_RANGES.audioReactiveSoftness
	},

	// ─── Glitch / RGB shift ────────────────────────────────────────────────────
	{
		key: 'rgbShift',
		labelKey: 'calibration_param_rgbShift',
		group: 'glitch',
		hintKey: 'calibration_param_rgbShift_hint',
		defaultRange: IMAGE_EFFECT_RANGES.rgbShift,
		precision: 3
	},
	{
		key: 'rgbShiftAudioSensitivity',
		labelKey: 'calibration_param_rgbShiftAudioSensitivity',
		group: 'glitch',
		hintKey: 'calibration_param_rgbShiftAudioSensitivity_hint',
		defaultRange: IMAGE_EFFECT_RANGES.rgbAudioSensitivity,
		precision: 3
	},
	{
		key: 'rgbShiftAudioSmoothing',
		labelKey: 'calibration_param_rgbShiftAudioSmoothing',
		group: 'glitch',
		hintKey: 'calibration_param_rgbShiftAudioSmoothing_hint',
		defaultRange: SPECTRUM_RANGES.smoothing
	},
	{
		key: 'rgbShiftAudioAttack',
		labelKey: 'calibration_param_rgbShiftAudioAttack',
		group: 'glitch',
		hintKey: 'calibration_param_rgbShiftAudioAttack_hint',
		defaultRange: LOGO_RANGES.attack
	},
	{
		key: 'rgbShiftAudioRelease',
		labelKey: 'calibration_param_rgbShiftAudioRelease',
		group: 'glitch',
		hintKey: 'calibration_param_rgbShiftAudioRelease_hint',
		defaultRange: LOGO_RANGES.release
	},
	{
		key: 'rgbShiftAudioReactivitySpeed',
		labelKey: 'calibration_param_rgbShiftAudioReactivitySpeed',
		group: 'glitch',
		hintKey: 'calibration_param_rgbShiftAudioReactivitySpeed_hint',
		defaultRange: LOGO_RANGES.reactivitySpeed
	},
	{
		key: 'rgbShiftAudioPeakWindow',
		labelKey: 'calibration_param_rgbShiftAudioPeakWindow',
		group: 'glitch',
		hintKey: 'calibration_param_rgbShiftAudioPeakWindow_hint',
		defaultRange: LOGO_RANGES.peakWindow
	},
	{
		key: 'rgbShiftAudioPeakFloor',
		labelKey: 'calibration_param_rgbShiftAudioPeakFloor',
		group: 'glitch',
		hintKey: 'calibration_param_rgbShiftAudioPeakFloor_hint',
		defaultRange: LOGO_RANGES.peakFloor
	},
	{
		key: 'rgbShiftAudioPunch',
		labelKey: 'calibration_param_rgbShiftAudioPunch',
		group: 'glitch',
		hintKey: 'calibration_param_rgbShiftAudioPunch_hint',
		defaultRange: LOGO_RANGES.punch
	},

	// ─── Global audio ──────────────────────────────────────────────────────────
	// `audioSensitivity`, `audioChannelSmoothing` y `audioSelectedChannelSmoothing`
	// se eliminaron de esta pestaña: el suavizado y la ganancia son
	// responsabilidad de cada subsistema (no hay una sola "física" universal).
	{
		key: 'audioSmoothing',
		labelKey: 'calibration_param_audioSmoothing',
		group: 'audio',
		hintKey: 'calibration_param_audioSmoothing_hint',
		defaultRange: { min: 0, max: 0.99, step: 0.01 }
	},
	{
		key: 'audioAutoKickThreshold',
		labelKey: 'calibration_param_audioAutoKickThreshold',
		group: 'audio',
		hintKey: 'calibration_param_audioAutoKickThreshold_hint',
		defaultRange: AUDIO_ROUTING_RANGES.autoKickThreshold
	},
	{
		key: 'audioAutoSwitchHoldMs',
		labelKey: 'calibration_param_audioAutoSwitchHoldMs',
		group: 'audio',
		hintKey: 'calibration_param_audioAutoSwitchHoldMs_hint',
		defaultRange: AUDIO_ROUTING_RANGES.autoSwitchHoldMs,
		precision: 0
	},

	// ─── Partículas ────────────────────────────────────────────────────────────
	{
		key: 'particleAudioSmoothing',
		labelKey: 'calibration_param_particleAudioSmoothing',
		group: 'particles',
		hintKey: 'calibration_param_particleAudioSmoothing_hint',
		defaultRange: AUDIO_ROUTING_RANGES.selectedChannelSmoothing
	},
	{
		key: 'particleAudioSizeBoost',
		labelKey: 'calibration_param_particleAudioSizeBoost',
		group: 'particles',
		hintKey: 'calibration_param_particleAudioSizeBoost_hint',
		defaultRange: { min: 0, max: 30, step: 1 },
		precision: 0
	},
	{
		key: 'particleAudioOpacityBoost',
		labelKey: 'calibration_param_particleAudioOpacityBoost',
		group: 'particles',
		hintKey: 'calibration_param_particleAudioOpacityBoost_hint',
		defaultRange: { min: 0, max: 1, step: 0.05 }
	},
	{
		key: 'particleAudioAttack',
		labelKey: 'calibration_param_particleAudioAttack',
		group: 'particles',
		hintKey: 'calibration_param_particleAudioAttack_hint',
		defaultRange: LOGO_RANGES.attack
	},
	{
		key: 'particleAudioRelease',
		labelKey: 'calibration_param_particleAudioRelease',
		group: 'particles',
		hintKey: 'calibration_param_particleAudioRelease_hint',
		defaultRange: LOGO_RANGES.release
	},
	{
		key: 'particleAudioReactivitySpeed',
		labelKey: 'calibration_param_particleAudioReactivitySpeed',
		group: 'particles',
		hintKey: 'calibration_param_particleAudioReactivitySpeed_hint',
		defaultRange: LOGO_RANGES.reactivitySpeed
	},
	{
		key: 'particleAudioPeakWindow',
		labelKey: 'calibration_param_particleAudioPeakWindow',
		group: 'particles',
		hintKey: 'calibration_param_particleAudioPeakWindow_hint',
		defaultRange: LOGO_RANGES.peakWindow
	},
	{
		key: 'particleAudioPeakFloor',
		labelKey: 'calibration_param_particleAudioPeakFloor',
		group: 'particles',
		hintKey: 'calibration_param_particleAudioPeakFloor_hint',
		defaultRange: LOGO_RANGES.peakFloor
	},
	{
		key: 'particleAudioPunch',
		labelKey: 'calibration_param_particleAudioPunch',
		group: 'particles',
		hintKey: 'calibration_param_particleAudioPunch_hint',
		defaultRange: LOGO_RANGES.punch
	},
	{
		key: 'particleAudioDriftAngle',
		labelKey: 'calibration_param_particleAudioDriftAngle',
		group: 'particles',
		hintKey: 'calibration_param_particleAudioDriftAngle_hint',
		defaultRange: PARTICLE_RANGES.audioDriftAngle,
		precision: 0
	},
	{
		key: 'particleAudioDriftAmount',
		labelKey: 'calibration_param_particleAudioDriftAmount',
		group: 'particles',
		hintKey: 'calibration_param_particleAudioDriftAmount_hint',
		defaultRange: PARTICLE_RANGES.audioDriftAmount
	},
	{
		key: 'particleAudioDriftBase',
		labelKey: 'calibration_param_particleAudioDriftBase',
		group: 'particles',
		hintKey: 'calibration_param_particleAudioDriftBase_hint',
		defaultRange: PARTICLE_RANGES.audioDriftBase
	},
	{
		key: 'particleAudioDriftThreshold',
		labelKey: 'calibration_param_particleAudioDriftThreshold',
		group: 'particles',
		hintKey: 'calibration_param_particleAudioDriftThreshold_hint',
		defaultRange: PARTICLE_RANGES.audioDriftThreshold
	},
	{
		key: 'particleAudioDriftRelease',
		labelKey: 'calibration_param_particleAudioDriftRelease',
		group: 'particles',
		hintKey: 'calibration_param_particleAudioDriftRelease_hint',
		defaultRange: PARTICLE_RANGES.audioDriftRelease
	},
	{
		key: 'particleDepthFlowAmount',
		labelKey: 'calibration_param_particleDepthFlowAmount',
		group: 'particles',
		hintKey: 'calibration_param_particleDepthFlowAmount_hint',
		defaultRange: PARTICLE_RANGES.depthFlowAmount
	},
	{
		key: 'particleDepthFlowThreshold',
		labelKey: 'calibration_param_particleDepthFlowThreshold',
		group: 'particles',
		hintKey: 'calibration_param_particleDepthFlowThreshold_hint',
		defaultRange: PARTICLE_RANGES.depthFlowThreshold
	},
	{
		key: 'particleDepthFlowSensitivity',
		labelKey: 'calibration_param_particleDepthFlowSensitivity',
		group: 'particles',
		hintKey: 'calibration_param_particleDepthFlowSensitivity_hint',
		defaultRange: PARTICLE_RANGES.depthFlowSensitivity
	},
	{
		key: 'particleDepthFlowAttack',
		labelKey: 'calibration_param_particleDepthFlowAttack',
		group: 'particles',
		hintKey: 'calibration_param_particleDepthFlowAttack_hint',
		defaultRange: PARTICLE_RANGES.depthFlowAttack
	},
	{
		key: 'particleDepthFlowRelease',
		labelKey: 'calibration_param_particleDepthFlowRelease',
		group: 'particles',
		hintKey: 'calibration_param_particleDepthFlowRelease_hint',
		defaultRange: PARTICLE_RANGES.depthFlowRelease
	},
	{
		key: 'particleDepthFlowSpeed',
		labelKey: 'calibration_param_particleDepthFlowSpeed',
		group: 'particles',
		hintKey: 'calibration_param_particleDepthFlowSpeed_hint',
		defaultRange: PARTICLE_RANGES.depthFlowSpeed
	},
	{
		key: 'particleDepthFlowSpread',
		labelKey: 'calibration_param_particleDepthFlowSpread',
		group: 'particles',
		hintKey: 'calibration_param_particleDepthFlowSpread_hint',
		defaultRange: PARTICLE_RANGES.depthFlowSpread
	}
];

export const CALIBRATION_PARAM_KEYS = CALIBRATION_PARAMS.map(p => p.key);

/**
 * Recommended re-calibration to fix the "slow + jittery" pattern in the
 * default Anthropic configuration. Triggered by the "Aplicar calibración
 * sugerida" button in the Calibration tab.
 */
export const SUGGESTED_CALIBRATION_VALUES: Readonly<
	Partial<Record<(typeof CALIBRATION_PARAM_KEYS)[number], number>>
> = {
	// Logo: menos saturación + decay más natural + ventana adaptiva más corta
	logoAudioSensitivity: 2.4,
	logoReactiveScaleIntensity: 0.75,
	logoAttack: 0.7,
	logoRelease: 0.12,
	logoPunch: 0.25,
	logoPeakWindow: 1.2,
	logoPeakFloor: 0.06,
	// BG Zoom: ataques menos violentos + floor que filtra ruido
	imageBassAttack: 0.95,
	imageBassRelease: 0.13,
	imageBassPeakFloor: 0.05,
	imageBassPunch: 0.15,
	imageBassReactiveScaleIntensity: 1.0,
	// Glitch: menos magnitud + más smoothing en hi-hat
	rgbShiftAudioSensitivity: 0.005,
	rgbShiftAudioSmoothing: 0.32
};

export type CalibrationRangeOverride = Partial<SliderRange>;

export type CalibrationRangeOverrides = Partial<
	Record<(typeof CALIBRATION_PARAM_KEYS)[number], CalibrationRangeOverride>
>;

export type CalibrationProfileValues = Partial<
	Record<(typeof CALIBRATION_PARAM_KEYS)[number], number>
>;

export interface CalibrationProfileSlot {
	name: string;
	values: CalibrationProfileValues | null;
}

export const MAX_CALIBRATION_SLOT_COUNT = 10;
export const CALIBRATION_PROFILE_SLOT_COUNT = 3;

export function createDefaultCalibrationProfileSlots(): CalibrationProfileSlot[] {
	return Array.from(
		{ length: CALIBRATION_PROFILE_SLOT_COUNT },
		(_, index) => ({
			name: `Calibration ${index + 1}`,
			values: null
		})
	);
}

export function getEffectiveRange(
	param: CalibrationParam,
	overrides: CalibrationRangeOverrides | undefined
): SliderRange {
	const o = overrides?.[param.key];
	if (!o) return param.defaultRange;
	return {
		min: typeof o.min === 'number' ? o.min : param.defaultRange.min,
		max: typeof o.max === 'number' ? o.max : param.defaultRange.max,
		step: typeof o.step === 'number' ? o.step : param.defaultRange.step
	};
}

export function buildCalibrationProfileName(
	overrides: CalibrationRangeOverrides | undefined
): string {
	const overridden = overrides ? Object.keys(overrides).length : 0;
	return overridden > 0
		? `Calibration (${overridden} ranges)`
		: 'Calibration';
}
