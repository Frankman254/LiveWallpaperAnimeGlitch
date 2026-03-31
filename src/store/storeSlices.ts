import type { StateCreator } from 'zustand'
import { DEFAULT_STATE } from '@/lib/constants'
import {
  buildLogoProfileName,
  buildSpectrumProfileName,
  extractLogoProfileSettings,
  extractSpectrumProfileSettings,
} from '@/lib/featureProfiles'
import {
  createCustomPresetId,
  extractPresetValues,
  resolvePreset,
} from '@/lib/presets'
import {
  applyActiveImageConfigToDefaultImages,
  buildBackgroundImageCollectionPatch,
  moveBackgroundImageItem,
  shuffleBackgroundImages,
  syncActiveBackgroundImage,
  syncStateWithActiveBackgroundImage,
} from '@/store/backgroundStoreUtils'
import type { WallpaperStore } from '@/store/wallpaperStoreTypes'
import { createBackgroundImageItem } from '@/lib/backgroundImages'

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0]
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1]
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2]

export function createBackgroundSlice(set: WallpaperSet, _get: WallpaperGet, _api: WallpaperApi) {
  return ({
  setGlitchIntensity: (v) => set({ glitchIntensity: v }),
  setGlitchBarWidth: (v) => set({ glitchBarWidth: v }),
  setGlitchDirection: (v) => set({ glitchDirection: v }),
  setGlitchFrequency: (v) => set({ glitchFrequency: v }),
  setNoiseIntensity: (v) => set({ noiseIntensity: v }),
  setGlitchAudioReactive: (v) => set({ glitchAudioReactive: v }),
  setGlitchAudioSensitivity: (v) => set({ glitchAudioSensitivity: v }),
  setRgbShift: (v) => set({ rgbShift: v }),
  setRgbShiftAudioReactive: (v) => set({ rgbShiftAudioReactive: v }),
  setRgbShiftAudioSensitivity: (v) => set({ rgbShiftAudioSensitivity: v }),
  setScanlineIntensity: (v) => set({ scanlineIntensity: v }),
  setScanlineMode: (v) => set({ scanlineMode: v }),
  setScanlineSpacing: (v) => set({ scanlineSpacing: v }),
  setScanlineThickness: (v) => set({ scanlineThickness: v }),
  setParallaxStrength: (v) => set({ parallaxStrength: v }),
  setImageUrl: (v) => set((state) => {
    if (v === null) {
      return {
        imageUrl: null,
        activeImageId: null,
      }
    }

    const match = state.backgroundImages.find((image) => image.url === v)
    if (!match) {
      return {
        imageUrl: v,
        activeImageId: null,
      }
    }

    return buildBackgroundImageCollectionPatch(state, state.backgroundImages, match.assetId)
  }),
  setImageScale: (v) => set((state) => ({ imageScale: v, ...syncActiveBackgroundImage(state, { scale: v }) })),
  setImagePositionX: (v) => set((state) => ({ imagePositionX: v, ...syncActiveBackgroundImage(state, { positionX: v }) })),
  setImagePositionY: (v) => set((state) => ({ imagePositionY: v, ...syncActiveBackgroundImage(state, { positionY: v }) })),
  setImageBassReactive: (v) => set({ imageBassReactive: v }),
  setImageBassScaleIntensity: (v) => set({ imageBassScaleIntensity: v }),
  setImageFitMode: (v) => set((state) => ({ imageFitMode: v, ...syncActiveBackgroundImage(state, { fitMode: v }) })),
  setImageMirror: (v) => set((state) => ({ imageMirror: v, ...syncActiveBackgroundImage(state, { mirror: v }) })),
  setGlobalBackgroundId: (v) => set({ globalBackgroundId: v }),
  setGlobalBackgroundUrl: (v) => set({ globalBackgroundUrl: v }),
  setGlobalBackgroundScale: (v) => set({ globalBackgroundScale: v }),
  setGlobalBackgroundPositionX: (v) => set({ globalBackgroundPositionX: v }),
  setGlobalBackgroundPositionY: (v) => set({ globalBackgroundPositionY: v }),
  setGlobalBackgroundFitMode: (v) => set({ globalBackgroundFitMode: v }),
  setGlobalBackgroundOpacity: (v) => set({ globalBackgroundOpacity: v }),
  setGlobalBackgroundBrightness: (v) => set({ globalBackgroundBrightness: v }),
  setGlobalBackgroundContrast: (v) => set({ globalBackgroundContrast: v }),
  setGlobalBackgroundSaturation: (v) => set({ globalBackgroundSaturation: v }),
  setGlobalBackgroundBlur: (v) => set({ globalBackgroundBlur: v }),
  setGlobalBackgroundHueRotate: (v) => set({ globalBackgroundHueRotate: v }),
  setFilterTarget: (v) => set({ filterTarget: v }),
  setFilterBrightness: (v) => set({ filterBrightness: v }),
  setFilterContrast: (v) => set({ filterContrast: v }),
  setFilterSaturation: (v) => set({ filterSaturation: v }),
  setFilterBlur: (v) => set({ filterBlur: v }),
  setFilterHueRotate: (v) => set({ filterHueRotate: v }),
  setGlitchStyle: (v) => set({ glitchStyle: v }),
  setSlideshowEnabled: (v) => set({ slideshowEnabled: v }),
  setSlideshowInterval: (v) => set({ slideshowInterval: v }),
  setSlideshowTransitionDuration: (v) => set((state) => ({
    slideshowTransitionDuration: v,
    ...syncActiveBackgroundImage(state, { transitionDuration: v }),
  })),
  setSlideshowTransitionType: (v) => set((state) => ({
    slideshowTransitionType: v,
    ...syncActiveBackgroundImage(state, { transitionType: v }),
  })),
  setSlideshowTransitionIntensity: (v) => set((state) => ({
    slideshowTransitionIntensity: v,
    ...syncActiveBackgroundImage(state, { transitionIntensity: v }),
  })),
  setSlideshowTransitionAudioDrive: (v) => set((state) => ({
    slideshowTransitionAudioDrive: v,
    ...syncActiveBackgroundImage(state, { transitionAudioDrive: v }),
  })),
  setSlideshowResetPosition: (v) => set({ slideshowResetPosition: v }),
  setActiveImageId: (id) => set((state) => buildBackgroundImageCollectionPatch(state, state.backgroundImages, id)),
  applyActiveImageConfigToDefaultImages: () => set((state) => applyActiveImageConfigToDefaultImages(state)),
  moveImageEntry: (id, direction) =>
    set((state) => {
      const backgroundImages = moveBackgroundImageItem(state.backgroundImages, id, direction)
      if (backgroundImages === state.backgroundImages) return state
      return buildBackgroundImageCollectionPatch(state, backgroundImages, state.activeImageId)
    }),
  shuffleImageEntries: () =>
    set((state) => {
      const backgroundImages = shuffleBackgroundImages(state.backgroundImages)
      if (backgroundImages === state.backgroundImages) return state
      return buildBackgroundImageCollectionPatch(state, backgroundImages, state.activeImageId)
    }),
  setImageUrls: (v) => set((state) => {
    if (v.length === 0) {
      return {
        imageIds: [],
        imageUrls: [],
        backgroundImages: [],
        activeImageId: null,
        imageUrl: null,
      }
    }

    const backgroundImages = state.backgroundImages
      .map((image, index) => ({
        ...image,
        url: v[index] ?? null,
      }))
      .filter((image) => image.url !== null)

    return buildBackgroundImageCollectionPatch(state, backgroundImages, state.activeImageId)
  }),
  addImageEntry: (id, url) =>
    set((state) => {
      const backgroundImage = createBackgroundImageItem(id, url)
      const backgroundImages = [...state.backgroundImages, backgroundImage]
      const nextActiveImageId = state.activeImageId ?? id
      return buildBackgroundImageCollectionPatch(state, backgroundImages, nextActiveImageId)
    }),
  removeImageEntry: (id) =>
    set((state) => {
      if (!state.backgroundImages.some((image) => image.assetId === id)) return state
      const backgroundImages = state.backgroundImages.filter((image) => image.assetId !== id)
      const nextActiveImageId = state.activeImageId === id
        ? (backgroundImages[0]?.assetId ?? null)
        : state.activeImageId
      return buildBackgroundImageCollectionPatch(state, backgroundImages, nextActiveImageId)
    }),
  addOverlay: (overlay) =>
    set((state) => ({
      overlays: [...state.overlays, overlay],
      selectedOverlayId: overlay.id,
    })),
  updateOverlay: (id, patch) =>
    set((state) => ({
      overlays: state.overlays.map((overlay) => (
        overlay.id === id ? { ...overlay, ...patch } : overlay
      )),
    })),
  removeOverlay: (id) =>
    set((state) => {
      const overlays = state.overlays.filter((overlay) => overlay.id !== id)
      return {
        overlays,
        selectedOverlayId: state.selectedOverlayId === id
          ? (overlays[0]?.id ?? null)
          : state.selectedOverlayId,
      }
    }),
  setSelectedOverlayId: (id) => set({ selectedOverlayId: id }),
  }) satisfies Partial<WallpaperStore>
}

