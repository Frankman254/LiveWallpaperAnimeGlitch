import type { StateCreator } from 'zustand';
import {
	IMAGE_BASS_ZOOM_PRESETS,
	releaseToLegacyDecay,
	type ImageBassZoomPresetId
} from '@/features/presets/imageBassZoomProfiles';
import {
	buildBackgroundProfileName,
	extractBackgroundProfileSettings,
	MAX_PROFILE_SLOT_COUNT
} from '@/lib/featureProfiles';
import {
	applyActiveImageConfigToDefaultImages,
	buildBackgroundImageCollectionPatch,
	moveBackgroundImageItem,
	shuffleBackgroundImages,
	syncActiveBackgroundImage
} from '@/store/backgroundStoreUtils';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import { createBackgroundImageItem } from '@/lib/backgroundImages';

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0];
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1];
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2];

export function createBackgroundSlice(
	set: WallpaperSet,
	_get: WallpaperGet,
	_api: WallpaperApi
) {
	return {
		setNoiseIntensity: v => set({ noiseIntensity: v }),
		setRgbShift: v => set({ rgbShift: v }),
		setRgbShiftAudioReactive: v => set({ rgbShiftAudioReactive: v }),
		setRgbShiftAudioSensitivity: v => set({ rgbShiftAudioSensitivity: v }),
		setRgbShiftAudioChannel: v => set({ rgbShiftAudioChannel: v }),
		setRgbShiftAudioSmoothingEnabled: v =>
			set({ rgbShiftAudioSmoothingEnabled: v }),
		setRgbShiftAudioSmoothing: v => set({ rgbShiftAudioSmoothing: v }),
		setScanlineIntensity: v => set({ scanlineIntensity: v }),
		setScanlineMode: v => set({ scanlineMode: v }),
		setScanlineSpacing: v => set({ scanlineSpacing: v }),
		setScanlineThickness: v => set({ scanlineThickness: v }),
		setParallaxStrength: v => set({ parallaxStrength: v }),
		setImageUrl: v =>
			set(state => {
				if (v === null) {
					return {
						imageUrl: null,
						activeImageId: null
					};
				}

				const match = state.backgroundImages.find(
					image => image.url === v
				);
				if (!match) {
					return {
						imageUrl: v,
						activeImageId: null
					};
				}

				return buildBackgroundImageCollectionPatch(
					state,
					state.backgroundImages,
					match.assetId
				);
			}),
		setImageScale: v =>
			set(state => ({
				imageScale: v,
				...syncActiveBackgroundImage(state, { scale: v })
			})),
		setImagePositionX: v =>
			set(state => ({
				imagePositionX: v,
				...syncActiveBackgroundImage(state, { positionX: v })
			})),
		setImagePositionY: v =>
			set(state => ({
				imagePositionY: v,
				...syncActiveBackgroundImage(state, { positionY: v })
			})),
		setImageOpacity: v =>
			set(state => ({
				imageOpacity: v,
				...syncActiveBackgroundImage(state, { opacity: v })
			})),
		setImageBassReactive: v =>
			set(state => ({
				imageBassReactive: v,
				backgroundImages: state.backgroundImages.map(image => ({
					...image,
					bassReactive: v
				}))
			})),
		setImageAudioSmoothingEnabled: v =>
			set({ imageAudioSmoothingEnabled: v, imageBassZoomPresetId: null }),
		setImageAudioSmoothing: v =>
			set({ imageAudioSmoothing: v, imageBassZoomPresetId: null }),
		setImageOpacityReactive: v =>
			set({ imageOpacityReactive: v, imageBassZoomPresetId: null }),
		setImageOpacityReactiveAmount: v =>
			set({ imageOpacityReactiveAmount: v, imageBassZoomPresetId: null }),
		setImageBassScaleIntensity: v =>
			set(state => ({
				imageBassScaleIntensity: v,
				backgroundImages: state.backgroundImages.map(image => ({
					...image,
					bassIntensity: v
				}))
			})),
		setImageAudioReactiveDecay: v =>
			set(state => ({
				imageAudioReactiveDecay: v,
				imageBassRelease: 0.02 + (1 - v) * 0.2,
				imageBassZoomPresetId: null,
				backgroundImages: state.backgroundImages.map(image => ({
					...image,
					audioReactiveDecay: v
				}))
			})),
		applyImageBassZoomPreset: (id: ImageBassZoomPresetId) =>
			set(state => {
				const patch = IMAGE_BASS_ZOOM_PRESETS[id];
				const decay = releaseToLegacyDecay(patch.imageBassRelease);
				return {
					...patch,
					imageBassZoomPresetId: id,
					imageAudioReactiveDecay: decay,
					backgroundImages: state.backgroundImages.map(image => ({
						...image,
						audioReactiveDecay: decay
					}))
				};
			}),
		setImageBassAttack: v =>
			set({ imageBassAttack: v, imageBassZoomPresetId: null }),
		setImageBassRelease: v =>
			set(state => {
				const decay = releaseToLegacyDecay(v);
				return {
					imageBassRelease: v,
					imageAudioReactiveDecay: decay,
					imageBassZoomPresetId: null,
					backgroundImages: state.backgroundImages.map(image => ({
						...image,
						audioReactiveDecay: decay
					}))
				};
			}),
		setImageBassReactivitySpeed: v =>
			set({ imageBassReactivitySpeed: v, imageBassZoomPresetId: null }),
		setImageBassPeakWindow: v =>
			set({ imageBassPeakWindow: v, imageBassZoomPresetId: null }),
		setImageBassPeakFloor: v =>
			set({ imageBassPeakFloor: v, imageBassZoomPresetId: null }),
		setImageBassPunch: v =>
			set({ imageBassPunch: v, imageBassZoomPresetId: null }),
		setImageBassReactiveScaleIntensity: v =>
			set({
				imageBassReactiveScaleIntensity: v,
				imageBassZoomPresetId: null
			}),
		setImageAudioChannel: v =>
			set(state => ({
				imageAudioChannel: v,
				imageBassZoomPresetId: null,
				backgroundImages: state.backgroundImages.map(image => ({
					...image,
					audioChannel: v
				}))
			})),
		addBackgroundProfileSlot: () =>
			set(state => {
				if (
					state.backgroundProfileSlots.length >=
					MAX_PROFILE_SLOT_COUNT
				)
					return state;
				return {
					backgroundProfileSlots: [
						...state.backgroundProfileSlots,
						{
							name: `BG ${state.backgroundProfileSlots.length + 1}`,
							values: null
						}
					]
				};
			}),
		removeBackgroundProfileSlot: index =>
			set(state => {
				if (index < 3 || index >= state.backgroundProfileSlots.length)
					return state;
				return {
					backgroundProfileSlots: state.backgroundProfileSlots.filter(
						(_, slotIndex) => slotIndex !== index
					)
				};
			}),
		saveBackgroundProfileSlot: index =>
			set(state => {
				if (index < 0 || index >= state.backgroundProfileSlots.length)
					return state;
				const nextSlots = state.backgroundProfileSlots.map(
					(slot, slotIndex) =>
						slotIndex === index
							? {
									name: buildBackgroundProfileName(state),
									values: extractBackgroundProfileSettings(
										state
									)
								}
							: slot
				);
				return { backgroundProfileSlots: nextSlots };
			}),
		loadBackgroundProfileSlot: index =>
			set(state => {
				const slot = state.backgroundProfileSlots[index];
				if (!slot?.values) return state;

				return {
					...slot.values,
					imageBassZoomPresetId: null,
					backgroundImages: state.backgroundImages.map(image => ({
						...image,
						bassReactive:
							slot.values?.imageBassReactive ??
							state.imageBassReactive,
						bassIntensity:
							slot.values?.imageBassScaleIntensity ??
							state.imageBassScaleIntensity,
						audioReactiveDecay:
							slot.values?.imageAudioReactiveDecay ??
							state.imageAudioReactiveDecay,
						audioChannel:
							slot.values?.imageAudioChannel ??
							state.imageAudioChannel
					}))
				};
			}),
		setImageFitMode: v =>
			set(state => ({
				imageFitMode: v,
				...syncActiveBackgroundImage(state, { fitMode: v })
			})),
		setImageMirror: v =>
			set(state => ({
				imageMirror: v,
				...syncActiveBackgroundImage(state, { mirror: v })
			})),
		setBackgroundImageEnabled: v => set({ backgroundImageEnabled: v }),
		setShowBackgroundScaleMeter: v => set({ showBackgroundScaleMeter: v }),
		setGlobalBackgroundEnabled: v => set({ globalBackgroundEnabled: v }),
		setGlobalBackgroundId: v => set({ globalBackgroundId: v }),
		setGlobalBackgroundUrl: v => set({ globalBackgroundUrl: v }),
		setGlobalBackgroundScale: v => set({ globalBackgroundScale: v }),
		setGlobalBackgroundPositionX: v =>
			set({ globalBackgroundPositionX: v }),
		setGlobalBackgroundPositionY: v =>
			set({ globalBackgroundPositionY: v }),
		setGlobalBackgroundFitMode: v => set({ globalBackgroundFitMode: v }),
		setGlobalBackgroundOpacity: v => set({ globalBackgroundOpacity: v }),
		setGlobalBackgroundBrightness: v =>
			set({ globalBackgroundBrightness: v }),
		setGlobalBackgroundContrast: v => set({ globalBackgroundContrast: v }),
		setGlobalBackgroundSaturation: v =>
			set({ globalBackgroundSaturation: v }),
		setGlobalBackgroundBlur: v => set({ globalBackgroundBlur: v }),
		setGlobalBackgroundHueRotate: v =>
			set({ globalBackgroundHueRotate: v }),
		setFilterTargets: v => set({ filterTargets: v }),
		toggleFilterTarget: target =>
			set(state => ({
				filterTargets: state.filterTargets.includes(target)
					? state.filterTargets.filter(item => item !== target)
					: [...state.filterTargets, target]
			})),
		setFilterOpacity: v => set({ filterOpacity: v }),
		setFilterBrightness: v => set({ filterBrightness: v }),
		setFilterContrast: v => set({ filterContrast: v }),
		setFilterSaturation: v => set({ filterSaturation: v }),
		setFilterBlur: v => set({ filterBlur: v }),
		setFilterHueRotate: v => set({ filterHueRotate: v }),
		setSlideshowEnabled: v => set({ slideshowEnabled: v }),
		setSlideshowInterval: v => set({ slideshowInterval: v }),
		setSlideshowTransitionDuration: v =>
			set(state => ({
				slideshowTransitionDuration: v,
				...syncActiveBackgroundImage(state, { transitionDuration: v })
			})),
		setSlideshowTransitionType: v =>
			set(state => ({
				slideshowTransitionType: v,
				...syncActiveBackgroundImage(state, { transitionType: v })
			})),
		setSlideshowTransitionIntensity: v =>
			set(state => ({
				slideshowTransitionIntensity: v,
				...syncActiveBackgroundImage(state, { transitionIntensity: v })
			})),
		setSlideshowTransitionAudioDrive: v =>
			set(state => ({
				slideshowTransitionAudioDrive: v,
				...syncActiveBackgroundImage(state, { transitionAudioDrive: v })
			})),
		setSlideshowTransitionAudioChannel: v =>
			set(state => ({
				slideshowTransitionAudioChannel: v,
				...syncActiveBackgroundImage(state, {
					transitionAudioChannel: v
				})
			})),
		setSlideshowResetPosition: v => set({ slideshowResetPosition: v }),
		setActiveImageId: id =>
			set(state =>
				buildBackgroundImageCollectionPatch(
					state,
					state.backgroundImages,
					id
				)
			),
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
		addImageEntry: (id, url) =>
			set(state => {
				const backgroundImage = createBackgroundImageItem(id, url);
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
		setSelectedOverlayId: id => set({ selectedOverlayId: id })
	} satisfies Partial<WallpaperStore>;
}
