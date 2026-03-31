import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  BuiltInLayerId,
  WallpaperState,
  PerformanceMode,
  AudioCaptureState,
  SpectrumColorMode,
  SpectrumBandMode,
  SpectrumShape,
  SpectrumLayout,
  SpectrumDirection,
  LogoBandMode,
  ParticleColorMode,
  ParticleLayerMode,
  ParticleRotationDirection,
  ParticleShape,
  RainColorMode,
  RainParticleType,
  ScanlineMode,
  GlitchStyle,
  FilterTarget,
  Language,
  ImageFitMode,
  SlideshowTransitionType,
  OverlayCropShape,
  BackgroundImageItem,
  ControlPanelAnchor,
} from '@/types/wallpaper'
import { DEFAULT_STATE } from '@/lib/constants'
import {
  createBackgroundImageItem,
  getBackgroundImageRuntimePatch,
  isBackgroundImageUsingDefaultLayout,
  type BackgroundImageLayout,
} from '@/lib/backgroundImages'
import {
  buildLogoProfileName,
  buildSpectrumProfileName,
  createDefaultLogoProfileSlots,
  createDefaultSpectrumProfileSlots,
  extractLogoProfileSettings,
  extractSpectrumProfileSettings,
  normalizeProfileSlots,
} from '@/lib/featureProfiles'
import {
  createCustomPresetId,
  extractPresetValues,
  resolvePreset,
} from '@/lib/presets'

type BackgroundImageLayoutState = Pick<
  WallpaperState,
  | 'imageScale'
  | 'imagePositionX'
  | 'imagePositionY'
  | 'imageFitMode'
>

type BackgroundImageLayoutPatch = Partial<BackgroundImageLayout>

function buildBackgroundImageCollectionPatch(
  state: WallpaperState,
  backgroundImages: BackgroundImageItem[],
  requestedActiveImageId: string | null = state.activeImageId
): Partial<WallpaperState> {
  const activeImageId = requestedActiveImageId && backgroundImages.some((image) => image.assetId === requestedActiveImageId)
    ? requestedActiveImageId
    : (backgroundImages[0]?.assetId ?? null)
  const activeImage = backgroundImages.find((image) => image.assetId === activeImageId) ?? null

  return {
    backgroundImages,
    activeImageId,
    imageIds: backgroundImages.map((image) => image.assetId),
    imageUrls: backgroundImages
      .map((image) => image.url)
      .filter((url): url is string => Boolean(url)),
    ...getBackgroundImageRuntimePatch(activeImage),
  }
}

function syncActiveBackgroundImage(
  state: WallpaperState,
  patch: BackgroundImageLayoutPatch
): Partial<WallpaperState> {
  if (!state.activeImageId) return {}

  let didUpdate = false
  const backgroundImages = state.backgroundImages.map((image) => {
    if (image.assetId !== state.activeImageId) return image
    didUpdate = true
    return { ...image, ...patch }
  })

  return didUpdate ? { backgroundImages } : {}
}

function syncStateWithActiveBackgroundImage(
  state: WallpaperState,
  patch: Partial<WallpaperState>
): Partial<WallpaperState> {
  const activeImageId = patch.activeImageId ?? state.activeImageId
  const sourceImages = patch.backgroundImages ?? state.backgroundImages
  if (!activeImageId || sourceImages.length === 0) return patch

  const nextConfig: BackgroundImageLayoutPatch = {}

  if ('imageScale' in patch) nextConfig.scale = patch.imageScale ?? state.imageScale
  if ('imagePositionX' in patch) nextConfig.positionX = patch.imagePositionX ?? state.imagePositionX
  if ('imagePositionY' in patch) nextConfig.positionY = patch.imagePositionY ?? state.imagePositionY
  if ('imageFitMode' in patch) nextConfig.fitMode = patch.imageFitMode ?? state.imageFitMode

  if (Object.keys(nextConfig).length === 0) return patch

  return {
    ...patch,
    backgroundImages: sourceImages.map((image) => (
      image.assetId === activeImageId ? { ...image, ...nextConfig } : image
    )),
  }
}

