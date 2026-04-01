import { useRef, useState, useEffect } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioContext } from '@/context/AudioDataContext'
import { useT } from '@/lib/i18n'
import { formatTrackTitle } from '@/lib/audio/trackTitle'
import { TRACK_TITLE_RANGES } from '@/config/ranges'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'
import SectionDivider from '../ui/SectionDivider'
import ResetButton from '../ui/ResetButton'
import EnumButtons from '../ui/EnumButtons'
import ColorInput from '../ui/ColorInput'
import type { TrackTitleFontStyle, TrackTitleLayoutMode } from '@/types/wallpaper'

const FFT_SIZES = ['512', '1024', '2048', '4096']
const FFT_PRESETS = [
  { id: 'fast', label: 'Fast', fftSize: 512 },
  { id: 'balanced', label: 'Balanced', fftSize: 2048 },
  { id: 'detailed', label: 'Detailed', fftSize: 4096 },
] as const
const TRACK_TITLE_LAYOUTS: TrackTitleLayoutMode[] = ['free', 'centered', 'left-dock', 'right-dock']
const TRACK_TITLE_LAYOUT_LABELS: Record<TrackTitleLayoutMode, string> = {
  free: 'Free',
  centered: 'Centered',
  'left-dock': 'Left Dock',
  'right-dock': 'Right Dock',
}
const TRACK_TITLE_FONTS: TrackTitleFontStyle[] = ['clean', 'condensed', 'techno', 'mono', 'serif']
const TRACK_TITLE_FONT_LABELS: Record<TrackTitleFontStyle, string> = {
  clean: 'Clean',
  condensed: 'Condensed',
  techno: 'Techno',
  mono: 'Mono',
  serif: 'Serif',
}

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
    startCapture, startFileCapture, stopCapture, pauseCapture, resumeCapture,
    pauseFileForSystem, resumeFileFromSystem,
    captureMode, isPaused,
    seek, getCurrentTime, getDuration,
    setFileVolume, setFileLoop,
    fileVolume, fileLoop,
    getFileName,
  } = useAudioContext()
  const mp3Ref = useRef<HTMLInputElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const state = store.audioCaptureState
  const isFile = captureMode === 'file' && state === 'active'
  const isCapturing = state === 'active'
  const audioPaused = store.audioPaused
  const motionPaused = store.motionPaused
  const activeFftPreset = FFT_PRESETS.find((preset) => preset.fftSize === store.fftSize) ?? null
  const formattedTrackTitle = formatTrackTitle(getFileName())

  // Poll progress while playing a file
  useEffect(() => {
    if (!isFile) return
    const id = setInterval(() => {
      setCurrentTime(getCurrentTime())
      setDuration(getDuration())
    }, 200)
    return () => clearInterval(id)
  }, [isFile, getCurrentTime, getDuration])

  function handleMp3(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    void startFileCapture(file)
    e.target.value = ''
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

      <SectionDivider label="Transport" />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">{t.hint_pause_audio_only}</span>
        <button
          onClick={toggleAudioOnlyPause}
          className="px-3 py-1.5 text-xs rounded border border-cyan-700 text-cyan-400 hover:border-cyan-400 transition-colors"
        >
          {audioPaused ? t.resume_audio_only : t.pause_audio_only}
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500">{t.hint_pause_all}</span>
        <button
          onClick={togglePauseAll}
          className="px-3 py-1.5 text-xs rounded border border-amber-700 text-amber-300 hover:border-amber-400 transition-colors"
        >
          {motionPaused ? t.resume_all : t.pause_all}
        </button>
      </div>

      {/* MP3 Player controls */}
      {isFile && (
        <>
          <SectionDivider label={getFileName()} />

          {/* Seek bar + time */}
          <div className="flex flex-col gap-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1 accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Play/Pause */}
          <div className="flex gap-2">
            <button
              onClick={isPaused ? resumeCapture : pauseCapture}
              className="flex-1 px-3 py-1.5 text-xs rounded border border-cyan-700 text-cyan-400 hover:border-cyan-400 transition-colors"
            >
              {isPaused ? t.resume : t.pause}
            </button>
          </div>

          <SliderControl
            label={t.label_volume}
            value={fileVolume}
            min={0} max={1} step={0.01}
            onChange={setFileVolume}
          />
          <ToggleControl
            label={t.label_loop}
            value={fileLoop}
            onChange={setFileLoop}
          />
        </>
      )}

      <SectionDivider label={t.section_track_title} />
      <ToggleControl
        label={t.label_track_title_enabled}
        value={store.audioTrackTitleEnabled}
        onChange={store.setAudioTrackTitleEnabled}
      />
      {isFile && (
        <div className="text-xs text-cyan-500">
          {t.label_now_playing}: {formattedTrackTitle || t.label_track_title_empty}
        </div>
      )}
      {store.audioTrackTitleEnabled && (
        <>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-cyan-400">{t.label_track_title_layout}</span>
            <EnumButtons<TrackTitleLayoutMode>
              options={TRACK_TITLE_LAYOUTS}
              value={store.audioTrackTitleLayoutMode}
              onChange={store.setAudioTrackTitleLayoutMode}
              labels={TRACK_TITLE_LAYOUT_LABELS}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-cyan-400">{t.label_font_style}</span>
            <EnumButtons<TrackTitleFontStyle>
              options={TRACK_TITLE_FONTS}
              value={store.audioTrackTitleFontStyle}
              onChange={store.setAudioTrackTitleFontStyle}
              labels={TRACK_TITLE_FONT_LABELS}
            />
          </div>
          <ToggleControl
            label={t.label_uppercase}
            value={store.audioTrackTitleUppercase}
            onChange={store.setAudioTrackTitleUppercase}
          />
          {store.audioTrackTitleLayoutMode === 'free' && (
            <SliderControl label={t.label_position_x} value={store.audioTrackTitlePositionX} {...TRACK_TITLE_RANGES.positionX} onChange={store.setAudioTrackTitlePositionX} />
          )}
          <SliderControl label={t.label_position_y} value={store.audioTrackTitlePositionY} {...TRACK_TITLE_RANGES.positionY} onChange={store.setAudioTrackTitlePositionY} />
          <SliderControl label={t.label_font_size} value={store.audioTrackTitleFontSize} {...TRACK_TITLE_RANGES.fontSize} onChange={store.setAudioTrackTitleFontSize} unit="px" />
          <SliderControl label={t.label_letter_spacing} value={store.audioTrackTitleLetterSpacing} {...TRACK_TITLE_RANGES.letterSpacing} onChange={store.setAudioTrackTitleLetterSpacing} unit="px" />
          <SliderControl label={t.label_title_width} value={store.audioTrackTitleWidth} {...TRACK_TITLE_RANGES.width} onChange={store.setAudioTrackTitleWidth} />
          <SliderControl label={t.label_opacity} value={store.audioTrackTitleOpacity} {...TRACK_TITLE_RANGES.opacity} onChange={store.setAudioTrackTitleOpacity} />
          <SliderControl label={t.label_scroll_speed} value={store.audioTrackTitleScrollSpeed} {...TRACK_TITLE_RANGES.scrollSpeed} onChange={store.setAudioTrackTitleScrollSpeed} unit="px/s" />
          <ColorInput label={t.label_text_color} value={store.audioTrackTitleTextColor} onChange={store.setAudioTrackTitleTextColor} />
          <ColorInput label={t.label_glow_color} value={store.audioTrackTitleGlowColor} onChange={store.setAudioTrackTitleGlowColor} />
          <SliderControl label={t.label_glow_blur} value={store.audioTrackTitleGlowBlur} {...TRACK_TITLE_RANGES.glowBlur} onChange={store.setAudioTrackTitleGlowBlur} />
          <ToggleControl label={t.label_backdrop} value={store.audioTrackTitleBackdropEnabled} onChange={store.setAudioTrackTitleBackdropEnabled} />
          {store.audioTrackTitleBackdropEnabled && (
            <>
              <ColorInput label={t.label_backdrop_color} value={store.audioTrackTitleBackdropColor} onChange={store.setAudioTrackTitleBackdropColor} />
              <SliderControl label={t.label_backdrop_opacity} value={store.audioTrackTitleBackdropOpacity} {...TRACK_TITLE_RANGES.backdropOpacity} onChange={store.setAudioTrackTitleBackdropOpacity} />
              <SliderControl label={t.label_backdrop_padding} value={store.audioTrackTitleBackdropPadding} {...TRACK_TITLE_RANGES.backdropPadding} onChange={store.setAudioTrackTitleBackdropPadding} unit="px" />
            </>
          )}
          <SectionDivider label={t.section_track_title_filters} />
          <SliderControl label={t.label_brightness} value={store.audioTrackTitleFilterBrightness} {...TRACK_TITLE_RANGES.filterBrightness} onChange={store.setAudioTrackTitleFilterBrightness} />
          <SliderControl label={t.label_contrast} value={store.audioTrackTitleFilterContrast} {...TRACK_TITLE_RANGES.filterContrast} onChange={store.setAudioTrackTitleFilterContrast} />
          <SliderControl label={t.label_saturation} value={store.audioTrackTitleFilterSaturation} {...TRACK_TITLE_RANGES.filterSaturation} onChange={store.setAudioTrackTitleFilterSaturation} />
          <SliderControl label={t.label_blur} value={store.audioTrackTitleFilterBlur} {...TRACK_TITLE_RANGES.filterBlur} onChange={store.setAudioTrackTitleFilterBlur} unit="px" />
          <SliderControl label={t.label_hue_rotate} value={store.audioTrackTitleFilterHueRotate} {...TRACK_TITLE_RANGES.filterHueRotate} onChange={store.setAudioTrackTitleFilterHueRotate} unit="deg" />
          <SliderControl label={t.label_rgb_shift} value={store.audioTrackTitleRgbShift} {...TRACK_TITLE_RANGES.rgbShift} onChange={store.setAudioTrackTitleRgbShift} />
          <SectionDivider label={t.label_glitch} />
          <SliderControl label={t.label_glitch} value={store.audioTrackTitleGlitchIntensity} {...TRACK_TITLE_RANGES.glitchIntensity} onChange={store.setAudioTrackTitleGlitchIntensity} />
          <SliderControl label={t.label_bar_width} value={store.audioTrackTitleGlitchBarWidth} {...TRACK_TITLE_RANGES.glitchBarWidth} onChange={store.setAudioTrackTitleGlitchBarWidth} unit="px" />
        </>
      )}

      <SectionDivider />
      <ResetButton label={t.reset_tab} onClick={onReset} />

      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_fft_presets}</span>
        <div className="flex gap-1 flex-wrap">
          {FFT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => store.setFftSize(preset.fftSize)}
              className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                activeFftPreset?.id === preset.id
                  ? 'bg-cyan-500 border-cyan-500 text-black'
                  : 'bg-transparent border-cyan-800 text-cyan-400 hover:border-cyan-500'
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
          onChange={(v) => store.setFftSize(Number(v))}
        />
        <span className="text-xs text-gray-500">{t.hint_fft_size}</span>
      </div>
      <SliderControl label={t.label_smoothing} value={store.audioSmoothing} min={0} max={0.99} step={0.01} onChange={store.setAudioSmoothing} />
    </>
  )
}
