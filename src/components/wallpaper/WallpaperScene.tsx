import { useRef } from 'react'
import * as THREE from 'three'
import BackgroundPlane from './BackgroundPlane'
import ParticlesBackground from './ParticlesBackground'
import ParticlesForeground from './ParticlesForeground'
import RainLayer from './RainLayer'
import ParallaxController from './ParallaxController'
import { useWallpaperStore } from '@/store/wallpaperStore'

export default function WallpaperScene() {
  const groupRef = useRef<THREE.Group>(null)
  const { rainEnabled, performanceMode, particlesEnabled, particleLayerMode } = useWallpaperStore()

  const showRain = rainEnabled && performanceMode !== 'low'
  const showBg = particlesEnabled && (particleLayerMode === 'background' || particleLayerMode === 'both')
  const showFg = particlesEnabled && (particleLayerMode === 'foreground' || particleLayerMode === 'both')

  return (
    <ParallaxController groupRef={groupRef}>
      <group ref={groupRef}>
        <BackgroundPlane />
        {showBg && <ParticlesBackground />}
        {showRain && <RainLayer />}
        {showFg && <ParticlesForeground />}
      </group>
    </ParallaxController>
  )
}
