import { useEffect } from 'react';
import { createBackgroundImageItem } from '@/lib/backgroundImages';
import { APP_LOGO_URL } from '@/lib/constants';
import { loadAllImages, loadImage } from '@/lib/db/imageDb';
import { useWallpaperStore } from '@/store/wallpaperStore';

export async function restoreWallpaperAssets(): Promise<void> {
	const state = useWallpaperStore.getState();

	let nextBackgroundImages = state.backgroundImages;
	let nextImageIds = state.imageIds;
	let nextImageUrls = state.imageUrls;
	let nextActiveImageId = state.activeImageId;
	let nextImageUrl = state.imageUrl;
	let nextImageScale = state.imageScale;
	let nextImagePositionX = state.imagePositionX;
	let nextImagePositionY = state.imagePositionY;
	let nextImageOpacity = state.imageOpacity;
	let nextImageBassReactive = state.imageBassReactive;
	let nextImageBassScaleIntensity = state.imageBassScaleIntensity;
	let nextImageAudioReactiveDecay = state.imageAudioReactiveDecay;
	let nextImageAudioChannel = state.imageAudioChannel;
	let nextImageFitMode = state.imageFitMode;
	let nextImageMirror = state.imageMirror;
	let nextSlideshowTransitionType = state.slideshowTransitionType;
	let nextSlideshowTransitionDuration = state.slideshowTransitionDuration;
	let nextSlideshowTransitionIntensity = state.slideshowTransitionIntensity;
	let nextSlideshowTransitionAudioDrive = state.slideshowTransitionAudioDrive;
	let nextSlideshowTransitionAudioChannel =
		state.slideshowTransitionAudioChannel;

	const imageAssetIds =
		state.backgroundImages.length > 0
			? state.backgroundImages.map(image => image.assetId)
			: state.imageIds;

	if (imageAssetIds.length > 0) {
		const urlMap = await loadAllImages(imageAssetIds);

		nextBackgroundImages = (
			state.backgroundImages.length > 0
				? state.backgroundImages
				: state.imageIds.map(assetId =>
						createBackgroundImageItem(assetId, null, {
							scale: state.imageScale,
							positionX: state.imagePositionX,
							positionY: state.imagePositionY,
							fitMode: state.imageFitMode,
							mirror: state.imageMirror,
							opacity: state.imageOpacity,
							bassReactive: state.imageBassReactive,
							bassIntensity: state.imageBassScaleIntensity,
							audioReactiveDecay:
								state.imageAudioReactiveDecay,
							audioChannel: state.imageAudioChannel,
							transitionType: state.slideshowTransitionType,
							transitionDuration:
								state.slideshowTransitionDuration,
							transitionIntensity:
								state.slideshowTransitionIntensity,
							transitionAudioDrive:
								state.slideshowTransitionAudioDrive,
							transitionAudioChannel:
								state.slideshowTransitionAudioChannel
						})
					)
		)
			.map(image => ({
				...image,
				url: urlMap.get(image.assetId) ?? null
			}))
			.filter(image => image.url);

		nextImageIds = nextBackgroundImages.map(image => image.assetId);
		nextImageUrls = nextBackgroundImages
			.map(image => image.url)
			.filter((url): url is string => Boolean(url));

		if (
			!nextBackgroundImages.some(
				image => image.assetId === nextActiveImageId
			)
		) {
			nextActiveImageId = nextBackgroundImages[0]?.assetId ?? null;
		}

		const activeImage =
			nextBackgroundImages.find(
				image => image.assetId === nextActiveImageId
			) ??
			nextBackgroundImages[0] ??
			null;
		nextActiveImageId = activeImage?.assetId ?? null;
		nextImageUrl = activeImage?.url ?? null;
		nextImageScale = activeImage?.scale ?? state.imageScale;
		nextImagePositionX = activeImage?.positionX ?? state.imagePositionX;
		nextImagePositionY = activeImage?.positionY ?? state.imagePositionY;
		nextImageOpacity = activeImage?.opacity ?? state.imageOpacity;
		nextImageBassReactive =
			activeImage?.bassReactive ?? state.imageBassReactive;
		nextImageBassScaleIntensity =
			activeImage?.bassIntensity ?? state.imageBassScaleIntensity;
		nextImageAudioReactiveDecay =
			activeImage?.audioReactiveDecay ?? state.imageAudioReactiveDecay;
		nextImageAudioChannel =
			activeImage?.audioChannel ?? state.imageAudioChannel;
		nextImageFitMode = activeImage?.fitMode ?? state.imageFitMode;
		nextImageMirror = activeImage?.mirror ?? state.imageMirror;
		nextSlideshowTransitionType =
			activeImage?.transitionType ?? state.slideshowTransitionType;
		nextSlideshowTransitionDuration =
			activeImage?.transitionDuration ??
			state.slideshowTransitionDuration;
		nextSlideshowTransitionIntensity =
			activeImage?.transitionIntensity ??
			state.slideshowTransitionIntensity;
		nextSlideshowTransitionAudioDrive =
			activeImage?.transitionAudioDrive ??
			state.slideshowTransitionAudioDrive;
		nextSlideshowTransitionAudioChannel =
			activeImage?.transitionAudioChannel ??
			state.slideshowTransitionAudioChannel;
	}

	let nextLogoUrl = state.logoUrl ?? APP_LOGO_URL;
	let nextLogoId = state.logoId;
	let nextGlobalBackgroundUrl = state.globalBackgroundUrl;
	let nextGlobalBackgroundId = state.globalBackgroundId;

	if (state.globalBackgroundId) {
		const globalBackgroundUrl = await loadImage(state.globalBackgroundId);
		if (globalBackgroundUrl) nextGlobalBackgroundUrl = globalBackgroundUrl;
		else nextGlobalBackgroundId = null;
	}

	if (state.logoId) {
		const logoUrl = await loadImage(state.logoId);
		if (logoUrl) nextLogoUrl = logoUrl;
		else nextLogoId = null;
	}
	if (!nextLogoId && !nextLogoUrl) {
		nextLogoUrl = APP_LOGO_URL;
	}

	let nextSelectedOverlayId = state.selectedOverlayId;
	let nextOverlays = state.overlays;
	if (state.overlays.length > 0) {
		const overlayIds = state.overlays.map(overlay => overlay.assetId);
		const overlayUrlMap = await loadAllImages(overlayIds);

		nextOverlays = state.overlays
			.map(overlay => ({
				...overlay,
				url: overlayUrlMap.get(overlay.assetId) ?? null
			}))
			.filter(overlay => overlay.url);

		if (
			!nextOverlays.some(overlay => overlay.id === nextSelectedOverlayId)
		) {
			nextSelectedOverlayId = nextOverlays[0]?.id ?? null;
		}
	}

	useWallpaperStore.setState({
		backgroundImages: nextBackgroundImages,
		activeImageId: nextActiveImageId,
		imageIds: nextImageIds,
		imageUrls: nextImageUrls,
		imageUrl: nextImageUrl,
		imageScale: nextImageScale,
		imagePositionX: nextImagePositionX,
		imagePositionY: nextImagePositionY,
		imageOpacity: nextImageOpacity,
		imageBassReactive: nextImageBassReactive,
		imageBassScaleIntensity: nextImageBassScaleIntensity,
		imageAudioReactiveDecay: nextImageAudioReactiveDecay,
		imageAudioChannel: nextImageAudioChannel,
		imageFitMode: nextImageFitMode,
		imageMirror: nextImageMirror,
		slideshowTransitionType: nextSlideshowTransitionType,
		slideshowTransitionDuration: nextSlideshowTransitionDuration,
		slideshowTransitionIntensity: nextSlideshowTransitionIntensity,
		slideshowTransitionAudioDrive: nextSlideshowTransitionAudioDrive,
		slideshowTransitionAudioChannel: nextSlideshowTransitionAudioChannel,
		globalBackgroundId: nextGlobalBackgroundId,
		globalBackgroundUrl: nextGlobalBackgroundUrl,
		logoId: nextLogoId,
		logoUrl: nextLogoUrl,
		overlays: nextOverlays,
		selectedOverlayId: nextSelectedOverlayId
	});
}

export function useRestoreWallpaperAssets(enabled = true): void {
	useEffect(() => {
		if (!enabled) return;
		void restoreWallpaperAssets();
	}, [enabled]);
}
