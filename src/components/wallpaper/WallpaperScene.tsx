import { useRef } from 'react'
import * as THREE from 'three'
import ParallaxController from './ParallaxController'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { buildSceneLayers } from '@/lib/layers'
import { renderSceneLayer } from '@/components/wallpaper/layers/sceneLayerRegistry'

export default function WallpaperScene() {
  const groupRef = useRef<THREE.Group>(null)
  const state = useWallpaperStore()
  const sceneLayers = buildSceneLayers(state)

  return (
    <ParallaxController groupRef={groupRef}>
      <group ref={groupRef}>
        {sceneLayers.map((layer) => (
          <group key={layer.id} renderOrder={layer.zIndex}>
            {renderSceneLayer(layer)}
          </group>
        ))}
      </group>
    </ParallaxController>
  )
}
