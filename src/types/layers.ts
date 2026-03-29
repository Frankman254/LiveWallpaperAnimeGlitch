import type {
  ImageFitMode,
  ParticleLayerMode,
  ParticleShape,
  RainColorMode,
  RainParticleType,
  SpectrumLayout,
  SpectrumShape,
} from '@/types/wallpaper'

export type LayerKind = 'scene' | 'overlay' | 'controller'
export type LayerType =
  | 'background-image'
  | 'slideshow'
  | 'fixed-overlay-image'
  | 'logo'
  | 'spectrum'
  | 'particle-background'
  | 'particle-foreground'
  | 'rain'
  | 'fx'

export interface AudioReactiveLayerConfig {
  enabled: boolean
  sensitivity?: number
  bandSource?: 'full' | 'bass' | 'low-mid' | 'mid' | 'high-mid' | 'treble'
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
}

export interface SlideshowLayer extends BaseLayer<'slideshow', 'controller'> {
  interval: number
  transitionDuration: number
  imageCount: number
}

export interface FixedOverlayImageLayer extends BaseLayer<'fixed-overlay-image', 'overlay'> {
  imageUrl: string | null
}

export interface LogoLayer extends BaseLayer<'logo', 'overlay'> {
  imageUrl: string | null
  baseSize: number
}

export interface SpectrumLayer extends BaseLayer<'spectrum', 'overlay'> {
  layout: SpectrumLayout
  shape: SpectrumShape
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

export interface FxLayer extends BaseLayer<'fx', 'scene'> {
  glitchEnabled: boolean
  scanlinesEnabled: boolean
}

export type SceneLayer =
  | BackgroundImageLayer
  | ParticleBackgroundLayer
  | ParticleForegroundLayer
  | RainLayerModel
  | FxLayer

export type OverlayLayer = FixedOverlayImageLayer | LogoLayer | SpectrumLayer
export type ControllerLayer = SlideshowLayer
export type WallpaperLayer = SceneLayer | OverlayLayer | ControllerLayer
