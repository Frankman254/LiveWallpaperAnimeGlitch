import type { WallpaperState } from './wallpaper';

export type PresetKey = 'softDream' | 'cyberPop' | 'rainyNight';

export type Preset = Partial<
	Omit<
		WallpaperState,
		| 'activePreset'
		| 'audioCaptureState'
		| 'audioReactive'
		| 'customPresets'
		| 'backgroundImages'
		| 'activeImageId'
		| 'globalBackgroundId'
		| 'globalBackgroundUrl'
		| 'globalBackgroundScale'
		| 'globalBackgroundPositionX'
		| 'globalBackgroundPositionY'
		| 'globalBackgroundFitMode'
		| 'globalBackgroundOpacity'
		| 'globalBackgroundBrightness'
		| 'globalBackgroundContrast'
		| 'globalBackgroundSaturation'
		| 'globalBackgroundBlur'
		| 'globalBackgroundHueRotate'
		| 'controlPanelAnchor'
		| 'layerZIndices'
		| 'imageUrl'
		| 'imageUrls'
		| 'imageIds'
		| 'isPresetDirty'
		| 'language'
		| 'logoId'
		| 'logoUrl'
		| 'overlays'
		| 'selectedOverlayId'
		| 'showFps'
	>
>;

export type PresetsMap = Record<PresetKey, Preset>;

export interface CustomPreset {
	id: string;
	name: string;
	values: Preset;
}

export type CustomPresetsMap = Record<string, CustomPreset>;
