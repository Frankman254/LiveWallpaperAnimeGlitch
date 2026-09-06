import type { WallpaperState } from '@/types/wallpaper';

/** Persisted user look; not part of built-in FILTER_LOOK_PRESETS. */
export const CUSTOM_FILTER_LOOK_ID = 'custom-look' as const;

export type FilterLookId =
	| 'crt'
	| 'vhs'
	| 'cyber-neon'
	| 'dream-bloom'
	| 'monochrome-ink'
	| 'club-glitch'
	| 'glass-mist'
	| 'infrared-pulse'
	| typeof CUSTOM_FILTER_LOOK_ID;

/**
 * The audio-reactive half of the RGB shift.
 *
 * These live next to `rgbShift` in the Looks tab and are meaningless without
 * it — a look that says "shift by 0.01" and a global that says "and make it
 * follow the hi-hat" are one visual idea, not two. Kept as a named list
 * because `store/featureProfiles` has to capture exactly the same set.
 */
export const RGB_SHIFT_AUDIO_KEYS = [
	'rgbShiftAudioReactive',
	'rgbShiftAudioSensitivity',
	'rgbShiftAudioChannel',
	'rgbShiftAudioSmoothing',
	'rgbShiftAudioAttack',
	'rgbShiftAudioRelease',
	'rgbShiftAudioReactivitySpeed',
	'rgbShiftAudioPeakWindow',
	'rgbShiftAudioPeakFloor',
	'rgbShiftAudioPunch'
] as const satisfies ReadonlyArray<keyof WallpaperState>;

export type RgbShiftAudioSettings = Pick<
	WallpaperState,
	(typeof RGB_SHIFT_AUDIO_KEYS)[number]
>;

export type FilterLookPreset = {
	id: FilterLookId;
	name: string;
	description: string;
	tags: string[];
	settings: Pick<
		WallpaperState,
		| 'filterBrightness'
		| 'filterContrast'
		| 'filterSaturation'
		| 'filterBlur'
		| 'filterHueRotate'
		| 'filterOpacity'
		| 'rgbShift'
		| 'noiseIntensity'
		| 'scanlineIntensity'
		| 'scanlineMode'
		| 'scanlineSpacing'
		| 'scanlineThickness'
	> &
		RgbShiftAudioSettings;
};

