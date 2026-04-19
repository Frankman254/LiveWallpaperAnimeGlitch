import { DEFAULT_STATE } from '@/lib/constants';
import {
	createBackgroundImageItem,
	getBackgroundImageRuntimePatch,
	isBackgroundImageUsingDefaultLayout,
	type BackgroundImageLayout
} from '@/lib/backgroundImages';
import type {
	BackgroundImageItem,
	SlideshowTransitionType,
	WallpaperState
} from '@/types/wallpaper';

export type BackgroundImageLayoutState = Pick<
	WallpaperState,
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
	| 'imageRotation'
	| 'slideshowTransitionType'
	| 'slideshowTransitionDuration'
	| 'slideshowTransitionIntensity'
	| 'slideshowTransitionAudioDrive'
	| 'slideshowTransitionAudioChannel'
>;

export type BackgroundImageLayoutPatch = Partial<BackgroundImageLayout> & {
	bassReactive?: boolean;
	bassIntensity?: number;
	audioReactiveDecay?: number;
	audioChannel?: WallpaperState['imageAudioChannel'];
	mirror?: boolean;
	rotation?: number;
	opacity?: number;
	transitionType?: SlideshowTransitionType;
	transitionDuration?: number;
	transitionIntensity?: number;
	transitionAudioDrive?: number;
	transitionAudioChannel?: WallpaperState['slideshowTransitionAudioChannel'];
};

export function buildBackgroundImageCollectionPatch(
	state: WallpaperState,
	backgroundImages: BackgroundImageItem[],
	requestedActiveImageId: string | null = state.activeImageId
): Partial<WallpaperState> {
	const activeImageId =
		requestedActiveImageId &&
		backgroundImages.some(image => image.assetId === requestedActiveImageId)
			? requestedActiveImageId
			: (backgroundImages[0]?.assetId ?? null);
	const activeImage =
		backgroundImages.find(image => image.assetId === activeImageId) ?? null;

	return {
		backgroundImages,
		activeImageId,
		imageIds: backgroundImages.map(image => image.assetId),
		imageUrls: backgroundImages
			.map(image => image.url)
			.filter((url): url is string => Boolean(url)),
		...getBackgroundImageRuntimePatch(activeImage)
	};
}

export function syncActiveBackgroundImage(
	state: WallpaperState,
	patch: BackgroundImageLayoutPatch
): Partial<WallpaperState> {
	if (!state.activeImageId) return {};

	let didUpdate = false;
	const backgroundImages = state.backgroundImages.map(image => {
		if (image.assetId !== state.activeImageId) return image;
		didUpdate = true;
		return { ...image, ...patch };
	});

	return didUpdate ? { backgroundImages } : {};
}

export function syncStateWithActiveBackgroundImage(
	state: WallpaperState,
	patch: Partial<WallpaperState>
): Partial<WallpaperState> {
	const activeImageId = patch.activeImageId ?? state.activeImageId;
	const sourceImages = patch.backgroundImages ?? state.backgroundImages;
	if (!activeImageId || sourceImages.length === 0) return patch;

	const nextConfig: BackgroundImageLayoutPatch = {};

	if ('imageScale' in patch)
		nextConfig.scale = patch.imageScale ?? state.imageScale;
	if ('imagePositionX' in patch)
		nextConfig.positionX = patch.imagePositionX ?? state.imagePositionX;
	if ('imagePositionY' in patch)
		nextConfig.positionY = patch.imagePositionY ?? state.imagePositionY;
	if ('imageOpacity' in patch)
		nextConfig.opacity = patch.imageOpacity ?? state.imageOpacity;
	if ('imageBassReactive' in patch)
		nextConfig.bassReactive =
			patch.imageBassReactive ?? state.imageBassReactive;
	if ('imageBassScaleIntensity' in patch)
		nextConfig.bassIntensity =
			patch.imageBassScaleIntensity ?? state.imageBassScaleIntensity;
	if ('imageAudioReactiveDecay' in patch)
		nextConfig.audioReactiveDecay =
			patch.imageAudioReactiveDecay ?? state.imageAudioReactiveDecay;
	if ('imageAudioChannel' in patch)
		nextConfig.audioChannel =
			patch.imageAudioChannel ?? state.imageAudioChannel;
	if ('imageFitMode' in patch)
		nextConfig.fitMode = patch.imageFitMode ?? state.imageFitMode;
	if ('imageMirror' in patch)
		nextConfig.mirror = patch.imageMirror ?? state.imageMirror;
	if ('imageRotation' in patch)
		nextConfig.rotation = patch.imageRotation ?? state.imageRotation;
	if ('slideshowTransitionType' in patch)
		nextConfig.transitionType =
			patch.slideshowTransitionType ?? state.slideshowTransitionType;
	if ('slideshowTransitionDuration' in patch)
		nextConfig.transitionDuration =
			patch.slideshowTransitionDuration ??
			state.slideshowTransitionDuration;
	if ('slideshowTransitionIntensity' in patch)
		nextConfig.transitionIntensity =
			patch.slideshowTransitionIntensity ??
			state.slideshowTransitionIntensity;
	if ('slideshowTransitionAudioDrive' in patch)
		nextConfig.transitionAudioDrive =
			patch.slideshowTransitionAudioDrive ??
			state.slideshowTransitionAudioDrive;
	if ('slideshowTransitionAudioChannel' in patch)
		nextConfig.transitionAudioChannel =
			patch.slideshowTransitionAudioChannel ??
			state.slideshowTransitionAudioChannel;

	if (Object.keys(nextConfig).length === 0) return patch;

	return {
		...patch,
		backgroundImages: sourceImages.map(image =>
			image.assetId === activeImageId
				? { ...image, ...nextConfig }
				: image
		)
	};
}

