import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioData } from '@/hooks/useAudioData'
import vertexShader from '@/shaders/backgroundVertex.glsl'
import fragmentShader from '@/shaders/backgroundFragment.glsl'

const FIT_MODE_INDEX: Record<string, number> = {
  stretch: 0,
  cover: 1,
  contain: 2,
  'fit-width': 3,
  'fit-height': 4,
}

export default function BackgroundPlane() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()
  const {
    glitchIntensity, glitchFrequency, rgbShift, scanlineIntensity, noiseIntensity,
    glitchAudioReactive, glitchAudioSensitivity,
    rgbShiftAudioReactive, rgbShiftAudioSensitivity,
    imageUrl, audioSensitivity,
    imageScale, imagePositionX, imagePositionY, imageBassReactive, imageBassScaleIntensity,
    imageFitMode,
    slideshowTransitionDuration,
  } = useWallpaperStore()
  const { getBands } = useAudioData()

  const texture = useMemo(() => {
    if (!imageUrl) return null
    const tex = new THREE.TextureLoader().load(imageUrl)
    tex.premultiplyAlpha = false
    return tex
  }, [imageUrl])

  // Crossfade refs
  const prevTextureRef = useRef<THREE.Texture | null>(null)
  const blendRef = useRef(1.0)
  const isTransitioningRef = useRef(false)

  useEffect(() => {
    return () => {
      prevTextureRef.current = texture
      if (texture) {
        blendRef.current = 0.0
        isTransitioningRef.current = true
      }
    }
  }, [texture])

  const uniforms = useMemo(
    () => ({
      tImage:            { value: texture },
      tImagePrev:        { value: null },
      uTime:             { value: 0 },
      uGlitchIntensity:  { value: glitchIntensity },
      uGlitchFrequency:  { value: glitchFrequency ?? 0.85 },
      uRgbShift:         { value: rgbShift },
      uScanlineIntensity:{ value: scanlineIntensity },
      uNoiseIntensity:   { value: noiseIntensity ?? 0 },
      uHasImage:         { value: !!texture },
      uHasPrevImage:     { value: false },
      uImageBlend:       { value: 1.0 },
      uImageScale:       { value: imageScale },
      uImageOffsetX:     { value: imagePositionX },
      uImageOffsetY:     { value: imagePositionY },
      uImageBassBoost:   { value: 0 },
      uImageAspect:      { value: 1.0 },
      uCanvasAspect:     { value: viewport.width / viewport.height },
      uFitMode:          { value: FIT_MODE_INDEX[imageFitMode] ?? 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useFrame(({ clock }, dt) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.ShaderMaterial
    const bass = getBands().bass

    mat.uniforms.uTime.value = clock.getElapsedTime()

    const glitchBoost = glitchAudioReactive ? bass * audioSensitivity * glitchAudioSensitivity : 0
    const rgbBoost    = rgbShiftAudioReactive ? bass * audioSensitivity * rgbShiftAudioSensitivity : 0
    mat.uniforms.uGlitchIntensity.value  = glitchIntensity + glitchBoost
    mat.uniforms.uGlitchFrequency.value  = glitchFrequency
    mat.uniforms.uRgbShift.value         = rgbShift + rgbBoost
    mat.uniforms.uScanlineIntensity.value= scanlineIntensity
    mat.uniforms.uNoiseIntensity.value   = noiseIntensity
    mat.uniforms.tImage.value            = texture
    mat.uniforms.uHasImage.value         = !!texture
    mat.uniforms.uImageScale.value       = imageScale
    mat.uniforms.uImageOffsetX.value     = imagePositionX
    mat.uniforms.uImageOffsetY.value     = imagePositionY
    mat.uniforms.uImageBassBoost.value   = imageBassReactive
      ? bass * audioSensitivity * imageBassScaleIntensity
      : 0

    // Image aspect ratio (available once texture loads)
    if (texture?.image) {
      const w = (texture.image as HTMLImageElement).naturalWidth || (texture.image as HTMLImageElement).width || 1
      const h = (texture.image as HTMLImageElement).naturalHeight || (texture.image as HTMLImageElement).height || 1
      mat.uniforms.uImageAspect.value = w / Math.max(h, 1)
    }
    mat.uniforms.uCanvasAspect.value = viewport.width / viewport.height
    mat.uniforms.uFitMode.value = FIT_MODE_INDEX[imageFitMode] ?? 1

    // Crossfade animation
    if (isTransitioningRef.current) {
      const dur = Math.max(0.1, slideshowTransitionDuration)
      blendRef.current = Math.min(1.0, blendRef.current + dt / dur)
      if (blendRef.current >= 1.0) {
        isTransitioningRef.current = false
        prevTextureRef.current = null
      }
    }
    mat.uniforms.uImageBlend.value    = blendRef.current
    mat.uniforms.tImagePrev.value     = prevTextureRef.current
    mat.uniforms.uHasPrevImage.value  = isTransitioningRef.current && !!prevTextureRef.current
  })

  return (
    <mesh ref={meshRef} renderOrder={0} scale={[viewport.width, viewport.height, 1]}>
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
