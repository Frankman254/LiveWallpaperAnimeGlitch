import { useState } from 'react'
import { FX_RANGES, IMAGE_RANGES, LOGO_RANGES } from '@/config/ranges'
import { doProfileSettingsMatch, extractBackgroundProfileSettings } from '@/lib/featureProfiles'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import SliderControl from '../../SliderControl'
import ToggleControl from '../../ToggleControl'
import AudioChannelSelector from '../../ui/AudioChannelSelector'
import ProfileSlotsEditor from '../../ui/ProfileSlotsEditor'
import SectionDivider from '../../ui/SectionDivider'

const BASS_SCALE_INTENSITY_RANGE = { min: 0.01, max: 2.5, step: 0.01 }

export default function BgZoomAudioSection() {
  const t = useT()
  const store = useWallpaperStore()
  const [showAdvanced, setShowAdvanced] = useState(true)
  const currentProfileSettings = extractBackgroundProfileSettings(store)
  const activeProfileIndex = store.backgroundProfileSlots.findIndex((slot) => (
    doProfileSettingsMatch(currentProfileSettings, slot.values)
  ))

  function handleSaveProfile(index: number) {
    const slot = store.backgroundProfileSlots[index]
    if (slot?.values && !window.confirm(t.confirm_overwrite_profile)) return
    store.saveBackgroundProfileSlot(index)
  }

  return (
    <>
      <SectionDivider label={t.section_bg_zoom_audio} />
      <p className="text-[11px] leading-snug text-cyan-800">{t.hint_bg_zoom_audio}</p>
      <p className="text-[11px] leading-snug text-cyan-700">{t.hint_editor_diag_tip}</p>
      <ProfileSlotsEditor
        title={t.section_saved_profiles}
        hint={t.hint_saved_profiles}
        slots={store.backgroundProfileSlots}
        activeIndex={activeProfileIndex >= 0 ? activeProfileIndex : null}
        onLoad={store.loadBackgroundProfileSlot}
        onSave={handleSaveProfile}
        loadLabel={t.label_load_profile}
        saveLabel={t.label_save_profile}
        slotLabel={t.label_profile_slot}
        emptyLabel={t.profile_slot_empty}
        activeLabel={t.profile_slot_active}
      />

      <span className="text-[11px] text-cyan-700">{t.hint_shared_bg_settings}</span>
      <ToggleControl label={t.label_bass_zoom} value={store.imageBassReactive} onChange={store.setImageBassReactive} />
      {store.imageBassReactive && (
        <>
          <AudioChannelSelector
            value={store.imageAudioChannel}
            onChange={store.setImageAudioChannel}
            label={t.label_zoom_audio_channel}
          />
          <SliderControl
            label={t.label_zoom_intensity}
            value={store.imageBassScaleIntensity}
            {...IMAGE_RANGES.bassIntensity}
            onChange={store.setImageBassScaleIntensity}
          />

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="self-start text-left text-[11px] text-cyan-500 underline decoration-cyan-800 hover:text-cyan-300"
          >
            {showAdvanced ? `▼ ${t.label_envelope_params_collapse}` : `▶ ${t.label_envelope_params_expand}`}
          </button>

          {showAdvanced && (
            <div className="flex flex-col gap-2 border border-cyan-950/60 rounded-md p-2">
              <SliderControl
                label={t.label_logo_attack}
                value={store.imageBassAttack}
                {...LOGO_RANGES.attack}
                onChange={store.setImageBassAttack}
              />
              <SliderControl
                label={t.label_logo_release}
                value={store.imageBassRelease}
                {...LOGO_RANGES.release}
                onChange={store.setImageBassRelease}
              />
              <SliderControl
                label={t.label_reactivity_speed}
                value={store.imageBassReactivitySpeed}
                {...LOGO_RANGES.reactivitySpeed}
                onChange={store.setImageBassReactivitySpeed}
              />
              <SliderControl
                label={t.label_logo_peak_window}
                value={store.imageBassPeakWindow}
                {...LOGO_RANGES.peakWindow}
                onChange={store.setImageBassPeakWindow}
              />
              <SliderControl
                label={t.label_logo_peak_floor}
                value={store.imageBassPeakFloor}
                {...LOGO_RANGES.peakFloor}
                onChange={store.setImageBassPeakFloor}
              />
              <SliderControl
                label={t.label_logo_punch}
                value={store.imageBassPunch}
                {...LOGO_RANGES.punch}
                onChange={store.setImageBassPunch}
              />
              <SliderControl
                label={t.label_reactive_scale}
                value={store.imageBassReactiveScaleIntensity}
                {...BASS_SCALE_INTENSITY_RANGE}
                onChange={store.setImageBassReactiveScaleIntensity}
              />
            </div>
          )}
        </>
      )}

      <SectionDivider label={t.section_background_motion} />
      <p className="text-[11px] leading-snug text-cyan-700">{t.hint_background_motion}</p>
      <SliderControl
        label={t.label_parallax}
        value={store.parallaxStrength}
        {...FX_RANGES.parallax}
        onChange={store.setParallaxStrength}
      />
    </>
  )
}
