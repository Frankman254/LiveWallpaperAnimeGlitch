import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioData } from '@/hooks/useAudioData'
import vertexShader from '@/shaders/backgroundVertex.glsl'
import fragmentShader from '@/shaders/backgroundFragment.glsl'

export default function BackgroundPlane() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()
  const {
    glitchIntensity, rgbShift, scanlineIntensity, imageUrl, audioSensitivity,
    imageScale, imagePositionX, imagePositionY, imageBassReactive, imageBassScaleIntensity,
  } = useWallpaperStore()
  const { getAmplitude, getBands } = useAudioData()

  const texture = useMemo(() => {
    if (!imageUrl) return null
    const tex = new THREE.TextureLoader().load(imageUrl)
    tex.premultiplyAlpha = false
    return tex
  }, [imageUrl])

  const uniforms = useMemo(
    () => ({
      tImage: { value: texture },
      uTime: { value: 0 },
      uGlitchIntensity: { value: glitchIntensity },
      uRgbShift: { value: rgbShift },
      uScanlineIntensity: { value: scanlineIntensity },
      uHasImage: { value: !!texture },
      uImageScale: { value: imageScale },
      uImageOffsetX: { value: imagePositionX },
      uImageOffsetY: { value: imagePositionY },
      uImageBassBoost: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.ShaderMaterial
    const amplitude = getAmplitude()
    const bass = getBands().bass

    mat.uniforms.uTime.value = clock.getElapsedTime()
    mat.uniforms.uGlitchIntensity.value = glitchIntensity + amplitude * audioSensitivity * 0.4
    mat.uniforms.uRgbShift.value = rgbShift + amplitude * audioSensitivity * 0.008
    mat.uniforms.uScanlineIntensity.value = scanlineIntensity
    mat.uniforms.tImage.value = texture
    mat.uniforms.uHasImage.value = !!texture
    mat.uniforms.uImageScale.value = imageScale
    mat.uniforms.uImageOffsetX.value = imagePositionX
    mat.uniforms.uImageOffsetY.value = imagePositionY
    mat.uniforms.uImageBassBoost.value = imageBassReactive
      ? bass * audioSensitivity * imageBassScaleIntensity
      : 0
  })

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  )
}
