import { useEffect, useRef } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioData } from '@/hooks/useAudioData'
import { drawSpectrum, resetSpectrum } from './CircularSpectrum'
import { drawLogo, resetLogo } from './ReactiveLogo'

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

      if (state.spectrumEnabled) {
        const bins = getFrequencyBins()
        drawSpectrum(ctx, canvas, bins, state, dt)
      } else {
        resetSpectrum()
      }

      if (state.logoEnabled) {
        const bands = getBands()
        // Use bass band + sensitivity for dramatic, beat-synchronized logo reaction
        const amplitude = Math.min(1, bands.bass * state.audioSensitivity * 4)
        drawLogo(ctx, canvas, amplitude, state)
      } else {
        resetLogo()
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
