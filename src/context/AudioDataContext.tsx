import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DesktopAudioAnalyzer } from '@/lib/audio/DesktopAudioAnalyzer'
import { MicrophoneAnalyzer } from '@/lib/audio/MicrophoneAnalyzer'
import { FileAudioAnalyzer } from '@/lib/audio/FileAudioAnalyzer'
import type { IAudioSourceAdapter } from '@/lib/audio/types'
import { useWallpaperStore } from '@/store/wallpaperStore'

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
  pauseFileForSystem: () => void
  resumeFileFromSystem: () => void
  // File player controls
  seek: (time: number) => void
  getCurrentTime: () => number
  getDuration: () => number
  setFileVolume: (v: number) => void
  setFileLoop: (v: boolean) => void
  getFileName: () => string
  fileVolume: number
  fileLoop: boolean
}

const AudioDataContext = createContext<AudioDataContextValue | null>(null)

export function AudioDataProvider({ children }: { children: ReactNode }) {
  const analyzerRef = useRef<IAudioSourceAdapter | null>(null)
  const systemPausedFileRef = useRef(false)
  const [captureMode, setCaptureMode] = useState<'desktop' | 'microphone' | 'file'>(
    supportsDisplayMedia ? 'desktop' : 'microphone'
  )
  const [isPaused, setIsPaused] = useState(false)
  const [fileVolume, setFileVolumeState] = useState(1.0)
  const [fileLoop, setFileLoopState] = useState(true)
  const audioCaptureState = useWallpaperStore((state) => state.audioCaptureState)
  const setAudioCaptureState = useWallpaperStore((state) => state.setAudioCaptureState)
  const setAudioPaused = useWallpaperStore((state) => state.setAudioPaused)
  const fftSize = useWallpaperStore((state) => state.fftSize)
  const audioSmoothing = useWallpaperStore((state) => state.audioSmoothing)

  useEffect(() => {
    if (audioCaptureState === 'idle' && analyzerRef.current) {
      analyzerRef.current.stop()
      analyzerRef.current = null
    }
  }, [audioCaptureState])

  useEffect(() => {
    return () => { analyzerRef.current?.stop() }
  }, [])

  useEffect(() => {
    analyzerRef.current?.setAnalysisConfig?.(fftSize, audioSmoothing)
  }, [fftSize, audioSmoothing])

  const startCapture = useCallback(async function startCapture() {
    systemPausedFileRef.current = false
    setAudioPaused(false)
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
        if (err.message === 'no-audio-track') setAudioCaptureState('no-audio-track')
        else if (err.name === 'NotAllowedError') setAudioCaptureState('denied')
        else setAudioCaptureState('error')
      } else {
        setAudioCaptureState('error')
      }
    }
  }, [audioSmoothing, fftSize, setAudioCaptureState, setAudioPaused])

  const startFileCapture = useCallback(async function startFileCapture(file: File) {
    systemPausedFileRef.current = false
    setAudioPaused(false)
    if (analyzerRef.current) {
      analyzerRef.current.stop()
      analyzerRef.current = null
    }
    setAudioCaptureState('requesting')
    setFileVolumeState(1.0)
    setFileLoopState(true)
    try {
      const analyzer = new FileAudioAnalyzer(file, fftSize, audioSmoothing)
      await analyzer.start()
      analyzerRef.current = analyzer
      setCaptureMode('file')
      setAudioCaptureState('active')
    } catch {
      analyzerRef.current = null
      setAudioCaptureState('error')
    }
  }, [audioSmoothing, fftSize, setAudioCaptureState, setAudioPaused])

  const stopCapture = useCallback(function stopCapture() {
    analyzerRef.current?.stop()
    analyzerRef.current = null
    systemPausedFileRef.current = false
    setAudioPaused(false)
    setCaptureMode(supportsDisplayMedia ? 'desktop' : 'microphone')
    setAudioCaptureState('idle')
    setIsPaused(false)
  }, [setAudioCaptureState, setAudioPaused])

  const pauseCapture = useCallback(function pauseCapture() {
    systemPausedFileRef.current = false
    analyzerRef.current?.pause?.()
    setIsPaused(true)
  }, [])

  const resumeCapture = useCallback(function resumeCapture() {
    systemPausedFileRef.current = false
    analyzerRef.current?.resume?.()
    setIsPaused(false)
  }, [])

  const pauseFileForSystem = useCallback(function pauseFileForSystem() {
    if (captureMode !== 'file' || isPaused) return
    analyzerRef.current?.pause?.()
    setIsPaused(true)
    systemPausedFileRef.current = true
  }, [captureMode, isPaused])

  const resumeFileFromSystem = useCallback(function resumeFileFromSystem() {
    if (captureMode !== 'file' || !systemPausedFileRef.current) return
    analyzerRef.current?.resume?.()
    setIsPaused(false)
    systemPausedFileRef.current = false
  }, [captureMode])

  const seek = useCallback(function seek(time: number) {
    analyzerRef.current?.seek?.(time)
  }, [])

  const getCurrentTime = useCallback(function getCurrentTime() {
    return analyzerRef.current?.getCurrentTime?.() ?? 0
  }, [])

  const getDuration = useCallback(function getDuration() {
    return analyzerRef.current?.getDuration?.() ?? 0
  }, [])

  const setFileVolume = useCallback(function setFileVolume(v: number) {
    setFileVolumeState(v)
    analyzerRef.current?.setVolume?.(v)
  }, [])

  const setFileLoop = useCallback(function setFileLoop(v: boolean) {
    setFileLoopState(v)
    analyzerRef.current?.setLoop?.(v)
  }, [])

  const getFileName = useCallback(function getFileName() {
    return analyzerRef.current?.getFileName?.() ?? ''
  }, [])

  const getAmplitude = useCallback(() => (
    useWallpaperStore.getState().audioPaused ? 0 : (analyzerRef.current?.getAmplitude() ?? 0)
  ), [])
  const getPeak = useCallback(() => (
    useWallpaperStore.getState().audioPaused ? 0 : (analyzerRef.current?.getPeak() ?? 0)
  ), [])
  const getBands = useCallback(() => (
    useWallpaperStore.getState().audioPaused
      ? { bass: 0, mid: 0, treble: 0 }
      : (analyzerRef.current?.getBands() ?? { bass: 0, mid: 0, treble: 0 })
  ), [])
  const getFrequencyBins = useCallback(() => (
    useWallpaperStore.getState().audioPaused
      ? new Uint8Array(0)
      : (analyzerRef.current?.getFrequencyBins() ?? new Uint8Array(0))
  ), [])

  const value: AudioDataContextValue = useMemo(() => ({
    getAmplitude,
    getPeak,
    getBands,
    getFrequencyBins,
    startCapture,
    startFileCapture,
    stopCapture,
    captureMode,
    isPaused,
    pauseCapture,
    pauseFileForSystem,
    resumeCapture,
    resumeFileFromSystem,
    seek,
    getCurrentTime,
    getDuration,
    setFileVolume,
    setFileLoop,
    getFileName,
    fileVolume,
    fileLoop,
  }), [
    captureMode,
    fileLoop,
    fileVolume,
    getAmplitude,
    getBands,
    getCurrentTime,
    getDuration,
    getFileName,
    getFrequencyBins,
    getPeak,
    isPaused,
    pauseCapture,
    pauseFileForSystem,
    resumeCapture,
    resumeFileFromSystem,
    seek,
    setFileLoop,
    setFileVolume,
    startCapture,
    startFileCapture,
    stopCapture,
  ])

  return <AudioDataContext.Provider value={value}>{children}</AudioDataContext.Provider>
}

export function useAudioContext(): AudioDataContextValue {
  const ctx = useContext(AudioDataContext)
  if (!ctx) throw new Error('useAudioContext must be used inside AudioDataProvider')
  return ctx
}
