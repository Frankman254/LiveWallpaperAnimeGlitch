import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioData } from '@/hooks/useAudioData'
import { randomBetween } from '@/lib/math'
import { PARTICLE_LIMITS } from '@/lib/constants'
import vertexShader from '@/shaders/particleVertex.glsl'
import fragmentShader from '@/shaders/particleFragment.glsl'

const PARTICLE_SHAPE_INDEX: Record<string, number> = {
  circles: 0,
  squares: 1,
  triangles: 2,
  stars: 3,
  plus: 4,
  minus: 5,
  diamonds: 6,
  cross: 7,
  all: 8,
}

function hexToVec3(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}

export default function ParticlesBackground() {
  const pointsRef = useRef<THREE.Points>(null)
  const {
    particleCount,
    particleSpeed,
    particleColor1,
    particleColor2,
    particleColorMode,
    particleShape,
    particleSizeMin,
    particleSizeMax,
    particleOpacity,
    particleGlow,
    particleGlowStrength,
    particleAudioReactive,
    particleAudioSizeBoost,
    particleAudioOpacityBoost,
    particleFadeInOut,
    performanceMode,
  } = useWallpaperStore()
  const { getAmplitude } = useAudioData()

  const count = Math.min(particleCount, PARTICLE_LIMITS[performanceMode])

  const { positions, velocities, sizes, colors, offsets, lives, lifeSpeeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    const offsets = new Float32Array(count)
    const lives = new Float32Array(count)
    const lifeSpeeds = new Float32Array(count)
    const c1 = hexToVec3(particleColor1)
    const c2 = hexToVec3(particleColor2)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = randomBetween(-2, 2)
      positions[i * 3 + 1] = randomBetween(-1, 1)
      positions[i * 3 + 2] = randomBetween(-0.3, 0)
      velocities[i * 3] = randomBetween(-0.0008, 0.0008)
      velocities[i * 3 + 1] = randomBetween(-0.0008, 0.0008)
      sizes[i] = randomBetween(particleSizeMin, particleSizeMax)
      offsets[i] = randomBetween(0, Math.PI * 2)
      lives[i] = randomBetween(0, 1) // stagger so they don't all fade together
      lifeSpeeds[i] = randomBetween(0.003, 0.012)

      const t = particleColorMode === 'random' ? Math.random() : i / count
      if (particleColorMode === 'solid') {
        colors[i * 3] = c1[0]; colors[i * 3 + 1] = c1[1]; colors[i * 3 + 2] = c1[2]
      } else {
        colors[i * 3] = c1[0] + (c2[0] - c1[0]) * t
        colors[i * 3 + 1] = c1[1] + (c2[1] - c1[1]) * t
        colors[i * 3 + 2] = c1[2] + (c2[2] - c1[2]) * t
      }
    }
    return { positions, velocities, sizes, colors, offsets, lives, lifeSpeeds }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, particleColor1, particleColor2, particleColorMode, particleSizeMin, particleSizeMax])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: particleOpacity },
    uGlowStrength: { value: 0 },
    uAmplitude: { value: 0 },
    uAudioSizeBoost: { value: particleAudioSizeBoost },
    uAudioOpacityBoost: { value: particleAudioOpacityBoost },
    uAudioReactive: { value: particleAudioReactive },
    uFadeInOut: { value: particleFadeInOut },
    uShape: { value: PARTICLE_SHAPE_INDEX[particleShape] ?? 0 },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [])

  useFrame(({ clock }, dt) => {
    if (!pointsRef.current) return
    const mat = pointsRef.current.material as THREE.ShaderMaterial
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array
    const lifeArr = pointsRef.current.geometry.attributes.aLife.array as Float32Array

    const amplitude = getAmplitude()
    mat.uniforms.uTime.value = clock.getElapsedTime()
    mat.uniforms.uOpacity.value = particleOpacity
    mat.uniforms.uGlowStrength.value = particleGlow ? particleGlowStrength : 0
    mat.uniforms.uAmplitude.value = amplitude
    mat.uniforms.uAudioSizeBoost.value = particleAudioSizeBoost
    mat.uniforms.uAudioOpacityBoost.value = particleAudioOpacityBoost
    mat.uniforms.uAudioReactive.value = particleAudioReactive
    mat.uniforms.uFadeInOut.value = particleFadeInOut
    mat.uniforms.uShape.value = PARTICLE_SHAPE_INDEX[particleShape] ?? 0

    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i * 3] * particleSpeed
      pos[i * 3 + 1] += velocities[i * 3 + 1] * particleSpeed
      if (pos[i * 3] > 2.1) pos[i * 3] = -2.1
      if (pos[i * 3] < -2.1) pos[i * 3] = 2.1
      if (pos[i * 3 + 1] > 1.1) pos[i * 3 + 1] = -1.1
      if (pos[i * 3 + 1] < -1.1) pos[i * 3 + 1] = 1.1

      lifeArr[i] += lifeSpeeds[i] * (60 * dt) // normalize to 60fps
      if (lifeArr[i] >= 1.0) {
        lifeArr[i] = 0
        pos[i * 3] = randomBetween(-2, 2)
        pos[i * 3 + 1] = randomBetween(-1, 1)
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.geometry.attributes.aLife.needsUpdate = true
  })

  return (
    <points ref={pointsRef} position={[0, 0, 0.02]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aColor" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aOffset" args={[offsets, 1]} />
        <bufferAttribute attach="attributes-aLife" args={[lives, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