export function createAudioSlice(set: WallpaperSet, _get: WallpaperGet, _api: WallpaperApi) {
  return ({
  setAudioReactive: (v) => set({ audioReactive: v }),
  setAudioSensitivity: (v) => set({ audioSensitivity: v }),
  setAudioCaptureState: (v) => set({ audioCaptureState: v }),
  setAudioPaused: (v) => set({ audioPaused: v }),
  setMotionPaused: (v) => set({ motionPaused: v }),
  setFftSize: (v) => set({ fftSize: v }),
  setAudioSmoothing: (v) => set({ audioSmoothing: v }),
  setAudioTrackTitleEnabled: (v) => set({ audioTrackTitleEnabled: v }),
  setAudioTrackTitleLayoutMode: (v) => set({ audioTrackTitleLayoutMode: v }),
  setAudioTrackTitleFontStyle: (v) => set({ audioTrackTitleFontStyle: v }),
  setAudioTrackTitleUppercase: (v) => set({ audioTrackTitleUppercase: v }),
  setAudioTrackTitlePositionX: (v) => set({ audioTrackTitlePositionX: v }),
  setAudioTrackTitlePositionY: (v) => set({ audioTrackTitlePositionY: v }),
  setAudioTrackTitleFontSize: (v) => set({ audioTrackTitleFontSize: v }),
  setAudioTrackTitleLetterSpacing: (v) => set({ audioTrackTitleLetterSpacing: v }),
  setAudioTrackTitleWidth: (v) => set({ audioTrackTitleWidth: v }),
  setAudioTrackTitleOpacity: (v) => set({ audioTrackTitleOpacity: v }),
  setAudioTrackTitleScrollSpeed: (v) => set({ audioTrackTitleScrollSpeed: v }),
  setAudioTrackTitleRgbShift: (v) => set({ audioTrackTitleRgbShift: v }),
  setAudioTrackTitleGlitchIntensity: (v) => set({ audioTrackTitleGlitchIntensity: v }),
  setAudioTrackTitleGlitchBarWidth: (v) => set({ audioTrackTitleGlitchBarWidth: v }),
  setAudioTrackTitleTextColor: (v) => set({ audioTrackTitleTextColor: v }),
  setAudioTrackTitleGlowColor: (v) => set({ audioTrackTitleGlowColor: v }),
  setAudioTrackTitleGlowBlur: (v) => set({ audioTrackTitleGlowBlur: v }),
  setAudioTrackTitleBackdropEnabled: (v) => set({ audioTrackTitleBackdropEnabled: v }),
  setAudioTrackTitleBackdropColor: (v) => set({ audioTrackTitleBackdropColor: v }),
  setAudioTrackTitleBackdropOpacity: (v) => set({ audioTrackTitleBackdropOpacity: v }),
  setAudioTrackTitleBackdropPadding: (v) => set({ audioTrackTitleBackdropPadding: v }),
  setAudioTrackTitleFilterBrightness: (v) => set({ audioTrackTitleFilterBrightness: v }),
  setAudioTrackTitleFilterContrast: (v) => set({ audioTrackTitleFilterContrast: v }),
  setAudioTrackTitleFilterSaturation: (v) => set({ audioTrackTitleFilterSaturation: v }),
  setAudioTrackTitleFilterBlur: (v) => set({ audioTrackTitleFilterBlur: v }),
  setAudioTrackTitleFilterHueRotate: (v) => set({ audioTrackTitleFilterHueRotate: v }),
  }) satisfies Partial<WallpaperStore>
}

