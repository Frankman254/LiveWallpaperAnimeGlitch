import type { CustomPresetsMap } from './presets'

export type PerformanceMode = 'low' | 'medium' | 'high'
export type ControlPanelAnchor = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
export type AudioCaptureState = 'idle' | 'requesting' | 'active' | 'denied' | 'error' | 'no-audio-track'
export type SpectrumColorMode = 'solid' | 'gradient' | 'rainbow'
export type SpectrumBandMode = 'full' | 'bass' | 'low-mid' | 'mid' | 'high-mid' | 'treble'
export type SpectrumShape = 'bars' | 'lines' | 'wave' | 'dots'
export type SpectrumLayout = 'circular' | 'horizontal' | 'top' | 'top-inverted' | 'bottom' | 'left' | 'right' | 'center'
export type SpectrumDirection = 'clockwise' | 'counterclockwise'
export type ParticleRotationDirection = 'clockwise' | 'counterclockwise'
export type LogoBandMode = 'peak' | 'full' | 'bass' | 'mid' | 'treble'
export type ParticleColorMode = 'solid' | 'gradient' | 'rainbow'
export type ParticleLayerMode = 'background' | 'foreground' | 'both'
export type ParticleShape = 'circles' | 'squares' | 'triangles' | 'stars' | 'plus' | 'minus' | 'diamonds' | 'cross' | 'all'
export type RainParticleType = 'lines' | 'drops' | 'dots' | 'bars'
export type RainColorMode = 'solid' | 'rainbow'
export type ScanlineMode = 'always' | 'pulse' | 'burst' | 'beat'
export type GlitchStyle = 'bands' | 'blocks' | 'pixels'
export type Language = 'en' | 'es'
export type ImageFitMode = 'stretch' | 'cover' | 'contain' | 'fit-width' | 'fit-height'
export type FilterTarget = 'background' | 'selected-overlay' | 'all-images'
export type SlideshowTransitionType =
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'zoom-in'
  | 'blur-dissolve'
  | 'bars-horizontal'
  | 'bars-vertical'
  | 'rgb-shift'
  | 'distortion'
export type OverlayBlendMode = 'normal' | 'screen' | 'lighten' | 'multiply'
export type OverlayCropShape = 'rectangle' | 'rounded' | 'circle' | 'diamond'
export type BuiltInLayerId =
  | 'background-image'
  | 'slideshow'
  | 'logo'
  | 'track-title'
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
  blendMode: OverlayBlendMode
  cropShape: OverlayCropShape
  edgeFade: number
  edgeBlur: number
  edgeGlow: number
  width: number
  height: number
}

export interface BackgroundImageItem {
  assetId: string
  url: string | null
  scale: number
  positionX: number
  positionY: number
  fitMode: ImageFitMode
  mirror: boolean
  transitionType: SlideshowTransitionType
  transitionDuration: number
  transitionIntensity: number
  transitionAudioDrive: number
}

export interface ProfileSlot<T> {
  name: string
  values: T | null
}

export interface SpectrumProfileSettings {
  spectrumEnabled: boolean
  spectrumFollowLogo: boolean
  spectrumCircularClone: boolean
  spectrumSpan: number
  spectrumCloneOpacity: number
  spectrumCloneScale: number
  spectrumCloneGap: number
  spectrumCloneGlowIntensity: number
  spectrumClonePrimaryColor: string
  spectrumCloneSecondaryColor: string
  spectrumCloneColorMode: SpectrumColorMode
  spectrumCloneBarCount: number
  spectrumCloneShape: SpectrumShape
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
}

