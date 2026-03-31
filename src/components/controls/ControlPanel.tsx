import { useEffect, useState } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import type { WallpaperState } from '@/types/wallpaper'
import EditorOverlay from './EditorOverlay'
import { DEFAULT_STATE } from '@/lib/constants'
import type { ControlPanelAnchor } from '@/types/wallpaper'
import { AudioTab, BgTab, ControlTabSuspense, ExportTab, FiltersTab, FxTab, GlitchTab, LayersTab, LogoTab, OverlaysTab, ParticlesTab, PerfTab, RainTab, SpectrumTab } from './controlTabsLazy'

type TabId = 'layers' | 'presets' | 'filters' | 'fx' | 'glitch' | 'audio' | 'spectrum' | 'logo' | 'particles' | 'rain' | 'overlays' | 'export' | 'perf'

const TAB_KEYS: Record<TabId, (keyof WallpaperState)[]> = {
  layers:    ['layerZIndices'],
  presets:   ['imageScale', 'imagePositionX', 'imagePositionY', 'imageBassReactive',
               'imageBassScaleIntensity', 'imageFitMode', 'imageMirror',
               'globalBackgroundScale', 'globalBackgroundPositionX', 'globalBackgroundPositionY', 'globalBackgroundFitMode',
               'globalBackgroundOpacity', 'globalBackgroundBrightness', 'globalBackgroundContrast',
               'globalBackgroundSaturation', 'globalBackgroundBlur', 'globalBackgroundHueRotate',
               'slideshowEnabled', 'slideshowInterval', 'slideshowTransitionDuration', 'slideshowTransitionType',
               'slideshowTransitionIntensity', 'slideshowTransitionAudioDrive'],
  filters:   ['filterTarget', 'filterBrightness', 'filterContrast', 'filterSaturation', 'filterBlur', 'filterHueRotate',
               'scanlineIntensity', 'scanlineMode', 'scanlineSpacing', 'scanlineThickness', 'rgbShift', 'noiseIntensity'],
  fx:        ['parallaxStrength', 'audioSensitivity'],
  glitch:    ['glitchIntensity', 'glitchFrequency', 'glitchStyle', 'glitchAudioReactive', 'glitchAudioSensitivity',
               'rgbShiftAudioReactive', 'rgbShiftAudioSensitivity'],
  audio:     ['audioPaused', 'motionPaused', 'fftSize', 'audioSmoothing',
               'audioTrackTitleLayoutMode', 'audioTrackTitleFontStyle', 'audioTrackTitleUppercase',
               'audioTrackTitleEnabled', 'audioTrackTitlePositionX', 'audioTrackTitlePositionY',
               'audioTrackTitleFontSize', 'audioTrackTitleLetterSpacing', 'audioTrackTitleWidth', 'audioTrackTitleOpacity', 'audioTrackTitleScrollSpeed',
               'audioTrackTitleRgbShift', 'audioTrackTitleScanlineIntensity', 'audioTrackTitleScanlineSpacing', 'audioTrackTitleScanlineThickness',
               'audioTrackTitleTextColor', 'audioTrackTitleGlowColor', 'audioTrackTitleGlowBlur',
               'audioTrackTitleBackdropEnabled', 'audioTrackTitleBackdropColor', 'audioTrackTitleBackdropOpacity', 'audioTrackTitleBackdropPadding',
               'audioTrackTitleFilterBrightness', 'audioTrackTitleFilterContrast', 'audioTrackTitleFilterSaturation',
               'audioTrackTitleFilterBlur', 'audioTrackTitleFilterHueRotate'],
  spectrum:  ['spectrumEnabled', 'spectrumFollowLogo', 'spectrumCircularClone', 'spectrumLayout', 'spectrumShape',
               'spectrumSpan', 'spectrumCloneOpacity', 'spectrumCloneScale', 'spectrumCloneGap', 'spectrumCloneGlowIntensity',
               'spectrumClonePrimaryColor', 'spectrumCloneSecondaryColor', 'spectrumCloneColorMode', 'spectrumCloneBarCount', 'spectrumCloneShape',
               'spectrumBarCount', 'spectrumBarWidth', 'spectrumMinHeight', 'spectrumMaxHeight',
               'spectrumSmoothing', 'spectrumOpacity', 'spectrumGlowIntensity', 'spectrumShadowBlur',
               'spectrumPrimaryColor', 'spectrumSecondaryColor', 'spectrumColorMode', 'spectrumBandMode',
               'spectrumDirection', 'spectrumMirror', 'spectrumPeakHold', 'spectrumPeakDecay', 'spectrumRotationSpeed',
               'spectrumRadius', 'spectrumInnerRadius'],
  logo:      ['logoEnabled', 'logoBaseSize', 'logoPositionX', 'logoPositionY', 'logoAudioSensitivity', 'logoReactiveScaleIntensity',
               'logoBandMode', 'logoReactivitySpeed', 'logoAttack', 'logoRelease', 'logoMinScale', 'logoMaxScale', 'logoPunch',
               'logoPeakWindow', 'logoPeakFloor',
               'logoGlowColor', 'logoGlowBlur', 'logoShadowEnabled',
               'logoShadowColor', 'logoShadowBlur', 'logoBackdropEnabled', 'logoBackdropColor',
               'logoBackdropOpacity', 'logoBackdropPadding'],
  particles: ['particlesEnabled', 'particleLayerMode', 'particleCount', 'particleSpeed',
               'particleShape', 'particleColorMode', 'particleColor1', 'particleColor2', 'particleOpacity',
               'particleFilterBrightness', 'particleFilterContrast', 'particleFilterSaturation', 'particleFilterBlur', 'particleFilterHueRotate',
               'particleScanlineIntensity', 'particleScanlineSpacing', 'particleScanlineThickness',
               'particleRotationIntensity', 'particleRotationDirection',
               'particleSizeMin', 'particleSizeMax', 'particleGlow', 'particleGlowStrength',
               'particleFadeInOut', 'particleAudioReactive', 'particleAudioSizeBoost',
               'particleAudioOpacityBoost'],
  rain:      ['rainEnabled', 'rainIntensity', 'rainDropCount', 'rainAngle', 'rainMeshRotationZ',
               'rainColor', 'rainColorMode', 'rainParticleType', 'rainLength', 'rainWidth',
               'rainBlur', 'rainSpeed', 'rainVariation'],
  overlays:  [],
  export:    [],
  perf:      ['performanceMode'],
}

