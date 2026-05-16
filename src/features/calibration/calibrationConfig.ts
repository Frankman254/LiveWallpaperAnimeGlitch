/**
 * Calibration tab — centralised reactivity controls with editable ranges.
 *
 * Every parameter declared here gets:
 *   1. A slider in the Calibration tab (under its group).
 *   2. A per-parameter editable min/max/step override (persisted in store).
 *   3. Inclusion in the calibration profile slots (save/load named bundles).
 *   4. A "suggested" value applied by the "Aplicar calibración sugerida" button.
 *
 * The `key` MUST match a numeric field on WallpaperState and a setter on
 * WallpaperStore named `set<PascalCase(key)>`. The CalibrationTab uses that
 * convention to read/write generically.
 */

import type { WallpaperState } from '@/types/wallpaper';
import type { SliderRange } from '@/config/ranges';
import {
	AUDIO_ROUTING_RANGES,
	FX_RANGES,
	IMAGE_EFFECT_RANGES,
	IMAGE_RANGES,
	LOGO_RANGES,
	SPECTRUM_RANGES
} from '@/config/ranges';

export type CalibrationGroupId = 'logo' | 'bgZoom' | 'glitch' | 'audio';

export interface CalibrationParam {
	/** Field name on WallpaperState (used to derive setter as `set${Pascal(key)}`). */
	key: keyof WallpaperState & string;
	label: string;
	group: CalibrationGroupId;
	hint?: string;
	defaultRange: SliderRange;
	/** Decimal places for slider value display (default 2). */
	precision?: number;
}

export interface CalibrationGroupMeta {
	id: CalibrationGroupId;
	label: string;
	description: string;
}

export const CALIBRATION_GROUPS: ReadonlyArray<CalibrationGroupMeta> = [
	{
		id: 'logo',
		label: 'Logo',
		description: 'Reacción de escala y glow del logo central.'
	},
	{
		id: 'bgZoom',
		label: 'BG Zoom',
		description: 'Envolvente del zoom del fondo en respuesta a graves.'
	},
	{
		id: 'glitch',
		label: 'Glitch / RGB',
		description: 'Sensibilidad y suavizado del chromatic shift reactivo.'
	},
	{
		id: 'audio',
		label: 'Audio global',
		description: 'Sensibilidad y routing globales del análisis de audio.'
	}
];

export const CALIBRATION_PARAMS: ReadonlyArray<CalibrationParam> = [
	// ─── Logo ──────────────────────────────────────────────────────────────────
	{
		key: 'logoAudioSensitivity',
		label: 'Sensibilidad',
		group: 'logo',
		hint: 'Ganancia bruta antes del envelope. Si lo subes mucho satura.',
		defaultRange: LOGO_RANGES.audioSensitivity
	},
	{
		key: 'logoReactiveScaleIntensity',
		label: 'Intensidad de escala',
		group: 'logo',
		hint: 'Cuánto del envelope se aplica al tamaño final.',
		defaultRange: LOGO_RANGES.reactiveScaleIntensity
	},
	{
		key: 'logoReactivitySpeed',
		label: 'Velocidad de respuesta',
		group: 'logo',
		hint: 'Multiplica el ritmo global de attack/release.',
		defaultRange: LOGO_RANGES.reactivitySpeed
	},
	{
		key: 'logoAttack',
		label: 'Attack',
		group: 'logo',
		hint: 'Velocidad de subida ante un golpe.',
		defaultRange: LOGO_RANGES.attack
	},
	{
		key: 'logoRelease',
		label: 'Release',
		group: 'logo',
		hint: 'Velocidad de caída tras un golpe.',
		defaultRange: LOGO_RANGES.release
	},
	{
		key: 'logoPunch',
		label: 'Punch',
		group: 'logo',
		hint: 'Boost extra sobre transientes (saltos bruscos de volumen).',
		defaultRange: LOGO_RANGES.punch
	},
	{
		key: 'logoPeakWindow',
		label: 'Peak Window',
		group: 'logo',
		hint: 'Segundos que el pico se "recuerda" antes de adaptarse.',
		defaultRange: LOGO_RANGES.peakWindow
	},
	{
		key: 'logoPeakFloor',
		label: 'Peak Floor',
		group: 'logo',
		hint: 'Fracción del pico que se trata como silencio.',
		defaultRange: LOGO_RANGES.peakFloor
	},

	// ─── BG Zoom (envelope) ────────────────────────────────────────────────────
	{
		key: 'imageBassScaleIntensity',
		label: 'Zoom intensity',
		group: 'bgZoom',
		hint: 'Multiplicador del zoom final aplicado al fondo.',
		defaultRange: IMAGE_RANGES.bassIntensity
	},
	{
		key: 'imageBassAttack',
		label: 'Attack',
		group: 'bgZoom',
		defaultRange: LOGO_RANGES.attack
	},
	{
		key: 'imageBassRelease',
		label: 'Release',
		group: 'bgZoom',
		defaultRange: LOGO_RANGES.release
	},
	{
		key: 'imageBassReactivitySpeed',
		label: 'Velocidad de respuesta',
		group: 'bgZoom',
		defaultRange: LOGO_RANGES.reactivitySpeed
	},
	{
		key: 'imageBassPeakWindow',
		label: 'Peak Window',
		group: 'bgZoom',
		defaultRange: LOGO_RANGES.peakWindow
	},
	{
		key: 'imageBassPeakFloor',
		label: 'Peak Floor',
		group: 'bgZoom',
		defaultRange: LOGO_RANGES.peakFloor
	},
	{
		key: 'imageBassPunch',
		label: 'Punch',
		group: 'bgZoom',
		defaultRange: LOGO_RANGES.punch
	},
	{
		key: 'imageBassReactiveScaleIntensity',
		label: 'Reactive scale',
		group: 'bgZoom',
		hint: 'Intensidad post-normalize (0.01–2.5).',
		defaultRange: { min: 0.01, max: 2.5, step: 0.01 }
	},

	// ─── Glitch / RGB shift ────────────────────────────────────────────────────
	{
		key: 'rgbShiftAudioSensitivity',
		label: 'RGB shift sensibilidad',
		group: 'glitch',
		hint: 'Magnitud del chromatic shift por unidad de canal.',
		defaultRange: IMAGE_EFFECT_RANGES.rgbAudioSensitivity,
		precision: 3
	},
	{
		key: 'rgbShiftAudioSmoothing',
		label: 'RGB shift smoothing',
		group: 'glitch',
		hint: 'Suaviza los picos del canal hi-hat para evitar temblores.',
		defaultRange: SPECTRUM_RANGES.smoothing
	},

	// ─── Global audio ──────────────────────────────────────────────────────────
	{
		key: 'audioSensitivity',
		label: 'Sensibilidad global',
		group: 'audio',
		hint: 'Multiplicador maestro aplicado a todo el análisis.',
		defaultRange: FX_RANGES.audioSensitivity
	},
	{
		key: 'audioChannelSmoothing',
		label: 'Channel smoothing',
		group: 'audio',
		hint: 'Suavizado por canal del routing de audio.',
		defaultRange: AUDIO_ROUTING_RANGES.channelSmoothing
	},
	{
		key: 'audioAutoKickThreshold',
		label: 'Auto-kick threshold',
		group: 'audio',
		hint: 'Umbral para detectar kicks en routing automático.',
		defaultRange: AUDIO_ROUTING_RANGES.autoKickThreshold
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
			name: `Calibración ${index + 1}`,
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
		? `Calibración (${overridden} rangos)`
		: 'Calibración';
}
