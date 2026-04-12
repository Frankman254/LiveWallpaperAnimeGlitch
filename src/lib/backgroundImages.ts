import { DEFAULT_STATE } from '@/lib/constants';
import type { BackgroundImageItem, WallpaperState } from '@/types/wallpaper';

export type BackgroundImageLayout = Pick<
	BackgroundImageItem,
	'scale' | 'positionX' | 'positionY' | 'fitMode'
>;
export type BackgroundImageSettings = Pick<
	BackgroundImageItem,
	| 'scale'
	| 'positionX'
	| 'positionY'
	| 'rotation'
	| 'fitMode'
	| 'mirror'
	| 'opacity'
	| 'bassReactive'
	| 'bassIntensity'
	| 'audioReactiveDecay'
	| 'audioChannel'
	| 'transitionType'
	| 'transitionDuration'
	| 'transitionIntensity'
	| 'transitionAudioDrive'
	| 'transitionAudioChannel'
	| 'logoProfileSlotIndex'
	| 'spectrumProfileSlotIndex'
>;

export function getDefaultBackgroundImageSettings(): BackgroundImageSettings {
	return {
		scale: DEFAULT_STATE.imageScale,
		positionX: DEFAULT_STATE.imagePositionX,
		positionY: DEFAULT_STATE.imagePositionY,
		rotation: 0,
		fitMode: DEFAULT_STATE.imageFitMode,
		mirror: DEFAULT_STATE.imageMirror,
		opacity: DEFAULT_STATE.imageOpacity,
		bassReactive: DEFAULT_STATE.imageBassReactive,
		bassIntensity: DEFAULT_STATE.imageBassScaleIntensity,
		audioReactiveDecay: DEFAULT_STATE.imageAudioReactiveDecay,
		audioChannel: DEFAULT_STATE.imageAudioChannel,
		transitionType: DEFAULT_STATE.slideshowTransitionType,
		transitionDuration: DEFAULT_STATE.slideshowTransitionDuration,
		transitionIntensity: DEFAULT_STATE.slideshowTransitionIntensity,
		transitionAudioDrive: DEFAULT_STATE.slideshowTransitionAudioDrive,
		transitionAudioChannel: DEFAULT_STATE.slideshowTransitionAudioChannel,
		logoProfileSlotIndex: null,
		spectrumProfileSlotIndex: null
	};
}

export function getDefaultBackgroundImageLayout(): BackgroundImageLayout {
	const defaults = getDefaultBackgroundImageSettings();
	return {
		scale: defaults.scale,
		positionX: defaults.positionX,
		positionY: defaults.positionY,
		fitMode: defaults.fitMode
	};
}

export function createBackgroundImageItem(
	assetId: string,
	url: string | null,
	thumbnailUrl: string | null = null,
	settings: Partial<BackgroundImageSettings> = {}
): BackgroundImageItem {
	const defaults = getDefaultBackgroundImageSettings();
	return {
		assetId,
		url,
		thumbnailUrl,
		scale: settings.scale ?? defaults.scale,
		positionX: settings.positionX ?? defaults.positionX,
		positionY: settings.positionY ?? defaults.positionY,
		rotation: settings.rotation ?? defaults.rotation,
		fitMode: settings.fitMode ?? defaults.fitMode,
		mirror: settings.mirror ?? defaults.mirror,
		opacity: settings.opacity ?? defaults.opacity,
		bassReactive: settings.bassReactive ?? defaults.bassReactive,
		bassIntensity: settings.bassIntensity ?? defaults.bassIntensity,
		audioReactiveDecay:
			settings.audioReactiveDecay ?? defaults.audioReactiveDecay,
		audioChannel: settings.audioChannel ?? defaults.audioChannel,
		transitionType: settings.transitionType ?? defaults.transitionType,
		transitionDuration:
			settings.transitionDuration ?? defaults.transitionDuration,
		transitionIntensity:
			settings.transitionIntensity ?? defaults.transitionIntensity,
		transitionAudioDrive:
			settings.transitionAudioDrive ?? defaults.transitionAudioDrive,
		transitionAudioChannel:
			settings.transitionAudioChannel ?? defaults.transitionAudioChannel,
		logoProfileSlotIndex:
			settings.logoProfileSlotIndex ?? defaults.logoProfileSlotIndex,
		spectrumProfileSlotIndex:
			settings.spectrumProfileSlotIndex ?? defaults.spectrumProfileSlotIndex,
		logoOverride: null,
		spectrumOverride: null,
		playbackSwitchAt: null
	};
}

export function getBackgroundImageRuntimePatch(
	image: BackgroundImageItem | null
): Pick<
	WallpaperState,
	| 'imageUrl'
	| 'imageScale'
	| 'imagePositionX'
	| 'imagePositionY'
	| 'imageOpacity'
	| 'imageBassReactive'
	| 'imageBassScaleIntensity'
	| 'imageAudioReactiveDecay'
	| 'imageAudioChannel'
	| 'imageFitMode'
	| 'imageMirror'
	| 'slideshowTransitionType'
	| 'slideshowTransitionDuration'
	| 'slideshowTransitionIntensity'
	| 'slideshowTransitionAudioDrive'
	| 'slideshowTransitionAudioChannel'
> {
	return {
		imageUrl: image?.url ?? null,
		imageScale: image?.scale ?? DEFAULT_STATE.imageScale,
		imagePositionX: image?.positionX ?? DEFAULT_STATE.imagePositionX,
		imagePositionY: image?.positionY ?? DEFAULT_STATE.imagePositionY,
		imageOpacity: image?.opacity ?? DEFAULT_STATE.imageOpacity,
		imageBassReactive:
			image?.bassReactive ?? DEFAULT_STATE.imageBassReactive,
		imageBassScaleIntensity:
			image?.bassIntensity ?? DEFAULT_STATE.imageBassScaleIntensity,
		imageAudioReactiveDecay:
			image?.audioReactiveDecay ?? DEFAULT_STATE.imageAudioReactiveDecay,
		imageAudioChannel:
			image?.audioChannel ?? DEFAULT_STATE.imageAudioChannel,
		imageFitMode: image?.fitMode ?? DEFAULT_STATE.imageFitMode,
		imageMirror: image?.mirror ?? DEFAULT_STATE.imageMirror,
		slideshowTransitionType:
			image?.transitionType ?? DEFAULT_STATE.slideshowTransitionType,
		slideshowTransitionDuration:
			image?.transitionDuration ??
			DEFAULT_STATE.slideshowTransitionDuration,
		slideshowTransitionIntensity:
			image?.transitionIntensity ??
			DEFAULT_STATE.slideshowTransitionIntensity,
		slideshowTransitionAudioDrive:
			image?.transitionAudioDrive ??
			DEFAULT_STATE.slideshowTransitionAudioDrive,
		slideshowTransitionAudioChannel:
			image?.transitionAudioChannel ??
			DEFAULT_STATE.slideshowTransitionAudioChannel
	};
}

export function isBackgroundImageUsingDefaultLayout(
	image: BackgroundImageItem
): boolean {
	const defaults = getDefaultBackgroundImageLayout();
	return (
		image.scale === defaults.scale &&
		image.positionX === defaults.positionX &&
		image.positionY === defaults.positionY &&
		image.fitMode === defaults.fitMode
	);
}