function openPreview() {
  const base = window.location.href.replace(/#.*$/, '')
  window.open(base + '#/preview', '_blank')
}

const PANEL_ANCHOR_WRAPPER_CLASS: Record<ControlPanelAnchor, string> = {
  'top-left': 'top-6 left-6',
  'top-right': 'top-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-right': 'bottom-6 right-6',
}

const PANEL_ANCHOR_OVERLAY_CLASS: Record<ControlPanelAnchor, string> = {
  'top-left': 'top-12 left-0',
  'top-right': 'top-12 right-0',
  'bottom-left': 'bottom-12 left-0',
  'bottom-right': 'bottom-12 right-0',
}

export default function ControlPanel() {
  const [open, setOpen] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [tab, setTab] = useState<TabId>('presets')
  const t = useT()
  const {
    resetSection,
    language,
    setLanguage,
    selectedOverlayId,
    overlays,
    updateOverlay,
    setSelectedOverlayId,
    setEditorPanelOpen,
    setEditorOverlayOpen,
    controlPanelAnchor,
  } = useWallpaperStore()

  useEffect(() => {
    setEditorPanelOpen(open)
  }, [open, setEditorPanelOpen])

  useEffect(() => {
    setEditorOverlayOpen(maximized)
  }, [maximized, setEditorOverlayOpen])

  useEffect(() => (
    () => {
      useWallpaperStore.setState({
        editorPanelOpen: false,
        editorOverlayOpen: false,
      })
    }
  ), [])

  useEffect(() => {
    if (!open && !maximized) {
      setSelectedOverlayId(null)
    }
  }, [maximized, open, setSelectedOverlayId])

  const TABS: { id: TabId; label: string }[] = [
    { id: 'layers',    label: t.tab_layers },
    { id: 'presets',   label: t.tab_presets },
    { id: 'filters',   label: t.tab_filters },
    { id: 'fx',        label: t.tab_fx },
    { id: 'glitch',    label: t.tab_glitch },
    { id: 'audio',     label: t.tab_audio },
    { id: 'spectrum',  label: t.tab_spectrum },
    { id: 'logo',      label: t.tab_logo },
    { id: 'particles', label: t.tab_particles },
    { id: 'rain',      label: t.tab_rain },
    { id: 'overlays',  label: t.tab_overlays },
    { id: 'export',    label: t.tab_export },
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
        blendMode: 'normal',
        cropShape: 'rectangle',
        edgeFade: 0.08,
        edgeBlur: 0,
        edgeGlow: 0.12,
      })
      return
    }

    resetSection(TAB_KEYS[tab].filter((k) => !['imageUrl', 'logoUrl'].includes(k as string)))
  }

  void DEFAULT_STATE

  return (
    <>
      {maximized && <EditorOverlay onClose={() => setMaximized(false)} />}
    <div className={`fixed z-50 ${PANEL_ANCHOR_WRAPPER_CLASS[controlPanelAnchor]}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-10 h-10 rounded-full bg-cyan-500 text-black font-bold flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:bg-cyan-400 transition-colors text-lg"
        title={open ? 'Close panel' : 'Open editor'}
      >
        {open ? '×' : '⚙'}
      </button>

      {open && (
        <div className={`absolute w-96 bg-black/95 border border-cyan-900 rounded-lg backdrop-blur-sm shadow-xl shadow-cyan-500/10 flex flex-col overflow-hidden ${PANEL_ANCHOR_OVERLAY_CLASS[controlPanelAnchor]}`}>

          {/* Header */}
          <div className="px-4 pt-3 pb-2 border-b border-cyan-900 flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-cyan-300 font-bold">{t.title}</span>
            </div>
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
            <ControlTabSuspense>
              {tab === 'layers'    && <LayersTab    onReset={resetTab} />}
              {tab === 'presets'   && <BgTab        onReset={resetTab} />}
              {tab === 'filters'   && <FiltersTab   onReset={resetTab} />}
              {tab === 'fx'        && <FxTab        onReset={resetTab} />}
              {tab === 'glitch'    && <GlitchTab    onReset={resetTab} />}
              {tab === 'audio'     && <AudioTab     onReset={resetTab} />}
              {tab === 'spectrum'  && <SpectrumTab  onReset={resetTab} />}
              {tab === 'logo'      && <LogoTab      onReset={resetTab} />}
              {tab === 'particles' && <ParticlesTab onReset={resetTab} />}
              {tab === 'rain'      && <RainTab      onReset={resetTab} />}
              {tab === 'overlays'  && <OverlaysTab  onReset={resetTab} />}
              {tab === 'export'    && <ExportTab />}
              {tab === 'perf'      && <PerfTab />}
            </ControlTabSuspense>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
