import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import type { SpectrumColorMode, SpectrumBandMode, SpectrumShape, SpectrumLayout } from '@/types/wallpaper'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'
import EnumButtons from '../ui/EnumButtons'
import ColorInput from '../ui/ColorInput'
import SectionDivider from '../ui/SectionDivider'
import ResetButton from '../ui/ResetButton'

const LAYOUTS: SpectrumLayout[] = ['circular', 'horizontal']
const SHAPES: SpectrumShape[] = ['bars', 'lines', 'wave', 'dots']
const COLOR_MODES: SpectrumColorMode[] = ['solid', 'gradient', 'rainbow']
const BAND_MODES: SpectrumBandMode[] = ['full', 'bass', 'mid', 'treble']

export default function SpectrumTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />
      <ToggleControl label={t.label_enabled} value={store.spectrumEnabled} onChange={store.setSpectrumEnabled} />
      {store.spectrumLayout === 'circular' && (
        <ToggleControl label={t.label_follow_logo} value={store.spectrumFollowLogo} onChange={store.setSpectrumFollowLogo} />
      )}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_layout}</span>
        <EnumButtons<SpectrumLayout> options={LAYOUTS} value={store.spectrumLayout} onChange={store.setSpectrumLayout} />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_shape}</span>
        <EnumButtons<SpectrumShape> options={SHAPES} value={store.spectrumShape} onChange={store.setSpectrumShape} />
      </div>
      <SectionDivider label={t.section_bars} />
      <SliderControl label={t.label_bar_count} value={store.spectrumBarCount} min={16} max={256} step={8} onChange={store.setSpectrumBarCount} />
      <SliderControl label={t.label_bar_width} value={store.spectrumBarWidth} min={1} max={16} step={0.5} onChange={store.setSpectrumBarWidth} />
      <SliderControl label={t.label_min_height} value={store.spectrumMinHeight} min={1} max={20} step={1} onChange={store.setSpectrumMinHeight} />
      <SliderControl label={t.label_max_height} value={store.spectrumMaxHeight} min={20} max={500} step={5} onChange={store.setSpectrumMaxHeight} />
      {store.spectrumLayout === 'circular' && (
        <>
          <SectionDivider label={t.section_circular} />
          <SliderControl label={t.label_inner_radius} value={store.spectrumInnerRadius} min={20} max={300} step={5} onChange={store.setSpectrumInnerRadius} />
          <SliderControl label={t.label_rotation_speed} value={store.spectrumRotationSpeed} min={-1} max={1} step={0.05} onChange={store.setSpectrumRotationSpeed} />
          <ToggleControl label={t.label_mirror_sym} value={store.spectrumMirror} onChange={store.setSpectrumMirror} />
        </>
      )}
      {store.spectrumLayout === 'horizontal' && (
        <>
          <SectionDivider label={t.section_horizontal} />
          <ToggleControl label={t.label_mirror_ud} value={store.spectrumMirror} onChange={store.setSpectrumMirror} />
        </>
      )}
      <SectionDivider label={t.section_appearance} />
      <SliderControl label={t.label_smoothing} value={store.spectrumSmoothing} min={0} max={0.99} step={0.01} onChange={store.setSpectrumSmoothing} />
      <SliderControl label={t.label_opacity} value={store.spectrumOpacity} min={0} max={1} step={0.05} onChange={store.setSpectrumOpacity} />
      <SliderControl label={t.label_glow} value={store.spectrumGlowIntensity} min={0} max={3} step={0.1} onChange={store.setSpectrumGlowIntensity} />
      <SliderControl label={t.label_shadow_blur} value={store.spectrumShadowBlur} min={0} max={60} step={2} onChange={store.setSpectrumShadowBlur} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_color_mode}</span>
        <EnumButtons<SpectrumColorMode> options={COLOR_MODES} value={store.spectrumColorMode} onChange={store.setSpectrumColorMode} />
      </div>
      <ColorInput label={t.label_primary_color} value={store.spectrumPrimaryColor} onChange={store.setSpectrumPrimaryColor} />
      <ColorInput label={t.label_secondary_color} value={store.spectrumSecondaryColor} onChange={store.setSpectrumSecondaryColor} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_band_mode}</span>
        <EnumButtons<SpectrumBandMode> options={BAND_MODES} value={store.spectrumBandMode} onChange={store.setSpectrumBandMode} />
      </div>
      <SectionDivider label={t.section_peak} />
      <ToggleControl label={t.label_peak_hold} value={store.spectrumPeakHold} onChange={store.setSpectrumPeakHold} />
      {store.spectrumPeakHold && (
        <SliderControl label={t.label_peak_decay} value={store.spectrumPeakDecay} min={0.001} max={0.02} step={0.001} onChange={store.setSpectrumPeakDecay} />
      )}
    </>
  )
}
