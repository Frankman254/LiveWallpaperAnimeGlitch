import { useState, useRef } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useAudioData } from '@/hooks/useAudioData'
import { DEFAULT_STATE } from '@/lib/constants'
import SliderControl from './SliderControl'
import ToggleControl from './ToggleControl'
import PresetSelector from './PresetSelector'
import ImageUploader from './ImageUploader'
import type {
  PerformanceMode,
  SpectrumColorMode,
  SpectrumBandMode,
  SpectrumShape,
  SpectrumLayout,
  ParticleColorMode,
  ParticleLayerMode,
  WallpaperState,
} from '@/types/wallpaper'

type Tab = 'presets' | 'fx' | 'audio' | 'spectrum' | 'logo' | 'particles' | 'rain' | 'perf'

const TABS: { id: Tab; label: string }[] = [
  { id: 'presets', label: 'BG' },
  { id: 'fx', label: 'FX' },
  { id: 'audio', label: 'Audio' },
  { id: 'spectrum', label: 'Spectrum' },
  { id: 'logo', label: 'Logo' },
  { id: 'particles', label: 'Particles' },
  { id: 'rain', label: 'Rain' },
  { id: 'perf', label: 'Perf' },
]

// Keys scoped per tab for per-tab reset
const TAB_KEYS: Record<Tab, (keyof WallpaperState)[]> = {
  presets: ['imageUrl', 'imageScale', 'imagePositionX', 'imagePositionY', 'imageBassReactive', 'imageBassScaleIntensity'],
  fx: ['glitchIntensity', 'rgbShift', 'scanlineIntensity', 'parallaxStrength', 'audioSensitivity'],
  audio: ['fftSize', 'audioSmoothing'],
  spectrum: [
    'spectrumEnabled', 'spectrumLayout', 'spectrumShape', 'spectrumBarCount', 'spectrumBarWidth',
    'spectrumMinHeight', 'spectrumMaxHeight', 'spectrumSmoothing', 'spectrumOpacity',
    'spectrumGlowIntensity', 'spectrumShadowBlur', 'spectrumPrimaryColor', 'spectrumSecondaryColor',
    'spectrumColorMode', 'spectrumBandMode', 'spectrumMirror', 'spectrumPeakHold', 'spectrumPeakDecay',
    'spectrumRotationSpeed', 'spectrumRadius', 'spectrumInnerRadius',
  ],
  logo: [
    'logoEnabled', 'logoBaseSize', 'logoReactiveScaleIntensity', 'logoReactivitySpeed',
    'logoGlowColor', 'logoGlowBlur', 'logoShadowEnabled', 'logoShadowColor', 'logoShadowBlur',
    'logoBackdropEnabled', 'logoBackdropColor', 'logoBackdropOpacity', 'logoBackdropPadding',
  ],
  particles: [
    'particlesEnabled', 'particleLayerMode', 'particleCount', 'particleSpeed',
    'particleColorMode', 'particleColor1', 'particleColor2', 'particleOpacity',
    'particleSizeMin', 'particleSizeMax', 'particleGlow', 'particleGlowStrength',
    'particleFadeInOut', 'particleAudioReactive', 'particleAudioSizeBoost', 'particleAudioOpacityBoost',
  ],
  rain: ['rainEnabled', 'rainIntensity'],
  perf: ['performanceMode'],
}

const PERF_MODES: PerformanceMode[] = ['low', 'medium', 'high']
const COLOR_MODES: SpectrumColorMode[] = ['solid', 'gradient', 'rainbow']
const BAND_MODES: SpectrumBandMode[] = ['full', 'bass', 'mid', 'treble']
const SPECTRUM_SHAPES: SpectrumShape[] = ['bars', 'lines', 'wave', 'dots']
const SPECTRUM_LAYOUTS: SpectrumLayout[] = ['circular', 'horizontal']
const PARTICLE_COLOR_MODES: ParticleColorMode[] = ['solid', 'gradient', 'random']
const LAYER_MODES: ParticleLayerMode[] = ['background', 'foreground', 'both']