export interface LogoProfileSettings {
  logoEnabled: boolean
  logoBaseSize: number
  logoPositionX: number
  logoPositionY: number
  logoBandMode: LogoBandMode
  logoAudioSensitivity: number
  logoReactiveScaleIntensity: number
  logoReactivitySpeed: number
  logoAttack: number
  logoRelease: number
  logoMinScale: number
  logoMaxScale: number
  logoPunch: number
  logoPeakWindow: number
  logoPeakFloor: number
  logoGlowColor: string
  logoGlowBlur: number
  logoShadowEnabled: boolean
  logoShadowColor: string
  logoShadowBlur: number
  logoBackdropEnabled: boolean
  logoBackdropColor: string
  logoBackdropOpacity: number
  logoBackdropPadding: number
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
  imageMirror: boolean
  filterTarget: FilterTarget
  filterBrightness: number
  filterContrast: number
  filterSaturation: number
  filterBlur: number
  filterHueRotate: number
  globalBackgroundId: string | null
  globalBackgroundUrl: string | null
  globalBackgroundScale: number
  globalBackgroundPositionX: number
  globalBackgroundPositionY: number
  globalBackgroundFitMode: ImageFitMode
  globalBackgroundOpacity: number
  globalBackgroundBrightness: number
  globalBackgroundContrast: number
  globalBackgroundSaturation: number
  globalBackgroundBlur: number
  globalBackgroundHueRotate: number

  // Audio
  audioReactive: boolean
  audioSensitivity: number
  audioCaptureState: AudioCaptureState
  audioPaused: boolean
  motionPaused: boolean
  fftSize: number
  audioSmoothing: number
  audioTrackTitleEnabled: boolean
  audioTrackTitlePositionX: number
  audioTrackTitlePositionY: number
  audioTrackTitleFontSize: number
  audioTrackTitleWidth: number
  audioTrackTitleOpacity: number
  audioTrackTitleScrollSpeed: number
  audioTrackTitleTextColor: string
  audioTrackTitleGlowColor: string
  audioTrackTitleGlowBlur: number
  audioTrackTitleBackdropEnabled: boolean
  audioTrackTitleBackdropColor: string
  audioTrackTitleBackdropOpacity: number
  audioTrackTitleBackdropPadding: number
  audioTrackTitleFilterBrightness: number
  audioTrackTitleFilterContrast: number
  audioTrackTitleFilterSaturation: number
  audioTrackTitleFilterBlur: number
  audioTrackTitleFilterHueRotate: number

  // Spectrum
  spectrumEnabled: boolean
  spectrumFollowLogo: boolean
  spectrumCircularClone: boolean
  spectrumSpan: number
  spectrumCloneOpacity: number
  spectrumCloneScale: number
  spectrumCloneGap: number
  spectrumCloneGlowIntensity: number
  spectrumClonePrimaryColor: string
  spectrumCloneSecondaryColor: string
  spectrumCloneColorMode: SpectrumColorMode
  spectrumCloneBarCount: number
  spectrumCloneShape: SpectrumShape
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
  spectrumProfileSlots: ProfileSlot<SpectrumProfileSettings>[]

  // Logo
  logoEnabled: boolean
  logoUrl: string | null
  logoBaseSize: number
  logoPositionX: number
  logoPositionY: number
  logoBandMode: LogoBandMode
  logoAudioSensitivity: number
  logoReactiveScaleIntensity: number
  logoReactivitySpeed: number
  logoAttack: number
  logoRelease: number
  logoMinScale: number
  logoMaxScale: number
  logoPunch: number
  logoPeakWindow: number
  logoPeakFloor: number
  logoGlowColor: string
  logoGlowBlur: number
  logoShadowEnabled: boolean
  logoShadowColor: string
  logoShadowBlur: number
  logoBackdropEnabled: boolean
  logoBackdropColor: string
  logoBackdropOpacity: number
  logoBackdropPadding: number
  logoProfileSlots: ProfileSlot<LogoProfileSettings>[]

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
  particleFilterBrightness: number
  particleFilterContrast: number
  particleFilterSaturation: number
  particleFilterBlur: number
  particleFilterHueRotate: number
  particleScanlineIntensity: number
  particleScanlineSpacing: number
  particleScanlineThickness: number
  particleRotationIntensity: number
  particleRotationDirection: ParticleRotationDirection
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
  slideshowTransitionIntensity: number
  slideshowTransitionAudioDrive: number
  slideshowResetPosition: boolean
  activeImageId: string | null
  backgroundImages: BackgroundImageItem[]
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
  showFps: boolean
  controlPanelAnchor: ControlPanelAnchor
  fpsOverlayAnchor: ControlPanelAnchor
  layerZIndices: Partial<Record<BuiltInLayerId, number>>
}
