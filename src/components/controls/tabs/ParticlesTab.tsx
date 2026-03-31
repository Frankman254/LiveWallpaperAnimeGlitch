import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import { PARTICLE_LIMITS } from '@/lib/constants'
import type { ParticleColorMode, ParticleLayerMode, ParticleShape } from '@/types/wallpaper'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'
import EnumButtons from '../ui/EnumButtons'
import ColorInput from '../ui/ColorInput'
import SectionDivider from '../ui/SectionDivider'
import ResetButton from '../ui/ResetButton'

const COLOR_MODES: ParticleColorMode[] = ['solid', 'gradient', 'rainbow']
const LAYER_MODES: ParticleLayerMode[] = ['background', 'foreground', 'both']
const SHAPES: ParticleShape[] = ['circles', 'squares', 'triangles', 'stars', 'plus', 'minus', 'diamonds', 'cross', 'all']
const SHAPE_LABELS: Record<ParticleShape, string> = {
  circles: 'Circle',
  squares: 'Square',
  triangles: 'Triangle',
  stars: 'Star',
  plus: 'Plus',
  minus: 'Minus',
  diamonds: 'Diamond',
  cross: 'Cross',
  all: 'Mix',
}

export default function ParticlesTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  const limit = PARTICLE_LIMITS[store.performanceMode]
  const effectiveCount = Math.min(store.particleCount, limit)
  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />
      <ToggleControl label={t.label_enabled} value={store.particlesEnabled} onChange={store.setParticlesEnabled} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_layer_mode}</span>
        <EnumButtons<ParticleLayerMode> options={LAYER_MODES} value={store.particleLayerMode} onChange={store.setParticleLayerMode} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_particle_shape}</span>
        <EnumButtons<ParticleShape>
          options={SHAPES}
          value={store.particleShape}
          onChange={store.setParticleShape}
          labels={SHAPE_LABELS}
        />
      </div>
      <SliderControl
        label={t.label_count}
        value={store.particleCount}
        min={0} max={200} step={10}
        onChange={store.setParticleCount}
        effectiveValue={effectiveCount !== store.particleCount ? effectiveCount : undefined}
        tooltip={`Capped to ${limit} in ${store.performanceMode} mode`}
      />
      <SliderControl label={t.label_speed} value={store.particleSpeed} min={0} max={5} step={0.1} onChange={store.setParticleSpeed} />
      <SectionDivider label={t.section_appearance} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_color_mode}</span>
        <EnumButtons<ParticleColorMode> options={COLOR_MODES} value={store.particleColorMode} onChange={store.setParticleColorMode} />
      </div>
      {store.particleColorMode !== 'rainbow' && (
        <>
          <ColorInput label={t.label_color_1} value={store.particleColor1} onChange={store.setParticleColor1} />
          <ColorInput label={t.label_color_2} value={store.particleColor2} onChange={store.setParticleColor2} />
        </>
      )}
      <SliderControl label={t.label_opacity} value={store.particleOpacity} min={0} max={1} step={0.05} onChange={store.setParticleOpacity} />
      <SliderControl label={t.label_size_min} value={store.particleSizeMin} min={1} max={60} step={1} onChange={store.setParticleSizeMin} />
      <SliderControl label={t.label_size_max} value={store.particleSizeMax} min={1} max={60} step={1} onChange={store.setParticleSizeMax} />
      <ToggleControl label={t.label_fade_in_out} value={store.particleFadeInOut} onChange={store.setParticleFadeInOut} />
      <ToggleControl label={t.label_glow} value={store.particleGlow} onChange={store.setParticleGlow} />
      {store.particleGlow && (
        <SliderControl label={t.label_glow_strength} value={store.particleGlowStrength} min={0} max={2} step={0.1} onChange={store.setParticleGlowStrength} />
      )}
      <SectionDivider label={`${t.tab_filters} / Scanlines`} />
      <SliderControl label={t.label_brightness} value={store.particleFilterBrightness} min={0.2} max={2} step={0.05} onChange={store.setParticleFilterBrightness} />
      <SliderControl label={t.label_contrast} value={store.particleFilterContrast} min={0.2} max={2} step={0.05} onChange={store.setParticleFilterContrast} />
      <SliderControl label={t.label_saturation} value={store.particleFilterSaturation} min={0} max={3} step={0.05} onChange={store.setParticleFilterSaturation} />
      <SliderControl label={t.label_blur} value={store.particleFilterBlur} min={0} max={12} step={0.25} unit="px" onChange={store.setParticleFilterBlur} />
      <SliderControl label={t.label_hue_rotate} value={store.particleFilterHueRotate} min={0} max={360} step={1} unit="deg" onChange={store.setParticleFilterHueRotate} />
      <SliderControl label={t.label_scanlines} value={store.particleScanlineIntensity} min={0} max={1} step={0.01} onChange={store.setParticleScanlineIntensity} />
      {store.particleScanlineIntensity > 0 && (
        <>
          <SliderControl label={t.label_spacing} value={store.particleScanlineSpacing} min={120} max={1400} step={10} onChange={store.setParticleScanlineSpacing} />
          <SliderControl label={t.label_thickness} value={store.particleScanlineThickness} min={0.4} max={4} step={0.1} onChange={store.setParticleScanlineThickness} />
        </>
      )}
      <SectionDivider label="Audio" />
      <ToggleControl label={t.label_audio_reactive} value={store.particleAudioReactive} onChange={store.setParticleAudioReactive} />
      {store.particleAudioReactive && (
        <>
          <SliderControl label={t.label_audio_size_boost} value={store.particleAudioSizeBoost} min={0} max={30} step={1} onChange={store.setParticleAudioSizeBoost} />
          <SliderControl label={t.label_audio_opacity_boost} value={store.particleAudioOpacityBoost} min={0} max={1} step={0.05} onChange={store.setParticleAudioOpacityBoost} />
        </>
      )}
    </>
  )
}