const CAPTURE_STATUS: Record<string, { label: string; color: string }> = {
  idle: { label: 'Not capturing', color: 'text-gray-500' },
  requesting: { label: 'Requesting...', color: 'text-yellow-400' },
  active: { label: 'Capturing audio', color: 'text-green-400' },
  denied: { label: 'Permission denied', color: 'text-red-400' },
  error: { label: 'Capture error', color: 'text-red-400' },
  'no-audio-track': { label: 'No audio track — share a tab with audio enabled', color: 'text-orange-400' },
}

function EnumButtons<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-2 py-0.5 text-xs rounded border capitalize transition-colors ${
            value === opt
              ? 'bg-cyan-500 border-cyan-500 text-black'
              : 'bg-transparent border-cyan-800 text-cyan-400 hover:border-cyan-500'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-cyan-400">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"
      />
    </div>
  )
}

function SectionDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 my-1">
      <div className="flex-1 h-px bg-cyan-900" />
      {label && <span className="text-xs text-cyan-700 uppercase tracking-widest">{label}</span>}
      <div className="flex-1 h-px bg-cyan-900" />
    </div>
  )
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-cyan-700 hover:text-cyan-500 transition-colors self-end"
      title="Reset this tab to defaults"
    >
      ↺ Reset tab
    </button>
  )
}

function LogoUploader() {
  const { setLogoUrl, setLogoEnabled } = useWallpaperStore()
  const ref = useRef<HTMLInputElement>(null)
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUrl(URL.createObjectURL(file))
    setLogoEnabled(true)
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-cyan-400">Logo Image (PNG/SVG)</span>
      <button
        onClick={() => ref.current?.click()}
        className="px-3 py-1 text-xs rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
      >
        Upload Logo
      </button>
      <input ref={ref} type="file" accept="image/*,.svg" onChange={handleFile} className="hidden" />
    </div>
  )
}

