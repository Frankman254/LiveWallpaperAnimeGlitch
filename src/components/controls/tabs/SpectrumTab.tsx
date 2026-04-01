import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import { SPECTRUM_RANGES } from '@/config/ranges'
import { doProfileSettingsMatch, extractSpectrumProfileSettings } from '@/lib/featureProfiles'
import type {
  SpectrumColorMode,
  SpectrumBandMode,
  SpectrumDirection,
  SpectrumShape,
  SpectrumLayout,
} from '@/types/wallpaper'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'
import EnumButtons from '../ui/EnumButtons'
import ColorInput from '../ui/ColorInput'
import SectionDivider from '../ui/SectionDivider'
import ResetButton from '../ui/ResetButton'
import ProfileSlotsEditor from '../ui/ProfileSlotsEditor'

const LAYOUTS: SpectrumLayout[] = ['circular', 'bottom', 'top', 'top-inverted', 'left', 'right', 'center']
const SHAPES: SpectrumShape[] = ['bars', 'lines', 'wave', 'dots']
const COLOR_MODES: SpectrumColorMode[] = ['solid', 'gradient', 'rainbow']
const BAND_MODES: SpectrumBandMode[] = ['full', 'bass', 'low-mid', 'mid', 'high-mid', 'treble']
const DIRECTIONS: SpectrumDirection[] = ['clockwise', 'counterclockwise']
const LAYOUT_LABELS: Partial<Record<SpectrumLayout, string>> = {
  circular: 'Circular',
  bottom: 'Bottom',
  top: 'Top',
  'top-inverted': 'Top Inv',
  left: 'Left',
  right: 'Right',
  center: 'Center',
}
const DIRECTION_LABELS: Record<SpectrumDirection, string> = {
  clockwise: 'CW',
  counterclockwise: 'CCW',
}
const BAND_LABELS: Partial<Record<SpectrumBandMode, string>> = {
  full: 'Full',
  bass: 'Bass',
  'low-mid': 'Low Mid',
  mid: 'Mid',
  'high-mid': 'High Mid',
  treble: 'Treble',
}

