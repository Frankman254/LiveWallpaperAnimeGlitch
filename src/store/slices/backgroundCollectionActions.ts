import { DEFAULT_STATE } from '@/lib/constants';
import { createBackgroundImageItem } from '@/lib/backgroundImages';
import { buildScenePatch, findScenePresetById } from '@/features/scenes/scenePresets';
import { invalidateSpectrumPresetMorph } from '@/features/spectrum/runtime/spectrumPresetTransition';
import {
	applyActiveImageConfigToDefaultImages,
	buildBackgroundImageCollectionPatch,
	moveBackgroundImageItem,
	shuffleBackgroundImages
} from '@/store/backgroundStoreUtils';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import type { StateCreator } from 'zustand';

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];

export function createBackgroundCollectionActions(set: WallpaperSet) {
	return {
		setImagePlaybackSwitchAt: v =>
			set(state => ({
				backgroundImages: state.backgroundImages.map(img =>
					img.assetId === state.activeImageId
						? { ...img, playbackSwitchAt: v }
						: img
				)
			})),
		resetAllManualTimestamps: () =>
			set(state => ({
				backgroundImages: state.backgroundImages.map(img => ({
					...img,
					playbackSwitchAt: null
				}))
			})),
		setActiveImageId: id =>
			set(state => {
				const patch = buildBackgroundImageCollectionPatch(
					state,
					state.backgroundImages,
					id
				);
				const activeImageId = patch.activeImageId;
				if (activeImageId) {
					const match = state.backgroundImages.find(
						img => img.assetId === activeImageId
					);
					if (match) {
						// Inline overrides take priority over slot indices.
						// Overrides configure appearance, not visibility — preserve
						// the current enabled state so a saved-when-disabled override
						// never silently hides the logo or spectrum.
						if (match.logoOverride) {
							Object.assign(patch, match.logoOverride, {
								logoEnabled: state.logoEnabled
							});
						} else if (
							match.logoProfileSlotIndex != null &&
							state.logoProfileSlots[match.logoProfileSlotIndex]
								?.values
						) {
							Object.assign(
								patch,
								state.logoProfileSlots[
									match.logoProfileSlotIndex
								].values,
								{ logoEnabled: state.logoEnabled }
							);
						}
						if (match.spectrumOverride) {
							Object.assign(patch, match.spectrumOverride, {
								spectrumEnabled: state.spectrumEnabled
							});
						} else if (
							match.spectrumProfileSlotIndex != null &&
							state.spectrumProfileSlots[
								match.spectrumProfileSlotIndex
							]?.values
						) {
							Object.assign(
								patch,
								state.spectrumProfileSlots[
									match.spectrumProfileSlotIndex
								].values,
								{ spectrumEnabled: state.spectrumEnabled }
							);
						}
						if (match.sceneOverrideId) {
							const scene = findScenePresetById(match.sceneOverrideId);
							if (scene) {
								invalidateSpectrumPresetMorph();
								Object.assign(
									patch,
									buildScenePatch(scene, {
										customSceneUserPatch:
											state.customSceneUserPatch
									})
								);
							}
						}
					}
				}
				return patch;
			}),
		applyActiveImageConfigToDefaultImages: () =>
			set(state => applyActiveImageConfigToDefaultImages(state)),
		moveImageEntry: (id, direction) =>
			set(state => {
				const backgroundImages = moveBackgroundImageItem(
					state.backgroundImages,
					id,
					direction
				);
				if (backgroundImages === state.backgroundImages) return state;
				return buildBackgroundImageCollectionPatch(
					state,
					backgroundImages,
					state.activeImageId
				);
			}),
		shuffleImageEntries: () =>
			set(state => {
				const backgroundImages = shuffleBackgroundImages(
					state.backgroundImages
				);
				if (backgroundImages === state.backgroundImages) return state;
				return buildBackgroundImageCollectionPatch(
					state,
					backgroundImages,
					state.activeImageId
				);
			}),
		setImageUrls: v =>
			set(state => {
				if (v.length === 0) {
					return {
						imageIds: [],
						imageUrls: [],
						backgroundImages: [],
						activeImageId: null,
						imageUrl: null
					};
				}

				const backgroundImages = state.backgroundImages
					.map((image, index) => ({
						...image,
						url: v[index] ?? null
					}))
					.filter(image => image.url !== null);

				return buildBackgroundImageCollectionPatch(
					state,
					backgroundImages,
					state.activeImageId
				);
			}),
		autoFitAllImages: () =>
			set(state => ({
				imageScale: 1.0,
				imageFitMode: 'cover',
				imagePositionX: 0,
				imagePositionY: 0,
				globalBackgroundScale: 1.0,
				globalBackgroundFitMode: 'cover',
				backgroundImages: state.backgroundImages.map(img => ({
					...img,
					scale: 1.0,
					fitMode: 'cover',
					positionX: 0,
					positionY: 0
				}))
			})),
		addImageEntry: (id, url, thumbnailUrl = null) =>
			set(state => {
				const backgroundImage = createBackgroundImageItem(
					id,
					url,
					thumbnailUrl
				);
				const backgroundImages = [
					...state.backgroundImages,
					backgroundImage
				];
				const nextActiveImageId = state.activeImageId ?? id;
				return buildBackgroundImageCollectionPatch(
					state,
					backgroundImages,
					nextActiveImageId
				);
			}),
		setImageThumbnailUrl: (id, thumbnailUrl) =>
			set(state => {
				let didUpdate = false;
				const backgroundImages = state.backgroundImages.map(image => {
					if (
						image.assetId !== id ||
						image.thumbnailUrl === thumbnailUrl
					) {
						return image;
					}

					didUpdate = true;
					return {
						...image,
						thumbnailUrl
					};
				});

				return didUpdate ? { backgroundImages } : state;
			}),
		removeImageEntry: id =>
			set(state => {
				if (!state.backgroundImages.some(image => image.assetId === id))
					return state;
				const backgroundImages = state.backgroundImages.filter(
					image => image.assetId !== id
				);
				const nextActiveImageId =
					state.activeImageId === id
						? (backgroundImages[0]?.assetId ?? null)
						: state.activeImageId;
				return buildBackgroundImageCollectionPatch(
					state,
					backgroundImages,
					nextActiveImageId
				);
			}),
		addOverlay: overlay =>
			set(state => ({
				overlays: [...state.overlays, overlay],
				selectedOverlayId: overlay.id
			})),
		updateOverlay: (id, patch) =>
			set(state => ({
				overlays: state.overlays.map(overlay =>
					overlay.id === id ? { ...overlay, ...patch } : overlay
				)
			})),
		removeOverlay: id =>
			set(state => {
				const overlays = state.overlays.filter(
					overlay => overlay.id !== id
				);
				return {
					overlays,
					selectedOverlayId:
						state.selectedOverlayId === id
							? (overlays[0]?.id ?? null)
							: state.selectedOverlayId
				};
			}),
		setSelectedOverlayId: id => set({ selectedOverlayId: id }),
		setBackgroundImageSceneOverride: (assetId, sceneId) =>
			set(state => ({
				backgroundImages: state.backgroundImages.map(image =>
					image.assetId === assetId
						? { ...image, sceneOverrideId: sceneId }
						: image
				)
			})),
		resetSceneBindings: () =>
			set(state => ({
				activeScenePresetId: DEFAULT_STATE.activeScenePresetId,
				backgroundImages: state.backgroundImages.map(img => ({
					...img,
					sceneOverrideId: null
				}))
			})),
	} satisfies Partial<WallpaperStore>;
}
