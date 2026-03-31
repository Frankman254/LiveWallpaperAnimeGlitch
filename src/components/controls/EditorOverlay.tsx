import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import type { WallpaperState } from '@/types/wallpaper'
import { DEFAULT_STATE } from '@/lib/constants'
import { AudioTab, BgTab, ControlTabSuspense, ExportTab, FiltersTab, FxTab, GlitchTab, LayersTab, LogoTab, OverlaysTab, ParticlesTab, PerfTab, RainTab, SpectrumTab } from './controlTabsLazy'

const TAB_KEYS: Record<string, (keyof WallpaperState)[]> = {
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
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-black/80 border border-cyan-900 rounded-lg flex flex-col overflow-hidden">
      <div className="px-3 py-2 border-b border-cyan-900 bg-cyan-950/30">
        <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold">{title}</span>
      </div>
      <div className="flex flex-col gap-3 p-3 overflow-y-auto flex-1">
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
  } = useWallpaperStore()

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

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-cyan-900 bg-black/90 flex-shrink-0">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-sm uppercase tracking-widest text-cyan-300 font-bold">{t.title}</span>
        </div>
        <span className="text-xs text-cyan-800">{t.autoSaved}</span>
        <button
          onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
          className="text-xs px-2 py-1 rounded border border-cyan-800 text-cyan-500 hover:border-cyan-500 transition-colors"
          title="Toggle language / Cambiar idioma"
        >
          {language === 'en' ? 'ES' : 'EN'}
        </button>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-cyan-900/50 text-cyan-300 hover:bg-cyan-800 transition-colors flex items-center justify-center text-base"
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
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>

          <SectionCard title={t.tab_layers}>
            <ControlTabSuspense>
              <LayersTab onReset={makeReset('layers')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_presets}>
            <ControlTabSuspense>
              <BgTab onReset={makeReset('presets')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_filters}>
            <ControlTabSuspense>
              <FiltersTab onReset={makeReset('filters')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_fx}>
            <ControlTabSuspense>
              <FxTab onReset={makeReset('fx')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_glitch}>
            <ControlTabSuspense>
              <GlitchTab onReset={makeReset('glitch')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_audio}>
            <ControlTabSuspense>
              <AudioTab onReset={makeReset('audio')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_spectrum}>
            <ControlTabSuspense>
              <SpectrumTab onReset={makeReset('spectrum')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_logo}>
            <ControlTabSuspense>
              <LogoTab onReset={makeReset('logo')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_particles}>
            <ControlTabSuspense>
              <ParticlesTab onReset={makeReset('particles')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_rain}>
            <ControlTabSuspense>
              <RainTab onReset={makeReset('rain')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_overlays}>
            <ControlTabSuspense>
              <OverlaysTab onReset={makeReset('overlays')} />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_export}>
            <ControlTabSuspense>
              <ExportTab />
            </ControlTabSuspense>
          </SectionCard>

          <SectionCard title={t.tab_perf}>
            <ControlTabSuspense>
              <PerfTab />
            </ControlTabSuspense>
          </SectionCard>

        </div>
      </div>
    </div>
  )
}
