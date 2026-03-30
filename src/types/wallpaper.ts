import type { CustomPresetsMap } from './presets'

export type PerformanceMode = 'low' | 'medium' | 'high'
export type AudioCaptureState = 'idle' | 'requesting' | 'active' | 'denied' | 'error' | 'no-audio-track'
export type SpectrumColorMode = 'solid' | 'gradient' | 'rainbow'
export type SpectrumBandMode = 'full' | 'bass' | 'low-mid' | 'mid' | 'high-mid' | 'treble'
export type SpectrumShape = 'bars' | 'lines' | 'wave' | 'dots'
export type SpectrumLayout = 'circular' | 'horizontal' | 'top' | 'top-inverted' | 'bottom' | 'left' | 'right' | 'center'
export type SpectrumDirection = 'clockwise' | 'counterclockwise'
export type ParticleColorMode = 'solid' | 'gradient' | 'random'
export type ParticleLayerMode = 'background' | 'foreground' | 'both'
export type ParticleShape = 'circles' | 'squares' | 'triangles' | 'stars' | 'plus' | 'minus' | 'diamonds' | 'cross' | 'all'
export type RainParticleType = 'lines' | 'drops' | 'dots' | 'bars'
export type RainColorMode = 'solid' | 'rainbow'
export type ScanlineMode = 'always' | 'pulse' | 'burst' | 'beat'
export type GlitchStyle = 'bands' | 'blocks' | 'pixels'
export type Language = 'en' | 'es'
export type ImageFitMode = 'stretch' | 'cover' | 'contain' | 'fit-width' | 'fit-height'
export type FilterTarget = 'background' | 'selected-overlay' | 'all-images'
export type SlideshowTransitionType = 'fade' | 'slide-left' | 'slide-right' | 'zoom-in' | 'blur-dissolve'
export type BuiltInLayerId =
  | 'background-image'
  | 'slideshow'
  | 'logo'
  | 'spectrum'
  | 'particle-background'
  | 'particle-foreground'
  | 'rain'
  | 'fx'

export interface OverlayImageItem {
  id: string
  assetId: string
  name: string
  url: string | null
  enabled: boolean
  zIndex: number
  positionX: number
  positionY: number
  scale: number
  rotation: number
  opacity: number
  width: number
  height: number
}

export type WallpaperState = {
  // Background FX
  glitchIntensity: number
  rgbShift: number
  scanlineIntensity: number
  scanlineMode: ScanlineMode
  scanlineSpacing: number
  scanlineThickness: number
  parallaxStrength: number
  imageUrl: string | null
  imageScale: number
  imagePositionX: number
  imagePositionY: number
  imageBassReactive: boolean
  imageBassScaleIntensity: number
  imageFitMode: ImageFitMode
  filterTarget: FilterTarget
  filterBrightness: number
  filterContrast: number
  filterSaturation: number
  filterBlur: number
  filterHueRotate: number

  // Audio
  audioReactive: boolean
  audioSensitivity: number
  audioCaptureState: AudioCaptureState
  fftSize: number
  audioSmoothing: number

  // Spectrum
  spectrumEnabled: boolean
  spectrumFollowLogo: boolean
  spectrumRadius: number
  spectrumInnerRadius: number
  spectrumBarCount: number
  spectrumBarWidth: number
  spectrumMinHeight: number
  spectrumMaxHeight: number
  spectrumSmoothing: number
  spectrumOpacity: number
  spectrumGlowIntensity: number
  spectrumShadowBlur: number
  spectrumPrimaryColor: string
  spectrumSecondaryColor: string
  spectrumColorMode: SpectrumColorMode
  spectrumBandMode: SpectrumBandMode
  spectrumShape: SpectrumShape
  spectrumLayout: SpectrumLayout
  spectrumDirection: SpectrumDirection
  spectrumRotationSpeed: number
  spectrumMirror: boolean
  spectrumPeakHold: boolean
  spectrumPeakDecay: number
  spectrumPositionX: number
  spectrumPositionY: number

  // Logo
  logoEnabled: boolean
  logoUrl: string | null
  logoBaseSize: number
  logoAudioSensitivity: number
  logoReactiveScaleIntensity: number
  logoReactivitySpeed: number
  logoAttack: number
  logoRelease: number
  logoMinScale: number
  logoMaxScale: number
  logoPunch: number
  logoGlowColor: string
  logoGlowBlur: number
  logoShadowEnabled: boolean
  logoShadowColor: string
  logoShadowBlur: number
  logoBackdropEnabled: boolean
  logoBackdropColor: string
  logoBackdropOpacity: number
  logoBackdropPadding: number

  // Particles
  particlesEnabled: boolean
  particleLayerMode: ParticleLayerMode
  particleShape: ParticleShape
  particleColor1: string
  particleColor2: string
  particleColorMode: ParticleColorMode
  particleSizeMin: number
  particleSizeMax: number
  particleOpacity: number
  particleGlow: boolean
  particleGlowStrength: number
  particleFadeInOut: boolean
  particleAudioReactive: boolean
  particleAudioSizeBoost: number
  particleAudioOpacityBoost: number
  particleCount: number
  particleSpeed: number

  // Glitch
  glitchFrequency: number
  glitchStyle: GlitchStyle
  noiseIntensity: number
  glitchAudioReactive: boolean
  glitchAudioSensitivity: number
  rgbShiftAudioReactive: boolean
  rgbShiftAudioSensitivity: number

  // Rain
  rainEnabled: boolean
  rainIntensity: number
  rainDropCount: number
  rainAngle: number
  rainMeshRotationZ: number
  rainColor: string
  rainColorMode: RainColorMode
  rainParticleType: RainParticleType
  rainLength: number
  rainWidth: number
  rainBlur: number
  rainSpeed: number
  rainVariation: number

  // Slideshow
  slideshowEnabled: boolean
  slideshowInterval: number
  slideshowTransitionDuration: number
  slideshowTransitionType: SlideshowTransitionType
  slideshowResetPosition: boolean
  imageUrls: string[]

  // Persistence (IndexedDB refs — blob URLs are reconstructed on load)
  imageIds: string[]
  logoId: string | null
  overlays: OverlayImageItem[]
  selectedOverlayId: string | null

  // System
  performanceMode: PerformanceMode
  customPresets: CustomPresetsMap
  activePreset: string
  language: Language
  isPresetDirty: boolean
  layerZIndices: Partial<Record<BuiltInLayerId, number>>
}