function getActiveBackgroundImageLayout(state: WallpaperState): BackgroundImageLayout {
  return {
    scale: state.imageScale,
    positionX: state.imagePositionX,
    positionY: state.imagePositionY,
    fitMode: state.imageFitMode,
  }
}

type WallpaperStore = WallpaperState & {
  // FX
  setGlitchIntensity: (v: number) => void
  setGlitchFrequency: (v: number) => void
  setNoiseIntensity: (v: number) => void
  setGlitchAudioReactive: (v: boolean) => void
  setGlitchAudioSensitivity: (v: number) => void
  setRgbShift: (v: number) => void
  setRgbShiftAudioReactive: (v: boolean) => void
  setRgbShiftAudioSensitivity: (v: number) => void
  setScanlineIntensity: (v: number) => void
  setScanlineMode: (v: ScanlineMode) => void
  setScanlineSpacing: (v: number) => void
  setScanlineThickness: (v: number) => void
  setParallaxStrength: (v: number) => void
  setImageUrl: (v: string | null) => void
  setImageScale: (v: number) => void
  setImagePositionX: (v: number) => void
  setImagePositionY: (v: number) => void
  setImageBassReactive: (v: boolean) => void
  setImageBassScaleIntensity: (v: number) => void
  setImageFitMode: (v: ImageFitMode) => void
  setGlobalBackgroundId: (v: string | null) => void
  setGlobalBackgroundUrl: (v: string | null) => void
  setGlobalBackgroundScale: (v: number) => void
  setGlobalBackgroundPositionX: (v: number) => void
  setGlobalBackgroundPositionY: (v: number) => void
  setGlobalBackgroundFitMode: (v: ImageFitMode) => void
  setGlobalBackgroundOpacity: (v: number) => void
  setGlobalBackgroundBrightness: (v: number) => void
  setGlobalBackgroundContrast: (v: number) => void
  setGlobalBackgroundSaturation: (v: number) => void
  setGlobalBackgroundBlur: (v: number) => void
  setGlobalBackgroundHueRotate: (v: number) => void
  setFilterTarget: (v: FilterTarget) => void
  setFilterBrightness: (v: number) => void
  setFilterContrast: (v: number) => void
  setFilterSaturation: (v: number) => void
  setFilterBlur: (v: number) => void
  setFilterHueRotate: (v: number) => void

  // Audio
  setAudioReactive: (v: boolean) => void
  setAudioSensitivity: (v: number) => void
  setAudioCaptureState: (v: AudioCaptureState) => void
  setFftSize: (v: number) => void
  setAudioSmoothing: (v: number) => void

  // Spectrum
  setSpectrumEnabled: (v: boolean) => void
  setSpectrumFollowLogo: (v: boolean) => void
  setSpectrumRadius: (v: number) => void
  setSpectrumInnerRadius: (v: number) => void
  setSpectrumBarCount: (v: number) => void
  setSpectrumBarWidth: (v: number) => void
  setSpectrumMinHeight: (v: number) => void
  setSpectrumMaxHeight: (v: number) => void
  setSpectrumSmoothing: (v: number) => void
  setSpectrumOpacity: (v: number) => void
  setSpectrumGlowIntensity: (v: number) => void
  setSpectrumShadowBlur: (v: number) => void
  setSpectrumPrimaryColor: (v: string) => void
  setSpectrumSecondaryColor: (v: string) => void
  setSpectrumColorMode: (v: SpectrumColorMode) => void
  setSpectrumBandMode: (v: SpectrumBandMode) => void
  setSpectrumShape: (v: SpectrumShape) => void
  setSpectrumLayout: (v: SpectrumLayout) => void
  setSpectrumDirection: (v: SpectrumDirection) => void
  setSpectrumRotationSpeed: (v: number) => void
  setSpectrumMirror: (v: boolean) => void
  setSpectrumPeakHold: (v: boolean) => void
  setSpectrumPeakDecay: (v: number) => void
  setSpectrumPositionX: (v: number) => void
  setSpectrumPositionY: (v: number) => void
  saveSpectrumProfileSlot: (index: number) => void
  loadSpectrumProfileSlot: (index: number) => void

  // Glitch
  setGlitchStyle: (v: GlitchStyle) => void

  // Logo
  setLogoEnabled: (v: boolean) => void
  setLogoUrl: (v: string | null) => void
  setLogoId: (v: string | null) => void
  setLogoBaseSize: (v: number) => void
  setLogoPositionX: (v: number) => void
  setLogoPositionY: (v: number) => void
  setLogoBandMode: (v: LogoBandMode) => void
  setLogoAudioSensitivity: (v: number) => void
  setLogoReactiveScaleIntensity: (v: number) => void
  setLogoReactivitySpeed: (v: number) => void
  setLogoAttack: (v: number) => void
  setLogoRelease: (v: number) => void
  setLogoMinScale: (v: number) => void
  setLogoMaxScale: (v: number) => void
  setLogoPunch: (v: number) => void
  setLogoPeakWindow: (v: number) => void
  setLogoPeakFloor: (v: number) => void
  setLogoGlowColor: (v: string) => void
  setLogoGlowBlur: (v: number) => void
  setLogoShadowEnabled: (v: boolean) => void
  setLogoShadowColor: (v: string) => void
  setLogoShadowBlur: (v: number) => void
  setLogoBackdropEnabled: (v: boolean) => void
  setLogoBackdropColor: (v: string) => void
  setLogoBackdropOpacity: (v: number) => void
  setLogoBackdropPadding: (v: number) => void
  saveLogoProfileSlot: (index: number) => void
  loadLogoProfileSlot: (index: number) => void

  // Particles
  setParticlesEnabled: (v: boolean) => void
  setParticleLayerMode: (v: ParticleLayerMode) => void
  setParticleShape: (v: ParticleShape) => void
  setParticleColor1: (v: string) => void
  setParticleColor2: (v: string) => void
  setParticleColorMode: (v: ParticleColorMode) => void
  setParticleSizeMin: (v: number) => void
  setParticleSizeMax: (v: number) => void
  setParticleOpacity: (v: number) => void
  setParticleGlow: (v: boolean) => void
  setParticleGlowStrength: (v: number) => void
  setParticleFilterBrightness: (v: number) => void
  setParticleFilterContrast: (v: number) => void
  setParticleFilterSaturation: (v: number) => void
  setParticleFilterBlur: (v: number) => void
  setParticleFilterHueRotate: (v: number) => void
  setParticleScanlineIntensity: (v: number) => void
  setParticleScanlineSpacing: (v: number) => void
  setParticleScanlineThickness: (v: number) => void
  setParticleRotationIntensity: (v: number) => void
  setParticleRotationDirection: (v: ParticleRotationDirection) => void
  setParticleFadeInOut: (v: boolean) => void
  setParticleAudioReactive: (v: boolean) => void
  setParticleAudioSizeBoost: (v: number) => void
  setParticleAudioOpacityBoost: (v: number) => void
  setParticleCount: (v: number) => void
  setParticleSpeed: (v: number) => void

  // Rain
  setRainEnabled: (v: boolean) => void
  setRainIntensity: (v: number) => void
  setRainDropCount: (v: number) => void
  setRainAngle: (v: number) => void
  setRainMeshRotationZ: (v: number) => void
  setRainColor: (v: string) => void
  setRainColorMode: (v: RainColorMode) => void
  setRainParticleType: (v: RainParticleType) => void
  setRainLength: (v: number) => void
  setRainWidth: (v: number) => void
  setRainBlur: (v: number) => void
  setRainSpeed: (v: number) => void
  setRainVariation: (v: number) => void

  // Slideshow
  setSlideshowEnabled: (v: boolean) => void
  setSlideshowInterval: (v: number) => void
  setSlideshowTransitionDuration: (v: number) => void
  setSlideshowTransitionType: (v: SlideshowTransitionType) => void
  setSlideshowTransitionIntensity: (v: number) => void
  setSlideshowTransitionAudioDrive: (v: number) => void
  setSlideshowResetPosition: (v: boolean) => void
  setActiveImageId: (id: string | null) => void
  applyActiveImageConfigToDefaultImages: () => void
  setImageUrls: (v: string[]) => void

  // Persistence (IndexedDB)
  addImageEntry: (id: string, url: string) => void
  removeImageEntry: (id: string) => void
  addOverlay: (overlay: WallpaperState['overlays'][number]) => void
  updateOverlay: (id: string, patch: Partial<WallpaperState['overlays'][number]>) => void
  removeOverlay: (id: string) => void
  setSelectedOverlayId: (id: string | null) => void

  // System
  setPerformanceMode: (v: PerformanceMode) => void
  setLanguage: (v: Language) => void
  setShowFps: (v: boolean) => void
  setControlPanelAnchor: (v: ControlPanelAnchor) => void
  setLayerZIndex: (id: BuiltInLayerId, zIndex: number) => void
  editorPanelOpen: boolean
  editorOverlayOpen: boolean
  backgroundFallbackVisible: boolean
  setEditorPanelOpen: (v: boolean) => void
  setEditorOverlayOpen: (v: boolean) => void
  setBackgroundFallbackVisible: (v: boolean) => void
  applyPreset: (id: string) => void
  saveCustomPreset: (name?: string) => void
  duplicatePreset: (name?: string) => void
  revertToActivePreset: () => void
  reset: () => void
  resetSection: (keys: (keyof WallpaperState)[]) => void
}

