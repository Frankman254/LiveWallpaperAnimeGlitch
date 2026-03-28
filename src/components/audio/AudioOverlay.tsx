import { useEffect, useRef } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioData } from '@/hooks/useAudioData'
import { drawSpectrum, resetSpectrum } from './CircularSpectrum'
import { drawLogo, getSmoothedAmplitude, resetLogo } from './ReactiveLogo'

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

      // Draw logo first so getSmoothedAmplitude() reflects current beat for spectrum follow
      if (state.logoEnabled) {
        const bands = getBands()
        const amplitude = Math.min(1, bands.bass * state.logoAudioSensitivity)
        drawLogo(ctx, canvas, amplitude, state)
      } else {
        resetLogo()
      }

      if (state.spectrumEnabled) {
        const bins = getFrequencyBins()
        // When spectrumFollowLogo is on, override inner radius to track logo size + audio scale
        let spectrumInnerRadius = state.spectrumInnerRadius
        if (state.spectrumFollowLogo && state.logoEnabled) {
          const smoothedAmp = getSmoothedAmplitude()
          const logoScale = 1 + smoothedAmp * state.logoReactiveScaleIntensity
          const logoRadius = (state.logoBaseSize * logoScale) / 2
          spectrumInnerRadius = logoRadius + (state.logoBackdropEnabled ? state.logoBackdropPadding : 4)
        }
        drawSpectrum(ctx, canvas, bins, { ...state, spectrumInnerRadius }, dt)
      } else {
        resetSpectrum()
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
