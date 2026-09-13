import type { ProfileSlot, WallpaperState } from '@/types/wallpaper';
import type { TranslationKey } from '@/lib/i18n/en';

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
	| 'noir-cinema'
	| 'hologram'
	| 'sunset-film'
	| 'ice-signal'
	| typeof CUSTOM_FILTER_LOOK_ID;

export const FILTER_LOOK_SLOT_SELECTION_PREFIX = 'slot:' as const;

/**
 * Everything except the retired `custom-look`. The legacy id survives in
 * `FilterLookId` only so pre-v110 projects still parse; nothing in the catalog
 * carries it, so anything keyed by factory look wants this type.
 */
export type FactoryFilterLookId = Exclude<
	FilterLookId,
	typeof CUSTOM_FILTER_LOOK_ID
>;

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

/**
 * Every visual value owned by a factory look. Targets stay outside this list:
 * choosing a visual treatment must not silently move it to different layers.
 */
export const FILTER_LOOK_PRESET_KEYS = [
	'filterOpacity',
	'filterBrightness',
	'filterContrast',
	'filterSaturation',
	'filterBlur',
	'filterHueRotate',
	'filterVignette',
	'filterBloom',
	'filterLumaThreshold',
	'filterLensWarp',
	'filterHeatDistortion',
	'rgbShift',
	...RGB_SHIFT_AUDIO_KEYS,
	'noiseIntensity',
	'scanlinesEnabled',
	'scanlineIntensity',
	'scanlineMode',
	'scanlineSpacing',
	'scanlineThickness'
] as const satisfies ReadonlyArray<keyof WallpaperState>;

export type FilterLookSettings = Pick<
	WallpaperState,
	(typeof FILTER_LOOK_PRESET_KEYS)[number]
>;

export type FilterLookPreset = {
	id: FactoryFilterLookId;
	name: string;
	/** i18n key — resolve with `useT()` at render time. */
	descriptionKey: TranslationKey;
	tags: string[];
	settings: FilterLookSettings;
};

export type FilterLookCatalogEntry<T> =
	| {
			key: `factory:${string}`;
			kind: 'factory';
			name: string;
			preset: FilterLookPreset;
			values: FilterLookSettings;
	  }
	| {
			key: `slot:${string}`;
			kind: 'slot';
			name: string;
			slotId: string;
			slotIndex: number;
			values: T | null;
	  };

export function toFilterLookSlotSelectionId(slotId: string): string {
	return `${FILTER_LOOK_SLOT_SELECTION_PREFIX}${slotId}`;
}

export function fromFilterLookSlotSelectionId(
	selectionId: string | null | undefined
): string | null {
	if (!selectionId?.startsWith(FILTER_LOOK_SLOT_SELECTION_PREFIX))
		return null;
	return selectionId.slice(FILTER_LOOK_SLOT_SELECTION_PREFIX.length) || null;
}

export function buildFilterLookCatalog<T>(
	slots: ReadonlyArray<ProfileSlot<T>>,
	includeEmptySlots = true
): Array<FilterLookCatalogEntry<T>> {
	return [
		...FILTER_LOOK_PRESETS.map(
			(preset): FilterLookCatalogEntry<T> => ({
				key: `factory:${preset.id}`,
				kind: 'factory',
				name: preset.name,
				preset,
				values: preset.settings
			})
		),
		...slots.flatMap(
			(slot, slotIndex): Array<FilterLookCatalogEntry<T>> => {
				if (!includeEmptySlots && slot.values === null) return [];
				return [
					{
						key: `slot:${slot.id}`,
						kind: 'slot',
						name: slot.name,
						slotId: slot.id,
						slotIndex,
						values: slot.values
					}
				];
			}
		)
	];
}

/**
 * Where the current selection sits in a catalog, or -1.
 *
 * `activeFilterLookId` is a single namespace — a factory id, or `slot:<id>`
 * — and resolving it in one place is what stops the editor tab and the HUD
 * from drifting into two different ideas of which look is active. The HUD's
 * old hand-rolled version checked the factory id first, so a slot saved while
 * a factory preset was applied could never read as the active entry.
 */
