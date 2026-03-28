import { useEffect, useRef } from 'react'
import { AudioAnalyzer } from '@/lib/audio'
import { useWallpaperStore } from '@/store/wallpaperStore'

/**
 * Manages AudioAnalyzer lifecycle based on audioReactive store state.
 * Returns a ref that holds the current normalized audio amplitude [0..1].
 */
export function useAudioAnalyzer() {
  const audioReactive = useWallpaperStore((s) => s.audioReactive)
  const setAudioReactive = useWallpaperStore((s) => s.setAudioReactive)
  const amplitudeRef = useRef(0)
  const analyzerRef = useRef<AudioAnalyzer | null>(null)

  useEffect(() => {
    if (!audioReactive) {
      analyzerRef.current?.destroy()
      analyzerRef.current = null
      amplitudeRef.current = 0
      return
    }

    const analyzer = new AudioAnalyzer()
    analyzerRef.current = analyzer

    analyzer.init().catch(() => {
      // Permission denied or no mic — silently disable
      setAudioReactive(false)
    })

    return () => {
      analyzer.destroy()
      analyzerRef.current = null
      amplitudeRef.current = 0
    }
  }, [audioReactive, setAudioReactive])

  /** Call this every frame to get updated amplitude. */
  function getAmplitude(): number {
    if (!analyzerRef.current) return 0
    amplitudeRef.current = analyzerRef.current.getAverageFrequency()
    return amplitudeRef.current
  }

  return { getAmplitude, amplitudeRef }
}
