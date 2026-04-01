import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import { FILTER_RANGES, GLITCH_RANGES, SCANLINE_RANGES } from '@/config/ranges'
import type { FilterTarget, ScanlineMode } from '@/types/wallpaper'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'
import EnumButtons from '../ui/EnumButtons'
import ResetButton from '../ui/ResetButton'
import SectionDivider from '../ui/SectionDivider'

const FILTER_TARGETS: FilterTarget[] = ['background', 'selected-overlay', 'all-images']
const FILTER_TARGET_LABELS: Record<FilterTarget, string> = {
  background: 'Background',
  'selected-overlay': 'Selected Overlay',
  'all-images': 'All Images',
}

const SCANLINE_MODES: ScanlineMode[] = ['always', 'pulse', 'burst', 'beat']
const SCANLINE_MODE_LABELS: Record<ScanlineMode, string> = {
  always: 'Always',
  pulse: 'Pulse',
  burst: 'Burst',
  beat: 'Beat',
}

export default function FiltersTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()

  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />

      <SectionDivider label={t.tab_filters} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400" title={t.hint_filter_target}>{t.label_filter_target}</span>
        <EnumButtons<FilterTarget>
          options={FILTER_TARGETS}
          value={store.filterTarget}
          onChange={store.setFilterTarget}
          labels={FILTER_TARGET_LABELS}
        />
      </div>

      <SectionDivider label={t.section_appearance} />
      <SliderControl label={t.label_brightness} value={store.filterBrightness} {...FILTER_RANGES.brightness} onChange={store.setFilterBrightness} />
      <SliderControl label={t.label_contrast}   value={store.filterContrast}   {...FILTER_RANGES.contrast}   onChange={store.setFilterContrast} />
      <SliderControl label={t.label_saturation} value={store.filterSaturation} {...FILTER_RANGES.saturation} onChange={store.setFilterSaturation} />
      <SliderControl label={t.label_blur}        value={store.filterBlur}        {...FILTER_RANGES.blur}        onChange={store.setFilterBlur} unit="px" />
      <SliderControl label={t.label_hue_rotate} value={store.filterHueRotate}  {...FILTER_RANGES.hueRotate}  onChange={store.setFilterHueRotate} unit="deg" />

      <SectionDivider label={t.label_rgb_shift} />
      <SliderControl label={t.label_rgb_shift}       value={store.rgbShift}       {...GLITCH_RANGES.rgbShift}       onChange={store.setRgbShift} />
      <ToggleControl label={t.label_rgb_shift_audio_reactive} value={store.rgbShiftAudioReactive} onChange={store.setRgbShiftAudioReactive} />
      {store.rgbShiftAudioReactive && (
        <SliderControl label={t.label_rgb_shift_audio_sensitivity} value={store.rgbShiftAudioSensitivity} {...GLITCH_RANGES.rgbAudioSensitivity} onChange={store.setRgbShiftAudioSensitivity} />
      )}
      <SliderControl label={t.label_noise_intensity} value={store.noiseIntensity} {...GLITCH_RANGES.noiseIntensity} onChange={store.setNoiseIntensity} />

      <SectionDivider label={t.label_scanlines} />
      <SliderControl label={t.label_scanlines} value={store.scanlineIntensity} {...SCANLINE_RANGES.intensity} onChange={store.setScanlineIntensity} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_scanline_mode}</span>
        <EnumButtons<ScanlineMode>
          options={SCANLINE_MODES}
          value={store.scanlineMode}
          onChange={store.setScanlineMode}
          labels={SCANLINE_MODE_LABELS}
        />
      </div>
      <SliderControl label={t.label_spacing}   value={store.scanlineSpacing}   {...SCANLINE_RANGES.spacing}   onChange={store.setScanlineSpacing} />
      <SliderControl label={t.label_thickness} value={store.scanlineThickness} {...SCANLINE_RANGES.thickness} onChange={store.setScanlineThickness} />
    </>
  )
}