export const FILTER_LOOK_PRESETS: FilterLookPreset[] = [
	{
		id: 'crt',
		name: 'CRT',
		description: 'Verde retro con scanlines y contraste alto.',
		tags: ['retro', 'scanlines', 'terminal'],
		settings: {
			filterBrightness: 0.92,
			filterContrast: 1.35,
			filterSaturation: 0.6,
			filterBlur: 0.4,
			filterHueRotate: 0,
			filterOpacity: 1,
			rgbShift: 0.001,
			noiseIntensity: 0.06,
			scanlineIntensity: 0.28,
			scanlineMode: 'always',
			scanlineSpacing: 640,
			scanlineThickness: 1.4,
			rgbShiftAudioReactive: false,
			rgbShiftAudioSensitivity: 0.004,
			rgbShiftAudioChannel: 'hihat',
			rgbShiftAudioSmoothing: 0.2,
			rgbShiftAudioAttack: 0.5,
			rgbShiftAudioRelease: 0.2,
			rgbShiftAudioReactivitySpeed: 0.8,
			rgbShiftAudioPeakWindow: 1.2,
			rgbShiftAudioPeakFloor: 0.08,
			rgbShiftAudioPunch: 0.25
		}
	},
	{
		id: 'vhs',
		name: 'VHS',
		description: 'Desenfoque suave, ruido y desalineación RGB.',
		tags: ['analog', 'soft', 'nostalgia'],
		settings: {
			filterBrightness: 0.98,
			filterContrast: 1.12,
			filterSaturation: 1.18,
			filterBlur: 1.1,
			filterHueRotate: -8,
			filterOpacity: 1,
			rgbShift: 0.006,
			noiseIntensity: 0.14,
			scanlineIntensity: 0.12,
			scanlineMode: 'pulse',
			scanlineSpacing: 760,
			scanlineThickness: 1.6,
			rgbShiftAudioReactive: true,
			rgbShiftAudioSensitivity: 0.007,
			rgbShiftAudioChannel: 'bass',
			rgbShiftAudioSmoothing: 0.38,
			rgbShiftAudioAttack: 0.3,
			rgbShiftAudioRelease: 0.35,
			rgbShiftAudioReactivitySpeed: 0.6,
			rgbShiftAudioPeakWindow: 1.6,
			rgbShiftAudioPeakFloor: 0.1,
			rgbShiftAudioPunch: 0.2
		}
	},
	{
		id: 'cyber-neon',
		name: 'Cyber Neon',
		description: 'Saturación fuerte y brillos neón con offset RGB.',
		tags: ['neon', 'vivid', 'glow'],
		settings: {
			filterBrightness: 1.08,
			filterContrast: 1.28,
			filterSaturation: 1.7,
			filterBlur: 0.2,
			filterHueRotate: 18,
			filterOpacity: 1,
			rgbShift: 0.004,
			noiseIntensity: 0.04,
			scanlineIntensity: 0.08,
			scanlineMode: 'burst',
			scanlineSpacing: 900,
			scanlineThickness: 1.1,
			rgbShiftAudioReactive: true,
			rgbShiftAudioSensitivity: 0.011,
			rgbShiftAudioChannel: 'hihat',
			rgbShiftAudioSmoothing: 0.14,
			rgbShiftAudioAttack: 0.65,
			rgbShiftAudioRelease: 0.16,
			rgbShiftAudioReactivitySpeed: 1.2,
			rgbShiftAudioPeakWindow: 1.0,
			rgbShiftAudioPeakFloor: 0.06,
			rgbShiftAudioPunch: 0.5
		}
	},
	{
		id: 'dream-bloom',
		name: 'Dream Bloom',
		description: 'Look etéreo con blur y tonos suaves.',
		tags: ['dreamy', 'soft', 'pastel'],
		settings: {
			filterBrightness: 1.12,
			filterContrast: 0.92,
			filterSaturation: 1.24,
			filterBlur: 2.2,
			filterHueRotate: 20,
			filterOpacity: 1,
			rgbShift: 0.0015,
			noiseIntensity: 0.02,
			scanlineIntensity: 0,
			scanlineMode: 'always',
			scanlineSpacing: 800,
			scanlineThickness: 1.2,
			rgbShiftAudioReactive: false,
			rgbShiftAudioSensitivity: 0.003,
			rgbShiftAudioChannel: 'full',
			rgbShiftAudioSmoothing: 0.5,
			rgbShiftAudioAttack: 0.25,
			rgbShiftAudioRelease: 0.45,
			rgbShiftAudioReactivitySpeed: 0.4,
			rgbShiftAudioPeakWindow: 2.2,
			rgbShiftAudioPeakFloor: 0.12,
			rgbShiftAudioPunch: 0.15
		}
	},
	{
		id: 'monochrome-ink',
		name: 'Monochrome Ink',
		description: 'Monocromo con contraste fuerte.',
		tags: ['mono', 'ink', 'high-contrast'],
		settings: {
			filterBrightness: 0.95,
			filterContrast: 1.45,
			filterSaturation: 0,
			filterBlur: 0.1,
			filterHueRotate: 0,
			filterOpacity: 1,
			rgbShift: 0,
			noiseIntensity: 0.03,
			scanlineIntensity: 0.05,
			scanlineMode: 'always',
			scanlineSpacing: 840,
			scanlineThickness: 1,
			rgbShiftAudioReactive: false,
			rgbShiftAudioSensitivity: 0.0,
			rgbShiftAudioChannel: 'full',
			rgbShiftAudioSmoothing: 0.2,
			rgbShiftAudioAttack: 0.5,
			rgbShiftAudioRelease: 0.2,
			rgbShiftAudioReactivitySpeed: 1.0,
			rgbShiftAudioPeakWindow: 1.0,
			rgbShiftAudioPeakFloor: 0.08,
			rgbShiftAudioPunch: 0.2
		}
	},
	{
		id: 'club-glitch',
		name: 'Club Glitch',
		description: 'Contraste agresivo y desplazamiento RGB visible.',
		tags: ['glitch', 'club', 'aggressive'],
		settings: {
			filterBrightness: 1.04,
			filterContrast: 1.5,
			filterSaturation: 1.55,
			filterBlur: 0.2,
			filterHueRotate: 36,
			filterOpacity: 1,
			rgbShift: 0.01,
			noiseIntensity: 0.22,
			scanlineIntensity: 0.18,
			scanlineMode: 'beat',
			scanlineSpacing: 720,
			scanlineThickness: 1.8,
			rgbShiftAudioReactive: true,
			rgbShiftAudioSensitivity: 0.022,
			rgbShiftAudioChannel: 'kick',
			rgbShiftAudioSmoothing: 0.07,
			rgbShiftAudioAttack: 0.95,
			rgbShiftAudioRelease: 0.09,
			rgbShiftAudioReactivitySpeed: 1.5,
			rgbShiftAudioPeakWindow: 0.8,
			rgbShiftAudioPeakFloor: 0.05,
			rgbShiftAudioPunch: 0.85
		}
	},
	{
		id: 'glass-mist',
		name: 'Glass Mist',
		description: 'Suave, limpio y ligeramente difuminado.',
		tags: ['glass', 'minimal', 'mist'],
		settings: {
			filterBrightness: 1.06,
			filterContrast: 1.06,
			filterSaturation: 1.08,
			filterBlur: 1.6,
			filterHueRotate: 6,
			filterOpacity: 1,
			rgbShift: 0.0008,
			noiseIntensity: 0.01,
			scanlineIntensity: 0,
			scanlineMode: 'always',
			scanlineSpacing: 960,
			scanlineThickness: 1,
			rgbShiftAudioReactive: false,
			rgbShiftAudioSensitivity: 0.002,
			rgbShiftAudioChannel: 'full',
			rgbShiftAudioSmoothing: 0.45,
			rgbShiftAudioAttack: 0.3,
			rgbShiftAudioRelease: 0.4,
			rgbShiftAudioReactivitySpeed: 0.5,
			rgbShiftAudioPeakWindow: 2.0,
			rgbShiftAudioPeakFloor: 0.14,
			rgbShiftAudioPunch: 0.15
		}
	},
	{
		id: 'infrared-pulse',
		name: 'Infrared Pulse',
		description: 'Tono cálido intenso con estética térmica.',
		tags: ['infrared', 'warm', 'pulse'],
		settings: {
			filterBrightness: 1.04,
			filterContrast: 1.34,
			filterSaturation: 1.48,
			filterBlur: 0.5,
			filterHueRotate: 62,
			filterOpacity: 1,
			rgbShift: 0.003,
			noiseIntensity: 0.05,
			scanlineIntensity: 0.06,
			scanlineMode: 'pulse',
			scanlineSpacing: 820,
			scanlineThickness: 1.2,
			rgbShiftAudioReactive: true,
			rgbShiftAudioSensitivity: 0.009,
			rgbShiftAudioChannel: 'vocal',
			rgbShiftAudioSmoothing: 0.3,
			rgbShiftAudioAttack: 0.4,
			rgbShiftAudioRelease: 0.3,
			rgbShiftAudioReactivitySpeed: 0.9,
			rgbShiftAudioPeakWindow: 1.4,
			rgbShiftAudioPeakFloor: 0.1,
			rgbShiftAudioPunch: 0.35
		}
	}
];

