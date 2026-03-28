import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useWallpaperStore } from '@/store/wallpaperStore'
import vertexShader from '@/shaders/rainVertex.glsl'
import fragmentShader from '@/shaders/rainOverlayFragment.glsl'

export default function RainLayer() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()
  const { rainIntensity } = useWallpaperStore()

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRainIntensity: { value: rainIntensity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.ShaderMaterial
    mat.uniforms.uTime.value = clock.getElapsedTime()
    mat.uniforms.uRainIntensity.value = rainIntensity
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0.1]} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}
