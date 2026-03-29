import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { DesktopAudioAnalyzer } from '@/lib/audio/DesktopAudioAnalyzer'
import { MicrophoneAnalyzer } from '@/lib/audio/MicrophoneAnalyzer'
import { FileAudioAnalyzer } from '@/lib/audio/FileAudioAnalyzer'
import type { IAudioSourceAdapter } from '@/lib/audio/types'
import { useWallpaperStore } from '@/store/wallpaperStore'

// getDisplayMedia is desktop-only — not available on Android/iOS
const supportsDisplayMedia = typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices?.getDisplayMedia === 'function'

interface AudioDataContextValue {
  getAmplitude: () => number
  getPeak: () => number
  getBands: () => { bass: number; mid: number; treble: number }
  getFrequencyBins: () => Uint8Array
  startCapture: () => Promise<void>
  startFileCapture: (file: File) => Promise<void>
  stopCapture: () => void
  captureMode: 'desktop' | 'microphone' | 'file'
  isPaused: boolean
  pauseCapture: () => void
  resumeCapture: () => void
}

const AudioDataContext = createContext<AudioDataContextValue | null>(null)

export function AudioDataProvider({ children }: { children: ReactNode }) {
  const analyzerRef = useRef<IAudioSourceAdapter | null>(null)
  const [captureMode, setCaptureMode] = useState<'desktop' | 'microphone' | 'file'>(
    supportsDisplayMedia ? 'desktop' : 'microphone'
  )
  const [isPaused, setIsPaused] = useState(false)
  const { audioCaptureState, setAudioCaptureState, fftSize, audioSmoothing } = useWallpaperStore()

  // Stop capture when audioCaptureState is forced to idle from outside
  useEffect(() => {
    if (audioCaptureState === 'idle' && analyzerRef.current) {
      analyzerRef.current.stop()
      analyzerRef.current = null
    }
  }, [audioCaptureState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      analyzerRef.current?.stop()
    }
  }, [])

  async function startCapture() {
    if (analyzerRef.current) {
      analyzerRef.current.stop()
      analyzerRef.current = null
    }

    setAudioCaptureState('requesting')

    try {
      const analyzer = supportsDisplayMedia
        ? new DesktopAudioAnalyzer(fftSize, audioSmoothing)
        : new MicrophoneAnalyzer(fftSize, audioSmoothing)
      await analyzer.start()
      analyzerRef.current = analyzer
      setCaptureMode(supportsDisplayMedia ? 'desktop' : 'microphone')
      setAudioCaptureState('active')
    } catch (err) {
      analyzerRef.current = null
      if (err instanceof Error) {
        if (err.message === 'no-audio-track') {
          setAudioCaptureState('no-audio-track')
        } else if (err.name === 'NotAllowedError') {
          setAudioCaptureState('denied')
        } else {
          setAudioCaptureState('error')
        }
      } else {
        setAudioCaptureState('error')
      }
    }
  }

  async function startFileCapture(file: File) {
    if (analyzerRef.current) {
      analyzerRef.current.stop()
      analyzerRef.current = null
    }

    setAudioCaptureState('requesting')

    try {
      const analyzer = new FileAudioAnalyzer(file)
      await analyzer.start()
      analyzerRef.current = analyzer
      setCaptureMode('file')
      setAudioCaptureState('active')
    } catch {
      analyzerRef.current = null
      setAudioCaptureState('error')
    }
  }

  function stopCapture() {
    analyzerRef.current?.stop()
    analyzerRef.current = null
    setCaptureMode(supportsDisplayMedia ? 'desktop' : 'microphone')
    setAudioCaptureState('idle')
    setIsPaused(false)
  }

  function pauseCapture() {
    analyzerRef.current?.pause?.()
    setIsPaused(true)
  }

  function resumeCapture() {
    analyzerRef.current?.resume?.()
    setIsPaused(false)
  }

  const value: AudioDataContextValue = {
    getAmplitude: () => analyzerRef.current?.getAmplitude() ?? 0,
    getPeak: () => analyzerRef.current?.getPeak() ?? 0,
    getBands: () => analyzerRef.current?.getBands() ?? { bass: 0, mid: 0, treble: 0 },
    getFrequencyBins: () => analyzerRef.current?.getFrequencyBins() ?? new Uint8Array(0),
    startCapture,
    startFileCapture,
    stopCapture,
    captureMode,
    isPaused,
    pauseCapture,
    resumeCapture,
  }

  return <AudioDataContext.Provider value={value}>{children}</AudioDataContext.Provider>
}

export function useAudioContext(): AudioDataContextValue {
  const ctx = useContext(AudioDataContext)
  if (!ctx) throw new Error('useAudioContext must be used inside AudioDataProvider')
  return ctx
}
