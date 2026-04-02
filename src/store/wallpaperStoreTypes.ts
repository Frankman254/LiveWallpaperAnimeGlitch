import type {
  AudioCaptureState,
  AudioReactiveChannel,
  BuiltInLayerId,
  ControlPanelAnchor,
  EditorTheme,
  FilterTarget,
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
  SpectrumLinearDirection,
  SpectrumLinearOrientation,
  SpectrumMode,
  SpectrumRadialShape,
  SpectrumShape,
  TrackTitleFontStyle,
  TrackTitleLayoutMode,
  WallpaperState,
} from '@/types/wallpaper'

export type WallpaperStore = WallpaperState & {
  // FX
  setNoiseIntensity: (v: number) => void
  setRgbShift: (v: number) => void
  setRgbShiftAudioReactive: (v: boolean) => void
  setRgbShiftAudioSensitivity: (v: number) => void
  setRgbShiftAudioChannel: (v: AudioReactiveChannel) => void
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
  setImageAudioReactiveDecay: (v: number) => void
  setImageAudioChannel: (v: AudioReactiveChannel) => void
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
  setAudioChannelSmoothing: (v: number) => void
  setAudioSelectedChannelSmoothing: (v: number) => void
  setAudioAutoKickThreshold: (v: number) => void
  setAudioAutoSwitchHoldMs: (v: number) => void
  setAudioTrackTitleEnabled: (v: boolean) => void
  setAudioTrackTitleLayoutMode: (v: TrackTitleLayoutMode) => void
  setAudioTrackTitleFontStyle: (v: TrackTitleFontStyle) => void
  setAudioTrackTitleUppercase: (v: boolean) => void
  setAudioTrackTitlePositionX: (v: number) => void
  setAudioTrackTitlePositionY: (v: number) => void
  setAudioTrackTitleFontSize: (v: number) => void
  setAudioTrackTitleLetterSpacing: (v: number) => void
  setAudioTrackTitleWidth: (v: number) => void
  setAudioTrackTitleOpacity: (v: number) => void
  setAudioTrackTitleScrollSpeed: (v: number) => void
  setAudioTrackTitleRgbShift: (v: number) => void
  setAudioTrackTitleTextColor: (v: string) => void
  setAudioTrackTitleGlowColor: (v: string) => void
  setAudioTrackTitleGlowBlur: (v: number) => void
  setAudioTrackTitleBackdropEnabled: (v: boolean) => void
  setAudioTrackTitleBackdropColor: (v: string) => void
  setAudioTrackTitleBackdropOpacity: (v: number) => void
  setAudioTrackTitleBackdropPadding: (v: number) => void
  setAudioTrackTitleFilterBrightness: (v: number) => void
  setAudioTrackTitleFilterContrast: (v: number) => void
  setAudioTrackTitleFilterSaturation: (v: number) => void
  setAudioTrackTitleFilterBlur: (v: number) => void
  setAudioTrackTitleFilterHueRotate: (v: number) => void

  // Spectrum
  setSpectrumEnabled: (v: boolean) => void
  setSpectrumMode: (v: SpectrumMode) => void
  setSpectrumLinearOrientation: (v: SpectrumLinearOrientation) => void
  setSpectrumLinearDirection: (v: SpectrumLinearDirection) => void
  setSpectrumRadialShape: (v: SpectrumRadialShape) => void
  setSpectrumRadialAngle: (v: number) => void
  setSpectrumRadialFitLogo: (v: boolean) => void
  setSpectrumFollowLogo: (v: boolean) => void
  setSpectrumLogoGap: (v: number) => void
  setSpectrumCircularClone: (v: boolean) => void
  setSpectrumSpan: (v: number) => void
  setSpectrumCloneOpacity: (v: number) => void
  setSpectrumCloneScale: (v: number) => void
  setSpectrumCloneGap: (v: number) => void
  setSpectrumCloneStyle: (v: SpectrumShape) => void
  setSpectrumCloneRadialShape: (v: SpectrumRadialShape) => void
  setSpectrumCloneRadialAngle: (v: number) => void
  setSpectrumCloneBarCount: (v: number) => void
  setSpectrumCloneBarWidth: (v: number) => void
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
  setSpectrumRotationSpeed: (v: number) => void
  setSpectrumMirror: (v: boolean) => void
  setSpectrumPeakHold: (v: boolean) => void
  setSpectrumPeakDecay: (v: number) => void
  setSpectrumPositionX: (v: number) => void
  setSpectrumPositionY: (v: number) => void
  saveSpectrumProfileSlot: (index: number) => void
  loadSpectrumProfileSlot: (index: number) => void

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
  setParticleAudioChannel: (v: AudioReactiveChannel) => void
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
  setSlideshowTransitionAudioChannel: (v: AudioReactiveChannel) => void
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
  setEditorTheme: (v: EditorTheme) => void
  setLayerZIndex: (id: BuiltInLayerId, zIndex: number) => void
  backgroundFallbackVisible: boolean
  setBackgroundFallbackVisible: (v: boolean) => void
  applyPreset: (id: string) => void
  saveCustomPreset: (name?: string) => void
  duplicatePreset: (name?: string) => void
  revertToActivePreset: () => void
  reset: () => void
  resetSection: (keys: (keyof WallpaperState)[]) => void
}
