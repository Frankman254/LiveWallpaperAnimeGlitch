import { useEffect, useRef } from 'react'
import type { LogoLayer, SpectrumLayer } from '@/types/layers'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioData } from '@/hooks/useAudioData'
import { buildOverlayLayers } from '@/lib/layers'
import { drawOverlayLayer } from '@/components/audio/layers/overlayLayerRegistry'
import { resetSpectrum } from '@/components/audio/CircularSpectrum'
import { resetLogo } from '@/components/audio/ReactiveLogo'

type RenderableAudioLayer = LogoLayer | SpectrumLayer

export default function AudioLayerCanvas({ layer }: { layer: RenderableAudioLayer }) {
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
      const currentCanvas = canvasRef.current
      if (!currentCanvas) return
      currentCanvas.width = window.innerWidth
      currentCanvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function frame(time: number) {
      const currentCanvas = canvasRef.current
      if (!currentCanvas || !ctx) return

      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = time
      ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height)

      const state = useWallpaperStore.getState()
      const nextLayer = buildOverlayLayers(state).find((candidate) => candidate.id === layer.id)
      if (nextLayer?.enabled) {
        const bins = getFrequencyBins()
        const bands = getBands()
        const bassAmplitude = Math.min(1, bands.bass * state.logoAudioSensitivity)
        drawOverlayLayer(nextLayer, { ctx, canvas: currentCanvas, state, bins, bassAmplitude, dt })
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (layer.type === 'logo') resetLogo()
      if (layer.type === 'spectrum') resetSpectrum()
    }
  }, [getBands, getFrequencyBins, layer.id, layer.type])

  if (!layer.enabled) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: layer.zIndex,
      }}
    />
  )
}