export function createSpectrumSlice(set: WallpaperSet, _get: WallpaperGet, _api: WallpaperApi) {
  return ({
  setSpectrumEnabled: (v) => set({ spectrumEnabled: v }),
  setSpectrumFollowLogo: (v) => set({ spectrumFollowLogo: v }),
  setSpectrumCircularClone: (v) => set({ spectrumCircularClone: v }),
  setSpectrumSpan: (v) => set({ spectrumSpan: v }),
  setSpectrumCloneOpacity: (v) => set({ spectrumCloneOpacity: v }),
  setSpectrumCloneScale: (v) => set({ spectrumCloneScale: v }),
  setSpectrumCloneGap: (v) => set({ spectrumCloneGap: v }),
  setSpectrumCloneGlowIntensity: (v) => set({ spectrumCloneGlowIntensity: v }),
  setSpectrumClonePrimaryColor: (v) => set({ spectrumClonePrimaryColor: v }),
  setSpectrumCloneSecondaryColor: (v) => set({ spectrumCloneSecondaryColor: v }),
  setSpectrumCloneColorMode: (v) => set({ spectrumCloneColorMode: v }),
  setSpectrumCloneBarCount: (v) => set({ spectrumCloneBarCount: v }),
  setSpectrumCloneShape: (v) => set({ spectrumCloneShape: v }),
  setSpectrumRadius: (v) => set({ spectrumRadius: v }),
  setSpectrumInnerRadius: (v) => set({ spectrumInnerRadius: v }),
  setSpectrumBarCount: (v) => set({ spectrumBarCount: v }),
  setSpectrumBarWidth: (v) => set({ spectrumBarWidth: v }),
  setSpectrumMinHeight: (v) => set({ spectrumMinHeight: v }),
  setSpectrumMaxHeight: (v) => set({ spectrumMaxHeight: v }),
  setSpectrumSmoothing: (v) => set({ spectrumSmoothing: v }),
  setSpectrumOpacity: (v) => set({ spectrumOpacity: v }),
  setSpectrumGlowIntensity: (v) => set({ spectrumGlowIntensity: v }),
  setSpectrumShadowBlur: (v) => set({ spectrumShadowBlur: v }),
  setSpectrumPrimaryColor: (v) => set({ spectrumPrimaryColor: v }),
  setSpectrumSecondaryColor: (v) => set({ spectrumSecondaryColor: v }),
  setSpectrumColorMode: (v) => set({ spectrumColorMode: v }),
  setSpectrumBandMode: (v) => set({ spectrumBandMode: v }),
  setSpectrumShape: (v) => set({ spectrumShape: v }),
  setSpectrumLayout: (v) => set({ spectrumLayout: v }),
  setSpectrumDirection: (v) => set({ spectrumDirection: v }),
  setSpectrumRotationSpeed: (v) => set({ spectrumRotationSpeed: v }),
  setSpectrumMirror: (v) => set({ spectrumMirror: v }),
  setSpectrumPeakHold: (v) => set({ spectrumPeakHold: v }),
  setSpectrumPeakDecay: (v) => set({ spectrumPeakDecay: v }),
  setSpectrumPositionX: (v) => set({ spectrumPositionX: v }),
  setSpectrumPositionY: (v) => set({ spectrumPositionY: v }),
  saveSpectrumProfileSlot: (index) =>
    set((state) => {
      if (index < 0 || index >= state.spectrumProfileSlots.length) return state
      const nextSlots = state.spectrumProfileSlots.map((slot, slotIndex) => (
        slotIndex === index
          ? {
              name: buildSpectrumProfileName(state),
              values: extractSpectrumProfileSettings(state),
            }
          : slot
      ))
      return { spectrumProfileSlots: nextSlots }
    }),
  loadSpectrumProfileSlot: (index) =>
    set((state) => {
      const slot = state.spectrumProfileSlots[index]
      if (!slot?.values) return state
      return {
        ...slot.values,
        spectrumCircularClone: slot.values.spectrumCircularClone ?? DEFAULT_STATE.spectrumCircularClone,
        spectrumSpan: slot.values.spectrumSpan ?? DEFAULT_STATE.spectrumSpan,
        spectrumCloneOpacity: slot.values.spectrumCloneOpacity ?? DEFAULT_STATE.spectrumCloneOpacity,
        spectrumCloneScale: slot.values.spectrumCloneScale ?? DEFAULT_STATE.spectrumCloneScale,
        spectrumCloneGap: slot.values.spectrumCloneGap ?? DEFAULT_STATE.spectrumCloneGap,
        spectrumCloneGlowIntensity: slot.values.spectrumCloneGlowIntensity ?? DEFAULT_STATE.spectrumCloneGlowIntensity,
        spectrumClonePrimaryColor: slot.values.spectrumClonePrimaryColor ?? DEFAULT_STATE.spectrumClonePrimaryColor,
        spectrumCloneSecondaryColor: slot.values.spectrumCloneSecondaryColor ?? DEFAULT_STATE.spectrumCloneSecondaryColor,
        spectrumCloneColorMode: slot.values.spectrumCloneColorMode ?? DEFAULT_STATE.spectrumCloneColorMode,
        spectrumCloneBarCount: slot.values.spectrumCloneBarCount ?? DEFAULT_STATE.spectrumCloneBarCount,
        spectrumCloneShape: slot.values.spectrumCloneShape ?? DEFAULT_STATE.spectrumCloneShape,
      }
    }),
  }) satisfies Partial<WallpaperStore>
}

