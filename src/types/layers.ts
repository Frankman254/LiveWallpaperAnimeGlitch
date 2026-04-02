import type {
  AudioReactiveChannel,
  ImageFitMode,
  ParticleLayerMode,
  ParticleShape,
  RainColorMode,
  RainParticleType,
  SlideshowTransitionType,
  SpectrumLinearOrientation,
  SpectrumMode,
  SpectrumRadialShape,
  SpectrumShape,
  OverlayCropShape,
} from '@/types/wallpaper'

export type LayerKind = 'scene' | 'overlay' | 'controller'
export type LayerType =
  | 'background-image'
  | 'slideshow'
  | 'overlay-image'
  | 'logo'
  | 'track-title'
  | 'spectrum'
  | 'particle-background'
  | 'particle-foreground'
  | 'rain'
  | 'fx'

export interface AudioReactiveLayerConfig {
  enabled: boolean
  sensitivity?: number
  channel?: AudioReactiveChannel
}

export interface BaseLayer<TType extends LayerType, TKind extends LayerKind> {
  id: string
  type: TType
  kind: TKind
  enabled: boolean
  zIndex: number
  opacity: number
  positionX: number
  positionY: number
  scale: number
  rotation: number
  blendMode: string
  locked: boolean
  draggable: boolean
  audioReactiveConfig?: AudioReactiveLayerConfig
}

export interface BackgroundImageLayer extends BaseLayer<'background-image', 'scene'> {
  imageUrl: string | null
  fitMode: ImageFitMode
  mirror: boolean
  transitionType: SlideshowTransitionType
  transitionDuration: number
  transitionIntensity: number
  transitionAudioDrive: number
}

export interface SlideshowLayer extends BaseLayer<'slideshow', 'controller'> {
  interval: number
  transitionDuration: number
  imageCount: number
}

export interface OverlayImageLayer extends BaseLayer<'overlay-image', 'overlay'> {
  assetId: string
  imageUrl: string | null
  name: string
  cropShape: OverlayCropShape
  edgeFade: number
  edgeBlur: number
  edgeGlow: number
  width: number
  height: number
}

export interface LogoLayer extends BaseLayer<'logo', 'overlay'> {
  imageUrl: string | null
  baseSize: number
}

export interface TrackTitleLayer extends BaseLayer<'track-title', 'overlay'> {
  maxWidthRatio: number
  fontSize: number
  scrollSpeed: number
}

export interface SpectrumLayer extends BaseLayer<'spectrum', 'overlay'> {
  mode: SpectrumMode
  linearOrientation: SpectrumLinearOrientation
  radialShape: SpectrumRadialShape
  style: SpectrumShape
  followLogo: boolean
}

export interface ParticleBackgroundLayer extends BaseLayer<'particle-background', 'scene'> {
  count: number
  shape: ParticleShape
  layerMode: ParticleLayerMode
}

export interface ParticleForegroundLayer extends BaseLayer<'particle-foreground', 'scene'> {
  count: number
  shape: ParticleShape
  layerMode: ParticleLayerMode
}

export interface RainLayerModel extends BaseLayer<'rain', 'scene'> {
  particleType: RainParticleType
  colorMode: RainColorMode
}

export interface FxLayer extends BaseLayer<'fx', 'scene'> {}

export type SceneLayer =
  | BackgroundImageLayer
  | ParticleBackgroundLayer
  | ParticleForegroundLayer
  | RainLayerModel
  | FxLayer

export type OverlayLayer = OverlayImageLayer | LogoLayer | TrackTitleLayer | SpectrumLayer
export type ControllerLayer = SlideshowLayer
export type WallpaperLayer = SceneLayer | OverlayLayer | ControllerLayer
