import { useEffect, useRef } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioData } from '@/hooks/useAudioData'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function random(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1)) % 1
}

export default function FxLayerCanvas({ zIndex }: { zIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const { getAmplitude, getBands } = useAudioData()

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
      const bass = getBands().bass
      const amplitude = getAmplitude()

      const glitchBoost = state.glitchAudioReactive
        ? bass * state.audioSensitivity * state.glitchAudioSensitivity
        : 0
      const rgbBoost = state.rgbShiftAudioReactive
        ? bass * state.audioSensitivity * state.rgbShiftAudioSensitivity * 40
        : 0

      const glitchAmount = clamp(state.glitchIntensity + glitchBoost, 0, 1.8)
      const rgbAmount = clamp((state.rgbShift * 2200) + rgbBoost, 0, 24)
      const noiseAmount = clamp(state.noiseIntensity, 0, 1)

      ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height)

      let scanlineAmount = state.scanlineIntensity
      if (state.scanlineMode === 'pulse') {
        scanlineAmount *= 0.45 + 0.55 * (Math.sin(time * 0.0026) * 0.5 + 0.5)
      } else if (state.scanlineMode === 'burst') {
        const burst = random(Math.floor(time * 0.002) + 11)
        scanlineAmount *= 0.18 + burst * 1.1
      } else if (state.scanlineMode === 'beat') {
        scanlineAmount *= 0.3 + Math.min(1.4, amplitude * state.audioSensitivity)
      }

      if (scanlineAmount > 0.001) {
        const lineCount = clamp(state.scanlineSpacing / 8, 12, 180)
        const spacing = currentCanvas.height / lineCount
        const thickness = clamp(state.scanlineThickness, 0.5, 8)
        ctx.fillStyle = `rgba(0, 0, 0, ${clamp(scanlineAmount * 0.22, 0, 0.45)})`
        for (let y = 0; y < currentCanvas.height; y += spacing) {
          ctx.fillRect(0, y, currentCanvas.width, thickness)
        }
      }

      if (rgbAmount > 0.1) {
        const shift = clamp(rgbAmount, 0, 24)
        ctx.fillStyle = `rgba(255, 0, 96, ${clamp(state.rgbShift * 60, 0, 0.12)})`
        ctx.fillRect(-shift, 0, currentCanvas.width, currentCanvas.height)
        ctx.fillStyle = `rgba(0, 255, 255, ${clamp(state.rgbShift * 60, 0, 0.12)})`
        ctx.fillRect(shift, 0, currentCanvas.width, currentCanvas.height)
      }

      if (glitchAmount > 0.001) {
        const count = Math.max(2, Math.floor(6 + glitchAmount * 18 * clamp(state.glitchFrequency, 0.1, 2)))
        for (let i = 0; i < count; i++) {
          const seed = time * 0.001 + i * 17.33
          const alpha = clamp(0.04 + glitchAmount * 0.14, 0, 0.22)

          if (state.glitchStyle === 'bands') {
            const y = random(seed) * currentCanvas.height
            const h = 8 + random(seed + 1.7) * 42
            const offset = (random(seed + 2.9) - 0.5) * 160 * glitchAmount
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
            ctx.fillRect(offset, y, currentCanvas.width, h)
            ctx.fillStyle = `rgba(255, 0, 120, ${alpha * 0.7})`
            ctx.fillRect(offset + 10, y + 1, currentCanvas.width, Math.max(2, h * 0.35))
          } else if (state.glitchStyle === 'blocks') {
            const x = random(seed + 3.1) * currentCanvas.width
            const y = random(seed + 4.3) * currentCanvas.height
            const w = 20 + random(seed + 5.9) * 180 * glitchAmount
            const h = 12 + random(seed + 6.7) * 80 * glitchAmount
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
            ctx.fillRect(x, y, w, h)
            ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.8})`
            ctx.fillRect(x + 4, y + 4, w * 0.55, h * 0.55)
          } else {
            const cell = Math.max(4, 14 - glitchAmount * 6)
            const x = Math.floor((random(seed + 7.1) * currentCanvas.width) / cell) * cell
            const y = Math.floor((random(seed + 8.9) * currentCanvas.height) / cell) * cell
            const w = cell * (2 + Math.floor(random(seed + 9.7) * 8))
            const h = cell * (2 + Math.floor(random(seed + 10.3) * 6))
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
            ctx.fillRect(x, y, w, h)
          }
        }
      }

      if (noiseAmount > 0.001) {
        const dotCount = Math.floor(noiseAmount * 800)
        for (let i = 0; i < dotCount; i++) {
          const seed = time * 0.004 + i * 13.17
          const x = random(seed) * currentCanvas.width
          const y = random(seed + 4.1) * currentCanvas.height
          const a = random(seed + 9.3) * noiseAmount * 0.35
          ctx.fillStyle = `rgba(255,255,255,${a})`
          ctx.fillRect(x, y, 1, 1)
        }
      }

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [getAmplitude, getBands])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex,
      }}
    />
  )
}
