import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import WallpaperScene from './WallpaperScene'

export default function WallpaperCanvas() {
  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%' }}
      gl={{ antialias: false, alpha: false }}
      camera={{ position: [0, 0, 1], fov: 75 }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        <WallpaperScene />
      </Suspense>
    </Canvas>
  )
}
