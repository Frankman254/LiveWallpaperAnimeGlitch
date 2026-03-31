import { DEFAULT_STATE } from '@/lib/constants'
import {
  createDefaultLogoProfileSlots,
  createDefaultSpectrumProfileSlots,
  normalizeProfileSlots,
} from '@/lib/featureProfiles'
import {
  buildBackgroundImageCollectionPatch,
  normalizePersistedBackgroundImages,
} from '@/store/backgroundStoreUtils'
import type { WallpaperStore } from '@/store/wallpaperStoreTypes'

export function migrateWallpaperStore(persistedState: unknown): WallpaperStore {
  const state = persistedState as Partial<WallpaperStore> | undefined
  if (!state) return persistedState as WallpaperStore

  const persistedParticleColorMode = (state as { particleColorMode?: string }).particleColorMode
  const normalizedBackgroundImages = normalizePersistedBackgroundImages(state)
  const backgroundState = buildBackgroundImageCollectionPatch(
    {
      ...DEFAULT_STATE,
      ...state,
      backgroundImages: normalizedBackgroundImages,
      activeImageId: state.activeImageId ?? normalizedBackgroundImages[0]?.assetId ?? null,
    },
    normalizedBackgroundImages,
    state.activeImageId ?? normalizedBackgroundImages[0]?.assetId ?? null
  )
  const normalizedOverlays = (state.overlays ?? []).map((overlay) => ({
    ...overlay,
    zIndex: Math.max(overlay.zIndex ?? 90, 90),
    blendMode: overlay.blendMode ?? 'normal',
    cropShape: overlay.cropShape ?? 'rectangle',
    edgeFade: overlay.edgeFade ?? 0.08,
    edgeBlur: overlay.edgeBlur ?? 0,
    edgeGlow: overlay.edgeGlow ?? 0.12,
  }))

  return {
    ...state,
    ...backgroundState,
    overlays: normalizedOverlays,
    selectedOverlayId: state.selectedOverlayId ?? null,
    layerZIndices: state.layerZIndices ?? {},
    spectrumDirection: state.spectrumDirection ?? ((state.spectrumRotationSpeed ?? 0) < 0 ? 'counterclockwise' : 'clockwise'),
    spectrumCircularClone: state.spectrumCircularClone ?? DEFAULT_STATE.spectrumCircularClone,
    spectrumRotationSpeed: state.spectrumDirection ? (state.spectrumRotationSpeed ?? 0) : Math.abs(state.spectrumRotationSpeed ?? 0),
    filterTarget: state.filterTarget ?? 'background',
    filterBrightness: state.filterBrightness ?? 1,
    filterContrast: state.filterContrast ?? 1,
    filterSaturation: state.filterSaturation ?? 1,
    filterBlur: state.filterBlur ?? 0,
    filterHueRotate: state.filterHueRotate ?? 0,
    globalBackgroundId: state.globalBackgroundId ?? DEFAULT_STATE.globalBackgroundId,
    globalBackgroundUrl: null,
    globalBackgroundScale: state.globalBackgroundScale ?? DEFAULT_STATE.globalBackgroundScale,
    globalBackgroundPositionX: state.globalBackgroundPositionX ?? DEFAULT_STATE.globalBackgroundPositionX,
    globalBackgroundPositionY: state.globalBackgroundPositionY ?? DEFAULT_STATE.globalBackgroundPositionY,
    globalBackgroundFitMode: state.globalBackgroundFitMode ?? DEFAULT_STATE.globalBackgroundFitMode,
    globalBackgroundOpacity: state.globalBackgroundOpacity ?? DEFAULT_STATE.globalBackgroundOpacity,
    globalBackgroundBrightness: state.globalBackgroundBrightness ?? DEFAULT_STATE.globalBackgroundBrightness,
    globalBackgroundContrast: state.globalBackgroundContrast ?? DEFAULT_STATE.globalBackgroundContrast,
    globalBackgroundSaturation: state.globalBackgroundSaturation ?? DEFAULT_STATE.globalBackgroundSaturation,
    globalBackgroundBlur: state.globalBackgroundBlur ?? DEFAULT_STATE.globalBackgroundBlur,
    globalBackgroundHueRotate: state.globalBackgroundHueRotate ?? DEFAULT_STATE.globalBackgroundHueRotate,
    particleColorMode: persistedParticleColorMode === 'random' ? 'rainbow' : (state.particleColorMode ?? DEFAULT_STATE.particleColorMode),
    particleFilterBrightness: state.particleFilterBrightness ?? DEFAULT_STATE.particleFilterBrightness,
    particleFilterContrast: state.particleFilterContrast ?? DEFAULT_STATE.particleFilterContrast,
    particleFilterSaturation: state.particleFilterSaturation ?? DEFAULT_STATE.particleFilterSaturation,
    particleFilterBlur: state.particleFilterBlur ?? DEFAULT_STATE.particleFilterBlur,
    particleFilterHueRotate: state.particleFilterHueRotate ?? DEFAULT_STATE.particleFilterHueRotate,
    particleScanlineIntensity: state.particleScanlineIntensity ?? DEFAULT_STATE.particleScanlineIntensity,
    particleScanlineSpacing: state.particleScanlineSpacing ?? DEFAULT_STATE.particleScanlineSpacing,
    particleScanlineThickness: state.particleScanlineThickness ?? DEFAULT_STATE.particleScanlineThickness,
    particleRotationIntensity: state.particleRotationIntensity ?? DEFAULT_STATE.particleRotationIntensity,
    particleRotationDirection: state.particleRotationDirection ?? DEFAULT_STATE.particleRotationDirection,
    logoBandMode: state.logoBandMode ?? DEFAULT_STATE.logoBandMode,
    logoPositionX: state.logoPositionX ?? DEFAULT_STATE.logoPositionX,
    logoPositionY: state.logoPositionY ?? DEFAULT_STATE.logoPositionY,
    logoPeakWindow: state.logoPeakWindow ?? DEFAULT_STATE.logoPeakWindow,
    logoPeakFloor: state.logoPeakFloor ?? DEFAULT_STATE.logoPeakFloor,
    logoProfileSlots: normalizeProfileSlots(state.logoProfileSlots, createDefaultLogoProfileSlots),
    spectrumProfileSlots: normalizeProfileSlots(state.spectrumProfileSlots, createDefaultSpectrumProfileSlots),
    audioPaused: state.audioPaused ?? DEFAULT_STATE.audioPaused,
    motionPaused: state.motionPaused ?? DEFAULT_STATE.motionPaused,
    slideshowTransitionIntensity: state.slideshowTransitionIntensity ?? DEFAULT_STATE.slideshowTransitionIntensity,
    slideshowTransitionAudioDrive: state.slideshowTransitionAudioDrive ?? DEFAULT_STATE.slideshowTransitionAudioDrive,
    showFps: state.showFps ?? DEFAULT_STATE.showFps,
    controlPanelAnchor: state.controlPanelAnchor ?? DEFAULT_STATE.controlPanelAnchor,
    fpsOverlayAnchor: state.fpsOverlayAnchor ?? DEFAULT_STATE.fpsOverlayAnchor,
  } as WallpaperStore
}

export function partializeWallpaperStore(state: WallpaperStore): Partial<WallpaperStore> {
  const {
    audioCaptureState,
    imageUrl,
    globalBackgroundUrl,
    logoUrl,
    imageUrls,
    isPresetDirty,
    editorPanelOpen,
    editorOverlayOpen,
    backgroundFallbackVisible,
    setEditorPanelOpen,
    setEditorOverlayOpen,
    setBackgroundFallbackVisible,
    ...rest
  } = state

  void audioCaptureState
  void imageUrl
  void globalBackgroundUrl
  void logoUrl
  void imageUrls
  void isPresetDirty
  void editorPanelOpen
  void editorOverlayOpen
  void backgroundFallbackVisible
  void setEditorPanelOpen
  void setEditorOverlayOpen
  void setBackgroundFallbackVisible

  return {
    ...rest,
    backgroundImages: state.backgroundImages.map((image) => ({
      ...image,
      url: null as string | null,
    })),
    overlays: state.overlays.map((overlay) => ({
      ...overlay,
      url: null as string | null,
    })),
  }
}
