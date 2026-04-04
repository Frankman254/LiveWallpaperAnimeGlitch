import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import { SPECTRUM_RANGES } from '@/config/ranges'
import { doProfileSettingsMatch, extractSpectrumProfileSettings } from '@/lib/featureProfiles'
import type { SpectrumBandMode, SpectrumColorMode, SpectrumLinearDirection, SpectrumLinearOrientation, SpectrumMode, SpectrumRadialShape, SpectrumShape } from '@/types/wallpaper'
import {
  SPECTRUM_BAND_LABELS,
  SPECTRUM_BAND_MODES,
  SPECTRUM_COLOR_MODES,
  SPECTRUM_LINEAR_DIRECTION_LABELS,
  SPECTRUM_LINEAR_DIRECTIONS,
  SPECTRUM_LINEAR_ORIENTATION_LABELS,
  SPECTRUM_LINEAR_ORIENTATIONS,
  SPECTRUM_MODE_LABELS,
  SPECTRUM_MODES,
  SPECTRUM_RADIAL_SHAPE_LABELS,
  SPECTRUM_RADIAL_SHAPES,
  SPECTRUM_STYLES,
} from '@/features/spectrum/spectrumControlConfig'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'
import EnumButtons from '../ui/EnumButtons'
import ColorInput from '../ui/ColorInput'
import ResetButton from '../ui/ResetButton'
import AudioChannelSelector from '../ui/AudioChannelSelector'
import ProfileSlotsEditor from '../ui/ProfileSlotsEditor'
import TabSection from '../ui/TabSection'

