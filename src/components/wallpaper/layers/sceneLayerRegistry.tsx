import type { ReactElement } from 'react'
import type { SceneLayer } from '@/types/layers'
import ParticlesBackground from '@/components/wallpaper/ParticlesBackground'
import ParticlesForeground from '@/components/wallpaper/ParticlesForeground'
import RainLayer from '@/components/wallpaper/RainLayer'

type SceneLayerRenderer<T extends SceneLayer = SceneLayer> = (layer: T) => ReactElement | null

const registry: Partial<Record<SceneLayer['type'], SceneLayerRenderer>> = {
  'particle-background': (layer) => <ParticlesBackground renderOrder={layer.zIndex} />,
  'particle-foreground': (layer) => <ParticlesForeground renderOrder={layer.zIndex} />,
  rain: (layer) => <RainLayer renderOrder={layer.zIndex} />,
  fx: () => null,
}

export function renderSceneLayer(layer: SceneLayer): ReactElement | null {
  if (!layer.enabled) return null
  const renderer = registry[layer.type]
  if (!renderer) return null
  return renderer(layer)
}
