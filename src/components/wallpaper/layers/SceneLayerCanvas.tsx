import { Suspense, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import type { SceneLayer } from '@/types/layers'
import { renderSceneLayer } from '@/components/wallpaper/layers/sceneLayerRegistry'
import ParallaxController from '@/components/wallpaper/ParallaxController'
import { useWallpaperStore } from '@/store/wallpaperStore'

export default function SceneLayerCanvas({ layer }: { layer: SceneLayer }) {
  const groupRef = useRef<THREE.Group>(null)
  const {
    filterTarget,
    filterBrightness,
    filterContrast,
    filterSaturation,
    filterBlur,
    filterHueRotate,
  } = useWallpaperStore()

  if (!layer.enabled) return null

  const filterActive = layer.type === 'background-image' && (
    filterTarget === 'background' || filterTarget === 'all-images'
  )
  const canvasFilter = filterActive
    ? `brightness(${filterBrightness}) contrast(${filterContrast}) saturate(${filterSaturation}) blur(${filterBlur}px) hue-rotate(${filterHueRotate}deg)`
    : 'none'

  return (
    <Canvas
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: layer.zIndex,
        filter: canvasFilter,
      }}
      gl={{ antialias: false, alpha: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
      }}
      camera={{ position: [0, 0, 1], fov: 75 }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        <ParallaxController groupRef={groupRef}>
          <group ref={groupRef}>
            {renderSceneLayer(layer)}
          </group>
        </ParallaxController>
      </Suspense>
    </Canvas>
  )
}
