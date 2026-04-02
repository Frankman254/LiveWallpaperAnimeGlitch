import { useEffect, useRef } from 'react'
import type { AudioSnapshot } from '@/lib/audio/audioChannels'
import type { LogoLayer, SpectrumLayer, TrackTitleLayer } from '@/types/layers'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioData } from '@/hooks/useAudioData'
import { getOverlayLayerById } from '@/lib/layers'
import { drawOverlayLayer } from '@/components/audio/layers/overlayLayerRegistry'
import { resetSpectrum } from '@/components/audio/CircularSpectrum'
import { resetLogo } from '@/components/audio/ReactiveLogo'
import { formatTrackTitle } from '@/lib/audio/trackTitle'

type RenderableAudioLayer = LogoLayer | SpectrumLayer | TrackTitleLayer

export default function AudioLayerCanvas({ layer }: { layer: RenderableAudioLayer }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const cachedRawTrackTitleRef = useRef<string>('')
  const cachedFormattedTrackTitleRef = useRef<string>('')
  const { getAudioSnapshot, getFileName } = useAudioData()

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

      const state = useWallpaperStore.getState()
      if (state.motionPaused) {
        lastTimeRef.current = time
        rafRef.current = requestAnimationFrame(frame)
        return
      }

      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = time
      ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height)

      const nextLayer = getOverlayLayerById(state, layer.id)
      if (nextLayer?.enabled) {
        const rawTrackTitle = getFileName()
        if (rawTrackTitle !== cachedRawTrackTitleRef.current) {
          cachedRawTrackTitleRef.current = rawTrackTitle
          cachedFormattedTrackTitleRef.current = formatTrackTitle(rawTrackTitle)
        }
        const audio: AudioSnapshot = getAudioSnapshot()
        drawOverlayLayer(nextLayer, {
          ctx,
          canvas: currentCanvas,
          state,
          audio,
          dt,
          trackTitle: cachedFormattedTrackTitleRef.current,
        })
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [getAudioSnapshot, getFileName, layer.id, layer.type])

  useEffect(() => (
    () => {
      if (layer.type === 'logo') resetLogo()
      if (layer.type === 'spectrum') resetSpectrum()
    }
  ), [layer.type])

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
