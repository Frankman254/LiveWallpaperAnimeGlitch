import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioData } from '@/hooks/useAudioData'
import { loadTexture } from '@/lib/textures'
import vertexShader from '@/shaders/backgroundVertex.glsl'
import fragmentShader from '@/shaders/backgroundFragment.glsl'

const FIT_MODE_INDEX: Record<string, number> = {
  stretch: 0,
  cover: 1,
  contain: 2,
  'fit-width': 3,
  'fit-height': 4,
}
const GLITCH_STYLE_INDEX: Record<string, number> = {
  bands: 0,
  blocks: 1,
  pixels: 2,
}
const SCANLINE_MODE_INDEX: Record<string, number> = {
  always: 0,
  pulse: 1,
  burst: 2,
  beat: 3,
}

function getTextureAspect(texture: THREE.Texture | null): number {
  const image = texture?.image as
    | { naturalWidth?: number; naturalHeight?: number; width?: number; height?: number }
    | undefined
  if (!image) return 1
  const width = image.naturalWidth || image.width || 1
  const height = image.naturalHeight || image.height || 1
  return width / Math.max(height, 1)
}

export default function BackgroundPlane({ renderOrder = 0 }: { renderOrder?: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const prevLoadedTextureRef = useRef<THREE.Texture | null>(null)
  const { viewport } = useThree()
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const {
    glitchIntensity, glitchFrequency, glitchStyle, rgbShift, scanlineIntensity, scanlineMode, scanlineSpacing, scanlineThickness, noiseIntensity,
    glitchAudioReactive, glitchAudioSensitivity,
    rgbShiftAudioReactive, rgbShiftAudioSensitivity,
    imageUrl, audioSensitivity,
    imageScale, imagePositionX, imagePositionY, imageBassReactive, imageBassScaleIntensity,
    imageFitMode,
    slideshowTransitionDuration,
  } = useWallpaperStore()
  const { getBands, getAmplitude } = useAudioData()

  useEffect(() => {
    let cancelled = false

    if (!imageUrl) {
      setTexture(null)
      return
    }

    void loadTexture(imageUrl)
      .then((loadedTexture) => {
        if (cancelled) return
        setTexture(loadedTexture)
      })
      .catch(() => {
        if (!cancelled) setTexture(null)
      })

    return () => {
      cancelled = true
    }
  }, [imageUrl])

  // Crossfade refs
  const prevTextureRef = useRef<THREE.Texture | null>(null)
  const blendRef = useRef(1.0)
  const isTransitioningRef = useRef(false)

  useEffect(() => {
    if (texture && prevLoadedTextureRef.current && prevLoadedTextureRef.current !== texture) {
      prevTextureRef.current = prevLoadedTextureRef.current
      blendRef.current = 0.0
      isTransitioningRef.current = true
    } else if (!texture) {
      prevTextureRef.current = null
      blendRef.current = 1.0
      isTransitioningRef.current = false
    }

    if (texture) {
      prevLoadedTextureRef.current = texture
    } else {
      prevLoadedTextureRef.current = null
    }
  }, [texture])

  const uniforms = useMemo(
    () => ({
      tImage:            { value: texture },
      tImagePrev:        { value: null },
      uTime:             { value: 0 },
      uGlitchIntensity:  { value: glitchIntensity },
      uGlitchFrequency:  { value: glitchFrequency ?? 0.85 },
      uGlitchStyle:      { value: GLITCH_STYLE_INDEX[glitchStyle] ?? 0 },
      uRgbShift:         { value: rgbShift },
      uScanlineIntensity:{ value: scanlineIntensity },
      uScanlineMode:     { value: SCANLINE_MODE_INDEX[scanlineMode] ?? 0 },
      uScanlineSpacing:  { value: scanlineSpacing },
      uScanlineThickness:{ value: scanlineThickness },
      uAudioLevel:       { value: 0 },
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
    const bass = getBands().bass
    const amplitude = getAmplitude()
    const totalScale = imageScale + (
      imageBassReactive ? bass * audioSensitivity * imageBassScaleIntensity : 0
    )

    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.ShaderMaterial

    mat.uniforms.uTime.value = clock.getElapsedTime()

    const glitchBoost = glitchAudioReactive ? bass * audioSensitivity * glitchAudioSensitivity : 0
    const rgbBoost    = rgbShiftAudioReactive ? bass * audioSensitivity * rgbShiftAudioSensitivity : 0
    mat.uniforms.uGlitchIntensity.value  = glitchIntensity + glitchBoost
    mat.uniforms.uGlitchFrequency.value  = glitchFrequency
    mat.uniforms.uGlitchStyle.value      = GLITCH_STYLE_INDEX[glitchStyle] ?? 0
    mat.uniforms.uRgbShift.value         = rgbShift + rgbBoost
    mat.uniforms.uScanlineIntensity.value= scanlineIntensity
    mat.uniforms.uScanlineMode.value     = SCANLINE_MODE_INDEX[scanlineMode] ?? 0
    mat.uniforms.uScanlineSpacing.value  = scanlineSpacing
    mat.uniforms.uScanlineThickness.value= scanlineThickness
    mat.uniforms.uAudioLevel.value       = amplitude * audioSensitivity
    mat.uniforms.uNoiseIntensity.value   = noiseIntensity
    mat.uniforms.tImage.value            = texture
    mat.uniforms.uHasImage.value         = !!texture
    mat.uniforms.uImageScale.value       = totalScale
    mat.uniforms.uImageOffsetX.value     = imagePositionX
    mat.uniforms.uImageOffsetY.value     = imagePositionY
    mat.uniforms.uImageBassBoost.value   = 0

    mat.uniforms.uImageAspect.value = getTextureAspect(texture)
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
    <mesh ref={meshRef} renderOrder={renderOrder} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}
