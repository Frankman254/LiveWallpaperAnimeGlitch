/**
 * `SceneIntent` is the ONLY thing a model is allowed to author.
 *
 * The app has ~190 spectrum keys alone. Letting a model write them directly
 * would be expensive, slow, and — worse — unvalidatable: one bad key name or
 * out-of-range float lands in persisted state and resurfaces as a rendering bug
 * three sessions later. Instead the model emits this ~15-field vocabulary and
 * `compileIntent` expands it deterministically.
 *
 * Everything here is therefore treated as HOSTILE INPUT. `parseSceneIntent`
 * never throws and never propagates an unknown value: anything it can't
 * validate is replaced by the neutral default and reported in `rejected`.
 */
import type {
	SpectrumFamily,
	SpectrumMode,
	SpectrumShape
} from '@/types/wallpaper';

/** Bumped when the vocabulary changes shape, so cached intents can be re-asked. */
export const SCENE_INTENT_VERSION = 1;

export const PARTICLES_PRESETS = [
	'off',
	'dust',
	'embers',
	'snow',
	'sparks'
] as const;
export const RAIN_PRESETS = ['off', 'light', 'heavy'] as const;
export const LOOKS_PRESETS = ['clean', 'crt', 'bloom', 'glitch'] as const;
export const LIGHTS_PRESETS = ['off', 'ambient', 'concert'] as const;

export type ParticlesPreset = (typeof PARTICLES_PRESETS)[number];
export type RainPreset = (typeof RAIN_PRESETS)[number];
export type LooksPreset = (typeof LOOKS_PRESETS)[number];
export type LightsPreset = (typeof LIGHTS_PRESETS)[number];

/** Valid values mirrored from the store's unions — the compiler relies on
 *  these being exhaustive, so a new family/shape must be added here too. */
export const SPECTRUM_FAMILIES = [
	'classic',
	'oscilloscope',
	'tunnel',
	'liquid',
	'orbital',
	'spiral'
] as const satisfies ReadonlyArray<SpectrumFamily>;

export const SPECTRUM_SHAPES = [
	'bars',
	'blocks',
	'lines',
	'wave',
	'dots',
	'capsules',
	'pixel'
] as const satisfies ReadonlyArray<SpectrumShape>;

export const SPECTRUM_MODES = [
	'radial',
	'linear'
] as const satisfies ReadonlyArray<SpectrumMode>;

export type SceneIntent = {
	/** 0 = calm/ambient, 1 = aggressive. Drives reactivity, glow, shake. */
	energy: number;
	/** 0 = thin/delicate, 1 = massive. Drives bar width, sizes, counts. */
	weight: number;
	/** 0 = static, 1 = chaotic. Drives rotation, drift, camera motion. */
	motion: number;
	palette: { primary: string; secondary: string; accent: string };
	spectrumMode: SpectrumMode;
	spectrumFamily: SpectrumFamily;
	spectrumShape: SpectrumShape;
	particles: ParticlesPreset;
	rain: RainPreset;
	looks: LooksPreset;
	lights: LightsPreset;
	/** Free text shown to the user: why this look fits the image. Never parsed. */
	rationale: string;
};

/** Neutral, always-valid intent. Also the fallback for every rejected field. */
export function defaultSceneIntent(): SceneIntent {
	return {
		energy: 0.5,
		weight: 0.5,
		motion: 0.5,
		palette: {
			primary: '#67e8f9',
			secondary: '#a855f7',
			accent: '#f472b6'
		},
		spectrumMode: 'radial',
		spectrumFamily: 'classic',
		spectrumShape: 'bars',
		particles: 'dust',
		rain: 'off',
		looks: 'clean',
		lights: 'off',
		rationale: ''
	};
}

/** Longest rationale we keep. Models ramble; the UI shows one paragraph. */
const MAX_RATIONALE_LENGTH = 400;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Normalize a hex color to `#rrggbb`. Accepts 3- or 6-digit hex with or
 * without the leading `#`. Returns null for anything else — including the
 * `hsl()` / `rgb()` forms used elsewhere in the app, because slot values are
 * compared as strings and a mixed notation would break slot reuse.
 */
