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
	IMAGE_EFFECT_RANGES,
	IMAGE_RANGES,
	LOGO_RANGES,
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
		description:
			'Controla cuánto crece el logo con la música y qué tan rápido vuelve a su tamaño.'
	},
	{
		id: 'bgZoom',
		label: 'BG Zoom',
		description:
			'Controla el zoom musical del fondo. Smoothing reduce jitter; attack/release definen rapidez.'
	},
	{
		id: 'bgReactive',
		label: 'BG Opacity / Blur',
		description:
			'Controla blur y opacidad por audio. Blur alto suaviza la imagen, pero cuesta GPU.'
	},
	{
		id: 'glitch',
		label: 'Glitch / RGB',
		description:
			'Controla el desplazamiento RGB. Mucha sensibilidad puede generar temblor visual.'
	},
	{
		id: 'audio',
		label: 'Audio global',
		description:
			'Parámetros que aplican al analizador FFT y al routing automático de canales. El suavizado lo maneja cada subsistema (logo, BG, spectrum, partículas).'
	},
	{
		id: 'particles',
		label: 'Partículas',
		description:
			'Controla cuánto crecen o brillan las partículas con la música. Valores altos cuestan FPS.'
	}
];

export const CALIBRATION_PARAMS: ReadonlyArray<CalibrationParam> = [
	// ─── Logo ──────────────────────────────────────────────────────────────────
	{
		key: 'logoAudioSmoothing',
		label: 'Smoothing pre-envelope',
		group: 'logo',
		hint: 'Suaviza la señal del canal antes del envelope. 0 = sin filtro, 0.9 = mucho.',
		defaultRange: AUDIO_ROUTING_RANGES.selectedChannelSmoothing
	},
	{
		key: 'logoAudioSensitivity',
		label: 'Sensibilidad',
		group: 'logo',
		hint: 'Ganancia bruta antes del envelope. Si lo subes mucho satura.',
		defaultRange: LOGO_RANGES.audioSensitivity
	},
	{
		key: 'logoMinScale',
		label: 'Min scale',
		group: 'logo',
		hint: 'Tamaño mínimo del logo en silencio.',
		defaultRange: LOGO_RANGES.minScale
	},
	{
		key: 'logoMaxScale',
		label: 'Max scale',
		group: 'logo',
		hint: 'Tamaño máximo en pico de audio.',
		defaultRange: LOGO_RANGES.maxScale
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
		key: 'imageAudioSmoothing',
		label: 'Smoothing pre-envelope',
		group: 'bgZoom',
		hint: 'Suaviza la señal del canal de fondo antes del envelope.',
		defaultRange: AUDIO_ROUTING_RANGES.selectedChannelSmoothing
	},
	{
		key: 'imageAudioReactiveDecay',
		label: 'Decay (legacy)',
		group: 'bgZoom',
		hint: 'Path antiguo de smoothing. 0.62 ≈ release 0.096 del envelope nuevo.',
		defaultRange: { min: 0, max: 1, step: 0.01 }
	},
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
		hint: 'Qué tan rápido crece el zoom cuando entra un golpe.',
		defaultRange: LOGO_RANGES.attack
	},
	{
		key: 'imageBassRelease',
		label: 'Release',
		group: 'bgZoom',
		hint: 'Qué tan rápido vuelve el zoom después del golpe.',
		defaultRange: LOGO_RANGES.release
	},
	{
		key: 'imageBassReactivitySpeed',
		label: 'Velocidad de respuesta',
		group: 'bgZoom',
		hint: 'Multiplica attack/release: alto = más nervioso, bajo = más suave.',
		defaultRange: LOGO_RANGES.reactivitySpeed
	},
	{
		key: 'imageBassPeakWindow',
		label: 'Peak Window',
		group: 'bgZoom',
		hint: 'Cuánto tiempo recuerda el pico reciente para estabilizar la reacción.',
		defaultRange: LOGO_RANGES.peakWindow
	},
	{
		key: 'imageBassPeakFloor',
		label: 'Peak Floor',
		group: 'bgZoom',
		hint: 'Piso de energía: sube esto si el fondo se mueve aun en partes suaves.',
		defaultRange: LOGO_RANGES.peakFloor
	},
	{
		key: 'imageBassPunch',
		label: 'Punch',
		group: 'bgZoom',
		hint: 'Empuje extra en golpes cortos. Alto puede verse brusco.',
		defaultRange: LOGO_RANGES.punch
	},
	{
		key: 'imageBassReactiveScaleIntensity',
		label: 'Reactive scale',
		group: 'bgZoom',
		hint: 'Intensidad post-normalize (0.01–2.5).',
		defaultRange: { min: 0.01, max: 2.5, step: 0.01 }
	},

	// ─── BG Opacity / Blur reactive ────────────────────────────────────────────
	{
		key: 'imageOpacityReactiveAmount',
		label: 'Opacity amount',
		group: 'bgReactive',
		hint: 'Cuánto cambia la opacidad del fondo con el audio.',
		defaultRange: IMAGE_RANGES.audioOpacityAmount
	},
	{
		key: 'imageOpacityReactiveThreshold',
		label: 'Opacity threshold',
		group: 'bgReactive',
		hint: 'Umbral mínimo de audio para activar el cambio de opacidad.',
		defaultRange: IMAGE_RANGES.audioReactiveThreshold
	},
	{
		key: 'imageOpacityReactiveSoftness',
		label: 'Opacity softness',
		group: 'bgReactive',
		hint: 'Suavidad de la transición alrededor del umbral.',
		defaultRange: IMAGE_RANGES.audioReactiveSoftness
	},
	{
		key: 'imageBlurReactiveAmount',
		label: 'Blur amount',
		group: 'bgReactive',
		hint: 'Cuántos px de blur añadir en el pico.',
		defaultRange: IMAGE_RANGES.audioBlurAmount
	},
	{
		key: 'imageBlurReactiveThreshold',
		label: 'Blur threshold',
		group: 'bgReactive',
		hint: 'Umbral mínimo de audio para activar el blur.',
		defaultRange: IMAGE_RANGES.audioReactiveThreshold
	},
	{
		key: 'imageBlurReactiveSoftness',
		label: 'Blur softness',
		group: 'bgReactive',
		hint: 'Suavidad de la transición de blur.',
		defaultRange: IMAGE_RANGES.audioReactiveSoftness
	},

	// ─── Glitch / RGB shift ────────────────────────────────────────────────────
	{
		key: 'rgbShift',
		label: 'RGB shift base',
		group: 'glitch',
		hint: 'Magnitud base del chromatic shift (siempre presente).',
		defaultRange: IMAGE_EFFECT_RANGES.rgbShift,
		precision: 3
	},
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
		hint: 'Suaviza los picos del canal antes del envelope.',
		defaultRange: SPECTRUM_RANGES.smoothing
	},
	{
		key: 'rgbShiftAudioAttack',
		label: 'RGB attack',
		group: 'glitch',
		hint: 'Velocidad de subida del envelope.',
		defaultRange: LOGO_RANGES.attack
	},
	{
		key: 'rgbShiftAudioRelease',
		label: 'RGB release',
		group: 'glitch',
		hint: 'Velocidad de caída del envelope.',
		defaultRange: LOGO_RANGES.release
	},
	{
		key: 'rgbShiftAudioReactivitySpeed',
		label: 'RGB response speed',
		group: 'glitch',
		hint: 'Multiplica attack/release.',
		defaultRange: LOGO_RANGES.reactivitySpeed
	},
	{
		key: 'rgbShiftAudioPeakWindow',
		label: 'RGB peak window',
		group: 'glitch',
		hint: 'Segundos que el pico se recuerda.',
		defaultRange: LOGO_RANGES.peakWindow
	},
	{
		key: 'rgbShiftAudioPeakFloor',
		label: 'RGB peak floor',
		group: 'glitch',
		hint: 'Fracción del pico tratada como silencio.',
		defaultRange: LOGO_RANGES.peakFloor
	},
	{
		key: 'rgbShiftAudioPunch',
		label: 'RGB punch',
		group: 'glitch',
		hint: 'Boost extra en transientes.',
		defaultRange: LOGO_RANGES.punch
	},

	// ─── Global audio ──────────────────────────────────────────────────────────
	// `audioSensitivity`, `audioChannelSmoothing` y `audioSelectedChannelSmoothing`
	// se eliminaron de esta pestaña: el suavizado y la ganancia son
	// responsabilidad de cada subsistema (no hay una sola "física" universal).
	{
		key: 'audioSmoothing',
		label: 'FFT smoothing',
		group: 'audio',
		hint: 'Smoothing del AnalyserNode (afecta los bins crudos antes de cualquier subsistema). No es channel smoothing.',
		defaultRange: { min: 0, max: 0.99, step: 0.01 }
	},
	{
		key: 'audioAutoKickThreshold',
		label: 'Auto-kick threshold',
		group: 'audio',
		hint: 'Umbral para detectar kicks en routing automático.',
		defaultRange: AUDIO_ROUTING_RANGES.autoKickThreshold
	},
	{
		key: 'audioAutoSwitchHoldMs',
		label: 'Auto-switch hold (ms)',
		group: 'audio',
		hint: 'Ventana mínima en ms para mantener un canal antes de cambiar.',
		defaultRange: AUDIO_ROUTING_RANGES.autoSwitchHoldMs,
		precision: 0
	},

	// ─── Partículas ────────────────────────────────────────────────────────────
	{
		key: 'particleAudioSmoothing',
		label: 'Smoothing pre-envelope',
		group: 'particles',
		hint: 'Suaviza el canal antes del envelope. 0 = raw, 0.9 = mucho.',
		defaultRange: AUDIO_ROUTING_RANGES.selectedChannelSmoothing
	},
	{
		key: 'particleAudioSizeBoost',
		label: 'Particle size boost',
		group: 'particles',
		hint: 'Cuánto crecen las partículas por audio. Solo aplica si están audio-reactivas.',
		defaultRange: { min: 0, max: 30, step: 1 },
		precision: 0
	},
	{
		key: 'particleAudioOpacityBoost',
		label: 'Particle opacity boost',
		group: 'particles',
		hint: 'Cuánto aumenta la opacidad por audio. Solo si audio-reactivas.',
		defaultRange: { min: 0, max: 1, step: 0.05 }
	},
	{
		key: 'particleAudioAttack',
		label: 'Attack',
		group: 'particles',
		hint: 'Velocidad de subida del envelope.',
		defaultRange: LOGO_RANGES.attack
	},
	{
		key: 'particleAudioRelease',
		label: 'Release',
		group: 'particles',
		hint: 'Velocidad de caída del envelope.',
		defaultRange: LOGO_RANGES.release
	},
	{
		key: 'particleAudioReactivitySpeed',
		label: 'Response speed',
		group: 'particles',
		hint: 'Multiplica attack/release.',
		defaultRange: LOGO_RANGES.reactivitySpeed
	},
	{
		key: 'particleAudioPeakWindow',
		label: 'Peak window',
		group: 'particles',
		hint: 'Segundos que el pico se recuerda.',
		defaultRange: LOGO_RANGES.peakWindow
	},
	{
		key: 'particleAudioPeakFloor',
		label: 'Peak floor',
		group: 'particles',
		hint: 'Fracción del pico tratada como silencio.',
		defaultRange: LOGO_RANGES.peakFloor
	},
	{
		key: 'particleAudioPunch',
		label: 'Punch',
		group: 'particles',
		hint: 'Boost extra en transientes.',
		defaultRange: LOGO_RANGES.punch
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
