import {
	doProfileSettingsMatch,
	extractBackgroundProfileSettings,
	extractLogoProfileSettings,
	extractMotionProfileSettings,
	extractSpectrumProfileSettings,
	MOTION_PROFILE_KEYS
} from '@/lib/featureProfiles';
import { hydrateSpectrumProfileValues } from '@/features/spectrum/runtime/spectrumProfileHydrate';
import { DEFAULT_STATE } from '@/lib/constants';
import type { LogoProfileSettings, SpectrumProfileSettings, WallpaperState } from '@/types/wallpaper';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

/** Slot index into a ProfileSlot array, or `none` = layer off / not applied. */
export type SceneSlotRef = number | 'none';

export const USER_SCENE_VERSION = 2 as const;

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
	/** v2: slot-first scene graph; v1 still loads via legacy nested fields. */
	v: 1 | 2 | typeof USER_SCENE_VERSION;
	backgroundAudio: SceneSlotRef;
	logo: UserSceneLogoPart;
	spectrum: UserSceneSpectrumPart;
	/** Full particle + rain field bundle (v1 inline fallback). */
	particlesRain: 'none' | Record<string, number | boolean | string>;
	filters: 'none' | Record<string, number | boolean | string | string[]>;
	trackTitle: 'none' | Record<string, number | boolean | string>;
	/** v2 — resolved profile slots (use `none` to skip a layer). */
	spectrumSlotId?: SceneSlotRef;
	logoSlotId?: SceneSlotRef;
	particlesSlotId?: SceneSlotRef;
	rainSlotId?: SceneSlotRef;
	/** Reserved until filter profile slots exist; use `none`. */
	filtersSlotId?: SceneSlotRef;
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

	const motionCurrent = extractMotionProfileSettings(state);
	const motionIdx = state.motionProfileSlots.findIndex(slot =>
		doProfileSettingsMatch(motionCurrent, slot.values)
	);
	const motionSlotRef: SceneSlotRef =
		!state.particlesEnabled && !state.rainEnabled
			? 'none'
			: motionIdx >= 0
				? motionIdx
				: 'none';

	const spectrumSlotId: SceneSlotRef =
		spectrumPart.kind === 'slot' ? spectrumPart.index : 'none';
	const logoSlotId: SceneSlotRef =
		logoPart.kind === 'slot' ? logoPart.index : 'none';

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
		trackTitle: trackTitlePart,
		spectrumSlotId,
		logoSlotId,
		particlesSlotId: motionSlotRef,
		rainSlotId: motionSlotRef,
		filtersSlotId: 'none'
	};
}

/** Normalize persisted v1 scenes to include v2 slot refs (no data loss). */
export function migrateUserSceneEntry(scene: UserScene): UserScene {
	if (scene.v >= 2) return scene;
	const spectrumSlotId: SceneSlotRef =
		scene.spectrum.kind === 'slot' ? scene.spectrum.index : 'none';
	const logoSlotId: SceneSlotRef =
		scene.logo.kind === 'slot' ? scene.logo.index : 'none';
	return {
		...scene,
		v: 2,
		spectrumSlotId,
		logoSlotId,
		particlesSlotId: 'none',
		rainSlotId: 'none',
		filtersSlotId: 'none'
	};
}

export function buildUserSceneActivationPatch(
	state: WallpaperState,
	scene: UserScene
): Partial<WallpaperState> {
	const patch: Partial<WallpaperState> = {};
	const sceneNorm = migrateUserSceneEntry(scene);

	if (sceneNorm.backgroundAudio !== 'none') {
		const slot = state.backgroundProfileSlots[sceneNorm.backgroundAudio];
		if (slot?.values) {
			const defaults = extractBackgroundProfileSettings(
				state as unknown as WallpaperState
			);
			Object.assign(patch, defaults, slot.values);
		}
	} else {
		patch.imageBassReactive = false;
	}

	if (typeof sceneNorm.logoSlotId === 'number') {
		const slot = state.logoProfileSlots[sceneNorm.logoSlotId];
		if (slot?.values) {
			const defaults = extractLogoProfileSettings(
				DEFAULT_STATE as unknown as WallpaperStore
			);
			Object.assign(patch, defaults, slot.values, {
				logoEnabled: true
			} as Partial<WallpaperState>);
		}
	} else if (sceneNorm.logo.kind === 'none') {
		patch.logoEnabled = false;
	} else if (sceneNorm.logo.kind === 'slot') {
		const slot = state.logoProfileSlots[sceneNorm.logo.index];
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
		Object.assign(patch, defaults, sceneNorm.logo.values, {
			logoEnabled: true
		} as Partial<WallpaperState>);
	}

	if (typeof sceneNorm.spectrumSlotId === 'number') {
		const slot = state.spectrumProfileSlots[sceneNorm.spectrumSlotId];
		if (slot?.values) {
			Object.assign(patch, hydrateSpectrumProfileValues(slot.values));
		}
	} else if (sceneNorm.spectrum.kind === 'none') {
		patch.spectrumEnabled = false;
	} else if (sceneNorm.spectrum.kind === 'slot') {
		const slot = state.spectrumProfileSlots[sceneNorm.spectrum.index];
		if (slot?.values) {
			Object.assign(patch, hydrateSpectrumProfileValues(slot.values));
		}
	} else {
		Object.assign(
			patch,
			hydrateSpectrumProfileValues(sceneNorm.spectrum.values)
		);
	}

	const motionSlotIndex =
		typeof sceneNorm.particlesSlotId === 'number'
			? sceneNorm.particlesSlotId
			: typeof sceneNorm.rainSlotId === 'number'
				? sceneNorm.rainSlotId
				: null;
	if (motionSlotIndex !== null) {
		const slot = state.motionProfileSlots[motionSlotIndex];
		if (slot?.values) {
			const defaults = extractMotionProfileSettings(
				DEFAULT_STATE as unknown as WallpaperStore
			);
			Object.assign(patch, defaults, slot.values);
		}
	} else if (sceneNorm.particlesRain === 'none') {
		patch.particlesEnabled = false;
		patch.rainEnabled = false;
	} else {
		Object.assign(patch, sceneNorm.particlesRain as Partial<WallpaperState>);
	}

	if (sceneNorm.filters === 'none') {
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
		Object.assign(patch, sceneNorm.filters as Partial<WallpaperState>);
	}

	if (sceneNorm.trackTitle === 'none') {
		patch.audioTrackTitleEnabled = false;
		patch.audioTrackTimeEnabled = false;
	} else {
		Object.assign(patch, sceneNorm.trackTitle as Partial<WallpaperState>);
	}

	return patch;
}