export function normalizeHexColor(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const raw = value.trim().replace(/^#/, '').toLowerCase();
	if (!/^[0-9a-f]{3}$/.test(raw) && !/^[0-9a-f]{6}$/.test(raw)) return null;
	const full =
		raw.length === 3
			? raw
					.split('')
					.map(c => c + c)
					.join('')
			: raw;
	return `#${full}`;
}

/**
 * Percentage-scale recovery threshold.
 *
 * Models — local ones especially — sometimes answer a 0..1 axis on a 0..100
 * scale: `energy: 30` meaning 30%. Clamping that to 1 is the worst possible
 * reading, turning "fairly calm" into "maximum aggression". A value above this
 * threshold is far more plausibly a percentage than a 0..1 overshoot (nothing
 * reading the scale correctly lands on 30), so it is rescaled; a mild overshoot
 * like 1.2 is still just clamped.
 */
const PERCENT_SCALE_THRESHOLD = 1.5;

function clamp01(value: unknown): number | null {
	if (typeof value !== 'number' || !Number.isFinite(value)) return null;
	const rescaled =
		value > PERCENT_SCALE_THRESHOLD && value <= 100 ? value / 100 : value;
	return Math.max(0, Math.min(1, rescaled));
}

function pickEnum<T extends string>(
	value: unknown,
	allowed: ReadonlyArray<T>
): T | null {
	return typeof value === 'string' &&
		(allowed as readonly string[]).includes(value)
		? (value as T)
		: null;
}

export type ParseSceneIntentResult = {
	intent: SceneIntent;
	/** Field paths that failed validation and fell back to the default. */
	rejected: string[];
};

/**
 * Validate untrusted JSON into a `SceneIntent`. Always succeeds: invalid
 * fields fall back to `defaultSceneIntent()` and are listed in `rejected` so
 * callers can log or surface a "the model returned junk" signal instead of
 * silently rendering a neutral scene and looking broken.
 */
export function parseSceneIntent(raw: unknown): ParseSceneIntentResult {
	const intent = defaultSceneIntent();
	const rejected: string[] = [];

	if (!isRecord(raw)) {
		return { intent, rejected: ['<root>'] };
	}

	const scalar = (key: 'energy' | 'weight' | 'motion') => {
		const value = clamp01(raw[key]);
		if (value === null) rejected.push(key);
		else intent[key] = value;
	};
	scalar('energy');
	scalar('weight');
	scalar('motion');

	const palette = raw.palette;
	if (isRecord(palette)) {
		for (const key of ['primary', 'secondary', 'accent'] as const) {
			const hex = normalizeHexColor(palette[key]);
			if (hex === null) rejected.push(`palette.${key}`);
			else intent.palette[key] = hex;
		}
	} else {
		rejected.push('palette');
	}

	const enumField = <K extends keyof SceneIntent>(
		key: K,
		allowed: ReadonlyArray<SceneIntent[K] & string>
	) => {
		const value = pickEnum(raw[key as string], allowed);
		if (value === null) rejected.push(key as string);
		else intent[key] = value as SceneIntent[K];
	};
	enumField('spectrumMode', SPECTRUM_MODES);
	enumField('spectrumFamily', SPECTRUM_FAMILIES);
	enumField('spectrumShape', SPECTRUM_SHAPES);
	enumField('particles', PARTICLES_PRESETS);
	enumField('rain', RAIN_PRESETS);
	enumField('looks', LOOKS_PRESETS);
	enumField('lights', LIGHTS_PRESETS);

	if (typeof raw.rationale === 'string') {
		intent.rationale = raw.rationale.trim().slice(0, MAX_RATIONALE_LENGTH);
	} else if (raw.rationale !== undefined) {
		rejected.push('rationale');
	}

	return { intent, rejected };
}
