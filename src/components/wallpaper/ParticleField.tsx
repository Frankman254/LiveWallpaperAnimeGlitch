import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  createAudioChannelSelectionState,
  resolveAudioChannelValue,
} from '@/lib/audio/audioChannels'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioData } from '@/hooks/useAudioData'
import { randomBetween } from '@/lib/math'
import { PARTICLE_LIMITS } from '@/lib/constants'
import vertexShader from '@/shaders/particleVertex.glsl'
import fragmentShader from '@/shaders/particleFragment.glsl'
import type { ParticleRotationDirection } from '@/types/wallpaper'

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

const PARTICLE_ROTATION_DIRECTION_INDEX: Record<ParticleRotationDirection, number> = {
  clockwise: 1,
  counterclockwise: -1,
}

function hexToVec3(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}

function hueToRgb(p: number, q: number, t: number): number {
  let nextT = t
  if (nextT < 0) nextT += 1
  if (nextT > 1) nextT -= 1
  if (nextT < 1 / 6) return p + (q - p) * 6 * nextT
  if (nextT < 1 / 2) return q
  if (nextT < 2 / 3) return p + (q - p) * (2 / 3 - nextT) * 6
  return p
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    hueToRgb(p, q, h + 1 / 3),
    hueToRgb(p, q, h),
    hueToRgb(p, q, h - 1 / 3),
  ]
}

interface ParticleFieldProps {
  renderOrder?: number
  zPosition: number
}

export default function ParticleField({ renderOrder = 10, zPosition }: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const motionTimeRef = useRef(0)
  const particleChannelSelectionRef = useRef(createAudioChannelSelectionState('instrumental'))
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
    particleScanlineIntensity,
    particleScanlineSpacing,
    particleScanlineThickness,
    particleRotationIntensity,
    particleRotationDirection,
    performanceMode,
    motionPaused,
    particleAudioChannel,
    audioSelectedChannelSmoothing,
    audioAutoKickThreshold,
    audioAutoSwitchHoldMs,
  } = useWallpaperStore()
  const { getAudioSnapshot } = useAudioData()

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
      positions[i * 3 + 2] = zPosition
      velocities[i * 3] = randomBetween(-0.0008, 0.0008)
      velocities[i * 3 + 1] = randomBetween(-0.0008, 0.0008)
      sizes[i] = randomBetween(particleSizeMin, particleSizeMax)
      offsets[i] = randomBetween(0, Math.PI * 2)
      lives[i] = randomBetween(0, 1)
      lifeSpeeds[i] = randomBetween(0.003, 0.012)

      if (particleColorMode === 'solid') {
        colors[i * 3] = c1[0]
        colors[i * 3 + 1] = c1[1]
        colors[i * 3 + 2] = c1[2]
      } else if (particleColorMode === 'rainbow') {
        const hue = (i / Math.max(count, 1) + offsets[i] / (Math.PI * 6)) % 1
        const [r, g, b] = hslToRgb(hue, 1, 0.64)
        colors[i * 3] = r
        colors[i * 3 + 1] = g
        colors[i * 3 + 2] = b
      } else {
        const t = i / Math.max(count, 1)
        colors[i * 3] = c1[0] + (c2[0] - c1[0]) * t
        colors[i * 3 + 1] = c1[1] + (c2[1] - c1[1]) * t
        colors[i * 3 + 2] = c1[2] + (c2[2] - c1[2]) * t
      }
    }

    return { positions, velocities, sizes, colors, offsets, lives, lifeSpeeds }
  }, [count, particleColor1, particleColor2, particleColorMode, particleSizeMin, particleSizeMax, zPosition])

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
    uScanlineIntensity: { value: particleScanlineIntensity },
    uScanlineSpacing: { value: particleScanlineSpacing },
    uScanlineThickness: { value: particleScanlineThickness },
    uRotationIntensity: { value: particleRotationIntensity },
    uRotationDirection: { value: PARTICLE_ROTATION_DIRECTION_INDEX[particleRotationDirection] ?? 1 },
  }), [])

  useEffect(() => {
    if (!pointsRef.current) return
    const geometry = pointsRef.current.geometry
    ;(geometry.attributes.position as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage)
    ;(geometry.attributes.aLife as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage)
  }, [count])

  useFrame((_, dt) => {
    if (!pointsRef.current) return
    if (motionPaused) return
    const mat = pointsRef.current.material as THREE.ShaderMaterial
    const pos = pointsRef.current.geometry.attributes.position.array as Float32Array
    const lifeArr = pointsRef.current.geometry.attributes.aLife.array as Float32Array

    const audio = getAudioSnapshot()
    const { value: amplitude } = resolveAudioChannelValue(
      audio.channels,
      particleAudioChannel,
      particleChannelSelectionRef.current,
      audioSelectedChannelSmoothing,
      audioAutoKickThreshold,
      audioAutoSwitchHoldMs,
      audio.timestampMs
    )
    const safeDt = Math.min(dt, 0.1)
    motionTimeRef.current += safeDt
    mat.uniforms.uTime.value = motionTimeRef.current
    mat.uniforms.uOpacity.value = particleOpacity
    mat.uniforms.uGlowStrength.value = particleGlow ? particleGlowStrength : 0
    mat.uniforms.uAmplitude.value = amplitude
    mat.uniforms.uAudioSizeBoost.value = particleAudioSizeBoost
    mat.uniforms.uAudioOpacityBoost.value = particleAudioOpacityBoost
    mat.uniforms.uAudioReactive.value = particleAudioReactive
    mat.uniforms.uFadeInOut.value = particleFadeInOut
    mat.uniforms.uShape.value = PARTICLE_SHAPE_INDEX[particleShape] ?? 0
    mat.uniforms.uScanlineIntensity.value = particleScanlineIntensity
    mat.uniforms.uScanlineSpacing.value = particleScanlineSpacing
    mat.uniforms.uScanlineThickness.value = particleScanlineThickness
    mat.uniforms.uRotationIntensity.value = particleRotationIntensity
    mat.uniforms.uRotationDirection.value = PARTICLE_ROTATION_DIRECTION_INDEX[particleRotationDirection] ?? 1

    if (particleSpeed > 0.001) {
      for (let i = 0; i < count; i++) {
        pos[i * 3] += velocities[i * 3] * particleSpeed
        pos[i * 3 + 1] += velocities[i * 3 + 1] * particleSpeed
        if (pos[i * 3] > 2.1) pos[i * 3] = -2.1
        if (pos[i * 3] < -2.1) pos[i * 3] = 2.1
        if (pos[i * 3 + 1] > 1.1) pos[i * 3 + 1] = -1.1
        if (pos[i * 3 + 1] < -1.1) pos[i * 3 + 1] = 1.1
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }

      for (let i = 0; i < count; i++) {
        lifeArr[i] += lifeSpeeds[i] * (60 * safeDt)
      if (lifeArr[i] >= 1.0) {
        lifeArr[i] = 0
        pos[i * 3] = randomBetween(-2, 2)
        pos[i * 3 + 1] = randomBetween(-1, 1)
      }
    }
    pointsRef.current.geometry.attributes.aLife.needsUpdate = true
    if (count > 0) {
      pointsRef.current.geometry.computeBoundingSphere()
    }
  })

  if (count === 0) return null

  return (
    <points ref={pointsRef} position={[0, 0, 0]} renderOrder={renderOrder} frustumCulled={false}>
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
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
