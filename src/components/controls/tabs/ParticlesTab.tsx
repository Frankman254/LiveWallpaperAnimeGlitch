import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import { PARTICLE_LIMITS } from '@/lib/constants'
import type { ParticleColorMode, ParticleLayerMode } from '@/types/wallpaper'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'
import EnumButtons from '../ui/EnumButtons'
import ColorInput from '../ui/ColorInput'
import SectionDivider from '../ui/SectionDivider'
import ResetButton from '../ui/ResetButton'

const COLOR_MODES: ParticleColorMode[] = ['solid', 'gradient', 'random']
const LAYER_MODES: ParticleLayerMode[] = ['background', 'foreground', 'both']

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
      <ColorInput label={t.label_color_1} value={store.particleColor1} onChange={store.setParticleColor1} />
      <ColorInput label={t.label_color_2} value={store.particleColor2} onChange={store.setParticleColor2} />
      <SliderControl label={t.label_opacity} value={store.particleOpacity} min={0} max={1} step={0.05} onChange={store.setParticleOpacity} />
      <SliderControl label={t.label_size_min} value={store.particleSizeMin} min={1} max={60} step={1} onChange={store.setParticleSizeMin} />
      <SliderControl label={t.label_size_max} value={store.particleSizeMax} min={1} max={60} step={1} onChange={store.setParticleSizeMax} />
      <ToggleControl label={t.label_fade_in_out} value={store.particleFadeInOut} onChange={store.setParticleFadeInOut} />
      <ToggleControl label={t.label_glow} value={store.particleGlow} onChange={store.setParticleGlow} />
      {store.particleGlow && (
        <SliderControl label={t.label_glow_strength} value={store.particleGlowStrength} min={0} max={2} step={0.1} onChange={store.setParticleGlowStrength} />
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
