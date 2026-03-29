import { useState } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import type { WallpaperState } from '@/types/wallpaper'
import BgTab from './tabs/BgTab'
import FxTab from './tabs/FxTab'
import GlitchTab from './tabs/GlitchTab'
import AudioTab from './tabs/AudioTab'
import SpectrumTab from './tabs/SpectrumTab'
import LogoTab from './tabs/LogoTab'
import ParticlesTab from './tabs/ParticlesTab'
import RainTab from './tabs/RainTab'
import LayersTab from './tabs/LayersTab'
import OverlaysTab from './tabs/OverlaysTab'
import PerfTab from './tabs/PerfTab'
import EditorOverlay from './EditorOverlay'
import { DEFAULT_STATE } from '@/lib/constants'

type TabId = 'layers' | 'presets' | 'fx' | 'glitch' | 'audio' | 'spectrum' | 'logo' | 'particles' | 'rain' | 'overlays' | 'perf'

const TAB_KEYS: Record<TabId, (keyof WallpaperState)[]> = {
  layers:    ['layerZIndices'],
  presets:   ['imageScale', 'imagePositionX', 'imagePositionY', 'imageBassReactive',
               'imageBassScaleIntensity', 'imageFitMode', 'slideshowEnabled', 'slideshowInterval'],
  fx:        ['scanlineIntensity', 'scanlineMode', 'scanlineSpacing', 'scanlineThickness', 'parallaxStrength', 'audioSensitivity'],
  glitch:    ['glitchIntensity', 'glitchFrequency', 'glitchStyle', 'glitchAudioReactive', 'glitchAudioSensitivity',
               'rgbShift', 'rgbShiftAudioReactive', 'rgbShiftAudioSensitivity', 'noiseIntensity'],
  audio:     ['fftSize', 'audioSmoothing'],
  spectrum:  ['spectrumEnabled', 'spectrumFollowLogo', 'spectrumLayout', 'spectrumShape',
               'spectrumBarCount', 'spectrumBarWidth', 'spectrumMinHeight', 'spectrumMaxHeight',
               'spectrumSmoothing', 'spectrumOpacity', 'spectrumGlowIntensity', 'spectrumShadowBlur',
               'spectrumPrimaryColor', 'spectrumSecondaryColor', 'spectrumColorMode', 'spectrumBandMode',
               'spectrumDirection', 'spectrumMirror', 'spectrumPeakHold', 'spectrumPeakDecay', 'spectrumRotationSpeed',
               'spectrumRadius', 'spectrumInnerRadius'],
  logo:      ['logoEnabled', 'logoBaseSize', 'logoAudioSensitivity', 'logoReactiveScaleIntensity',
               'logoReactivitySpeed', 'logoGlowColor', 'logoGlowBlur', 'logoShadowEnabled',
               'logoShadowColor', 'logoShadowBlur', 'logoBackdropEnabled', 'logoBackdropColor',
               'logoBackdropOpacity', 'logoBackdropPadding'],
  particles: ['particlesEnabled', 'particleLayerMode', 'particleCount', 'particleSpeed',
               'particleShape', 'particleColorMode', 'particleColor1', 'particleColor2', 'particleOpacity',
               'particleSizeMin', 'particleSizeMax', 'particleGlow', 'particleGlowStrength',
               'particleFadeInOut', 'particleAudioReactive', 'particleAudioSizeBoost',
               'particleAudioOpacityBoost'],
  rain:      ['rainEnabled', 'rainIntensity', 'rainDropCount', 'rainAngle', 'rainMeshRotationZ',
               'rainColor', 'rainColorMode', 'rainParticleType', 'rainLength', 'rainWidth',
               'rainBlur', 'rainSpeed', 'rainVariation'],
  overlays:  [],
  perf:      ['performanceMode'],
}