export function extractFilterLookSettingsFromState(
	state: WallpaperState
): FilterLookPreset['settings'] {
	return {
		filterBrightness: state.filterBrightness,
		filterContrast: state.filterContrast,
		filterSaturation: state.filterSaturation,
		filterBlur: state.filterBlur,
		filterHueRotate: state.filterHueRotate,
		filterOpacity: state.filterOpacity,
		rgbShift: state.rgbShift,
		noiseIntensity: state.noiseIntensity,
		scanlineIntensity: state.scanlineIntensity,
		scanlineMode: state.scanlineMode,
		scanlineSpacing: state.scanlineSpacing,
		scanlineThickness: state.scanlineThickness,
		...extractRgbShiftAudioSettings(state)
	};
}

export function extractRgbShiftAudioSettings(
	state: WallpaperState
): RgbShiftAudioSettings {
	return {
		rgbShiftAudioReactive: state.rgbShiftAudioReactive,
		rgbShiftAudioSensitivity: state.rgbShiftAudioSensitivity,
		rgbShiftAudioChannel: state.rgbShiftAudioChannel,
		rgbShiftAudioSmoothing: state.rgbShiftAudioSmoothing,
		rgbShiftAudioAttack: state.rgbShiftAudioAttack,
		rgbShiftAudioRelease: state.rgbShiftAudioRelease,
		rgbShiftAudioReactivitySpeed: state.rgbShiftAudioReactivitySpeed,
		rgbShiftAudioPeakWindow: state.rgbShiftAudioPeakWindow,
		rgbShiftAudioPeakFloor: state.rgbShiftAudioPeakFloor,
		rgbShiftAudioPunch: state.rgbShiftAudioPunch
	};
}

export function findFilterLookById(
	id: string | null | undefined,
	customSettings?: FilterLookPreset['settings'] | null
): FilterLookPreset | undefined {
	if (!id) return undefined;
	if (id === CUSTOM_FILTER_LOOK_ID) {
		if (!customSettings) return undefined;
		return {
			id: CUSTOM_FILTER_LOOK_ID,
			name: 'Custom',
			description: 'Your saved tone / glitch / scanline settings.',
			tags: ['custom'],
			settings: customSettings
		};
	}
	return FILTER_LOOK_PRESETS.find(look => look.id === id);
}