export default function SpectrumTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  const isRadial = store.spectrumMode === 'radial'
  // Show position controls when: linear, radial+free, or radial+followLogo but logo is disabled (fallback placement)
  const canMoveMainSpectrum = !isRadial || !store.spectrumFollowLogo || !store.logoEnabled
  const currentProfileSettings = extractSpectrumProfileSettings(store)
  const activeProfileIndex = store.spectrumProfileSlots.findIndex((slot) => (
    doProfileSettingsMatch(currentProfileSettings, slot.values)
  ))

  function handleSaveProfile(index: number) {
    const slot = store.spectrumProfileSlots[index]
    if (slot?.values && !window.confirm(t.confirm_overwrite_profile)) return
    store.saveSpectrumProfileSlot(index)
  }

  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />

      <TabSection title={t.section_spectrum_profiles} hint={t.hint_editor_diag_spectrum}>
        <ToggleControl label={t.label_enabled} value={store.spectrumEnabled} onChange={store.setSpectrumEnabled} />
        <ProfileSlotsEditor
          title={t.section_saved_profiles}
          hint={t.hint_saved_profiles}
          slots={store.spectrumProfileSlots}
          activeIndex={activeProfileIndex >= 0 ? activeProfileIndex : null}
          onLoad={store.loadSpectrumProfileSlot}
          onSave={handleSaveProfile}
          onAdd={store.addSpectrumProfileSlot}
          onDelete={store.removeSpectrumProfileSlot}
          loadLabel={t.label_load_profile}
          saveLabel={t.label_save_profile}
          slotLabel={t.label_profile_slot}
          emptyLabel={t.profile_slot_empty}
          activeLabel={t.profile_slot_active}
        />
      </TabSection>

      <TabSection title={t.section_spectrum_mode_placement}>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-cyan-400">{t.label_spectrum_mode}</span>
          <EnumButtons<SpectrumMode>
            options={SPECTRUM_MODES}
            value={store.spectrumMode}
            onChange={store.setSpectrumMode}
            labels={SPECTRUM_MODE_LABELS}
          />
        </div>

        {isRadial ? (
          <>
            <ToggleControl label={t.label_follow_logo} value={store.spectrumFollowLogo} onChange={store.setSpectrumFollowLogo} />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-cyan-400">{t.label_radial_shape}</span>
              <EnumButtons<SpectrumRadialShape>
                options={SPECTRUM_RADIAL_SHAPES}
                value={store.spectrumRadialShape}
                onChange={store.setSpectrumRadialShape}
                labels={SPECTRUM_RADIAL_SHAPE_LABELS}
              />
            </div>
            <SliderControl label={t.label_radial_angle} value={store.spectrumRadialAngle} {...SPECTRUM_RANGES.radialAngle} onChange={store.setSpectrumRadialAngle} unit="deg" />
            {store.spectrumFollowLogo ? (
              <>
                <ToggleControl
                  label={t.label_fit_around_logo}
                  value={store.spectrumRadialFitLogo}
                  onChange={store.setSpectrumRadialFitLogo}
                  tooltip={t.hint_fit_around_logo}
                />
                <SliderControl label={t.label_logo_gap} value={store.spectrumLogoGap} {...SPECTRUM_RANGES.logoGap} onChange={store.setSpectrumLogoGap} unit="px" />
              </>
            ) : (
              <SliderControl label={t.label_inner_radius} value={store.spectrumInnerRadius} {...SPECTRUM_RANGES.innerRadius} onChange={store.setSpectrumInnerRadius} />
            )}
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-cyan-400">{t.label_spectrum_orientation}</span>
              <EnumButtons<SpectrumLinearOrientation>
                options={SPECTRUM_LINEAR_ORIENTATIONS}
                value={store.spectrumLinearOrientation}
                onChange={store.setSpectrumLinearOrientation}
                labels={SPECTRUM_LINEAR_ORIENTATION_LABELS}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-cyan-400">{t.label_linear_direction}</span>
              <EnumButtons<SpectrumLinearDirection>
                options={SPECTRUM_LINEAR_DIRECTIONS}
                value={store.spectrumLinearDirection}
                onChange={store.setSpectrumLinearDirection}
                labels={SPECTRUM_LINEAR_DIRECTION_LABELS}
              />
            </div>
            <SliderControl label={t.label_spectrum_span} value={store.spectrumSpan} {...SPECTRUM_RANGES.span} onChange={store.setSpectrumSpan} />
            <ToggleControl
              label={t.label_circular_clone}
              value={store.spectrumCircularClone}
              onChange={store.setSpectrumCircularClone}
              tooltip={t.hint_circular_clone}
            />
          </>
        )}

        {canMoveMainSpectrum && (
          <>
            <SliderControl label={t.label_position_x} value={store.spectrumPositionX} {...SPECTRUM_RANGES.positionX} onChange={store.setSpectrumPositionX} />
            <SliderControl label={t.label_position_y} value={store.spectrumPositionY} {...SPECTRUM_RANGES.positionY} onChange={store.setSpectrumPositionY} />
          </>
        )}
      </TabSection>

      <TabSection title={t.section_spectrum_style_size}>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-cyan-400">{t.label_spectrum_style}</span>
          <EnumButtons<SpectrumShape> options={SPECTRUM_STYLES} value={store.spectrumShape} onChange={store.setSpectrumShape} />
        </div>
        <SliderControl label={t.label_bar_count} value={store.spectrumBarCount} {...SPECTRUM_RANGES.barCount} onChange={store.setSpectrumBarCount} />
        <SliderControl label={t.label_bar_width} value={store.spectrumBarWidth} {...SPECTRUM_RANGES.barWidth} onChange={store.setSpectrumBarWidth} />
        <div className="grid grid-cols-2 gap-3">
          <SliderControl label={t.label_min_height} value={store.spectrumMinHeight} {...SPECTRUM_RANGES.minHeight} onChange={store.setSpectrumMinHeight} />
          <SliderControl label={t.label_max_height} value={store.spectrumMaxHeight} {...SPECTRUM_RANGES.maxHeight} onChange={store.setSpectrumMaxHeight} />
        </div>
      </TabSection>

      {!isRadial && store.spectrumCircularClone ? (
        <TabSection title={t.section_circular_clone} hint={t.hint_circular_clone}>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-cyan-400">{t.label_clone_style}</span>
            <EnumButtons<SpectrumShape> options={SPECTRUM_STYLES} value={store.spectrumCloneStyle} onChange={store.setSpectrumCloneStyle} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-cyan-400">{t.label_clone_shape}</span>
            <EnumButtons<SpectrumRadialShape>
              options={SPECTRUM_RADIAL_SHAPES}
              value={store.spectrumCloneRadialShape}
              onChange={store.setSpectrumCloneRadialShape}
              labels={SPECTRUM_RADIAL_SHAPE_LABELS}
            />
          </div>
          <SliderControl label={t.label_clone_angle} value={store.spectrumCloneRadialAngle} {...SPECTRUM_RANGES.cloneRadialAngle} onChange={store.setSpectrumCloneRadialAngle} unit="deg" />
          <SliderControl label={t.label_clone_bar_count} value={store.spectrumCloneBarCount} {...SPECTRUM_RANGES.cloneBarCount} onChange={store.setSpectrumCloneBarCount} />
          <SliderControl label={t.label_clone_bar_width} value={store.spectrumCloneBarWidth} {...SPECTRUM_RANGES.cloneBarWidth} onChange={store.setSpectrumCloneBarWidth} />
          <SliderControl label={t.label_clone_opacity} value={store.spectrumCloneOpacity} {...SPECTRUM_RANGES.cloneOpacity} onChange={store.setSpectrumCloneOpacity} />
          <SliderControl label={t.label_clone_scale} value={store.spectrumCloneScale} {...SPECTRUM_RANGES.cloneScale} onChange={store.setSpectrumCloneScale} />
          <SliderControl label={t.label_clone_gap} value={store.spectrumCloneGap} {...SPECTRUM_RANGES.cloneGap} onChange={store.setSpectrumCloneGap} unit="px" />
        </TabSection>
      ) : null}

      <TabSection title={t.section_appearance}>
        <SliderControl label={t.label_smoothing} value={store.spectrumSmoothing} {...SPECTRUM_RANGES.smoothing} onChange={store.setSpectrumSmoothing} />
        <SliderControl label={t.label_opacity} value={store.spectrumOpacity} {...SPECTRUM_RANGES.opacity} onChange={store.setSpectrumOpacity} />
        <SliderControl label={t.label_glow} value={store.spectrumGlowIntensity} {...SPECTRUM_RANGES.glowIntensity} onChange={store.setSpectrumGlowIntensity} />
        <SliderControl label={t.label_shadow_blur} value={store.spectrumShadowBlur} {...SPECTRUM_RANGES.shadowBlur} onChange={store.setSpectrumShadowBlur} />
        <div className="flex flex-col gap-1">
          <span className="text-xs text-cyan-400">{t.label_color_mode}</span>
          <EnumButtons<SpectrumColorMode> options={SPECTRUM_COLOR_MODES} value={store.spectrumColorMode} onChange={store.setSpectrumColorMode} />
        </div>
        <ColorInput label={t.label_primary_color} value={store.spectrumPrimaryColor} onChange={store.setSpectrumPrimaryColor} />
        <ColorInput label={t.label_secondary_color} value={store.spectrumSecondaryColor} onChange={store.setSpectrumSecondaryColor} />
        <AudioChannelSelector value={store.spectrumBandMode} onChange={store.setSpectrumBandMode} label={t.label_band_mode} />
      </TabSection>

      <TabSection title={t.section_spectrum_motion_peaks}>
        {isRadial ? (
          <SliderControl label={t.label_rotation_speed} value={store.spectrumRotationSpeed} {...SPECTRUM_RANGES.rotationSpeed} onChange={store.setSpectrumRotationSpeed} />
        ) : null}
        <ToggleControl label={isRadial ? t.label_mirror_sym : t.label_mirror_ud} value={store.spectrumMirror} onChange={store.setSpectrumMirror} />
        <ToggleControl label={t.label_peak_hold} value={store.spectrumPeakHold} onChange={store.setSpectrumPeakHold} />
        {store.spectrumPeakHold ? (
          <SliderControl label={t.label_peak_decay} value={store.spectrumPeakDecay} {...SPECTRUM_RANGES.peakDecay} onChange={store.setSpectrumPeakDecay} />
        ) : null}
      </TabSection>
    </>
  )
}
