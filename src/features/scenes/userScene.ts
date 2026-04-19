import {
	doProfileSettingsMatch,
	extractBackgroundProfileSettings,
	extractLogoProfileSettings,
	extractSpectrumProfileSettings,
	MOTION_PROFILE_KEYS
} from '@/lib/featureProfiles';
import { hydrateSpectrumProfileValues } from '@/features/spectrum/runtime/spectrumProfileHydrate';
import { DEFAULT_STATE } from '@/lib/constants';
import type { LogoProfileSettings, SpectrumProfileSettings, WallpaperState } from '@/types/wallpaper';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

/** Slot index into a ProfileSlot array, or `none` = layer off / not applied. */
export type SceneSlotRef = number | 'none';

export const USER_SCENE_VERSION = 1 as const;

export type UserSceneLogoPart =
	| { kind: 'slot'; index: number }
	| { kind: 'none' }
	| { kind: 'inline'; values: LogoProfileSettings };

export type UserSceneSpectrumPart =
	| { kind: 'slot'; index: number }
	| { kind: 'none' }
	| { kind: 'inline'; values: SpectrumProfileSettings };

export type UserScene = {
	id: string;
	name: string;
	createdAt: number;
	v: typeof USER_SCENE_VERSION;
	backgroundAudio: SceneSlotRef;
	logo: UserSceneLogoPart;
	spectrum: UserSceneSpectrumPart;
	/** Full particle + rain field bundle (systems without profile slots yet). */
	particlesRain: 'none' | Record<string, number | boolean | string>;
	filters: 'none' | Record<string, number | boolean | string | string[]>;
	trackTitle: 'none' | Record<string, number | boolean | string>;
};

const FILTER_KEYS = [
	'filterTargets',
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
	'noiseIntensity',
	'scanlineIntensity',
	'scanlineMode',
	'scanlineSpacing',
	'scanlineThickness'
] as const satisfies ReadonlyArray<keyof WallpaperState>;

const TRACK_TITLE_KEYS = [
	'audioTrackTitleEnabled',
	'audioTrackTitleLayoutMode',
	'audioTrackTitleFontStyle',
	'audioTrackTitleUppercase',
	'audioTrackTitlePositionX',
	'audioTrackTitlePositionY',
	'audioTrackTitleFontSize',
	'audioTrackTitleLetterSpacing',
	'audioTrackTitleWidth',
	'audioTrackTitleOpacity',
	'audioTrackTitleScrollSpeed',
	'audioTrackTitleRgbShift',
	'audioTrackTitleTextColor',
	'audioTrackTitleTextColorSource',
	'audioTrackTitleStrokeColor',
	'audioTrackTitleStrokeColorSource',
	'audioTrackTitleStrokeWidth',
	'audioTrackTitleGlowColor',
	'audioTrackTitleGlowColorSource',
	'audioTrackTitleGlowBlur',
	'audioTrackTitleBackdropEnabled',
	'audioTrackTitleBackdropColor',
	'audioTrackTitleBackdropColorSource',
	'audioTrackTitleBackdropOpacity',
	'audioTrackTitleBackdropPadding',
	'audioTrackTitleFilterBrightness',
	'audioTrackTitleFilterContrast',
	'audioTrackTitleFilterSaturation',
	'audioTrackTitleFilterBlur',
	'audioTrackTitleFilterHueRotate',
	'audioTrackTimeEnabled',
	'audioTrackTimePositionX',
	'audioTrackTimePositionY',
	'audioTrackTimeWidth',
	'audioTrackTimeFontStyle',
	'audioTrackTimeFontSize',
	'audioTrackTimeLetterSpacing',
	'audioTrackTimeOpacity',
	'audioTrackTimeRgbShift',
	'audioTrackTimeTextColor',
	'audioTrackTimeTextColorSource',
	'audioTrackTimeStrokeColor',
	'audioTrackTimeStrokeColorSource',
	'audioTrackTimeStrokeWidth',
	'audioTrackTimeGlowColor',
	'audioTrackTimeGlowColorSource',
	'audioTrackTimeGlowBlur',
	'audioTrackTimeFilterBrightness',
	'audioTrackTimeFilterContrast',
	'audioTrackTimeFilterSaturation',
	'audioTrackTimeFilterBlur',
	'audioTrackTimeFilterHueRotate'
] as const satisfies ReadonlyArray<keyof WallpaperState>;

function pickStateKeys<K extends keyof WallpaperState>(
	state: WallpaperState,
	keys: readonly K[]
): Pick<WallpaperState, K> {
	const out = {} as Pick<WallpaperState, K>;
	for (const k of keys) {
		(out as Record<string, unknown>)[k] = state[k];
	}
	return out;
}

