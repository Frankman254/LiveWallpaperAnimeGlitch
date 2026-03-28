import { useState } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import type { WallpaperState } from '@/types/wallpaper'
import BgTab from './tabs/BgTab'
import FxTab from './tabs/FxTab'
import AudioTab from './tabs/AudioTab'
import SpectrumTab from './tabs/SpectrumTab'
import LogoTab from './tabs/LogoTab'
import ParticlesTab from './tabs/ParticlesTab'
import RainTab from './tabs/RainTab'
import PerfTab from './tabs/PerfTab'
import { DEFAULT_STATE } from '@/lib/constants'

type TabId = 'presets' | 'fx' | 'audio' | 'spectrum' | 'logo' | 'particles' | 'rain' | 'perf'

/** Keys reset per tab (excludes blob URLs reset separately) */
const TAB_KEYS: Record<TabId, (keyof WallpaperState)[]> = {
  presets:   ['imageScale', 'imagePositionX', 'imagePositionY', 'imageBassReactive', 'imageBassScaleIntensity', 'slideshowEnabled', 'slideshowInterval'],
  fx:        ['glitchIntensity', 'rgbShift', 'scanlineIntensity', 'parallaxStrength', 'audioSensitivity'],
  audio:     ['fftSize', 'audioSmoothing'],
  spectrum:  ['spectrumEnabled', 'spectrumFollowLogo', 'spectrumLayout', 'spectrumShape', 'spectrumBarCount', 'spectrumBarWidth',
               'spectrumMinHeight', 'spectrumMaxHeight', 'spectrumSmoothing', 'spectrumOpacity',
               'spectrumGlowIntensity', 'spectrumShadowBlur', 'spectrumPrimaryColor', 'spectrumSecondaryColor',
               'spectrumColorMode', 'spectrumBandMode', 'spectrumMirror', 'spectrumPeakHold', 'spectrumPeakDecay',
               'spectrumRotationSpeed', 'spectrumRadius', 'spectrumInnerRadius'],
  logo:      ['logoEnabled', 'logoBaseSize', 'logoAudioSensitivity', 'logoReactiveScaleIntensity', 'logoReactivitySpeed',
               'logoGlowColor', 'logoGlowBlur', 'logoShadowEnabled', 'logoShadowColor', 'logoShadowBlur',
               'logoBackdropEnabled', 'logoBackdropColor', 'logoBackdropOpacity', 'logoBackdropPadding'],
  particles: ['particlesEnabled', 'particleLayerMode', 'particleCount', 'particleSpeed', 'particleColorMode',
               'particleColor1', 'particleColor2', 'particleOpacity', 'particleSizeMin', 'particleSizeMax',
               'particleGlow', 'particleGlowStrength', 'particleFadeInOut', 'particleAudioReactive',
               'particleAudioSizeBoost', 'particleAudioOpacityBoost'],
  rain:      ['rainEnabled', 'rainIntensity', 'rainDropCount', 'rainAngle', 'rainMeshRotationZ',
               'rainColor', 'rainParticleType', 'rainLength', 'rainWidth', 'rainBlur', 'rainSpeed'],
  perf:      ['performanceMode'],
}

export default function ControlPanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<TabId>('presets')
  const t = useT()
  const { resetSection, language, setLanguage } = useWallpaperStore()

  const TABS: { id: TabId; label: string }[] = [
    { id: 'presets',   label: t.tab_presets },
    { id: 'fx',        label: t.tab_fx },
    { id: 'audio',     label: t.tab_audio },
    { id: 'spectrum',  label: t.tab_spectrum },
    { id: 'logo',      label: t.tab_logo },
    { id: 'particles', label: t.tab_particles },
    { id: 'rain',      label: t.tab_rain },
    { id: 'perf',      label: t.tab_perf },
  ]

  function resetTab() {
    resetSection(TAB_KEYS[tab].filter((k) => !['imageUrl', 'logoUrl'].includes(k as string)))
  }

  // Restore per-tab defaults for numeric/bool fields from DEFAULT_STATE
  void DEFAULT_STATE // ensure import is used

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
            <span className="text-xs uppercase tracking-widest text-cyan-300 font-bold">{t.title}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-cyan-700">{t.autoSaved}</span>
              <button
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="text-xs px-1.5 py-0.5 rounded border border-cyan-800 text-cyan-500 hover:border-cyan-500 transition-colors"
                title="Toggle language / Cambiar idioma"
              >
                {language === 'en' ? 'ES' : 'EN'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-0.5 p-2 border-b border-cyan-900 bg-black/50">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  tab === t.id ? 'bg-cyan-500 text-black font-bold' : 'text-cyan-500 hover:text-cyan-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex flex-col gap-3 p-4 max-h-[65vh] overflow-y-auto">
            {tab === 'presets'   && <BgTab        onReset={resetTab} />}
            {tab === 'fx'        && <FxTab        onReset={resetTab} />}
            {tab === 'audio'     && <AudioTab     onReset={resetTab} />}
            {tab === 'spectrum'  && <SpectrumTab  onReset={resetTab} />}
            {tab === 'logo'      && <LogoTab      onReset={resetTab} />}
            {tab === 'particles' && <ParticlesTab onReset={resetTab} />}
            {tab === 'rain'      && <RainTab      onReset={resetTab} />}
            {tab === 'perf'      && <PerfTab />}
          </div>
        </div>
      )}
    </div>
  )
}
