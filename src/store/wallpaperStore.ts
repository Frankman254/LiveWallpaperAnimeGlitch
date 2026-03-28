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
  ParticleColorMode,
  ParticleLayerMode,
  RainParticleType,
  Language,
} from '@/types/wallpaper'
import { DEFAULT_STATE } from '@/lib/constants'
import { presets } from '@/lib/presets'
import type { PresetKey } from '@/types/presets'

type WallpaperStore = WallpaperState & {
  // FX
  setGlitchIntensity: (v: number) => void
  setRgbShift: (v: number) => void
  setScanlineIntensity: (v: number) => void
  setParallaxStrength: (v: number) => void
  setImageUrl: (v: string | null) => void
  setImageScale: (v: number) => void
  setImagePositionX: (v: number) => void
  setImagePositionY: (v: number) => void
  setImageBassReactive: (v: boolean) => void
  setImageBassScaleIntensity: (v: number) => void

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
  setSpectrumRotationSpeed: (v: number) => void
  setSpectrumMirror: (v: boolean) => void
  setSpectrumPeakHold: (v: boolean) => void
  setSpectrumPeakDecay: (v: number) => void

  // Logo
  setLogoEnabled: (v: boolean) => void
  setLogoUrl: (v: string | null) => void
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
  setRainParticleType: (v: RainParticleType) => void
  setRainLength: (v: number) => void
  setRainWidth: (v: number) => void
  setRainBlur: (v: number) => void
  setRainSpeed: (v: number) => void

  // Slideshow
  setSlideshowEnabled: (v: boolean) => void
  setSlideshowInterval: (v: number) => void
  setImageUrls: (v: string[]) => void

  // System
  setPerformanceMode: (v: PerformanceMode) => void
  setLanguage: (v: Language) => void
  applyPreset: (key: PresetKey) => void
  reset: () => void
  resetSection: (keys: (keyof WallpaperState)[]) => void
}

export const useWallpaperStore = create<WallpaperStore>()(
  persist(
  (set) => ({
  ...DEFAULT_STATE,

  setGlitchIntensity: (v) => set({ glitchIntensity: v }),
  setRgbShift: (v) => set({ rgbShift: v }),
  setScanlineIntensity: (v) => set({ scanlineIntensity: v }),
  setParallaxStrength: (v) => set({ parallaxStrength: v }),
  setImageUrl: (v) => set({ imageUrl: v }),
  setImageScale: (v) => set({ imageScale: v }),
  setImagePositionX: (v) => set({ imagePositionX: v }),
  setImagePositionY: (v) => set({ imagePositionY: v }),
  setImageBassReactive: (v) => set({ imageBassReactive: v }),
  setImageBassScaleIntensity: (v) => set({ imageBassScaleIntensity: v }),

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
  setSpectrumRotationSpeed: (v) => set({ spectrumRotationSpeed: v }),
  setSpectrumMirror: (v) => set({ spectrumMirror: v }),
  setSpectrumPeakHold: (v) => set({ spectrumPeakHold: v }),
  setSpectrumPeakDecay: (v) => set({ spectrumPeakDecay: v }),

  setLogoEnabled: (v) => set({ logoEnabled: v }),
  setLogoUrl: (v) => set({ logoUrl: v }),
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
  setRainParticleType: (v) => set({ rainParticleType: v }),
  setRainLength: (v) => set({ rainLength: v }),
  setRainWidth: (v) => set({ rainWidth: v }),
  setRainBlur: (v) => set({ rainBlur: v }),
  setRainSpeed: (v) => set({ rainSpeed: v }),

  setSlideshowEnabled: (v) => set({ slideshowEnabled: v }),
  setSlideshowInterval: (v) => set({ slideshowInterval: v }),
  setImageUrls: (v) => set({ imageUrls: v }),

  setPerformanceMode: (v) => set({ performanceMode: v }),
  setLanguage: (v) => set({ language: v }),

  applyPreset: (key) =>
    set((state) => ({
      ...state,
      ...presets[key],
      activePreset: key,
    })),

  reset: () => set({ ...DEFAULT_STATE }),

  resetSection: (keys) =>
    set(Object.fromEntries(keys.map((k) => [k, DEFAULT_STATE[k]])) as Partial<WallpaperState>),
  }),
  {
    name: 'lwag-state',
    // Exclude runtime/blob-URL fields from persistence
    partialize: (state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { audioCaptureState, imageUrl, logoUrl, imageUrls, ...rest } = state
      return rest
    },
  }
))
