export type PerformanceMode = 'low' | 'medium' | 'high'
export type AudioCaptureState = 'idle' | 'requesting' | 'active' | 'denied' | 'error' | 'no-audio-track'
export type SpectrumColorMode = 'solid' | 'gradient' | 'rainbow'
export type SpectrumBandMode = 'full' | 'bass' | 'mid' | 'treble'
export type SpectrumShape = 'bars' | 'lines' | 'wave' | 'dots'
export type SpectrumLayout = 'circular' | 'horizontal'
export type ParticleColorMode = 'solid' | 'gradient' | 'random'
export type ParticleLayerMode = 'background' | 'foreground' | 'both'

export type WallpaperState = {
  // Background FX
  glitchIntensity: number
  rgbShift: number
  scanlineIntensity: number
  parallaxStrength: number
  imageUrl: string | null
  imageScale: number
  imagePositionX: number
  imagePositionY: number
  imageBassReactive: boolean
  imageBassScaleIntensity: number

  // Audio
  audioReactive: boolean
  audioSensitivity: number
  audioCaptureState: AudioCaptureState
  fftSize: number
  audioSmoothing: number

  // Spectrum
  spectrumEnabled: boolean
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
  spectrumRotationSpeed: number
  spectrumMirror: boolean
  spectrumPeakHold: boolean
  spectrumPeakDecay: number

  // Logo
  logoEnabled: boolean
  logoUrl: string | null
  logoBaseSize: number
  logoReactiveScaleIntensity: number
  logoReactivitySpeed: number
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

  // Rain
  rainEnabled: boolean
  rainIntensity: number

  // System
  performanceMode: PerformanceMode
  activePreset: string
}
