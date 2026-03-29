import type { ReactElement } from 'react'
import type { SceneLayer } from '@/types/layers'
import BackgroundPlane from '@/components/wallpaper/BackgroundPlane'
import ParticlesBackground from '@/components/wallpaper/ParticlesBackground'
import ParticlesForeground from '@/components/wallpaper/ParticlesForeground'
import RainLayer from '@/components/wallpaper/RainLayer'

type SceneLayerRenderer<T extends SceneLayer = SceneLayer> = (layer: T) => ReactElement | null

const registry: Partial<Record<SceneLayer['type'], SceneLayerRenderer>> = {
  'background-image': () => <BackgroundPlane />,
  'particle-background': () => <ParticlesBackground />,
  'particle-foreground': () => <ParticlesForeground />,
  rain: () => <RainLayer />,
  fx: () => null,
}

export function renderSceneLayer(layer: SceneLayer): ReactElement | null {
  if (!layer.enabled) return null
  const renderer = registry[layer.type]
  if (!renderer) return null
  return renderer(layer)
}
