import { useEffect, useMemo, useRef, useState } from 'react'
import { useT } from '@/lib/i18n'
import SectionDivider from '../ui/SectionDivider'
import EnumButtons from '../ui/EnumButtons'
import ToggleControl from '../ToggleControl'
import SliderControl from '../SliderControl'

type RecorderStatus = 'idle' | 'recording' | 'saved' | 'error'

type SupportedFormat = {
  id: string
  mimeType: string
  extension: 'webm' | 'mp4'
  label: string
}

const FPS_OPTIONS = ['30', '60'] as const

function openPreview() {
  const base = window.location.href.replace(/#.*$/, '')
  window.open(base + '#/preview', '_blank')
}

function getSupportedFormats(): SupportedFormat[] {
  if (typeof MediaRecorder === 'undefined') {
    return []
  }

  const candidates: SupportedFormat[] = [
    { id: 'browser-default', mimeType: '', extension: 'webm', label: 'Browser Default' },
    { id: 'mp4-h264', mimeType: 'video/mp4;codecs=h264,aac', extension: 'mp4', label: 'MP4 (H.264)' },
    { id: 'mp4-basic', mimeType: 'video/mp4', extension: 'mp4', label: 'MP4' },
    { id: 'webm-vp9', mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm', label: 'WebM (VP9)' },
    { id: 'webm-vp8', mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm', label: 'WebM (VP8)' },
    { id: 'webm-basic', mimeType: 'video/webm', extension: 'webm', label: 'WebM' },
  ]

  return candidates.filter((candidate) => candidate.mimeType === '' || MediaRecorder.isTypeSupported(candidate.mimeType))
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function ExportTab() {
  const t = useT()
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const supportedFormats = useMemo(() => getSupportedFormats(), [])
  const [formatId, setFormatId] = useState<string>(supportedFormats[0]?.id ?? '')
  const [fps, setFps] = useState<(typeof FPS_OPTIONS)[number]>('60')
  const [bitrateMbps, setBitrateMbps] = useState(18)
  const [includeAudio, setIncludeAudio] = useState(true)
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const canScreenCapture = typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getDisplayMedia === 'function'
  const hasMediaRecorder = typeof MediaRecorder !== 'undefined'

  const format = supportedFormats.find((candidate) => candidate.id === formatId) ?? supportedFormats[0] ?? null

  useEffect(() => {
    if (!format && supportedFormats[0]) {
      setFormatId(supportedFormats[0].id)
    }
  }, [format, supportedFormats])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
      }
      recorderRef.current?.stop()
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  async function startRecording() {
    if (!hasMediaRecorder) {
      setStatus('error')
      setErrorMessage('MediaRecorder unavailable in this browser.')
      return
    }

    if (!canScreenCapture) {
      setStatus('error')
      setErrorMessage(window.isSecureContext
        ? 'Screen capture is unavailable in this browser.'
        : 'Screen capture requires HTTPS or localhost.')
      return
    }

    if (!format) {
      setStatus('error')
      setErrorMessage('No recording container is available in this browser.')
      return
    }

    try {
      setErrorMessage('')
      chunksRef.current = []
      setElapsedSeconds(0)

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: Number(fps),
        },
        audio: includeAudio,
      })

      streamRef.current = stream

      const recorder = new MediaRecorder(stream, format.mimeType
        ? {
            mimeType: format.mimeType,
            videoBitsPerSecond: Math.round(bitrateMbps * 1_000_000),
          }
        : {
            videoBitsPerSecond: Math.round(bitrateMbps * 1_000_000),
          })
      recorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onerror = () => {
        setStatus('error')
        setErrorMessage('media-recorder-error')
      }

      recorder.onstop = () => {
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current)
          timerRef.current = null
        }

        const blob = new Blob(chunksRef.current, { type: format.mimeType })
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          const stamp = new Date().toISOString().replace(/[:.]/g, '-')
          link.href = url
          link.download = `live-wallpaper-export-${stamp}.${format.extension}`
          link.click()
          window.setTimeout(() => URL.revokeObjectURL(url), 2000)
          setStatus('saved')
        } else {
          setStatus('error')
          setErrorMessage('empty-recording')
        }

        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        recorderRef.current = null
      }

      stream.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          if (recorder.state !== 'inactive') {
            recorder.stop()
          }
        })
      })

      recorder.start(250)
      setStatus('recording')
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((value) => value + 1)
      }, 1000)
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'screen-capture-failed')
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      recorderRef.current = null
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
      return
    }

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const statusLabel = {
    idle: t.status_record_idle,
    recording: `${t.status_recording} ${formatDuration(elapsedSeconds)}`,
    saved: t.status_record_saved,
    error: t.status_record_error,
  }[status]

  return (
    <>
      <SectionDivider label={t.section_export} />
      <div className="flex flex-col gap-1">
        <span className={`text-xs ${
          status === 'recording' ? 'text-red-400' :
          status === 'saved' ? 'text-green-400' :
          status === 'error' ? 'text-red-500' :
          'text-cyan-400'
        }`}>
          {statusLabel}
        </span>
        <span className="text-xs text-gray-500">{t.hint_record_preview}</span>
        <span className="text-xs text-gray-500">{t.hint_record_format}</span>
        {errorMessage && status === 'error' && (
          <span className="text-xs text-red-500">{errorMessage}</span>
        )}
      </div>

      <button
        onClick={openPreview}
        className="px-3 py-1.5 text-xs rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
      >
        {t.label_open_clean_preview}
      </button>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_record_format}</span>
        <EnumButtons<string>
          options={supportedFormats.map((candidate) => candidate.id)}
          value={format?.id ?? ''}
          onChange={setFormatId}
          labels={Object.fromEntries(supportedFormats.map((candidate) => [candidate.id, candidate.label]))}
        />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_record_fps}</span>
        <EnumButtons<(typeof FPS_OPTIONS)[number]>
          options={[...FPS_OPTIONS]}
          value={fps}
          onChange={setFps}
        />
      </div>

      <SliderControl
        label={t.label_record_bitrate}
        value={bitrateMbps}
        min={6}
        max={40}
        step={1}
        unit="Mbps"
        onChange={setBitrateMbps}
      />
      <ToggleControl
        label={t.label_record_audio}
        value={includeAudio}
        onChange={setIncludeAudio}
      />

      <div className="flex gap-2">
        <button
          onClick={() => void startRecording()}
          disabled={status === 'recording' || !hasMediaRecorder}
          className="flex-1 px-3 py-1.5 text-xs rounded border border-cyan-700 text-cyan-400 hover:border-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {t.label_start_recording}
        </button>
        <button
          onClick={stopRecording}
          disabled={status !== 'recording'}
          className="px-3 py-1.5 text-xs rounded border border-red-800 text-red-400 hover:border-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {t.label_stop_recording}
        </button>
      </div>
    </>
  )
}