export function createLogoSlice(set: WallpaperSet, _get: WallpaperGet, _api: WallpaperApi) {
  return ({
  setLogoEnabled: (v) => set({ logoEnabled: v }),
  setLogoUrl: (v) => set({ logoUrl: v }),
  setLogoId: (v) => set({ logoId: v }),
  setLogoBaseSize: (v) => set({ logoBaseSize: v }),
  setLogoPositionX: (v) => set({ logoPositionX: v }),
  setLogoPositionY: (v) => set({ logoPositionY: v }),
  setLogoBandMode: (v) => set({ logoBandMode: v }),
  setLogoAudioSensitivity: (v) => set({ logoAudioSensitivity: v }),
  setLogoReactiveScaleIntensity: (v) => set({ logoReactiveScaleIntensity: v }),
  setLogoReactivitySpeed: (v) => set({ logoReactivitySpeed: v }),
  setLogoAttack: (v) => set({ logoAttack: v }),
  setLogoRelease: (v) => set({ logoRelease: v }),
  setLogoMinScale: (v) => set({ logoMinScale: v }),
  setLogoMaxScale: (v) => set({ logoMaxScale: v }),
  setLogoPunch: (v) => set({ logoPunch: v }),
  setLogoPeakWindow: (v) => set({ logoPeakWindow: v }),
  setLogoPeakFloor: (v) => set({ logoPeakFloor: v }),
  setLogoGlowColor: (v) => set({ logoGlowColor: v }),
  setLogoGlowBlur: (v) => set({ logoGlowBlur: v }),
  setLogoShadowEnabled: (v) => set({ logoShadowEnabled: v }),
  setLogoShadowColor: (v) => set({ logoShadowColor: v }),
  setLogoShadowBlur: (v) => set({ logoShadowBlur: v }),
  setLogoBackdropEnabled: (v) => set({ logoBackdropEnabled: v }),
  setLogoBackdropColor: (v) => set({ logoBackdropColor: v }),
  setLogoBackdropOpacity: (v) => set({ logoBackdropOpacity: v }),
  setLogoBackdropPadding: (v) => set({ logoBackdropPadding: v }),
  saveLogoProfileSlot: (index) =>
    set((state) => {
      if (index < 0 || index >= state.logoProfileSlots.length) return state
      const nextSlots = state.logoProfileSlots.map((slot, slotIndex) => (
        slotIndex === index
          ? {
              name: buildLogoProfileName(state),
              values: extractLogoProfileSettings(state),
            }
          : slot
      ))
      return { logoProfileSlots: nextSlots }
    }),
  loadLogoProfileSlot: (index) =>
    set((state) => {
      const slot = state.logoProfileSlots[index]
      if (!slot?.values) return state
      return { ...slot.values }
    }),
  }) satisfies Partial<WallpaperStore>
}