export default function SpectrumTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  const currentLayout: SpectrumLayout = store.spectrumLayout === 'horizontal' ? 'bottom' : store.spectrumLayout
  const isCircular = currentLayout === 'circular'
  const currentProfileSettings = extractSpectrumProfileSettings(store)
  const activeProfileIndex = store.spectrumProfileSlots.findIndex((slot) => (
    doProfileSettingsMatch(currentProfileSettings, slot.values)
  ))

  function handleLoadProfile(index: number) {
    const slot = store.spectrumProfileSlots[index]
    if (!slot?.values) return
    if (!doProfileSettingsMatch(currentProfileSettings, slot.values)) {
      const shouldLoad = window.confirm(t.confirm_load_profile)
      if (!shouldLoad) return
    }
    store.loadSpectrumProfileSlot(index)
  }

  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />
      <ToggleControl label={t.label_enabled} value={store.spectrumEnabled} onChange={store.setSpectrumEnabled} />
      <ProfileSlotsEditor
        title={t.section_saved_profiles}
        hint={t.hint_saved_profiles}
        slots={store.spectrumProfileSlots}
        activeIndex={activeProfileIndex >= 0 ? activeProfileIndex : null}
        onLoad={handleLoadProfile}
        onSave={store.saveSpectrumProfileSlot}
        loadLabel={t.label_load_profile}
        saveLabel={t.label_save_profile}
        slotLabel={t.label_profile_slot}
        emptyLabel={t.profile_slot_empty}
        activeLabel={t.profile_slot_active}
      />
      {isCircular && (
        <ToggleControl label={t.label_follow_logo} value={store.spectrumFollowLogo} onChange={store.setSpectrumFollowLogo} />
      )}
      {!isCircular && (
        <ToggleControl
          label={t.label_circular_clone}
          value={store.spectrumCircularClone}
          onChange={store.setSpectrumCircularClone}
          tooltip={t.hint_circular_clone}
        />
      )}
      {!isCircular && store.spectrumCircularClone && (
        <>
          <SectionDivider label={t.section_circular_clone} />
          <SliderControl label={t.label_clone_opacity}   value={store.spectrumCloneOpacity}      {...SPECTRUM_RANGES.cloneOpacity}      onChange={store.setSpectrumCloneOpacity} />
          <SliderControl label={t.label_clone_scale}     value={store.spectrumCloneScale}        {...SPECTRUM_RANGES.cloneScale}        onChange={store.setSpectrumCloneScale} />
          <SliderControl label={t.label_clone_gap}       value={store.spectrumCloneGap}          {...SPECTRUM_RANGES.cloneGap}          onChange={store.setSpectrumCloneGap}    unit="px" />
          <SliderControl label={t.label_clone_bar_count} value={store.spectrumCloneBarCount}     {...SPECTRUM_RANGES.cloneBarCount}     onChange={store.setSpectrumCloneBarCount} />
          <SliderControl label={t.label_clone_glow}      value={store.spectrumCloneGlowIntensity} {...SPECTRUM_RANGES.cloneGlowIntensity} onChange={store.setSpectrumCloneGlowIntensity} />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-cyan-400">{t.label_clone_shape}</span>
            <EnumButtons<SpectrumShape> options={SHAPES} value={store.spectrumCloneShape} onChange={store.setSpectrumCloneShape} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-cyan-400">{t.label_clone_color_mode}</span>
            <EnumButtons<SpectrumColorMode> options={COLOR_MODES} value={store.spectrumCloneColorMode} onChange={store.setSpectrumCloneColorMode} />
          </div>
          <ColorInput label={t.label_clone_primary_color}   value={store.spectrumClonePrimaryColor}   onChange={store.setSpectrumClonePrimaryColor} />
          <ColorInput label={t.label_clone_secondary_color} value={store.spectrumCloneSecondaryColor} onChange={store.setSpectrumCloneSecondaryColor} />
        </>
      )}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_layout}</span>
        <EnumButtons<SpectrumLayout>
          options={LAYOUTS}
          value={currentLayout}
          onChange={store.setSpectrumLayout}
          labels={LAYOUT_LABELS}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_shape}</span>
        <EnumButtons<SpectrumShape> options={SHAPES} value={store.spectrumShape} onChange={store.setSpectrumShape} />
      </div>
      <SectionDivider label={t.section_bars} />
      <SliderControl label={t.label_bar_count}  value={store.spectrumBarCount}  {...SPECTRUM_RANGES.barCount}  onChange={store.setSpectrumBarCount} />
      <SliderControl label={t.label_bar_width}  value={store.spectrumBarWidth}  {...SPECTRUM_RANGES.barWidth}  onChange={store.setSpectrumBarWidth} />
      <SliderControl label={t.label_min_height} value={store.spectrumMinHeight} {...SPECTRUM_RANGES.minHeight} onChange={store.setSpectrumMinHeight} />
      <SliderControl label={t.label_max_height} value={store.spectrumMaxHeight} {...SPECTRUM_RANGES.maxHeight} onChange={store.setSpectrumMaxHeight} />
      {isCircular && (
        <>
          <SectionDivider label={t.section_circular} />
          <SliderControl label={t.label_inner_radius} value={store.spectrumInnerRadius} {...SPECTRUM_RANGES.innerRadius} onChange={store.setSpectrumInnerRadius} />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-cyan-400">{t.label_direction}</span>
            <EnumButtons<SpectrumDirection>
              options={DIRECTIONS}
              value={store.spectrumDirection}
              onChange={store.setSpectrumDirection}
              labels={DIRECTION_LABELS}
            />
          </div>
          <SliderControl label={t.label_rotation_speed} value={store.spectrumRotationSpeed} {...SPECTRUM_RANGES.rotationSpeed} onChange={store.setSpectrumRotationSpeed} />
          <ToggleControl label={t.label_mirror_sym} value={store.spectrumMirror} onChange={store.setSpectrumMirror} />
          <SectionDivider label="Position" />
          <SliderControl label="Position X" value={store.spectrumPositionX} {...SPECTRUM_RANGES.positionX} onChange={store.setSpectrumPositionX} />
          <SliderControl label="Position Y" value={store.spectrumPositionY} {...SPECTRUM_RANGES.positionY} onChange={store.setSpectrumPositionY} />
        </>
      )}
      {!isCircular && (
        <>
          <SectionDivider label={t.section_horizontal} />
          <SliderControl label={t.label_spectrum_span} value={store.spectrumSpan} {...SPECTRUM_RANGES.span} onChange={store.setSpectrumSpan} />
          <ToggleControl label={t.label_mirror_ud} value={store.spectrumMirror} onChange={store.setSpectrumMirror} />
          <SectionDivider label="Position" />
          <SliderControl label="Position X" value={store.spectrumPositionX} {...SPECTRUM_RANGES.positionX} onChange={store.setSpectrumPositionX} />
          <SliderControl label="Position Y" value={store.spectrumPositionY} {...SPECTRUM_RANGES.positionY} onChange={store.setSpectrumPositionY} />
        </>
      )}
      <SectionDivider label={t.section_appearance} />
      <SliderControl label={t.label_smoothing}   value={store.spectrumSmoothing}     {...SPECTRUM_RANGES.smoothing}    onChange={store.setSpectrumSmoothing} />
      <SliderControl label={t.label_opacity}     value={store.spectrumOpacity}       {...SPECTRUM_RANGES.opacity}      onChange={store.setSpectrumOpacity} />
      <SliderControl label={t.label_glow}        value={store.spectrumGlowIntensity} {...SPECTRUM_RANGES.glowIntensity} onChange={store.setSpectrumGlowIntensity} />
      <SliderControl label={t.label_shadow_blur} value={store.spectrumShadowBlur}    {...SPECTRUM_RANGES.shadowBlur}   onChange={store.setSpectrumShadowBlur} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_color_mode}</span>
        <EnumButtons<SpectrumColorMode> options={COLOR_MODES} value={store.spectrumColorMode} onChange={store.setSpectrumColorMode} />
      </div>
      <ColorInput label={t.label_primary_color}   value={store.spectrumPrimaryColor}   onChange={store.setSpectrumPrimaryColor} />
      <ColorInput label={t.label_secondary_color} value={store.spectrumSecondaryColor} onChange={store.setSpectrumSecondaryColor} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_band_mode}</span>
        <EnumButtons<SpectrumBandMode>
          options={BAND_MODES}
          value={store.spectrumBandMode}
          onChange={store.setSpectrumBandMode}
          labels={BAND_LABELS}
        />
      </div>
      <SectionDivider label={t.section_peak} />
      <ToggleControl label={t.label_peak_hold} value={store.spectrumPeakHold} onChange={store.setSpectrumPeakHold} />
      {store.spectrumPeakHold && (
        <SliderControl label={t.label_peak_decay} value={store.spectrumPeakDecay} {...SPECTRUM_RANGES.peakDecay} onChange={store.setSpectrumPeakDecay} />
      )}
    </>
  )
}