function openPreview() {
  const base = window.location.href.replace(/#.*$/, '')
  window.open(base + '#/preview', '_blank')
}

export default function ControlPanel() {
  const [open, setOpen] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [tab, setTab] = useState<TabId>('presets')
  const t = useT()
  const { resetSection, language, setLanguage, selectedOverlayId, overlays, updateOverlay } = useWallpaperStore()

  const TABS: { id: TabId; label: string }[] = [
    { id: 'layers',    label: t.tab_layers },
    { id: 'presets',   label: t.tab_presets },
    { id: 'fx',        label: t.tab_fx },
    { id: 'glitch',    label: t.tab_glitch },
    { id: 'audio',     label: t.tab_audio },
    { id: 'spectrum',  label: t.tab_spectrum },
    { id: 'logo',      label: t.tab_logo },
    { id: 'particles', label: t.tab_particles },
    { id: 'rain',      label: t.tab_rain },
    { id: 'overlays',  label: t.tab_overlays },
    { id: 'perf',      label: t.tab_perf },
  ]

  function resetTab() {
    if (tab === 'overlays') {
      const selected = overlays.find((overlay) => overlay.id === selectedOverlayId)
      if (!selected) return
      updateOverlay(selected.id, {
        enabled: true,
        positionX: 0,
        positionY: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
      })
      return
    }

    resetSection(TAB_KEYS[tab].filter((k) => !['imageUrl', 'logoUrl'].includes(k as string)))
  }

  void DEFAULT_STATE

  return (
    <>
      {maximized && <EditorOverlay onClose={() => setMaximized(false)} />}
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-full bg-cyan-500 text-black font-bold flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition-colors text-lg"
        title={open ? 'Close panel' : 'Open editor'}
      >
        {open ? '×' : '⚙'}
      </button>

      {open && (
        <div className="absolute bottom-12 right-0 w-96 bg-black/95 border border-cyan-900 rounded-lg backdrop-blur-sm shadow-xl shadow-cyan-500/10 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="px-4 pt-3 pb-2 border-b border-cyan-900 flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-cyan-300 font-bold flex-1">{t.title}</span>
            <span className="text-xs text-cyan-800">{t.autoSaved}</span>
            <button
              onClick={openPreview}
              title="Open preview in new tab"
              className="text-xs px-2 py-0.5 rounded border border-cyan-800 text-cyan-500 hover:border-cyan-500 hover:text-cyan-300 transition-colors"
            >
              ▶
            </button>
            <button
              onClick={() => setMaximized(true)}
              title="Full editor"
              className="text-xs px-2 py-0.5 rounded border border-cyan-800 text-cyan-500 hover:border-cyan-500 hover:text-cyan-300 transition-colors"
            >
              ⛶
            </button>
            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="text-xs px-1.5 py-0.5 rounded border border-cyan-800 text-cyan-500 hover:border-cyan-500 transition-colors"
              title="Toggle language / Cambiar idioma"
            >
              {language === 'en' ? 'ES' : 'EN'}
            </button>
          </div>

          {/* Tabs — horizontal scroll, no wrap */}
          <div
            className="flex p-1.5 border-b border-cyan-900 bg-black/50 gap-0.5"
            style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-2.5 py-1 text-xs rounded whitespace-nowrap transition-colors flex-shrink-0 ${
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
            {tab === 'layers'    && <LayersTab    onReset={resetTab} />}
            {tab === 'presets'   && <BgTab        onReset={resetTab} />}
            {tab === 'fx'        && <FxTab        onReset={resetTab} />}
            {tab === 'glitch'    && <GlitchTab    onReset={resetTab} />}
            {tab === 'audio'     && <AudioTab     onReset={resetTab} />}
            {tab === 'spectrum'  && <SpectrumTab  onReset={resetTab} />}
            {tab === 'logo'      && <LogoTab      onReset={resetTab} />}
            {tab === 'particles' && <ParticlesTab onReset={resetTab} />}
            {tab === 'rain'      && <RainTab      onReset={resetTab} />}
            {tab === 'overlays'  && <OverlaysTab  onReset={resetTab} />}
            {tab === 'perf'      && <PerfTab />}
          </div>
        </div>
      )}
    </div>
    </>
  )
}
