import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import type { FilterTarget, ScanlineMode } from '@/types/wallpaper'
import SliderControl from '../SliderControl'
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
      <SliderControl label={t.label_brightness} value={store.filterBrightness} min={0.4} max={2} step={0.01} onChange={store.setFilterBrightness} />
      <SliderControl label={t.label_contrast} value={store.filterContrast} min={0.4} max={2.5} step={0.01} onChange={store.setFilterContrast} />
      <SliderControl label={t.label_saturation} value={store.filterSaturation} min={0} max={3} step={0.01} onChange={store.setFilterSaturation} />
      <SliderControl label={t.label_blur} value={store.filterBlur} min={0} max={12} step={0.1} onChange={store.setFilterBlur} unit="px" />
      <SliderControl label={t.label_hue_rotate} value={store.filterHueRotate} min={-180} max={180} step={1} onChange={store.setFilterHueRotate} unit="deg" />

      <SectionDivider label={t.label_rgb_shift} />
      <SliderControl
        label={t.label_rgb_shift}
        value={store.rgbShift}
        min={0}
        max={0.03}
        step={0.001}
        onChange={store.setRgbShift}
      />
      <SliderControl
        label={t.label_noise_intensity}
        value={store.noiseIntensity}
        min={0}
        max={0.8}
        step={0.01}
        onChange={store.setNoiseIntensity}
      />

      <SectionDivider label={t.label_scanlines} />
      <SliderControl label={t.label_scanlines} value={store.scanlineIntensity} min={0} max={1} step={0.01} onChange={store.setScanlineIntensity} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_scanline_mode}</span>
        <EnumButtons<ScanlineMode>
          options={SCANLINE_MODES}
          value={store.scanlineMode}
          onChange={store.setScanlineMode}
          labels={SCANLINE_MODE_LABELS}
        />
      </div>
      <SliderControl label={t.label_spacing} value={store.scanlineSpacing} min={200} max={1600} step={25} onChange={store.setScanlineSpacing} />
      <SliderControl label={t.label_thickness} value={store.scanlineThickness} min={0.5} max={6} step={0.1} onChange={store.setScanlineThickness} />
    </>
  )
}