export default function ControlPanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('presets')
  const store = useWallpaperStore()
  const { startCapture, stopCapture, captureMode } = useAudioData()

  const captureStatus = CAPTURE_STATUS[store.audioCaptureState] ?? CAPTURE_STATUS['idle']
  const isCapturing = store.audioCaptureState === 'active'

  function resetTab() {
    const keys = TAB_KEYS[tab].filter(k => k !== 'imageUrl' && k !== 'logoUrl')
    store.resetSection(keys)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-full bg-cyan-500 text-black font-bold flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition-colors text-lg"
      >
        {open ? '×' : '⚙'}
      </button>

      {open && (
        <div className="absolute bottom-12 right-0 w-80 bg-black/95 border border-cyan-900 rounded-lg backdrop-blur-sm shadow-xl shadow-cyan-500/10 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-3 pb-2 border-b border-cyan-900 flex justify-between items-center">
            <span className="text-xs uppercase tracking-widest text-cyan-300 font-bold">
              Live Wallpaper
            </span>
            <span className="text-xs text-cyan-700">auto-saved</span>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-0.5 p-2 border-b border-cyan-900 bg-black/50">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  tab === t.id
                    ? 'bg-cyan-500 text-black font-bold'
                    : 'text-cyan-500 hover:text-cyan-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex flex-col gap-3 p-4 max-h-[65vh] overflow-y-auto">

            {/* ── BG / Presets ── */}
            {tab === 'presets' && (
              <>
                <ResetButton onClick={resetTab} />
                <PresetSelector />
                <SectionDivider label="Image" />
                <ImageUploader />
                <SliderControl label="Scale" value={store.imageScale} min={0.1} max={4} step={0.05} onChange={store.setImageScale} />
                <SliderControl label="Position X" value={store.imagePositionX} min={-1} max={1} step={0.02} onChange={store.setImagePositionX} />
                <SliderControl label="Position Y" value={store.imagePositionY} min={-1} max={1} step={0.02} onChange={store.setImagePositionY} />
                <SectionDivider label="Bass Reactive" />
                <ToggleControl label="Bass Zoom" value={store.imageBassReactive} onChange={store.setImageBassReactive} />
                {store.imageBassReactive && (
                  <SliderControl label="Zoom Intensity" value={store.imageBassScaleIntensity} min={0.05} max={1} step={0.05} onChange={store.setImageBassScaleIntensity} />
                )}
              </>
            )}

            {/* ── FX ── */}
            {tab === 'fx' && (
              <>
                <ResetButton onClick={resetTab} />
                <SliderControl label="Glitch Intensity" value={store.glitchIntensity} min={0} max={0.5} step={0.01} onChange={store.setGlitchIntensity} />
                <SliderControl label="RGB Shift" value={store.rgbShift} min={0} max={0.02} step={0.001} onChange={store.setRgbShift} />
                <SliderControl label="Scanlines" value={store.scanlineIntensity} min={0} max={0.5} step={0.01} onChange={store.setScanlineIntensity} />
                <SliderControl label="Parallax" value={store.parallaxStrength} min={0} max={0.1} step={0.005} onChange={store.setParallaxStrength} />
                <SliderControl label="Audio Sensitivity" value={store.audioSensitivity} min={0} max={5} step={0.1} onChange={store.setAudioSensitivity} />
              </>
            )}

            {/* ── Audio ── */}
            {tab === 'audio' && (
              <>
                <div className="flex flex-col gap-1">
                  <span className={`text-xs ${captureStatus.color}`}>{captureStatus.label}</span>
                  {store.audioCaptureState === 'no-audio-track' && (
                    <span className="text-xs text-gray-500">Tip: When sharing, choose a tab or window with audio playing.</span>
                  )}
                  {captureMode === 'microphone' && (
                    <span className="text-xs text-purple-400">Mobile mode — uses microphone input</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={startCapture}
                    disabled={isCapturing || store.audioCaptureState === 'requesting'}
                    className="flex-1 px-3 py-1.5 text-xs rounded border border-cyan-700 text-cyan-400 hover:border-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {store.audioCaptureState === 'requesting'
                      ? 'Requesting...'
                      : captureMode === 'microphone'
                        ? 'Capture Microphone'
                        : 'Capture Desktop Audio'
                    }
                  </button>
                  <button
                    onClick={stopCapture}
                    disabled={!isCapturing}
                    className="px-3 py-1.5 text-xs rounded border border-red-800 text-red-400 hover:border-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Stop
                  </button>
                </div>
                <SectionDivider />
                <ResetButton onClick={resetTab} />
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-cyan-400">FFT Size</span>
                  <EnumButtons<string>
                    options={['512', '1024', '2048', '4096']}
                    value={String(store.fftSize)}
                    onChange={(v) => store.setFftSize(Number(v))}
                  />
                </div>
                <SliderControl label="Smoothing" value={store.audioSmoothing} min={0} max={0.99} step={0.01} onChange={store.setAudioSmoothing} />
              </>
            )}

            {/* ── Spectrum ── */}
            {tab === 'spectrum' && (
              <>
                <ResetButton onClick={resetTab} />
                <ToggleControl label="Enabled" value={store.spectrumEnabled} onChange={store.setSpectrumEnabled} />
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-cyan-400">Layout</span>
                  <EnumButtons<SpectrumLayout> options={SPECTRUM_LAYOUTS} value={store.spectrumLayout} onChange={store.setSpectrumLayout} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-cyan-400">Shape</span>
                  <EnumButtons<SpectrumShape> options={SPECTRUM_SHAPES} value={store.spectrumShape} onChange={store.setSpectrumShape} />
                </div>

                <SectionDivider label="Bars" />
                <SliderControl label="Bar Count" value={store.spectrumBarCount} min={16} max={256} step={8} onChange={store.setSpectrumBarCount} />
                <SliderControl label="Bar Width" value={store.spectrumBarWidth} min={1} max={16} step={0.5} onChange={store.setSpectrumBarWidth} />
                <SliderControl label="Min Height" value={store.spectrumMinHeight} min={1} max={20} step={1} onChange={store.setSpectrumMinHeight} />
                <SliderControl label="Max Height" value={store.spectrumMaxHeight} min={20} max={500} step={5} onChange={store.setSpectrumMaxHeight} />

                {/* Circular-only controls */}
                {store.spectrumLayout === 'circular' && (
                  <>
                    <SectionDivider label="Circular" />
                    <SliderControl label="Inner Radius" value={store.spectrumInnerRadius} min={20} max={300} step={5} onChange={store.setSpectrumInnerRadius} />
                    <SliderControl label="Rotation Speed" value={store.spectrumRotationSpeed} min={-1} max={1} step={0.05} onChange={store.setSpectrumRotationSpeed} />
                    <ToggleControl label="Mirror (symmetrical)" value={store.spectrumMirror} onChange={store.setSpectrumMirror} />
                  </>
                )}

                {/* Horizontal-only controls */}
                {store.spectrumLayout === 'horizontal' && (
                  <>
                    <SectionDivider label="Horizontal" />
                    <ToggleControl label="Mirror (up+down)" value={store.spectrumMirror} onChange={store.setSpectrumMirror} />
                  </>
                )}

                <SectionDivider label="Appearance" />
                <SliderControl label="Smoothing" value={store.spectrumSmoothing} min={0} max={0.99} step={0.01} onChange={store.setSpectrumSmoothing} />
                <SliderControl label="Opacity" value={store.spectrumOpacity} min={0} max={1} step={0.05} onChange={store.setSpectrumOpacity} />
                <SliderControl label="Glow" value={store.spectrumGlowIntensity} min={0} max={3} step={0.1} onChange={store.setSpectrumGlowIntensity} />
                <SliderControl label="Shadow Blur" value={store.spectrumShadowBlur} min={0} max={60} step={2} onChange={store.setSpectrumShadowBlur} />
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-cyan-400">Color Mode</span>
                  <EnumButtons<SpectrumColorMode> options={COLOR_MODES} value={store.spectrumColorMode} onChange={store.setSpectrumColorMode} />
                </div>
                <ColorInput label="Primary Color" value={store.spectrumPrimaryColor} onChange={store.setSpectrumPrimaryColor} />
                <ColorInput label="Secondary Color" value={store.spectrumSecondaryColor} onChange={store.setSpectrumSecondaryColor} />
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-cyan-400">Band Mode</span>
                  <EnumButtons<SpectrumBandMode> options={BAND_MODES} value={store.spectrumBandMode} onChange={store.setSpectrumBandMode} />
                </div>
                <SectionDivider label="Peak" />
                <ToggleControl label="Peak Hold" value={store.spectrumPeakHold} onChange={store.setSpectrumPeakHold} />
                {store.spectrumPeakHold && (
                  <SliderControl label="Peak Decay" value={store.spectrumPeakDecay} min={0.001} max={0.02} step={0.001} onChange={store.setSpectrumPeakDecay} />
                )}
              </>
            )}

            {/* ── Logo ── */}
            {tab === 'logo' && (
              <>
                <ResetButton onClick={resetTab} />
                <ToggleControl label="Enabled" value={store.logoEnabled} onChange={store.setLogoEnabled} />
                <LogoUploader />
                <SectionDivider label="Size & Reactivity" />
                <SliderControl label="Base Size" value={store.logoBaseSize} min={20} max={400} step={5} onChange={store.setLogoBaseSize} />
                <SliderControl label="Reactive Scale" value={store.logoReactiveScaleIntensity} min={0} max={3} step={0.1} onChange={store.setLogoReactiveScaleIntensity} />
                <SliderControl label="Reactivity Speed" value={store.logoReactivitySpeed} min={0.01} max={1} step={0.01} onChange={store.setLogoReactivitySpeed} />
                <SectionDivider label="Glow" />
                <ColorInput label="Glow Color" value={store.logoGlowColor} onChange={store.setLogoGlowColor} />
                <SliderControl label="Glow Blur" value={store.logoGlowBlur} min={0} max={80} step={2} onChange={store.setLogoGlowBlur} />
                <ToggleControl label="Shadow" value={store.logoShadowEnabled} onChange={store.setLogoShadowEnabled} />
                {store.logoShadowEnabled && (
                  <>
                    <ColorInput label="Shadow Color" value={store.logoShadowColor} onChange={store.setLogoShadowColor} />
                    <SliderControl label="Shadow Blur" value={store.logoShadowBlur} min={0} max={100} step={5} onChange={store.setLogoShadowBlur} />
                  </>
                )}
                <SectionDivider label="Backdrop" />
                <ToggleControl label="Backdrop Circle" value={store.logoBackdropEnabled} onChange={store.setLogoBackdropEnabled} />
                {store.logoBackdropEnabled && (
                  <>
                    <ColorInput label="Backdrop Color" value={store.logoBackdropColor} onChange={store.setLogoBackdropColor} />
                    <SliderControl label="Backdrop Opacity" value={store.logoBackdropOpacity} min={0} max={1} step={0.05} onChange={store.setLogoBackdropOpacity} />
                    <SliderControl label="Backdrop Padding" value={store.logoBackdropPadding} min={0} max={80} step={2} onChange={store.setLogoBackdropPadding} />
                  </>
                )}
              </>
            )}

            {/* ── Particles ── */}
            {tab === 'particles' && (
              <>
                <ResetButton onClick={resetTab} />
                <ToggleControl label="Enabled" value={store.particlesEnabled} onChange={store.setParticlesEnabled} />
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-cyan-400">Layer Mode</span>
                  <EnumButtons<ParticleLayerMode> options={LAYER_MODES} value={store.particleLayerMode} onChange={store.setParticleLayerMode} />
                </div>
                <SliderControl label="Count" value={store.particleCount} min={0} max={200} step={10} onChange={store.setParticleCount} />
                <SliderControl label="Speed" value={store.particleSpeed} min={0} max={5} step={0.1} onChange={store.setParticleSpeed} />
                <SectionDivider label="Appearance" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-cyan-400">Color Mode</span>
                  <EnumButtons<ParticleColorMode> options={PARTICLE_COLOR_MODES} value={store.particleColorMode} onChange={store.setParticleColorMode} />
                </div>
                <ColorInput label="Color 1" value={store.particleColor1} onChange={store.setParticleColor1} />
                <ColorInput label="Color 2" value={store.particleColor2} onChange={store.setParticleColor2} />
                <SliderControl label="Opacity" value={store.particleOpacity} min={0} max={1} step={0.05} onChange={store.setParticleOpacity} />
                <SliderControl label="Size Min" value={store.particleSizeMin} min={1} max={60} step={1} onChange={store.setParticleSizeMin} />
                <SliderControl label="Size Max" value={store.particleSizeMax} min={1} max={60} step={1} onChange={store.setParticleSizeMax} />
                <ToggleControl label="Fade In/Out" value={store.particleFadeInOut} onChange={store.setParticleFadeInOut} />
                <ToggleControl label="Glow" value={store.particleGlow} onChange={store.setParticleGlow} />
                {store.particleGlow && (
                  <SliderControl label="Glow Strength" value={store.particleGlowStrength} min={0} max={2} step={0.1} onChange={store.setParticleGlowStrength} />
                )}
                <SectionDivider label="Audio" />
                <ToggleControl label="Audio Reactive" value={store.particleAudioReactive} onChange={store.setParticleAudioReactive} />
                {store.particleAudioReactive && (
                  <>
                    <SliderControl label="Audio Size Boost" value={store.particleAudioSizeBoost} min={0} max={30} step={1} onChange={store.setParticleAudioSizeBoost} />
                    <SliderControl label="Audio Opacity Boost" value={store.particleAudioOpacityBoost} min={0} max={1} step={0.05} onChange={store.setParticleAudioOpacityBoost} />
                  </>
                )}
              </>
            )}

            {/* ── Rain ── */}
            {tab === 'rain' && (
              <>
                <ResetButton onClick={resetTab} />
                <ToggleControl label="Rain Enabled" value={store.rainEnabled} onChange={store.setRainEnabled} />
                <SliderControl label="Rain Intensity" value={store.rainIntensity} min={0} max={1} step={0.05} onChange={store.setRainIntensity} />
                <span className="text-xs text-gray-500">Rain is disabled in Low performance mode.</span>
              </>
            )}

            {/* ── Performance ── */}
            {tab === 'perf' && (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-cyan-400 uppercase tracking-widest">Performance Mode</span>
                  <div className="flex gap-2">
                    {PERF_MODES.map((mode) => (
                      <button
                        key={mode}
                        onClick={() => store.setPerformanceMode(mode)}
                        className={`flex-1 py-1 text-xs rounded border capitalize transition-colors ${
                          store.performanceMode === mode
                            ? 'bg-cyan-500 border-cyan-500 text-black'
                            : 'bg-transparent border-cyan-800 text-cyan-400 hover:border-cyan-500'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    Low: max 20 particles, no rain.<br />
                    Medium: max 80 particles.<br />
                    High: max 200 particles.
                  </span>
                </div>
                <SectionDivider />
                <button
                  onClick={store.reset}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors text-left"
                >
                  Reset ALL settings to defaults
                </button>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  )
}
