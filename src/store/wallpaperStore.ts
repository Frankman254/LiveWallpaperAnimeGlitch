import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  WallpaperState,
  PerformanceMode,
  AudioCaptureState,
  SpectrumColorMode,
  SpectrumBandMode,
  SpectrumShape,
  SpectrumLayout,
  SpectrumDirection,
  ParticleColorMode,
  ParticleLayerMode,
  ParticleShape,
  RainColorMode,
  RainParticleType,
  ScanlineMode,
  GlitchStyle,
  Language,
  ImageFitMode,
} from '@/types/wallpaper'
import { DEFAULT_STATE } from '@/lib/constants'
import {
  createCustomPresetId,
  extractPresetValues,
  resolvePreset,
} from '@/lib/presets'

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

  // Glitch
  setGlitchStyle: (v: GlitchStyle) => void

  // Logo
  setLogoEnabled: (v: boolean) => void
  setLogoUrl: (v: string | null) => void
  setLogoId: (v: string | null) => void
  setLogoBaseSize: (v: number) => void
  setLogoAudioSensitivity: (v: number) => void
  setLogoReactiveScaleIntensity: (v: number) => void
  setLogoReactivitySpeed: (v: number) => void
  setLogoGlowColor: (v: string) => void
  setLogoGlowBlur: (v: number) => void
  setLogoShadowEnabled: (v: boolean) => void
  setLogoShadowColor: (v: string) => void
  setLogoShadowBlur: (v: number) => void
  setLogoBackdropEnabled: (v: boolean) => void
  setLogoBackdropColor: (v: string) => void
  setLogoBackdropOpacity: (v: number) => void
  setLogoBackdropPadding: (v: number) => void

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
  setSlideshowResetPosition: (v: boolean) => void
  setImageUrls: (v: string[]) => void

  // Persistence (IndexedDB)
  addImageEntry: (id: string, url: string) => void
  removeImageEntry: (id: string) => void

  // System
  setPerformanceMode: (v: PerformanceMode) => void
  setLanguage: (v: Language) => void
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
  setImageUrl: (v) => set({ imageUrl: v }),
  setImageScale: (v) => set({ imageScale: v }),
  setImagePositionX: (v) => set({ imagePositionX: v }),
  setImagePositionY: (v) => set({ imagePositionY: v }),
  setImageBassReactive: (v) => set({ imageBassReactive: v }),
  setImageBassScaleIntensity: (v) => set({ imageBassScaleIntensity: v }),
  setImageFitMode: (v) => set({ imageFitMode: v }),

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

  setGlitchStyle: (v) => set({ glitchStyle: v }),

  setLogoEnabled: (v) => set({ logoEnabled: v }),
  setLogoUrl: (v) => set({ logoUrl: v }),
  setLogoId: (v) => set({ logoId: v }),
  setLogoBaseSize: (v) => set({ logoBaseSize: v }),
  setLogoAudioSensitivity: (v) => set({ logoAudioSensitivity: v }),
  setLogoReactiveScaleIntensity: (v) => set({ logoReactiveScaleIntensity: v }),
  setLogoReactivitySpeed: (v) => set({ logoReactivitySpeed: v }),
  setLogoGlowColor: (v) => set({ logoGlowColor: v }),
  setLogoGlowBlur: (v) => set({ logoGlowBlur: v }),
  setLogoShadowEnabled: (v) => set({ logoShadowEnabled: v }),
  setLogoShadowColor: (v) => set({ logoShadowColor: v }),
  setLogoShadowBlur: (v) => set({ logoShadowBlur: v }),
  setLogoBackdropEnabled: (v) => set({ logoBackdropEnabled: v }),
  setLogoBackdropColor: (v) => set({ logoBackdropColor: v }),
  setLogoBackdropOpacity: (v) => set({ logoBackdropOpacity: v }),
  setLogoBackdropPadding: (v) => set({ logoBackdropPadding: v }),

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
  setSlideshowResetPosition: (v) => set({ slideshowResetPosition: v }),
  setImageUrls: (v) => set({ imageUrls: v }),

  addImageEntry: (id, url) =>
    set((state) => ({
      imageIds: [...state.imageIds, id],
      imageUrls: [...state.imageUrls, url],
      imageUrl: state.imageUrl ?? url,
    })),

  removeImageEntry: (id) =>
    set((state) => {
      const idx = state.imageIds.indexOf(id)
      if (idx === -1) return state
      const newIds = state.imageIds.filter((_, i) => i !== idx)
      const removedUrl = state.imageUrls[idx]
      const newUrls = state.imageUrls.filter((_, i) => i !== idx)
      const newImageUrl = state.imageUrl === removedUrl
        ? (newUrls[0] ?? null)
        : state.imageUrl
      return { imageIds: newIds, imageUrls: newUrls, imageUrl: newImageUrl }
    }),

  setPerformanceMode: (v) => set({ performanceMode: v }),
  setLanguage: (v) => set({ language: v }),

  applyPreset: (id) =>
    set((state) => {
      const preset = resolvePreset(id, state.customPresets)
      if (!preset) return state
      return {
        ...preset.values,
        activePreset: preset.id,
        isPresetDirty: false,
      }
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
      return {
        ...preset.values,
        isPresetDirty: false,
      }
    }),

  reset: () =>
    set((state) => ({
      ...DEFAULT_STATE,
      customPresets: state.customPresets,
      language: state.language,
    })),

  resetSection: (keys) =>
    set(Object.fromEntries(keys.map((k) => [k, DEFAULT_STATE[k]])) as Partial<WallpaperState>),
  }),
  {
    name: 'lwag-state',
    version: 2,
    migrate: (persistedState) => {
      const state = persistedState as Partial<WallpaperStore> | undefined
      if (!state) return persistedState as unknown as WallpaperStore

      if (!state.spectrumDirection) {
        return {
          ...state,
          spectrumDirection: (state.spectrumRotationSpeed ?? 0) < 0 ? 'counterclockwise' : 'clockwise',
          spectrumRotationSpeed: Math.abs(state.spectrumRotationSpeed ?? 0),
        } as WallpaperStore
      }

      return state as WallpaperStore
    },
    partialize: (state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { audioCaptureState, imageUrl, logoUrl, imageUrls, isPresetDirty, ...rest } = state
      return rest
    },
  }
))
