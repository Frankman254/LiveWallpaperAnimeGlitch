import { useEffect, useRef, useState } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioContext } from '@/context/AudioDataContext'
import { useT } from '@/lib/i18n'
import { AUDIO_ROUTING_RANGES } from '@/config/ranges'
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme'
import SliderControl from '../SliderControl'
import SectionDivider from '../ui/SectionDivider'
import ResetButton from '../ui/ResetButton'
import EnumButtons from '../ui/EnumButtons'

const FFT_SIZES = ['512', '1024', '2048', '4096']
const FFT_PRESETS = [
  { id: 'fast', label: 'Fast', fftSize: 512 },
  { id: 'balanced', label: 'Balanced', fftSize: 2048 },
  { id: 'detailed', label: 'Detailed', fftSize: 4096 },
] as const

function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function AudioTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  const {
    startCapture,
    startFileCapture,
    stopCapture,
    pauseCapture,
    resumeCapture,
    pauseFileForSystem,
    resumeFileFromSystem,
    captureMode,
    isPaused,
    seek,
    getCurrentTime,
    getDuration,
    setFileVolume,
    setFileLoop,
    fileVolume,
    fileLoop,
    getFileName,
  } = useAudioContext()
  const mp3Ref = useRef<HTMLInputElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const state = store.audioCaptureState
  const theme = EDITOR_THEME_CLASSES[store.editorTheme]
  const isFile = captureMode === 'file' && state === 'active'
  const isCapturing = state === 'active'
  const audioPaused = store.audioPaused
  const motionPaused = store.motionPaused
  const activeFftPreset = FFT_PRESETS.find((preset) => preset.fftSize === store.fftSize) ?? null

  useEffect(() => {
    if (!isFile) return
    const id = setInterval(() => {
      setCurrentTime(getCurrentTime())
      setDuration(getDuration())
    }, 200)
    return () => clearInterval(id)
  }, [getCurrentTime, getDuration, isFile])

  function handleMp3(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    void startFileCapture(file)
    event.target.value = ''
  }

  function toggleAudioOnlyPause() {
    const nextPaused = !audioPaused
    store.setAudioPaused(nextPaused)

    if (isFile) {
      if (nextPaused) pauseFileForSystem()
      else resumeFileFromSystem()
    }
  }

  function togglePauseAll() {
    const nextPaused = !motionPaused
    store.setMotionPaused(nextPaused)
    store.setAudioPaused(nextPaused)

    if (isFile) {
      if (nextPaused) pauseFileForSystem()
      else resumeFileFromSystem()
    }
  }

  const statusLabel: Record<string, string> = {
    idle: t.status_idle,
    requesting: t.status_requesting,
    active: captureMode === 'file' ? t.status_file : t.status_active,
    denied: t.status_denied,
    error: t.status_error,
    'no-audio-track': t.status_no_audio_track,
  }
  const statusColor: Record<string, string> = {
    idle: 'text-gray-500',
    requesting: 'text-yellow-400',
    active: 'text-green-400',
    denied: 'text-red-400',
    error: 'text-red-400',
    'no-audio-track': 'text-orange-400',
  }

  return (
    <>
      <SectionDivider label={t.section_audio_capture} />
      <div className="flex flex-col gap-1">
        <span className={`text-xs ${statusColor[state] ?? 'text-gray-500'}`}>
          {statusLabel[state] ?? t.status_idle}
        </span>
        {captureMode !== 'microphone' && (
          <span className="text-xs text-gray-500">{t.hint_capture_window_audio}</span>
        )}
        {state === 'no-audio-track' && (
          <span className="text-xs text-gray-500">{t.hint_share_tab}</span>
        )}
        {captureMode === 'microphone' && (
          <span className="text-xs text-purple-400">{t.hint_mobile_mode}</span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={startCapture}
          disabled={isCapturing || state === 'requesting'}
          className="flex-1 rounded border border-cyan-700 px-3 py-1.5 text-xs text-cyan-400 transition-colors hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state === 'requesting'
            ? t.requesting
            : captureMode === 'microphone'
              ? t.capture_mic
              : t.capture_desktop}
        </button>
        <button
          onClick={stopCapture}
          disabled={!isCapturing}
          className="rounded border border-red-800 px-3 py-1.5 text-xs text-red-400 transition-colors hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t.stop}
        </button>
      </div>

      <button
        onClick={() => mp3Ref.current?.click()}
        disabled={isCapturing || state === 'requesting'}
        className="rounded border border-purple-800 px-3 py-1.5 text-xs text-purple-400 transition-colors hover:border-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {t.upload_mp3}
      </button>
      <input ref={mp3Ref} type="file" accept="audio/mp3,audio/mpeg,audio/*" onChange={handleMp3} className="hidden" />

      <SectionDivider label={t.section_audio_motion} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">{t.hint_pause_audio_only}</span>
        <button
          onClick={toggleAudioOnlyPause}
          className="rounded border border-cyan-700 px-3 py-1.5 text-xs text-cyan-400 transition-colors hover:border-cyan-400"
        >
          {audioPaused ? t.resume_audio_only : t.pause_audio_only}
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">{t.hint_pause_all}</span>
        <button
          onClick={togglePauseAll}
          className="rounded border border-amber-700 px-3 py-1.5 text-xs text-amber-300 transition-colors hover:border-amber-400"
        >
          {motionPaused ? t.resume_all : t.pause_all}
        </button>
      </div>

      {isFile && (
        <>
          <SectionDivider label={t.section_audio_transport} />
          <div className="text-xs text-cyan-500">{getFileName()}</div>

          <div className="flex flex-col gap-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={(event) => seek(Number(event.target.value))}
              className={`h-1 w-full cursor-pointer ${theme.controlAccent}`}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <button
            onClick={isPaused ? resumeCapture : pauseCapture}
            className="rounded border border-cyan-700 px-3 py-1.5 text-xs text-cyan-400 transition-colors hover:border-cyan-400"
          >
            {isPaused ? t.resume : t.pause}
          </button>

          <SliderControl
            label={t.label_volume}
            value={fileVolume}
            min={0}
            max={1}
            step={0.01}
            onChange={setFileVolume}
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-cyan-400">{t.label_loop}</span>
            <button
              onClick={() => setFileLoop(!fileLoop)}
              className={`rounded border px-3 py-1.5 text-xs transition-colors ${
                fileLoop
                  ? 'border-cyan-500 text-cyan-300'
                  : 'border-cyan-800 text-cyan-400 hover:border-cyan-500'
              }`}
            >
              {fileLoop ? t.label_enabled : t.label_loop}
            </button>
          </div>
        </>
      )}

      <SectionDivider label={t.section_audio_analysis} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_fft_presets}</span>
        <div className="flex flex-wrap gap-1">
          {FFT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => store.setFftSize(preset.fftSize)}
              className={`rounded border px-2 py-0.5 text-xs transition-colors ${
                activeFftPreset?.id === preset.id
                  ? 'border-cyan-500 bg-cyan-500 text-black'
                  : 'border-cyan-800 bg-transparent text-cyan-400 hover:border-cyan-500'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500">
          {activeFftPreset?.id === 'fast' && t.hint_fft_fast}
          {activeFftPreset?.id === 'balanced' && t.hint_fft_balanced}
          {activeFftPreset?.id === 'detailed' && t.hint_fft_detailed}
          {!activeFftPreset && t.hint_fft_custom}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_fft_size}</span>
        <EnumButtons<string>
          options={FFT_SIZES}
          value={String(store.fftSize)}
          onChange={(value) => store.setFftSize(Number(value))}
        />
        <span className="text-xs text-gray-500">{t.hint_fft_size}</span>
      </div>
      <SliderControl label={t.label_smoothing} value={store.audioSmoothing} min={0} max={0.99} step={0.01} onChange={store.setAudioSmoothing} />

      <SectionDivider label={t.section_audio_routing} />
      <span className="text-xs text-gray-500">{t.hint_auto_channel_priority}</span>
      <SliderControl
        label={t.label_channel_smoothing}
        value={store.audioChannelSmoothing}
        {...AUDIO_ROUTING_RANGES.channelSmoothing}
        onChange={store.setAudioChannelSmoothing}
      />
      <SliderControl
        label={t.label_selected_channel_smoothing}
        value={store.audioSelectedChannelSmoothing}
        {...AUDIO_ROUTING_RANGES.selectedChannelSmoothing}
        onChange={store.setAudioSelectedChannelSmoothing}
      />
      <SliderControl
        label={t.label_auto_kick_threshold}
        value={store.audioAutoKickThreshold}
        {...AUDIO_ROUTING_RANGES.autoKickThreshold}
        onChange={store.setAudioAutoKickThreshold}
      />
      <SliderControl
        label={t.label_auto_switch_hold}
        value={store.audioAutoSwitchHoldMs}
        {...AUDIO_ROUTING_RANGES.autoSwitchHoldMs}
        onChange={store.setAudioAutoSwitchHoldMs}
        unit="ms"
      />

      <SectionDivider />
      <ResetButton label={t.reset_tab} onClick={onReset} />
    </>
  )
}
