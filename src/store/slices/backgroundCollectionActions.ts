import { DEFAULT_STATE } from '@/lib/constants';
import {
	loadImageDimensions,
	suggestBackgroundAutoFit
} from '@/lib/backgroundAutoFit';
import { createBackgroundImageItem } from '@/lib/backgroundImages';
import {
	buildSceneSlotActivationPatch,
	normalizeSceneSlotAgainstState
} from '@/features/scenes/sceneSlot';
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
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];

export function createBackgroundCollectionActions(
	set: WallpaperSet,
	get: WallpaperGet
) {
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
						const sceneSlot =
							match.sceneSlotId != null
								? state.sceneSlots.find(
										s => s.id === match.sceneSlotId
									)
								: undefined;
						if (sceneSlot) {
							invalidateSpectrumPresetMorph();
							const normalized = normalizeSceneSlotAgainstState(
								sceneSlot,
								state
							);
							Object.assign(
								patch,
								buildSceneSlotActivationPatch(state, normalized),
								{ activeSceneSlotId: sceneSlot.id }
							);
						} else {
							patch.activeSceneSlotId = null;
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
		moveImageEntryToIndex: (id, targetIndex) =>
			set(state => {
				const sourceIndex = state.backgroundImages.findIndex(
					image => image.assetId === id
				);
				if (sourceIndex < 0) return state;
				const clamped = Math.max(
					0,
					Math.min(state.backgroundImages.length - 1, targetIndex)
				);
				if (clamped === sourceIndex) return state;
				const next = [...state.backgroundImages];
				const [moved] = next.splice(sourceIndex, 1);
				if (!moved) return state;
				next.splice(clamped, 0, moved);
				return buildBackgroundImageCollectionPatch(
					state,
					next,
					state.activeImageId
				);
			}),
		setBackgroundImageEntryEnabled: (assetId, enabled) =>
			set(state => {
				const target = state.backgroundImages.find(
					image => image.assetId === assetId
				);
				if (!target || target.enabled === enabled) return state;
				const backgroundImages = state.backgroundImages.map(image =>
					image.assetId === assetId ? { ...image, enabled } : image
				);
				// If we just disabled the active image, jump to the next one
				// that's still enabled (and has a usable url). If none remain,
				// keep activeImageId so the user can re-enable later without
				// losing their selection context.
				let nextActiveImageId = state.activeImageId;
				if (!enabled && state.activeImageId === assetId) {
					const startIndex = backgroundImages.findIndex(
						image => image.assetId === assetId
					);
					const ordered = [
						...backgroundImages.slice(startIndex + 1),
						...backgroundImages.slice(0, startIndex)
					];
					const nextEnabled = ordered.find(
						image => image.enabled && image.url
					);
					if (nextEnabled) nextActiveImageId = nextEnabled.assetId;
				}
				return buildBackgroundImageCollectionPatch(
					state,
					backgroundImages,
					nextActiveImageId
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
		autoFitAllImages: async () => {
			const state = get();
			if (state.backgroundImages.length === 0) return;
			const viewportWidth =
				typeof window === 'undefined' ? 1920 : window.innerWidth;
			const viewportHeight =
				typeof window === 'undefined' ? 1080 : window.innerHeight;
			const nextImages = await Promise.all(
				state.backgroundImages.map(async image => {
					if (!image.url) return image;
					try {
						const { width, height } = await loadImageDimensions(image.url);
						const suggestion = suggestBackgroundAutoFit(
							viewportWidth,
							viewportHeight,
							width,
							height,
							image.bassReactive,
							image.bassIntensity
						);
						return {
							...image,
							scale: suggestion.scale,
							fitMode: suggestion.fitMode,
							positionX: suggestion.positionX,
							positionY: suggestion.positionY
						};
					} catch {
						return image;
					}
				})
			);
			set(current =>
				buildBackgroundImageCollectionPatch(
					current,
					nextImages,
					current.activeImageId
				)
			);
		},
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
		setBackgroundImageSceneSlotId: (assetId, sceneSlotId) =>
			set(state => ({
				backgroundImages: state.backgroundImages.map(image =>
					image.assetId === assetId
						? { ...image, sceneSlotId }
						: image
				)
			})),
		resetSceneSlotBindings: () =>
			set(state => ({
				activeSceneSlotId: DEFAULT_STATE.activeSceneSlotId,
				backgroundImages: state.backgroundImages.map(img => ({
					...img,
					sceneSlotId: null
				}))
			}))
	} satisfies Partial<WallpaperStore>;
}