export function createParticlesRainSlice(set: WallpaperSet, _get: WallpaperGet, _api: WallpaperApi) {
  return ({
  setParticlesEnabled: (v) => set({ particlesEnabled: v }),
  setParticleLayerMode: (v) => set({ particleLayerMode: v }),
  setParticleShape: (v) => set({ particleShape: v }),
  setParticleColor1: (v) => set({ particleColor1: v }),
  setParticleColor2: (v) => set({ particleColor2: v }),
  setParticleColorMode: (v) => set({ particleColorMode: v }),
  setParticleSizeMin: (v) => set({ particleSizeMin: v }),
  setParticleSizeMax: (v) => set({ particleSizeMax: v }),
  setParticleOpacity: (v) => set({ particleOpacity: v }),
  setParticleGlow: (v) => set({ particleGlow: v }),
  setParticleGlowStrength: (v) => set({ particleGlowStrength: v }),
  setParticleFilterBrightness: (v) => set({ particleFilterBrightness: v }),
  setParticleFilterContrast: (v) => set({ particleFilterContrast: v }),
  setParticleFilterSaturation: (v) => set({ particleFilterSaturation: v }),
  setParticleFilterBlur: (v) => set({ particleFilterBlur: v }),
  setParticleFilterHueRotate: (v) => set({ particleFilterHueRotate: v }),
  setParticleScanlineIntensity: (v) => set({ particleScanlineIntensity: v }),
  setParticleScanlineSpacing: (v) => set({ particleScanlineSpacing: v }),
  setParticleScanlineThickness: (v) => set({ particleScanlineThickness: v }),
  setParticleRotationIntensity: (v) => set({ particleRotationIntensity: v }),
  setParticleRotationDirection: (v) => set({ particleRotationDirection: v }),
  setParticleFadeInOut: (v) => set({ particleFadeInOut: v }),
  setParticleAudioReactive: (v) => set({ particleAudioReactive: v }),
  setParticleAudioSizeBoost: (v) => set({ particleAudioSizeBoost: v }),
  setParticleAudioOpacityBoost: (v) => set({ particleAudioOpacityBoost: v }),
  setParticleCount: (v) => set({ particleCount: v }),
  setParticleSpeed: (v) => set({ particleSpeed: v }),
  setRainEnabled: (v) => set({ rainEnabled: v }),
  setRainIntensity: (v) => set({ rainIntensity: v }),
  setRainDropCount: (v) => set({ rainDropCount: v }),
  setRainAngle: (v) => set({ rainAngle: v }),
  setRainMeshRotationZ: (v) => set({ rainMeshRotationZ: v }),
  setRainColor: (v) => set({ rainColor: v }),
  setRainColorMode: (v) => set({ rainColorMode: v }),
  setRainParticleType: (v) => set({ rainParticleType: v }),
  setRainLength: (v) => set({ rainLength: v }),
  setRainWidth: (v) => set({ rainWidth: v }),
  setRainBlur: (v) => set({ rainBlur: v }),
  setRainSpeed: (v) => set({ rainSpeed: v }),
  setRainVariation: (v) => set({ rainVariation: v }),
  }) satisfies Partial<WallpaperStore>
}