export function findFilterLookCatalogIndex<T>(
	entries: ReadonlyArray<FilterLookCatalogEntry<T>>,
	activeFilterLookId: string | null | undefined
): number {
	if (!activeFilterLookId) return -1;
	const slotId = fromFilterLookSlotSelectionId(activeFilterLookId);
	if (slotId !== null) {
		return entries.findIndex(
			entry => entry.kind === 'slot' && entry.slotId === slotId
		);
	}
	return entries.findIndex(
		entry =>
			entry.kind === 'factory' && entry.preset.id === activeFilterLookId
	);
}

export const FILTER_LOOK_PRESETS: FilterLookPreset[] = [
	{
		id: 'crt',
		name: 'CRT',
		descriptionKey: 'look_factory_description_crt',
		tags: ['retro', 'scanlines', 'terminal'],
		settings: {
			filterBrightness: 0.92,
			filterContrast: 1.35,
			filterSaturation: 0.6,
			filterBlur: 0.4,
			filterHueRotate: 0,
			filterOpacity: 1,
			filterVignette: 0.35,
			filterBloom: 0.08,
			filterLumaThreshold: 0.72,
			filterLensWarp: 0.04,
			filterHeatDistortion: 0,
			rgbShift: 0.001,
			noiseIntensity: 0.06,
			scanlinesEnabled: true,
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
		descriptionKey: 'look_factory_description_vhs',
		tags: ['analog', 'soft', 'nostalgia'],
		settings: {
			filterBrightness: 0.98,
			filterContrast: 1.12,
			filterSaturation: 1.18,
			filterBlur: 1.1,
			filterHueRotate: -8,
			filterOpacity: 1,
			filterVignette: 0.25,
			filterBloom: 0.08,
			filterLumaThreshold: 0.68,
			filterLensWarp: 0.03,
			filterHeatDistortion: 0.02,
			rgbShift: 0.006,
			noiseIntensity: 0.14,
			scanlinesEnabled: true,
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
		descriptionKey: 'look_factory_description_cyber_neon',
		tags: ['neon', 'vivid', 'glow'],
		settings: {
			filterBrightness: 1.08,
			filterContrast: 1.28,
			filterSaturation: 1.7,
			filterBlur: 0.2,
			filterHueRotate: 18,
			filterOpacity: 1,
			filterVignette: 0.2,
			filterBloom: 0.45,
			filterLumaThreshold: 0.55,
			filterLensWarp: 0.03,
			filterHeatDistortion: 0.05,
			rgbShift: 0.004,
			noiseIntensity: 0.04,
			scanlinesEnabled: true,
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
		descriptionKey: 'look_factory_description_dream_bloom',
		tags: ['dreamy', 'soft', 'pastel'],
		settings: {
			filterBrightness: 1.12,
			filterContrast: 0.92,
			filterSaturation: 1.24,
			filterBlur: 2.2,
			filterHueRotate: 20,
			filterOpacity: 1,
			filterVignette: 0.15,
			filterBloom: 0.6,
			filterLumaThreshold: 0.5,
			filterLensWarp: 0.02,
			filterHeatDistortion: 0.03,
			rgbShift: 0.0015,
			noiseIntensity: 0.02,
			scanlinesEnabled: false,
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
		descriptionKey: 'look_factory_description_monochrome_ink',
		tags: ['mono', 'ink', 'high-contrast'],
		settings: {
			filterBrightness: 0.95,
			filterContrast: 1.45,
			filterSaturation: 0,
			filterBlur: 0.1,
			filterHueRotate: 0,
			filterOpacity: 1,
			filterVignette: 0.45,
			filterBloom: 0.1,
			filterLumaThreshold: 0.75,
			filterLensWarp: 0,
			filterHeatDistortion: 0,
			rgbShift: 0,
			noiseIntensity: 0.03,
			scanlinesEnabled: true,
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
		descriptionKey: 'look_factory_description_club_glitch',
		tags: ['glitch', 'club', 'aggressive'],
		settings: {
			filterBrightness: 1.04,
			filterContrast: 1.5,
			filterSaturation: 1.55,
			filterBlur: 0.2,
			filterHueRotate: 36,
			filterOpacity: 1,
			filterVignette: 0.3,
			filterBloom: 0.5,
			filterLumaThreshold: 0.45,
			filterLensWarp: 0.08,
			filterHeatDistortion: 0.1,
			rgbShift: 0.01,
			noiseIntensity: 0.22,
			scanlinesEnabled: true,
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
		descriptionKey: 'look_factory_description_glass_mist',
		tags: ['glass', 'minimal', 'mist'],
		settings: {
			filterBrightness: 1.06,
			filterContrast: 1.06,
			filterSaturation: 1.08,
			filterBlur: 1.6,
			filterHueRotate: 6,
			filterOpacity: 1,
			filterVignette: 0.18,
			filterBloom: 0.22,
			filterLumaThreshold: 0.62,
			filterLensWarp: 0.02,
			filterHeatDistortion: 0.02,
			rgbShift: 0.0008,
			noiseIntensity: 0.01,
			scanlinesEnabled: false,
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
		descriptionKey: 'look_factory_description_infrared_pulse',
		tags: ['infrared', 'warm', 'pulse'],
		settings: {
			filterBrightness: 1.04,
			filterContrast: 1.34,
			filterSaturation: 1.48,
			filterBlur: 0.5,
			filterHueRotate: 62,
			filterOpacity: 1,
			filterVignette: 0.35,
			filterBloom: 0.3,
			filterLumaThreshold: 0.56,
			filterLensWarp: 0.04,
			filterHeatDistortion: 0.16,
			rgbShift: 0.003,
			noiseIntensity: 0.05,
			scanlinesEnabled: true,
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
	},
	{
		id: 'noir-cinema',
		name: 'Noir Cinema',
		descriptionKey: 'look_factory_description_noir_cinema',
		tags: ['cinema', 'mono', 'grain'],
		settings: {
			filterOpacity: 1,
			filterBrightness: 0.88,
			filterContrast: 1.38,
			filterSaturation: 0.18,
			filterBlur: 0.2,
			filterHueRotate: 0,
			filterVignette: 0.58,
			filterBloom: 0.12,
			filterLumaThreshold: 0.76,
			filterLensWarp: 0,
			filterHeatDistortion: 0,
			rgbShift: 0.0005,
			rgbShiftAudioReactive: false,
			rgbShiftAudioSensitivity: 0.002,
			rgbShiftAudioChannel: 'full',
			rgbShiftAudioSmoothing: 0.45,
			rgbShiftAudioAttack: 0.25,
			rgbShiftAudioRelease: 0.4,
			rgbShiftAudioReactivitySpeed: 0.5,
			rgbShiftAudioPeakWindow: 1.8,
			rgbShiftAudioPeakFloor: 0.12,
			rgbShiftAudioPunch: 0.12,
			noiseIntensity: 0.09,
			scanlinesEnabled: false,
			scanlineIntensity: 0,
			scanlineMode: 'always',
			scanlineSpacing: 900,
			scanlineThickness: 1
		}
	},
	{
		id: 'hologram',
		name: 'Hologram',
		descriptionKey: 'look_factory_description_hologram',
		tags: ['hologram', 'cyan', 'scanlines'],
		settings: {
			filterOpacity: 1,
			filterBrightness: 1.08,
			filterContrast: 1.22,
			filterSaturation: 1.3,
			filterBlur: 0.35,
			filterHueRotate: 148,
			filterVignette: 0.22,
			filterBloom: 0.4,
			filterLumaThreshold: 0.5,
			filterLensWarp: 0.05,
			filterHeatDistortion: 0.06,
			rgbShift: 0.005,
			rgbShiftAudioReactive: true,
			rgbShiftAudioSensitivity: 0.012,
			rgbShiftAudioChannel: 'vocal',
			rgbShiftAudioSmoothing: 0.22,
			rgbShiftAudioAttack: 0.62,
			rgbShiftAudioRelease: 0.2,
			rgbShiftAudioReactivitySpeed: 1.1,
			rgbShiftAudioPeakWindow: 1.1,
			rgbShiftAudioPeakFloor: 0.07,
			rgbShiftAudioPunch: 0.48,
			noiseIntensity: 0.045,
			scanlinesEnabled: true,
			scanlineIntensity: 0.16,
			scanlineMode: 'pulse',
			scanlineSpacing: 680,
			scanlineThickness: 1.1
		}
	},
	{
		id: 'sunset-film',
		name: 'Sunset Film',
		descriptionKey: 'look_factory_description_sunset_film',
		tags: ['film', 'warm', 'cinematic'],
		settings: {
			filterOpacity: 1,
			filterBrightness: 1.04,
			filterContrast: 1.08,
			filterSaturation: 1.22,
			filterBlur: 0.45,
			filterHueRotate: -14,
			filterVignette: 0.32,
			filterBloom: 0.34,
			filterLumaThreshold: 0.58,
			filterLensWarp: 0.015,
			filterHeatDistortion: 0.025,
			rgbShift: 0.0012,
			rgbShiftAudioReactive: false,
			rgbShiftAudioSensitivity: 0.003,
			rgbShiftAudioChannel: 'bass',
			rgbShiftAudioSmoothing: 0.5,
			rgbShiftAudioAttack: 0.25,
			rgbShiftAudioRelease: 0.5,
			rgbShiftAudioReactivitySpeed: 0.4,
			rgbShiftAudioPeakWindow: 2,
			rgbShiftAudioPeakFloor: 0.12,
			rgbShiftAudioPunch: 0.14,
			noiseIntensity: 0.035,
			scanlinesEnabled: false,
			scanlineIntensity: 0,
			scanlineMode: 'always',
			scanlineSpacing: 900,
			scanlineThickness: 1
		}
	},
	{
		id: 'ice-signal',
		name: 'Ice Signal',
		descriptionKey: 'look_factory_description_ice_signal',
		tags: ['ice', 'clean', 'digital'],
		settings: {
			filterOpacity: 1,
			filterBrightness: 1.08,
			filterContrast: 1.18,
			filterSaturation: 1.25,
			filterBlur: 0.1,
			filterHueRotate: 188,
			filterVignette: 0.2,
			filterBloom: 0.28,
			filterLumaThreshold: 0.62,
			filterLensWarp: 0.02,
			filterHeatDistortion: 0,
			rgbShift: 0.0025,
			rgbShiftAudioReactive: true,
			rgbShiftAudioSensitivity: 0.008,
			rgbShiftAudioChannel: 'hihat',
			rgbShiftAudioSmoothing: 0.16,
			rgbShiftAudioAttack: 0.72,
			rgbShiftAudioRelease: 0.14,
			rgbShiftAudioReactivitySpeed: 1.25,
			rgbShiftAudioPeakWindow: 0.9,
			rgbShiftAudioPeakFloor: 0.06,
			rgbShiftAudioPunch: 0.55,
			noiseIntensity: 0.02,
			scanlinesEnabled: true,
			scanlineIntensity: 0.06,
			scanlineMode: 'burst',
			scanlineSpacing: 860,
			scanlineThickness: 0.9
		}
	}
];

export function extractFilterLookSettingsFromState(
	state: WallpaperState
): FilterLookPreset['settings'] {
	return {
		filterOpacity: state.filterOpacity,
		filterBrightness: state.filterBrightness,
		filterContrast: state.filterContrast,
		filterSaturation: state.filterSaturation,
		filterBlur: state.filterBlur,
		filterHueRotate: state.filterHueRotate,
		filterVignette: state.filterVignette,
		filterBloom: state.filterBloom,
		filterLumaThreshold: state.filterLumaThreshold,
		filterLensWarp: state.filterLensWarp,
		filterHeatDistortion: state.filterHeatDistortion,
		rgbShift: state.rgbShift,
		noiseIntensity: state.noiseIntensity,
		scanlinesEnabled: state.scanlinesEnabled,
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