export const useWallpaperStore = create<WallpaperStore>()(
  persist(
  (set) => ({
  ...DEFAULT_STATE,

  setGlitchIntensity: (v) => set({ glitchIntensity: v }),
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
  setImageScale: (v) => set((state) => ({
    imageScale: v,
    ...syncActiveBackgroundImage(state, { scale: v }),
  })),
  setImagePositionX: (v) => set((state) => ({
    imagePositionX: v,
    ...syncActiveBackgroundImage(state, { positionX: v }),
  })),
  setImagePositionY: (v) => set((state) => ({
    imagePositionY: v,
    ...syncActiveBackgroundImage(state, { positionY: v }),
  })),
  setImageBassReactive: (v) => set({
    imageBassReactive: v,
  }),
  setImageBassScaleIntensity: (v) => set({
    imageBassScaleIntensity: v,
  }),
  setImageFitMode: (v) => set((state) => ({
    imageFitMode: v,
    ...syncActiveBackgroundImage(state, { fitMode: v }),
  })),
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

  setAudioReactive: (v) => set({ audioReactive: v }),
  setAudioSensitivity: (v) => set({ audioSensitivity: v }),
  setAudioCaptureState: (v) => set({ audioCaptureState: v }),
  setFftSize: (v) => set({ fftSize: v }),
  setAudioSmoothing: (v) => set({ audioSmoothing: v }),

  setSpectrumEnabled: (v) => set({ spectrumEnabled: v }),
  setSpectrumFollowLogo: (v) => set({ spectrumFollowLogo: v }),
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
      return { ...slot.values }
    }),

  setGlitchStyle: (v) => set({ glitchStyle: v }),

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

  setSlideshowEnabled: (v) => set({ slideshowEnabled: v }),
  setSlideshowInterval: (v) => set({ slideshowInterval: v }),
  setSlideshowTransitionDuration: (v) => set({ slideshowTransitionDuration: v }),
  setSlideshowTransitionType: (v) => set({ slideshowTransitionType: v }),
  setSlideshowTransitionIntensity: (v) => set({ slideshowTransitionIntensity: v }),
  setSlideshowTransitionAudioDrive: (v) => set({ slideshowTransitionAudioDrive: v }),
  setSlideshowResetPosition: (v) => set({ slideshowResetPosition: v }),
  setActiveImageId: (id) => set((state) => (
    buildBackgroundImageCollectionPatch(state, state.backgroundImages, id)
  )),
  applyActiveImageConfigToDefaultImages: () =>
    set((state) => {
      if (!state.activeImageId) return state

      const activeLayout = getActiveBackgroundImageLayout(state)
      let didUpdate = false
      const backgroundImages = state.backgroundImages.map((image) => {
        if (image.assetId === state.activeImageId || !isBackgroundImageUsingDefaultLayout(image)) {
          return image
        }

        didUpdate = true
        return {
          ...image,
          ...activeLayout,
        }
      })

      return didUpdate
        ? buildBackgroundImageCollectionPatch(state, backgroundImages, state.activeImageId)
        : state
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

  setPerformanceMode: (v) => set({ performanceMode: v }),
  setLanguage: (v) => set({ language: v }),
  setShowFps: (v) => set({ showFps: v }),
  setControlPanelAnchor: (v) => set({ controlPanelAnchor: v }),
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
      Object.fromEntries(keys.map((k) => [k, DEFAULT_STATE[k]])) as Partial<WallpaperState>
    )),
  }),
  {
    name: 'lwag-state',
    version: 14,
    migrate: (persistedState) => {
      const state = persistedState as Partial<WallpaperStore> | undefined
      if (!state) return persistedState as unknown as WallpaperStore
      const persistedParticleColorMode = (state as { particleColorMode?: string }).particleColorMode
      const fallbackImageConfig: BackgroundImageLayoutState = {
        imageScale: state.imageScale ?? DEFAULT_STATE.imageScale,
        imagePositionX: state.imagePositionX ?? DEFAULT_STATE.imagePositionX,
        imagePositionY: state.imagePositionY ?? DEFAULT_STATE.imagePositionY,
        imageFitMode: state.imageFitMode ?? DEFAULT_STATE.imageFitMode,
      }
      const fallbackImageLayout: BackgroundImageLayout = {
        scale: fallbackImageConfig.imageScale,
        positionX: fallbackImageConfig.imagePositionX,
        positionY: fallbackImageConfig.imagePositionY,
        fitMode: fallbackImageConfig.imageFitMode,
      }
      const normalizedBackgroundImages = (state.backgroundImages?.length
        ? state.backgroundImages
        : (state.imageIds ?? []).map((assetId) => createBackgroundImageItem(assetId, null, fallbackImageLayout))
      ).map((image) => ({
        assetId: image.assetId,
        url: image.url ?? null,
        scale: image.scale ?? fallbackImageConfig.imageScale,
        positionX: image.positionX ?? fallbackImageConfig.imagePositionX,
        positionY: image.positionY ?? fallbackImageConfig.imagePositionY,
        fitMode: image.fitMode ?? fallbackImageConfig.imageFitMode,
      }))
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
        particleColorMode: persistedParticleColorMode === 'random' ? 'rainbow' : ((state.particleColorMode as typeof DEFAULT_STATE.particleColorMode | undefined) ?? DEFAULT_STATE.particleColorMode),
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
        slideshowTransitionIntensity: state.slideshowTransitionIntensity ?? DEFAULT_STATE.slideshowTransitionIntensity,
        slideshowTransitionAudioDrive: state.slideshowTransitionAudioDrive ?? DEFAULT_STATE.slideshowTransitionAudioDrive,
        showFps: state.showFps ?? DEFAULT_STATE.showFps,
        controlPanelAnchor: state.controlPanelAnchor ?? DEFAULT_STATE.controlPanelAnchor,
      } as WallpaperStore
    },
    partialize: (state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      void globalBackgroundUrl
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
    },
  }
))
