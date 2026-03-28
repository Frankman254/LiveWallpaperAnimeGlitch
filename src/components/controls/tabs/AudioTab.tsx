import { useRef } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioData } from '@/hooks/useAudioData'
import { useT } from '@/lib/i18n'
import SliderControl from '../SliderControl'
import SectionDivider from '../ui/SectionDivider'
import ResetButton from '../ui/ResetButton'
import EnumButtons from '../ui/EnumButtons'

const FFT_SIZES = ['512', '1024', '2048', '4096']

export default function AudioTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  const { startCapture, startFileCapture, stopCapture, captureMode } = useAudioData()
  const mp3Ref = useRef<HTMLInputElement>(null)

  function handleMp3(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    void startFileCapture(file)
    e.target.value = ''
  }

  const STATUS_LABEL: Record<string, string> = {
    idle: t.status_idle,
    requesting: t.status_requesting,
    active: captureMode === 'file' ? t.status_file : t.status_active,
    denied: t.status_denied,
    error: t.status_error,
    'no-audio-track': t.status_no_audio_track,
  }
  const STATUS_COLOR: Record<string, string> = {
    idle: 'text-gray-500',
    requesting: 'text-yellow-400',
    active: 'text-green-400',
    denied: 'text-red-400',
    error: 'text-red-400',
    'no-audio-track': 'text-orange-400',
  }

  const state = store.audioCaptureState
  const isCapturing = state === 'active'

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className={`text-xs ${STATUS_COLOR[state] ?? 'text-gray-500'}`}>
          {STATUS_LABEL[state] ?? t.status_idle}
        </span>
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
          className="flex-1 px-3 py-1.5 text-xs rounded border border-cyan-700 text-cyan-400 hover:border-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {state === 'requesting' ? t.requesting
            : captureMode === 'microphone' ? t.capture_mic
            : t.capture_desktop}
        </button>
        <button
          onClick={stopCapture}
          disabled={!isCapturing}
          className="px-3 py-1.5 text-xs rounded border border-red-800 text-red-400 hover:border-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {t.stop}
        </button>
      </div>
      <button
        onClick={() => mp3Ref.current?.click()}
        disabled={isCapturing || state === 'requesting'}
        className="px-3 py-1.5 text-xs rounded border border-purple-800 text-purple-400 hover:border-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {t.upload_mp3}
      </button>
      <input ref={mp3Ref} type="file" accept="audio/mp3,audio/mpeg,audio/*" onChange={handleMp3} className="hidden" />
      <SectionDivider />
      <ResetButton label={t.reset_tab} onClick={onReset} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_fft_size}</span>
        <EnumButtons<string>
          options={FFT_SIZES}
          value={String(store.fftSize)}
          onChange={(v) => store.setFftSize(Number(v))}
        />
      </div>
      <SliderControl label={t.label_smoothing} value={store.audioSmoothing} min={0} max={0.99} step={0.01} onChange={store.setAudioSmoothing} />
    </>
  )
}