export function getActiveBackgroundImageLayout(
	state: WallpaperState
): BackgroundImageLayout & { rotation: number } {
	return {
		scale: state.imageScale,
		positionX: state.imagePositionX,
		positionY: state.imagePositionY,
		fitMode: state.imageFitMode,
		rotation: state.imageRotation
	};
}

export function moveBackgroundImageItem(
	backgroundImages: BackgroundImageItem[],
	id: string,
	direction: -1 | 1
): BackgroundImageItem[] {
	const currentIndex = backgroundImages.findIndex(
		image => image.assetId === id
	);
	if (currentIndex < 0) return backgroundImages;

	const targetIndex = Math.max(
		0,
		Math.min(backgroundImages.length - 1, currentIndex + direction)
	);
	if (targetIndex === currentIndex) return backgroundImages;

	const nextImages = [...backgroundImages];
	const [movedImage] = nextImages.splice(currentIndex, 1);
	if (!movedImage) return backgroundImages;
	nextImages.splice(targetIndex, 0, movedImage);
	return nextImages;
}

export function shuffleBackgroundImages(
	backgroundImages: BackgroundImageItem[]
): BackgroundImageItem[] {
	if (backgroundImages.length < 2) return backgroundImages;

	const nextImages = [...backgroundImages];
	for (let index = nextImages.length - 1; index > 0; index -= 1) {
		const randomIndex = Math.floor(Math.random() * (index + 1));
		[nextImages[index], nextImages[randomIndex]] = [
			nextImages[randomIndex],
			nextImages[index]
		];
	}

	return nextImages;
}

export function buildFallbackBackgroundImageConfig(
	state: Partial<WallpaperState>
): BackgroundImageLayoutState {
	return {
		imageScale: state.imageScale ?? DEFAULT_STATE.imageScale,
		imagePositionX: state.imagePositionX ?? DEFAULT_STATE.imagePositionX,
		imagePositionY: state.imagePositionY ?? DEFAULT_STATE.imagePositionY,
		imageOpacity: state.imageOpacity ?? DEFAULT_STATE.imageOpacity,
		imageBassReactive:
			state.imageBassReactive ?? DEFAULT_STATE.imageBassReactive,
		imageBassScaleIntensity:
			state.imageBassScaleIntensity ??
			DEFAULT_STATE.imageBassScaleIntensity,
		imageAudioReactiveDecay:
			state.imageAudioReactiveDecay ??
			DEFAULT_STATE.imageAudioReactiveDecay,
		imageAudioChannel:
			state.imageAudioChannel ?? DEFAULT_STATE.imageAudioChannel,
		imageFitMode: state.imageFitMode ?? DEFAULT_STATE.imageFitMode,
		imageMirror: state.imageMirror ?? DEFAULT_STATE.imageMirror,
		imageRotation: state.imageRotation ?? DEFAULT_STATE.imageRotation,
		slideshowTransitionType:
			state.slideshowTransitionType ??
			DEFAULT_STATE.slideshowTransitionType,
		slideshowTransitionDuration:
			state.slideshowTransitionDuration ??
			DEFAULT_STATE.slideshowTransitionDuration,
		slideshowTransitionIntensity:
			state.slideshowTransitionIntensity ??
			DEFAULT_STATE.slideshowTransitionIntensity,
		slideshowTransitionAudioDrive:
			state.slideshowTransitionAudioDrive ??
			DEFAULT_STATE.slideshowTransitionAudioDrive,
		slideshowTransitionAudioChannel:
			state.slideshowTransitionAudioChannel ??
			DEFAULT_STATE.slideshowTransitionAudioChannel
	};
}

