import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import type { RainColorMode, RainParticleType } from '@/types/wallpaper'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'
import EnumButtons from '../ui/EnumButtons'
import ColorInput from '../ui/ColorInput'
import SectionDivider from '../ui/SectionDivider'
import ResetButton from '../ui/ResetButton'

const PARTICLE_TYPES: RainParticleType[] = ['lines', 'drops', 'dots', 'bars']
const COLOR_MODES: RainColorMode[] = ['solid', 'rainbow']

export default function RainTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />
      <ToggleControl label={t.label_rain_enabled} value={store.rainEnabled} onChange={store.setRainEnabled} />
      <SliderControl label={t.label_rain_intensity} value={store.rainIntensity} min={0} max={1} step={0.05} onChange={store.setRainIntensity} />
      <SliderControl label={t.label_rain_count} value={store.rainDropCount} min={5} max={100} step={5} onChange={store.setRainDropCount} />
      <SliderControl label={t.label_rain_speed} value={store.rainSpeed} min={0.1} max={6} step={0.1} onChange={store.setRainSpeed} />

      <SectionDivider label="Direction" />
      <SliderControl label={t.label_rain_angle} value={store.rainAngle} min={-180} max={180} step={1} onChange={store.setRainAngle} unit="°" />
      <SliderControl label={t.label_rain_rotation_z} value={store.rainMeshRotationZ} min={-45} max={45} step={1} onChange={store.setRainMeshRotationZ} unit="°" />

      <SectionDivider label="Style" />
      <ColorInput label={t.label_rain_color} value={store.rainColor} onChange={store.setRainColor} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_color_mode}</span>
        <EnumButtons<RainColorMode> options={COLOR_MODES} value={store.rainColorMode} onChange={store.setRainColorMode} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_rain_type}</span>
        <EnumButtons<RainParticleType> options={PARTICLE_TYPES} value={store.rainParticleType} onChange={store.setRainParticleType} />
      </div>
      <SliderControl label={t.label_rain_length} value={store.rainLength} min={0.01} max={0.4} step={0.01} onChange={store.setRainLength} />
      <SliderControl label={t.label_rain_width} value={store.rainWidth} min={0.0002} max={0.012} step={0.0002} onChange={store.setRainWidth} />
      <SliderControl label={t.label_rain_blur} value={store.rainBlur} min={0} max={0.02} step={0.001} onChange={store.setRainBlur} />
      <SliderControl label={t.label_variation} value={store.rainVariation} min={0} max={1} step={0.05} onChange={store.setRainVariation} />

      <span className="text-xs text-gray-500">{t.hint_rain_low_perf}</span>
    </>
  )
}
