import { useEffect, useRef } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioData } from '@/hooks/useAudioData'
import { resetSpectrum } from './CircularSpectrum'
import { resetLogo } from './ReactiveLogo'
import { buildOverlayLayers } from '@/lib/layers'
import { drawOverlayLayer } from '@/components/audio/layers/overlayLayerRegistry'

export default function AudioOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const { getFrequencyBins, getBands } = useAudioData()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function frame(time: number) {
      if (!canvas || !ctx) return
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = time

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const state = useWallpaperStore.getState()
      const overlayLayers = buildOverlayLayers(state)
      const bands = getBands()

      if (!overlayLayers.some((layer) => layer.type === 'logo' && layer.enabled)) {
        resetLogo()
      }

      if (!overlayLayers.some((layer) => layer.type === 'spectrum' && layer.enabled)) {
        resetSpectrum()
      }

      const bins = getFrequencyBins()
      const bassAmplitude = Math.min(1, bands.bass * state.logoAudioSensitivity)
      for (const layer of overlayLayers) {
        drawOverlayLayer(layer, { ctx, canvas, state, bins, bands, bassAmplitude, dt })
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [getFrequencyBins, getBands])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  )
}
