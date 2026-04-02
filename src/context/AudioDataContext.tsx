import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { DesktopAudioAnalyzer } from '@/lib/audio/DesktopAudioAnalyzer'
import { MicrophoneAnalyzer } from '@/lib/audio/MicrophoneAnalyzer'
import { FileAudioAnalyzer } from '@/lib/audio/FileAudioAnalyzer'
import {
  analyzeAudioChannels,
  createAudioAnalysisState,
  type AudioSnapshot,
} from '@/lib/audio/audioChannels'
import type { IAudioSourceAdapter } from '@/lib/audio/types'
import { useWallpaperStore } from '@/store/wallpaperStore'

const supportsDisplayMedia = typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices?.getDisplayMedia === 'function'

interface AudioDataContextValue {
  getAudioSnapshot: () => AudioSnapshot
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

const EMPTY_AUDIO_SNAPSHOT: AudioSnapshot = {
  bins: new Uint8Array(0),
  amplitude: 0,
  peak: 0,
  channels: {
    full: 0,
    kick: 0,
    instrumental: 0,
    bass: 0,
    hihat: 0,
    vocal: 0,
  },
  timestampMs: 0,
}

export function AudioDataProvider({ children }: { children: ReactNode }) {
  const analyzerRef = useRef<IAudioSourceAdapter | null>(null)
  const analysisStateRef = useRef(createAudioAnalysisState())
  const peakRef = useRef(0)
  const snapshotRef = useRef<AudioSnapshot>(EMPTY_AUDIO_SNAPSHOT)
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
  const audioChannelSmoothing = useWallpaperStore((state) => state.audioChannelSmoothing)

  const resetAudioAnalysis = useCallback(function resetAudioAnalysis() {
    analysisStateRef.current = createAudioAnalysisState()
    peakRef.current = 0
    snapshotRef.current = {
      ...EMPTY_AUDIO_SNAPSHOT,
      bins: new Uint8Array(0),
      channels: { ...EMPTY_AUDIO_SNAPSHOT.channels },
    }
  }, [])

  useEffect(() => {
    if (audioCaptureState === 'idle' && analyzerRef.current) {
      analyzerRef.current.stop()
      analyzerRef.current = null
      resetAudioAnalysis()
    }
  }, [audioCaptureState, resetAudioAnalysis])

  useEffect(() => {
    return () => {
      analyzerRef.current?.stop()
      resetAudioAnalysis()
    }
  }, [resetAudioAnalysis])

  useEffect(() => {
    analyzerRef.current?.setAnalysisConfig?.(fftSize, audioSmoothing)
  }, [fftSize, audioSmoothing])

  const startCapture = useCallback(async function startCapture() {
    systemPausedFileRef.current = false
    resetAudioAnalysis()
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
  }, [audioSmoothing, fftSize, resetAudioAnalysis, setAudioCaptureState, setAudioPaused])

  const startFileCapture = useCallback(async function startFileCapture(file: File) {
    systemPausedFileRef.current = false
    resetAudioAnalysis()
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
  }, [audioSmoothing, fftSize, resetAudioAnalysis, setAudioCaptureState, setAudioPaused])

  const stopCapture = useCallback(function stopCapture() {
    analyzerRef.current?.stop()
    analyzerRef.current = null
    systemPausedFileRef.current = false
    setAudioPaused(false)
    setCaptureMode(supportsDisplayMedia ? 'desktop' : 'microphone')
    setAudioCaptureState('idle')
    setIsPaused(false)
    resetAudioAnalysis()
  }, [resetAudioAnalysis, setAudioCaptureState, setAudioPaused])

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

  const getAudioSnapshot = useCallback(() => {
    if (useWallpaperStore.getState().audioPaused) {
      return {
        ...EMPTY_AUDIO_SNAPSHOT,
        bins: new Uint8Array(0),
        channels: { ...EMPTY_AUDIO_SNAPSHOT.channels },
        timestampMs: typeof performance !== 'undefined' ? performance.now() : 0,
      }
    }

    const timestampMs = typeof performance !== 'undefined' ? performance.now() : Date.now()
    if (snapshotRef.current.timestampMs > 0 && (timestampMs - snapshotRef.current.timestampMs) < 8) {
      return snapshotRef.current
    }

    const bins = analyzerRef.current?.getFrequencyBins() ?? new Uint8Array(0)
    let amplitude = 0
    if (bins.length > 0) {
      let sum = 0
      for (let index = 0; index < bins.length; index += 1) {
        sum += bins[index] ?? 0
      }
      amplitude = sum / bins.length / 255
    }

    peakRef.current = Math.max(peakRef.current * 0.98, amplitude)
    const channels = analyzeAudioChannels(
      bins,
      analysisStateRef.current,
      audioChannelSmoothing,
      timestampMs
    )

    snapshotRef.current = {
      bins,
      amplitude,
      peak: peakRef.current,
      channels: { ...channels },
      timestampMs,
    }

    return snapshotRef.current
  }, [audioChannelSmoothing])

  const getAmplitude = useCallback(() => getAudioSnapshot().amplitude, [getAudioSnapshot])
  const getPeak = useCallback(() => getAudioSnapshot().peak, [getAudioSnapshot])
  const getBands = useCallback(() => {
    const snapshot = getAudioSnapshot()
    return {
      bass: snapshot.channels.bass,
      mid: snapshot.channels.instrumental,
      treble: snapshot.channels.hihat,
    }
  }, [getAudioSnapshot])
  const getFrequencyBins = useCallback(() => getAudioSnapshot().bins, [getAudioSnapshot])

  const value: AudioDataContextValue = useMemo(() => ({
    getAudioSnapshot,
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
    getAudioSnapshot,
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
