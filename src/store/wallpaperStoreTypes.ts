import type {
  AudioCaptureState,
  BuiltInLayerId,
  ControlPanelAnchor,
  FilterTarget,
  GlitchStyle,
  ImageFitMode,
  Language,
  LogoBandMode,
  ParticleColorMode,
  ParticleLayerMode,
  ParticleRotationDirection,
  ParticleShape,
  PerformanceMode,
  RainColorMode,
  RainParticleType,
  ScanlineMode,
  SlideshowTransitionType,
  SpectrumBandMode,
  SpectrumColorMode,
  SpectrumDirection,
  SpectrumLayout,
  SpectrumShape,
  WallpaperState,
} from '@/types/wallpaper'

export type WallpaperStore = WallpaperState & {
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
  setImageMirror: (v: boolean) => void
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
  setAudioPaused: (v: boolean) => void
  setMotionPaused: (v: boolean) => void
  setFftSize: (v: number) => void
  setAudioSmoothing: (v: number) => void

  // Spectrum
  setSpectrumEnabled: (v: boolean) => void
  setSpectrumFollowLogo: (v: boolean) => void
  setSpectrumCircularClone: (v: boolean) => void
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
  moveImageEntry: (id: string, direction: -1 | 1) => void
  shuffleImageEntries: () => void
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
  setFpsOverlayAnchor: (v: ControlPanelAnchor) => void
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
