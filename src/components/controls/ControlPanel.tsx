import { useEffect, useState } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import type { WallpaperState } from '@/types/wallpaper'
import EditorOverlay from './EditorOverlay'
import { DEFAULT_STATE } from '@/lib/constants'
import type { ControlPanelAnchor } from '@/types/wallpaper'
import { EDITOR_THEME_CLASSES } from './editorTheme'
import { AudioTab, BgTab, ControlTabSuspense, DiagnosticsTab, ExportTab, FiltersTab, LayersTab, LogoTab, OverlaysTab, ParticlesTab, PerfTab, RainTab, SpectrumTab, TrackTitleTab } from './controlTabsLazy'

type TabId = 'layers' | 'presets' | 'filters' | 'audio' | 'track' | 'spectrum' | 'logo' | 'diagnostics' | 'particles' | 'rain' | 'overlays' | 'export' | 'perf'

const TAB_KEYS: Record<TabId, (keyof WallpaperState)[]> = {
  layers:    ['layerZIndices'],
  presets:   ['imageScale', 'imagePositionX', 'imagePositionY', 'imageBassReactive',
               'backgroundImageEnabled', 'imageOpacity',
               'imageBassScaleIntensity', 'imageAudioReactiveDecay',
               'imageBassAttack', 'imageBassRelease', 'imageBassReactivitySpeed', 'imageBassPeakWindow',
               'imageBassPeakFloor', 'imageBassPunch', 'imageBassReactiveScaleIntensity',
               'imageAudioChannel', 'imageFitMode', 'imageMirror',
               'parallaxStrength',
               'globalBackgroundEnabled',
               'globalBackgroundScale', 'globalBackgroundPositionX', 'globalBackgroundPositionY', 'globalBackgroundFitMode',
               'globalBackgroundOpacity', 'globalBackgroundBrightness', 'globalBackgroundContrast',
               'globalBackgroundSaturation', 'globalBackgroundBlur', 'globalBackgroundHueRotate',
               'slideshowEnabled', 'slideshowInterval', 'slideshowTransitionDuration', 'slideshowTransitionType',
               'slideshowTransitionIntensity', 'slideshowTransitionAudioDrive', 'slideshowTransitionAudioChannel'],
  filters:   ['filterTarget', 'filterBrightness', 'filterContrast', 'filterSaturation', 'filterBlur', 'filterHueRotate',
               'scanlineIntensity', 'scanlineMode', 'scanlineSpacing', 'scanlineThickness',
               'rgbShift', 'noiseIntensity', 'rgbShiftAudioReactive', 'rgbShiftAudioSensitivity', 'rgbShiftAudioChannel'],
  audio:     ['audioPaused', 'motionPaused', 'fftSize', 'audioSmoothing', 'audioChannelSmoothing', 'audioSelectedChannelSmoothing',
               'audioAutoKickThreshold', 'audioAutoSwitchHoldMs'],
  track:     ['audioTrackTitleLayoutMode', 'audioTrackTitleFontStyle', 'audioTrackTitleUppercase',
               'audioTrackTitleEnabled', 'audioTrackTitlePositionX', 'audioTrackTitlePositionY',
               'audioTrackTitleFontSize', 'audioTrackTitleLetterSpacing', 'audioTrackTitleWidth', 'audioTrackTitleOpacity', 'audioTrackTitleScrollSpeed',
               'audioTrackTitleRgbShift',
               'audioTrackTitleTextColor', 'audioTrackTitleGlowColor', 'audioTrackTitleGlowBlur',
               'audioTrackTitleBackdropEnabled', 'audioTrackTitleBackdropColor', 'audioTrackTitleBackdropOpacity', 'audioTrackTitleBackdropPadding',
               'audioTrackTitleFilterBrightness', 'audioTrackTitleFilterContrast', 'audioTrackTitleFilterSaturation',
               'audioTrackTitleFilterBlur', 'audioTrackTitleFilterHueRotate'],
  spectrum:  ['spectrumEnabled', 'spectrumMode', 'spectrumLinearOrientation', 'spectrumLinearDirection', 'spectrumRadialShape', 'spectrumRadialAngle',
               'spectrumRadialFitLogo', 'spectrumFollowLogo', 'spectrumLogoGap', 'spectrumCircularClone', 'spectrumShape', 'spectrumSpan',
               'spectrumCloneOpacity', 'spectrumCloneScale', 'spectrumCloneGap', 'spectrumCloneStyle', 'spectrumCloneRadialShape', 'spectrumCloneRadialAngle', 'spectrumCloneBarCount', 'spectrumCloneBarWidth',
               'spectrumBarCount', 'spectrumBarWidth', 'spectrumMinHeight', 'spectrumMaxHeight',
               'spectrumSmoothing', 'spectrumOpacity', 'spectrumGlowIntensity', 'spectrumShadowBlur',
               'spectrumPrimaryColor', 'spectrumSecondaryColor', 'spectrumColorMode', 'spectrumBandMode',
               'spectrumMirror', 'spectrumPeakHold', 'spectrumPeakDecay', 'spectrumRotationSpeed', 'spectrumInnerRadius',
               'spectrumPositionX', 'spectrumPositionY'],
  logo:      ['logoEnabled', 'logoBaseSize', 'logoPositionX', 'logoPositionY', 'logoAudioSensitivity', 'logoReactiveScaleIntensity',
               'logoBandMode', 'logoReactivitySpeed', 'logoAttack', 'logoRelease', 'logoMinScale', 'logoMaxScale', 'logoPunch',
               'logoPeakWindow', 'logoPeakFloor',
               'logoGlowColor', 'logoGlowBlur', 'logoShadowEnabled',
               'logoShadowColor', 'logoShadowBlur',                'logoBackdropEnabled', 'logoBackdropColor',
               'logoBackdropOpacity', 'logoBackdropPadding'],
  diagnostics: ['showBackgroundScaleMeter', 'showSpectrumDiagnosticsHud', 'showLogoDiagnosticsHud'],
  particles: ['particlesEnabled', 'particleLayerMode', 'particleCount', 'particleSpeed',
               'particleShape', 'particleColorMode', 'particleColor1', 'particleColor2', 'particleOpacity',
               'particleFilterBrightness', 'particleFilterContrast', 'particleFilterSaturation', 'particleFilterBlur', 'particleFilterHueRotate',
               'particleScanlineIntensity', 'particleScanlineSpacing', 'particleScanlineThickness',
               'particleRotationIntensity', 'particleRotationDirection',
               'particleSizeMin', 'particleSizeMax', 'particleGlow', 'particleGlowStrength',
               'particleFadeInOut', 'particleAudioReactive', 'particleAudioChannel', 'particleAudioSizeBoost',
               'particleAudioOpacityBoost'],
  rain:      ['rainEnabled', 'rainIntensity', 'rainDropCount', 'rainAngle', 'rainMeshRotationZ',
               'rainColor', 'rainColorMode', 'rainParticleType', 'rainLength', 'rainWidth',
               'rainBlur', 'rainSpeed', 'rainVariation'],
  overlays:  [],
  export:    [],
  perf:      ['performanceMode', 'editorTheme'],
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

interface ControlPanelProps {
  open: boolean
  maximized: boolean
  onOpenChange: (value: boolean) => void
  onMaximizedChange: (value: boolean) => void
}

export default function ControlPanel({
  open,
  maximized,
  onOpenChange,
  onMaximizedChange,
}: ControlPanelProps) {
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
    controlPanelAnchor,
    editorTheme,
    logoUrl,
  } = useWallpaperStore()
  const theme = EDITOR_THEME_CLASSES[editorTheme]

  useEffect(() => {
    if (!open && !maximized) {
      setSelectedOverlayId(null)
    }
  }, [maximized, open, setSelectedOverlayId])

  const TABS: { id: TabId; label: string }[] = [
    { id: 'layers',    label: t.tab_layers },
    { id: 'presets',   label: t.tab_presets },
    { id: 'filters',   label: t.tab_filters },
    { id: 'audio',     label: t.tab_audio },
    { id: 'track',     label: t.tab_track },
    { id: 'spectrum',  label: t.tab_spectrum },
    { id: 'logo',      label: t.tab_logo },
    { id: 'diagnostics', label: t.tab_diagnostics },
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
      {maximized && <EditorOverlay onClose={() => onMaximizedChange(false)} />}
    <div className={`fixed z-50 ${PANEL_ANCHOR_WRAPPER_CLASS[controlPanelAnchor]}`}>
      <button
        onClick={() => onOpenChange(!open)}
        className={`group h-10 w-10 rounded-full transition-all duration-200 ${theme.launcher} ${open ? theme.launcherOpen : ''}`}
        title={open ? 'Close panel' : 'Open editor'}
      >
        <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full">
          {logoUrl && !open ? (
            <img
              src={logoUrl}
              alt=""
              className={`h-6 w-6 rounded-full object-cover opacity-85 ring-1 ${theme.launcherImageRing}`}
            />
          ) : (
            <span className={`text-lg font-semibold transition-opacity ${theme.launcherIcon}`}>
              {open ? '×' : '◌'}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div className={`absolute w-96 rounded-lg flex flex-col overflow-hidden ${theme.panelShell} ${PANEL_ANCHOR_OVERLAY_CLASS[controlPanelAnchor]}`}>

          {/* Header */}
          <div className={`px-4 pt-3 pb-2 flex items-center gap-2 ${theme.panelHeader}`}>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className={`text-xs uppercase tracking-widest font-bold ${theme.panelTitle}`}>{t.title}</span>
            </div>
            <span className={`text-xs ${theme.panelSubtle}`}>{t.autoSaved}</span>
            <button
              onClick={openPreview}
              title="Open preview in new tab"
              className={`text-xs px-2 py-0.5 rounded border transition-colors ${theme.actionButton}`}
            >
              ▶
            </button>
            <button
              onClick={() => onMaximizedChange(true)}
              title={t.label_open_editor_workspace}
              className={`text-xs px-2 py-0.5 rounded border transition-colors ${theme.actionButton}`}
            >
              ⇱
            </button>
            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className={`text-xs px-1.5 py-0.5 rounded border transition-colors ${theme.actionButton}`}
              title="Toggle language / Cambiar idioma"
            >
              {language === 'en' ? 'ES' : 'EN'}
            </button>
          </div>

          {/* Tabs — horizontal scroll, no wrap */}
          <div
            className={`flex p-1.5 gap-0.5 ${theme.tabBar}`}
            style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-2.5 py-1 text-xs rounded whitespace-nowrap transition-colors flex-shrink-0 ${
                  tab === t.id
                    ? theme.tabActive
                    : theme.tabInactive
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
              {tab === 'audio'     && <AudioTab     onReset={resetTab} />}
              {tab === 'track'     && <TrackTitleTab onReset={resetTab} />}
              {tab === 'spectrum'  && <SpectrumTab  onReset={resetTab} />}
              {tab === 'logo'      && <LogoTab      onReset={resetTab} />}
              {tab === 'diagnostics' && <DiagnosticsTab onReset={resetTab} />}
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