export function createUserSceneId(): string {
	return `scene-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function defaultUserSceneName(): string {
	const d = new Date();
	return `Scene ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export function captureUserSceneFromState(
	state: WallpaperState,
	name: string
): UserScene {
	const bgCurrent = extractBackgroundProfileSettings(state);
	const bgIdx = state.backgroundProfileSlots.findIndex(slot =>
		doProfileSettingsMatch(bgCurrent, slot.values)
	);

	const activeImg = state.backgroundImages.find(
		i => i.assetId === state.activeImageId
	);

	let logoPart: UserSceneLogoPart;
	if (!state.logoEnabled) {
		logoPart = { kind: 'none' };
	} else if (activeImg?.logoProfileSlotIndex != null) {
		logoPart = { kind: 'slot', index: activeImg.logoProfileSlotIndex };
	} else if (activeImg?.logoOverride) {
		logoPart = { kind: 'inline', values: activeImg.logoOverride };
	} else {
		logoPart = {
			kind: 'inline',
			values: extractLogoProfileSettings(state)
		};
	}

	let spectrumPart: UserSceneSpectrumPart;
	if (!state.spectrumEnabled) {
		spectrumPart = { kind: 'none' };
	} else if (activeImg?.spectrumProfileSlotIndex != null) {
		spectrumPart = { kind: 'slot', index: activeImg.spectrumProfileSlotIndex };
	} else if (activeImg?.spectrumOverride) {
		spectrumPart = { kind: 'inline', values: activeImg.spectrumOverride };
	} else {
		spectrumPart = {
			kind: 'inline',
			values: extractSpectrumProfileSettings(state)
		};
	}

	const particlesRainPart: UserScene['particlesRain'] =
		!state.particlesEnabled && !state.rainEnabled
			? 'none'
			: (pickStateKeys(state, MOTION_PROFILE_KEYS) as unknown as Record<
					string,
					number | boolean | string
				>);

	const trackTitlePart: UserScene['trackTitle'] =
		!state.audioTrackTitleEnabled && !state.audioTrackTimeEnabled
			? 'none'
			: (pickStateKeys(state, TRACK_TITLE_KEYS) as unknown as Record<
					string,
					number | boolean | string
				>);

	return {
		id: createUserSceneId(),
		name,
		createdAt: Date.now(),
		v: USER_SCENE_VERSION,
		backgroundAudio: bgIdx >= 0 ? bgIdx : 'none',
		logo: logoPart,
		spectrum: spectrumPart,
		particlesRain: particlesRainPart,
		filters: pickStateKeys(state, FILTER_KEYS) as unknown as Record<
			string,
			number | boolean | string | string[]
		>,
		trackTitle: trackTitlePart
	};
}

export function buildUserSceneActivationPatch(
	state: WallpaperState,
	scene: UserScene
): Partial<WallpaperState> {
	const patch: Partial<WallpaperState> = {};

	if (scene.backgroundAudio !== 'none') {
		const slot = state.backgroundProfileSlots[scene.backgroundAudio];
		if (slot?.values) {
			const defaults = extractBackgroundProfileSettings(
				state as unknown as WallpaperState
			);
			Object.assign(patch, defaults, slot.values);
		}
	} else {
		patch.imageBassReactive = false;
	}

	if (scene.logo.kind === 'none') {
		patch.logoEnabled = false;
	} else if (scene.logo.kind === 'slot') {
		const slot = state.logoProfileSlots[scene.logo.index];
		if (slot?.values) {
			const defaults = extractLogoProfileSettings(
				DEFAULT_STATE as unknown as WallpaperStore
			);
			Object.assign(patch, defaults, slot.values, {
				logoEnabled: true
			} as Partial<WallpaperState>);
		}
	} else {
		const defaults = extractLogoProfileSettings(
			DEFAULT_STATE as unknown as WallpaperStore
		);
		Object.assign(patch, defaults, scene.logo.values, {
			logoEnabled: true
		} as Partial<WallpaperState>);
	}

	if (scene.spectrum.kind === 'none') {
		patch.spectrumEnabled = false;
	} else if (scene.spectrum.kind === 'slot') {
		const slot = state.spectrumProfileSlots[scene.spectrum.index];
		if (slot?.values) {
			Object.assign(patch, hydrateSpectrumProfileValues(slot.values));
		}
	} else {
		Object.assign(patch, hydrateSpectrumProfileValues(scene.spectrum.values));
	}

	if (scene.particlesRain === 'none') {
		patch.particlesEnabled = false;
		patch.rainEnabled = false;
	} else {
		Object.assign(patch, scene.particlesRain as Partial<WallpaperState>);
	}

	if (scene.filters === 'none') {
		patch.filterTargets = [];
		patch.filterOpacity = 1;
		patch.filterBrightness = 1;
		patch.filterContrast = 1;
		patch.filterSaturation = 1;
		patch.filterBlur = 0;
		patch.filterHueRotate = 0;
		patch.filterVignette = 0;
		patch.filterBloom = 0;
		patch.filterLumaThreshold = DEFAULT_STATE.filterLumaThreshold;
		patch.filterLensWarp = 0;
		patch.filterHeatDistortion = 0;
		patch.rgbShift = 0;
		patch.noiseIntensity = 0;
		patch.scanlineIntensity = 0;
	} else {
		Object.assign(patch, scene.filters as Partial<WallpaperState>);
	}

	if (scene.trackTitle === 'none') {
		patch.audioTrackTitleEnabled = false;
		patch.audioTrackTimeEnabled = false;
	} else {
		Object.assign(patch, scene.trackTitle as Partial<WallpaperState>);
	}

	return patch;
}
