import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { randomBetween } from '@/lib/math'
import { PARTICLE_LIMITS } from '@/lib/constants'

export default function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null)
  const { particleCount, particleSpeed, performanceMode } = useWallpaperStore()

  const effectiveCount = Math.min(particleCount, PARTICLE_LIMITS[performanceMode])

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(effectiveCount * 3)
    const velocities = new Float32Array(effectiveCount * 3)
    for (let i = 0; i < effectiveCount; i++) {
      positions[i * 3] = randomBetween(-2, 2)
      positions[i * 3 + 1] = randomBetween(-1, 1)
      positions[i * 3 + 2] = randomBetween(-0.5, 0)
      velocities[i * 3] = randomBetween(-0.001, 0.001)
      velocities[i * 3 + 1] = randomBetween(-0.001, 0.001)
      velocities[i * 3 + 2] = 0
    }
    return { positions, velocities }
  }, [effectiveCount])

  useFrame(() => {
    if (!pointsRef.current) return
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < effectiveCount; i++) {
      pos[i * 3] += velocities[i * 3] * particleSpeed
      pos[i * 3 + 1] += velocities[i * 3 + 1] * particleSpeed
      if (pos[i * 3] > 2) pos[i * 3] = -2
      if (pos[i * 3] < -2) pos[i * 3] = 2
      if (pos[i * 3 + 1] > 1) pos[i * 3 + 1] = -1
      if (pos[i * 3 + 1] < -1) pos[i * 3 + 1] = 1
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={0x00ffff}
        size={0.005}
        sizeAttenuation
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
