import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioData } from '@/hooks/useAudioData'
import { loadTexture } from '@/lib/textures'
import { clamp } from '@/lib/math'
import vertexShader from '@/shaders/backgroundVertex.glsl'
import fragmentShader from '@/shaders/backgroundFragment.glsl'

const FIT_MODE_INDEX: Record<string, number> = {
  stretch: 0,
  cover: 1,
  contain: 2,
  'fit-width': 3,
  'fit-height': 4,
}
const TRANSITION_TYPE_INDEX: Record<string, number> = {
  'fade': 0,
  'slide-left': 1,
  'slide-right': 2,
  'zoom-in': 3,
  'blur-dissolve': 4,
  'bars-horizontal': 5,
  'bars-vertical': 6,
  'rgb-shift': 7,
  'distortion': 8,
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
type TransitionImageParams = {
  scale: number
  positionX: number
  positionY: number
  fitMode: string
}

const DEFAULT_PREV_IMAGE_PARAMS: TransitionImageParams = {
  scale: 1,
  positionX: 0,
  positionY: 0,
  fitMode: 'cover',
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
  const hasResolvedTextureRef = useRef(false)
  const smoothedBassRef = useRef(0)
  const previousImageUrlRef = useRef<string | null>(null)
  const prevImageParamsRef = useRef({
    scale: DEFAULT_PREV_IMAGE_PARAMS.scale,
    positionX: DEFAULT_PREV_IMAGE_PARAMS.positionX,
    positionY: DEFAULT_PREV_IMAGE_PARAMS.positionY,
    fitMode: DEFAULT_PREV_IMAGE_PARAMS.fitMode,
  })
  const lastImageParamsRef = useRef({
    scale: DEFAULT_PREV_IMAGE_PARAMS.scale,
    positionX: DEFAULT_PREV_IMAGE_PARAMS.positionX,
    positionY: DEFAULT_PREV_IMAGE_PARAMS.positionY,
    fitMode: DEFAULT_PREV_IMAGE_PARAMS.fitMode,
  })
  const { viewport } = useThree()
  const [texture, setTexture] = useState<THREE.Texture | null>(null)
  const {
    glitchIntensity, glitchFrequency, glitchStyle, rgbShift, scanlineIntensity, scanlineMode, scanlineSpacing, scanlineThickness, noiseIntensity,
    glitchAudioReactive, glitchAudioSensitivity,
    rgbShiftAudioReactive, rgbShiftAudioSensitivity,
    imageUrl, audioSensitivity,
    imageScale, imagePositionX, imagePositionY, imageBassReactive, imageBassScaleIntensity,
    imageFitMode,
    filterTarget,
    slideshowTransitionDuration,
    slideshowTransitionType,
    slideshowTransitionIntensity,
    slideshowTransitionAudioDrive,
    setBackgroundFallbackVisible,
  } = useWallpaperStore()
  const { getBands, getAmplitude } = useAudioData()
  const currentImageParams = useMemo(
    () => ({
      scale: imageScale,
      positionX: imagePositionX,
      positionY: imagePositionY,
      fitMode: imageFitMode,
    }),
    [imageFitMode, imagePositionX, imagePositionY, imageScale]
  )

  useEffect(() => {
    if (previousImageUrlRef.current && previousImageUrlRef.current !== imageUrl) {
      prevImageParamsRef.current = lastImageParamsRef.current
    }
    previousImageUrlRef.current = imageUrl
  }, [imageUrl])

  useEffect(() => {
    lastImageParamsRef.current = currentImageParams
  }, [currentImageParams])

  useEffect(() => {
    let cancelled = false
    const hasRenderableTexture = Boolean(texture || prevLoadedTextureRef.current || hasResolvedTextureRef.current)

    if (!imageUrl) {
      setTexture(null)
      hasResolvedTextureRef.current = false
      setBackgroundFallbackVisible(false)
      return
    }

    setBackgroundFallbackVisible(!hasRenderableTexture)

    void loadTexture(imageUrl)
      .then((loadedTexture) => {
        if (cancelled) return
        hasResolvedTextureRef.current = true
        setTexture(loadedTexture)
        setBackgroundFallbackVisible(false)
      })
      .catch(() => {
        if (cancelled) return
        if (!hasResolvedTextureRef.current && !prevLoadedTextureRef.current) {
          setTexture(null)
          setBackgroundFallbackVisible(true)
        } else {
          setBackgroundFallbackVisible(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [imageUrl, setBackgroundFallbackVisible])

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
      uImageRequested:   { value: !!imageUrl },
      uHasPrevImage:     { value: false },
      uImageBlend:       { value: 1.0 },
      uImageScale:       { value: imageScale },
      uImageOffsetX:     { value: imagePositionX },
      uImageOffsetY:     { value: imagePositionY },
      uImageBassBoost:   { value: 0 },
      uImageAspect:      { value: 1.0 },
      uPrevImageAspect:  { value: 1.0 },
      uCanvasAspect:     { value: viewport.width / viewport.height },
      uFitMode:          { value: FIT_MODE_INDEX[imageFitMode] ?? 1 },
      uPrevImageScale:   { value: imageScale },
      uPrevImageOffsetX: { value: imagePositionX },
      uPrevImageOffsetY: { value: imagePositionY },
      uPrevFitMode:      { value: FIT_MODE_INDEX[imageFitMode] ?? 1 },
      uTransitionType:   { value: 0 },
      uTransitionForce:  { value: 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useFrame(({ clock }, dt) => {
    const bass = getBands().bass
    const amplitude = getAmplitude()

    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.ShaderMaterial
    const filterActive = filterTarget === 'background' || filterTarget === 'all-images'

    mat.uniforms.uTime.value = clock.getElapsedTime()

    const glitchBoost = filterActive && glitchAudioReactive ? bass * audioSensitivity * glitchAudioSensitivity : 0
    const rgbBoost    = filterActive && rgbShiftAudioReactive ? bass * audioSensitivity * rgbShiftAudioSensitivity : 0
    mat.uniforms.uGlitchIntensity.value  = filterActive ? glitchIntensity + glitchBoost : 0
    mat.uniforms.uGlitchFrequency.value  = glitchFrequency
    mat.uniforms.uGlitchStyle.value      = GLITCH_STYLE_INDEX[glitchStyle] ?? 0
    mat.uniforms.uRgbShift.value         = filterActive ? rgbShift + rgbBoost : 0
    mat.uniforms.uScanlineIntensity.value= filterActive ? scanlineIntensity : 0
    mat.uniforms.uScanlineMode.value     = SCANLINE_MODE_INDEX[scanlineMode] ?? 0
    mat.uniforms.uScanlineSpacing.value  = scanlineSpacing
    mat.uniforms.uScanlineThickness.value= scanlineThickness
    mat.uniforms.uAudioLevel.value       = amplitude * audioSensitivity
    mat.uniforms.uNoiseIntensity.value   = filterActive ? noiseIntensity : 0
    mat.uniforms.tImage.value            = texture
    mat.uniforms.uHasImage.value         = !!texture
    mat.uniforms.uImageRequested.value   = !!imageUrl
    mat.uniforms.uImageScale.value       = imageScale
    mat.uniforms.uImageOffsetX.value     = imagePositionX
    mat.uniforms.uImageOffsetY.value     = imagePositionY
    // Smooth the bass boost with a fast attack and slow release to prevent saturation
    const targetBass = imageBassReactive ? bass * audioSensitivity * imageBassScaleIntensity : 0
    const bassAttack = 0.7
    const bassRelease = 0.06
    if (targetBass > smoothedBassRef.current) {
      smoothedBassRef.current += (targetBass - smoothedBassRef.current) * bassAttack
    } else {
      smoothedBassRef.current += (targetBass - smoothedBassRef.current) * bassRelease
    }
    mat.uniforms.uImageBassBoost.value = smoothedBassRef.current

    mat.uniforms.uImageAspect.value = getTextureAspect(texture)
    mat.uniforms.uPrevImageAspect.value = getTextureAspect(prevTextureRef.current)
    mat.uniforms.uCanvasAspect.value = viewport.width / viewport.height
    mat.uniforms.uFitMode.value = FIT_MODE_INDEX[imageFitMode] ?? 1
    mat.uniforms.uPrevImageScale.value = prevImageParamsRef.current.scale
    mat.uniforms.uPrevImageOffsetX.value = prevImageParamsRef.current.positionX
    mat.uniforms.uPrevImageOffsetY.value = prevImageParamsRef.current.positionY
    mat.uniforms.uPrevFitMode.value = FIT_MODE_INDEX[prevImageParamsRef.current.fitMode] ?? 1
    mat.uniforms.uTransitionType.value = TRANSITION_TYPE_INDEX[slideshowTransitionType] ?? 0
    mat.uniforms.uTransitionForce.value = clamp(
      slideshowTransitionIntensity + (bass * audioSensitivity * slideshowTransitionAudioDrive),
      0.2,
      3.5
    )

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
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}
