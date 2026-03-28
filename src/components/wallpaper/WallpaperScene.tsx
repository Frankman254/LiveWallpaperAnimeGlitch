import { useRef } from 'react'
import * as THREE from 'three'
import BackgroundPlane from './BackgroundPlane'
import ParticleField from './ParticleField'
import RainLayer from './RainLayer'
import ParallaxController from './ParallaxController'
import { useWallpaperStore } from '@/store/wallpaperStore'

export default function WallpaperScene() {
  const groupRef = useRef<THREE.Group>(null)
  const { rainEnabled, performanceMode } = useWallpaperStore()

  const showRain = rainEnabled && performanceMode !== 'low'

  return (
    <ParallaxController groupRef={groupRef}>
      <group ref={groupRef}>
        <BackgroundPlane />
        <ParticleField />
        {showRain && <RainLayer />}
      </group>
    </ParallaxController>
  )
}
