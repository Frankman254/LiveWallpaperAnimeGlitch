import { buildControllerLayers, buildOverlayLayers, buildSceneLayers } from '@/lib/layers'
import { useT } from '@/lib/i18n'
import { useWallpaperStore } from '@/store/wallpaperStore'
import type { OverlayLayer, WallpaperLayer } from '@/types/layers'
import type { BuiltInLayerId } from '@/types/wallpaper'
import ResetButton from '@/components/controls/ui/ResetButton'
import SectionDivider from '@/components/controls/ui/SectionDivider'
import SliderControl from '@/components/controls/SliderControl'
import ToggleControl from '@/components/controls/ToggleControl'

const LAYER_LABELS: Record<string, string> = {
  'background-image': 'Background',
  slideshow: 'Slideshow',
  logo: 'Logo',
  spectrum: 'Spectrum',
  'particle-background': 'Particles Back',
  'particle-foreground': 'Particles Front',
  rain: 'Rain',
  fx: 'FX',
}

function getLayerLabel(layer: WallpaperLayer): string {
  if (layer.type === 'overlay-image') return layer.name
  return LAYER_LABELS[layer.id] ?? layer.type
}

function isOverlayImage(layer: WallpaperLayer): layer is Extract<OverlayLayer, { type: 'overlay-image' }> {
  return layer.type === 'overlay-image'
}

export default function LayersTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()

  const layers = [
    ...buildSceneLayers(store),
    ...buildControllerLayers(store),
    ...buildOverlayLayers(store),
  ].sort((a, b) => a.zIndex - b.zIndex)

  function setParticleLayerEnabled(target: 'background' | 'foreground', enabled: boolean) {
    if (target === 'background') {
      if (enabled) {
        store.setParticlesEnabled(true)
        if (store.particleLayerMode === 'foreground') store.setParticleLayerMode('both')
        else store.setParticleLayerMode('background')
        return
      }

      if (!store.particlesEnabled) return
      if (store.particleLayerMode === 'both') store.setParticleLayerMode('foreground')
      else if (store.particleLayerMode === 'background') store.setParticlesEnabled(false)
      return
    }

    if (enabled) {
      store.setParticlesEnabled(true)
      if (store.particleLayerMode === 'background') store.setParticleLayerMode('both')
      else store.setParticleLayerMode('foreground')
      return
    }

    if (!store.particlesEnabled) return
    if (store.particleLayerMode === 'both') store.setParticleLayerMode('background')
    else if (store.particleLayerMode === 'foreground') store.setParticlesEnabled(false)
  }

  function toggleLayer(layer: WallpaperLayer, enabled: boolean) {
    if (isOverlayImage(layer)) {
      store.updateOverlay(layer.id, { enabled })
      return
    }

    switch (layer.id) {
      case 'slideshow':
        store.setSlideshowEnabled(enabled)
        return
      case 'logo':
        store.setLogoEnabled(enabled)
        return
      case 'spectrum':
        store.setSpectrumEnabled(enabled)
        return
      case 'particle-background':
        setParticleLayerEnabled('background', enabled)
        return
      case 'particle-foreground':
        setParticleLayerEnabled('foreground', enabled)
        return
      case 'rain':
        store.setRainEnabled(enabled)
        return
      default:
        return
    }
  }

  function updateZIndex(layer: WallpaperLayer, zIndex: number) {
    if (isOverlayImage(layer)) {
      store.updateOverlay(layer.id, { zIndex })
      return
    }

    store.setLayerZIndex(layer.id as BuiltInLayerId, zIndex)
  }

  function canToggle(layer: WallpaperLayer): boolean {
    return isOverlayImage(layer) || [
      'slideshow',
      'logo',
      'spectrum',
      'particle-background',
      'particle-foreground',
      'rain',
    ].includes(layer.id)
  }

  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />
      <SectionDivider label={t.section_layers} />

      <div className="flex flex-col gap-3">
        {layers.map((layer) => (
          <div key={layer.id} className="rounded border border-cyan-900 bg-black/40 p-3 flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="text-xs text-cyan-300">{getLayerLabel(layer)}</div>
                <div className="text-[11px] text-cyan-700 uppercase tracking-widest">
                  {layer.kind} • {layer.type}
                </div>
              </div>
              {isOverlayImage(layer) && (
                <button
                  onClick={() => store.setSelectedOverlayId(layer.id)}
                  className="px-2 py-1 text-[11px] rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
                >
                  {t.label_open_overlay}
                </button>
              )}
            </div>

            {canToggle(layer) ? (
              <ToggleControl
                label={t.label_enabled}
                value={layer.enabled}
                onChange={(value) => toggleLayer(layer, value)}
              />
            ) : (
              <div className="text-[11px] text-cyan-700">{t.label_layer_managed}</div>
            )}

            <SliderControl
              label={t.label_z_index}
              value={layer.zIndex}
              min={0}
              max={120}
              step={1}
              onChange={(value) => updateZIndex(layer, value)}
            />
          </div>
        ))}
      </div>
    </>
  )
}
