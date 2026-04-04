import type { ReactNode } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import type { WallpaperState } from '@/types/wallpaper'
import { DEFAULT_STATE } from '@/lib/constants'
import { EDITOR_THEME_CLASSES } from './editorTheme'
import { useWindowPresentationControls } from '@/hooks/useWindowPresentationControls'
import { useAudioContext } from '@/context/AudioDataContext'
import { AudioTab, BgTab, ControlTabSuspense, DiagnosticsTab, ExportTab, FiltersTab, LayersTab, LogoTab, OverlaysTab, ParticlesTab, PerfTab, RainTab, SpectrumTab, TrackTitleTab } from './controlTabsLazy'

const TAB_KEYS: Record<string, (keyof WallpaperState)[]> = {
  layers:    ['layerZIndices'],
  presets:   ['imageScale', 'imagePositionX', 'imagePositionY', 'imageBassReactive',
               'backgroundImageEnabled', 'imageOpacity', 'imageAudioSmoothingEnabled', 'imageAudioSmoothing',
               'imageOpacityReactive', 'imageOpacityReactiveAmount',
               'imageBassScaleIntensity', 'imageAudioReactiveDecay',
               'imageBassAttack', 'imageBassRelease', 'imageBassReactivitySpeed', 'imageBassPeakWindow',
               'imageBassPeakFloor', 'imageBassPunch', 'imageBassReactiveScaleIntensity',
               'imageAudioChannel', 'imageFitMode', 'imageMirror', 'parallaxStrength',
               'globalBackgroundEnabled',
               'globalBackgroundScale', 'globalBackgroundPositionX', 'globalBackgroundPositionY', 'globalBackgroundFitMode',
               'globalBackgroundOpacity', 'globalBackgroundBrightness', 'globalBackgroundContrast',
               'globalBackgroundSaturation', 'globalBackgroundBlur', 'globalBackgroundHueRotate',
               'slideshowEnabled', 'slideshowInterval', 'slideshowTransitionDuration', 'slideshowTransitionType',
               'slideshowTransitionIntensity', 'slideshowTransitionAudioDrive', 'slideshowTransitionAudioChannel'],
  filters:   ['filterTargets', 'filterOpacity', 'filterBrightness', 'filterContrast', 'filterSaturation', 'filterBlur', 'filterHueRotate',
               'scanlineIntensity', 'scanlineMode', 'scanlineSpacing', 'scanlineThickness',
               'rgbShift', 'noiseIntensity', 'rgbShiftAudioReactive', 'rgbShiftAudioSensitivity', 'rgbShiftAudioChannel',
               'rgbShiftAudioSmoothingEnabled', 'rgbShiftAudioSmoothing'],
  audio:     ['audioPaused', 'motionPaused', 'fftSize',
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
               'spectrumSmoothing', 'spectrumAudioSmoothingEnabled', 'spectrumAudioSmoothing', 'spectrumOpacity', 'spectrumGlowIntensity', 'spectrumShadowBlur',
               'spectrumPrimaryColor', 'spectrumSecondaryColor', 'spectrumColorMode', 'spectrumBandMode',
               'spectrumMirror', 'spectrumPeakHold', 'spectrumPeakDecay', 'spectrumRotationSpeed', 'spectrumInnerRadius',
               'spectrumPositionX', 'spectrumPositionY'],
  logo:      ['logoEnabled', 'logoBaseSize', 'logoPositionX', 'logoPositionY', 'logoAudioSmoothingEnabled', 'logoAudioSmoothing', 'logoAudioSensitivity', 'logoReactiveScaleIntensity',
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

function SectionCard({
  title,
  children,
  themeClasses,
}: {
  title: string
  children: ReactNode
  themeClasses: (typeof EDITOR_THEME_CLASSES)[keyof typeof EDITOR_THEME_CLASSES]
}) {
  return (
    <div
      className={`flex min-w-[320px] basis-[360px] flex-1 flex-col rounded-lg ${themeClasses.sectionShell}`}
    >
      <div className={`px-3 py-2 ${themeClasses.sectionHeader}`}>
        <span className={`text-xs uppercase tracking-widest font-bold ${themeClasses.sectionTitle}`}>{title}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto p-3">
        {children}
      </div>
    </div>
  )
}

export default function EditorOverlay({ onClose }: { onClose: () => void }) {
  const t = useT()
  const {
    resetSection,
    language,
    setLanguage,
    overlays,
    selectedOverlayId,
    updateOverlay,
    editorTheme,
    audioPaused,
    motionPaused,
    setAudioPaused,
    setMotionPaused,
  } = useWallpaperStore()
  const { isFullscreen, fullscreenSupported, toggleFullscreen } = useWindowPresentationControls()
  const { captureMode, pauseFileForSystem, resumeFileFromSystem } = useAudioContext()
  const theme = EDITOR_THEME_CLASSES[editorTheme]

  void DEFAULT_STATE

  function makeReset(tabId: string) {
    return () => {
      if (tabId === 'overlays') {
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

      resetSection(
        (TAB_KEYS[tabId] ?? []).filter((k) => !['imageUrl', 'logoUrl'].includes(k as string))
      )
    }
  }

  function toggleHeaderAudioPause() {
    const nextPaused = !audioPaused
    setAudioPaused(nextPaused)
    if (captureMode === 'file') {
      if (nextPaused) pauseFileForSystem()
      else resumeFileFromSystem()
    }
  }

  function toggleHeaderMotionPause() {
    setMotionPaused(!motionPaused)
  }

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col ${theme.overlayShell}`}>
      {/* Top bar */}
      <div className={`flex flex-wrap items-center gap-2 px-6 py-3 flex-shrink-0 ${theme.overlayTopBar}`}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className={`text-sm uppercase tracking-widest font-bold ${theme.panelTitle}`}>{t.title}</span>
        </div>
        {fullscreenSupported ? (
          <button
            onClick={() => void toggleFullscreen()}
            className={`flex h-8 w-10 items-center justify-center rounded border px-2 py-1 text-sm transition-colors ${theme.actionButton}`}
            title={isFullscreen ? t.label_exit_fullscreen : t.label_enter_fullscreen}
            aria-label={isFullscreen ? t.label_exit_fullscreen : t.label_enter_fullscreen}
          >
            {isFullscreen ? '🗗' : '⛶'}
          </button>
        ) : null}
        <button
          onClick={toggleHeaderAudioPause}
          className={`flex h-8 w-8 items-center justify-center rounded border px-2 py-1 text-sm transition-colors ${theme.actionButton}`}
          title={t.hint_pause_audio_only}
          aria-label={t.hint_pause_audio_only}
        >
          {audioPaused ? '▶' : '⏸'}
        </button>
        <button
          onClick={toggleHeaderMotionPause}
          className="flex h-8 w-8 items-center justify-center rounded border border-orange-400/40 bg-orange-500/10 px-2 py-1 text-sm text-orange-100 transition-colors hover:border-orange-300 hover:bg-orange-500/15"
          title={t.hint_pause_all}
          aria-label={t.hint_pause_all}
        >
          {motionPaused ? '▶' : '⏸'}
        </button>
        <span className={`text-xs ${theme.panelSubtle}`}>{t.autoSaved}</span>
        <button
          onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
          className={`text-xs px-2 py-1 rounded border transition-colors ${theme.actionButton}`}
          title="Toggle language / Cambiar idioma"
        >
          {language === 'en' ? 'ES' : 'EN'}
        </button>
        <button
          onClick={onClose}
          className={`w-8 h-8 rounded-full transition-colors flex items-center justify-center text-base ${theme.overlayClose}`}
          title="Close full editor"
        >
          ×
        </button>
      </div>

      {/* Grid of all sections */}
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#164e63 transparent' }}
      >
        <div className="flex flex-wrap items-start gap-4">

          <SectionCard title={t.tab_layers} themeClasses={theme}>
            <ControlTabSuspense>
              <LayersTab onReset={makeReset('layers')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_presets} themeClasses={theme}>
            <ControlTabSuspense>
              <BgTab onReset={makeReset('presets')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_filters} themeClasses={theme}>
            <ControlTabSuspense>
              <FiltersTab onReset={makeReset('filters')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_audio} themeClasses={theme}>
            <ControlTabSuspense>
              <AudioTab onReset={makeReset('audio')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_track} themeClasses={theme}>
            <ControlTabSuspense>
              <TrackTitleTab onReset={makeReset('track')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_spectrum} themeClasses={theme}>
            <ControlTabSuspense>
              <SpectrumTab onReset={makeReset('spectrum')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_logo} themeClasses={theme}>
            <ControlTabSuspense>
              <LogoTab onReset={makeReset('logo')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_diagnostics} themeClasses={theme}>
            <ControlTabSuspense>
              <DiagnosticsTab onReset={makeReset('diagnostics')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_particles} themeClasses={theme}>
            <ControlTabSuspense>
              <ParticlesTab onReset={makeReset('particles')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_rain} themeClasses={theme}>
            <ControlTabSuspense>
              <RainTab onReset={makeReset('rain')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_overlays} themeClasses={theme}>
            <ControlTabSuspense>
              <OverlaysTab onReset={makeReset('overlays')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_export} themeClasses={theme}>
            <ControlTabSuspense>
              <ExportTab />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_perf} themeClasses={theme}>
            <ControlTabSuspense>
              <PerfTab />
            </ControlTabSuspense>
          </SectionCard>

        </div>
      </div>
    </div>
  )
}