export function createSystemSlice(set: WallpaperSet, _get: WallpaperGet, _api: WallpaperApi) {
  return ({
  setPerformanceMode: (v) => set({ performanceMode: v }),
  setLanguage: (v) => set({ language: v }),
  setShowFps: (v) => set({ showFps: v }),
  setControlPanelAnchor: (v) => set({ controlPanelAnchor: v }),
  setFpsOverlayAnchor: (v) => set({ fpsOverlayAnchor: v }),
  setEditorTheme: (v) => set({ editorTheme: v }),
  setLayerZIndex: (id, zIndex) =>
    set((state) => ({
      layerZIndices: {
        ...state.layerZIndices,
        [id]: zIndex,
      },
    })),
  editorPanelOpen: false,
  editorOverlayOpen: false,
  backgroundFallbackVisible: false,
  setEditorPanelOpen: (v) => set({ editorPanelOpen: v }),
  setEditorOverlayOpen: (v) => set({ editorOverlayOpen: v }),
  setBackgroundFallbackVisible: (v) => set({ backgroundFallbackVisible: v }),
  applyPreset: (id) =>
    set((state) => {
      const preset = resolvePreset(id, state.customPresets)
      if (!preset) return state
      return syncStateWithActiveBackgroundImage(state, {
        ...preset.values,
        activePreset: preset.id,
        isPresetDirty: false,
      })
    }),
  saveCustomPreset: (name) =>
    set((state) => {
      const currentCustom = state.customPresets[state.activePreset]
      const nextName = name?.trim() || currentCustom?.name || 'Custom Preset'
      const id = currentCustom?.id ?? createCustomPresetId()

      return {
        customPresets: {
          ...state.customPresets,
          [id]: {
            id,
            name: nextName,
            values: extractPresetValues(state),
          },
        },
        activePreset: id,
        isPresetDirty: false,
      }
    }),
  duplicatePreset: (name) =>
    set((state) => {
      const source = resolvePreset(state.activePreset, state.customPresets)
      const nextName = name?.trim() || `${source?.name ?? 'Preset'} Copy`
      const id = createCustomPresetId()

      return {
        customPresets: {
          ...state.customPresets,
          [id]: {
            id,
            name: nextName,
            values: extractPresetValues(state),
          },
        },
        activePreset: id,
        isPresetDirty: false,
      }
    }),
  revertToActivePreset: () =>
    set((state) => {
      const preset = resolvePreset(state.activePreset, state.customPresets)
      if (!preset) return state
      return syncStateWithActiveBackgroundImage(state, {
        ...preset.values,
        isPresetDirty: false,
      })
    }),
  reset: () =>
    set((state) => ({
      ...DEFAULT_STATE,
      customPresets: state.customPresets,
      language: state.language,
    })),
  resetSection: (keys) =>
    set((state) => syncStateWithActiveBackgroundImage(
      state,
      Object.fromEntries(keys.map((k) => [k, DEFAULT_STATE[k]]))
    )),
  }) satisfies Partial<WallpaperStore>
}
