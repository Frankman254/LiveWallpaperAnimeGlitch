import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import vertexShader from '@/shaders/backgroundVertex.glsl'
import fragmentShader from '@/shaders/backgroundFragment.glsl'

export default function BackgroundPlane() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()
  const { glitchIntensity, rgbShift, scanlineIntensity, imageUrl, audioSensitivity } =
    useWallpaperStore()
  const { getAmplitude } = useAudioAnalyzer()

  const texture = useMemo(() => {
    if (!imageUrl) return null
    return new THREE.TextureLoader().load(imageUrl)
  }, [imageUrl])

  const uniforms = useMemo(
    () => ({
      tImage: { value: texture },
      uTime: { value: 0 },
      uGlitchIntensity: { value: glitchIntensity },
      uRgbShift: { value: rgbShift },
      uScanlineIntensity: { value: scanlineIntensity },
      uHasImage: { value: !!texture },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material as THREE.ShaderMaterial
    const amplitude = getAmplitude()
    mat.uniforms.uTime.value = clock.getElapsedTime()
    mat.uniforms.uGlitchIntensity.value = glitchIntensity + amplitude * audioSensitivity * 0.4
    mat.uniforms.uRgbShift.value = rgbShift + amplitude * audioSensitivity * 0.008
    mat.uniforms.uScanlineIntensity.value = scanlineIntensity
    mat.uniforms.tImage.value = texture
    mat.uniforms.uHasImage.value = !!texture
  })

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}