export function normalizePersistedBackgroundImages(
	state: Partial<WallpaperState>
): BackgroundImageItem[] {
	const fallbackImageConfig = buildFallbackBackgroundImageConfig(state);
	const fallbackImageLayout: BackgroundImageLayout = {
		scale: fallbackImageConfig.imageScale,
		positionX: fallbackImageConfig.imagePositionX,
		positionY: fallbackImageConfig.imagePositionY,
		fitMode: fallbackImageConfig.imageFitMode
	};

	return (
		state.backgroundImages?.length
			? state.backgroundImages
			: (state.imageIds ?? []).map(assetId =>
					createBackgroundImageItem(
						assetId,
						null,
						null,
						fallbackImageLayout
					)
				)
	).map(image => ({
		assetId: image.assetId,
		url: image.url ?? null,
		thumbnailUrl: image.thumbnailUrl ?? null,
		scale: image.scale ?? fallbackImageConfig.imageScale,
		positionX: image.positionX ?? fallbackImageConfig.imagePositionX,
		positionY: image.positionY ?? fallbackImageConfig.imagePositionY,
		rotation: image.rotation ?? fallbackImageConfig.imageRotation,
		fitMode: image.fitMode ?? fallbackImageConfig.imageFitMode,
		mirror: image.mirror ?? fallbackImageConfig.imageMirror,
		opacity: image.opacity ?? fallbackImageConfig.imageOpacity,
		bassReactive:
			image.bassReactive ?? fallbackImageConfig.imageBassReactive,
		bassIntensity:
			image.bassIntensity ?? fallbackImageConfig.imageBassScaleIntensity,
		audioReactiveDecay:
			image.audioReactiveDecay ??
			fallbackImageConfig.imageAudioReactiveDecay,
		audioChannel:
			image.audioChannel ?? fallbackImageConfig.imageAudioChannel,
		transitionType:
			image.transitionType ?? fallbackImageConfig.slideshowTransitionType,
		transitionDuration:
			image.transitionDuration ??
			fallbackImageConfig.slideshowTransitionDuration,
		transitionIntensity:
			image.transitionIntensity ??
			fallbackImageConfig.slideshowTransitionIntensity,
		transitionAudioDrive:
			image.transitionAudioDrive ??
			fallbackImageConfig.slideshowTransitionAudioDrive,
		transitionAudioChannel:
			image.transitionAudioChannel ??
			fallbackImageConfig.slideshowTransitionAudioChannel,
		logoProfileSlotIndex: image.logoProfileSlotIndex ?? null,
		spectrumProfileSlotIndex: image.spectrumProfileSlotIndex ?? null,
		logoOverride: image.logoOverride ?? null,
		spectrumOverride: image.spectrumOverride ?? null,
		playbackSwitchAt: image.playbackSwitchAt ?? null,
		userSceneId:
			typeof (image as { userSceneId?: unknown }).userSceneId === 'string'
				? (image as { userSceneId: string }).userSceneId
				: null
	}));
}

export function applyActiveImageConfigToDefaultImages(
	state: WallpaperState
): WallpaperState | Partial<WallpaperState> {
	if (!state.activeImageId) return state;

	const activeLayout = getActiveBackgroundImageLayout(state);
	let didUpdate = false;
	const backgroundImages = state.backgroundImages.map(image => {
		if (
			image.assetId === state.activeImageId ||
			!isBackgroundImageUsingDefaultLayout(image)
		) {
			return image;
		}

		didUpdate = true;
		return {
			...image,
			...activeLayout
		};
	});

	return didUpdate
		? buildBackgroundImageCollectionPatch(
				state,
				backgroundImages,
				state.activeImageId
			)
		: state;
}
