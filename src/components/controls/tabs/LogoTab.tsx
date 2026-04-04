import { useRef, useState } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import { saveImage, loadImage } from '@/lib/db/imageDb'
import { doProfileSettingsMatch, extractLogoProfileSettings } from '@/lib/featureProfiles'
import { AUDIO_ROUTING_RANGES, LOGO_RANGES } from '@/config/ranges'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'
import ColorInput from '../ui/ColorInput'
import ResetButton from '../ui/ResetButton'
import EnumButtons from '../ui/EnumButtons'
import AudioChannelSelector from '../ui/AudioChannelSelector'
import ProfileSlotsEditor from '../ui/ProfileSlotsEditor'
import TabSection from '../ui/TabSection'
import { useDialog } from '../ui/DialogProvider'
import type { WallpaperState } from '@/types/wallpaper'
import { LOGO_QUICK_PROFILES, type LogoQuickProfile } from '@/features/presets/logoProfiles'

function LogoUploader() {
  const t = useT()
  const { setLogoUrl, setLogoEnabled, setLogoId } = useWallpaperStore()
  const ref = useRef<HTMLInputElement>(null)
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const id = await saveImage(file)
    const url = await loadImage(id)
    if (!url) return
    setLogoId(id)
    setLogoUrl(url)
    setLogoEnabled(true)
  }
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-cyan-400">{t.label_logo_image}</span>
      <button
        onClick={() => ref.current?.click()}
        className="px-3 py-1 text-xs rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
      >
        {t.upload_logo}
      </button>
      <input ref={ref} type="file" accept="image/*,.svg" onChange={handleFile} className="hidden" />
    </div>
  )
}

export default function LogoTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  const { confirm } = useDialog()
  const [showAdvanced, setShowAdvanced] = useState(true)
  const quickProfileLabels: Record<LogoQuickProfile, string> = {
    subtle: t.profile_subtle,
    balanced: t.profile_balanced,
    dsg: t.profile_dsg,
  }
  const currentProfileSettings = extractLogoProfileSettings(store)
  const activeSavedProfileIndex = store.logoProfileSlots.findIndex((slot) => (
    doProfileSettingsMatch(currentProfileSettings, slot.values)
  ))
  const activeQuickProfile = (Object.entries(LOGO_QUICK_PROFILES) as Array<[LogoQuickProfile, Partial<WallpaperState>]>)
    .find(([, profile]) => (
      Object.entries(profile).every(([key, value]) => store[key as keyof WallpaperState] === value)
    ))?.[0] ?? 'balanced'

  function applyQuickProfile(profile: LogoQuickProfile) {
    useWallpaperStore.setState(LOGO_QUICK_PROFILES[profile])
  }

  async function handleSaveProfile(index: number) {
    const slot = store.logoProfileSlots[index]
    if (slot?.values) {
      const ok = await confirm({
        title: t.label_save_profile,
        message: t.confirm_overwrite_profile,
        confirmLabel: t.label_save_profile,
        cancelLabel: t.label_cancel,
        tone: 'warning',
      })
      if (!ok) return
    }
    store.saveLogoProfileSlot(index)
  }

  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />

      <TabSection title={t.section_logo_source_profiles} hint={t.hint_logo_profiles}>
        <ToggleControl label={t.label_enabled} value={store.logoEnabled} onChange={store.setLogoEnabled} />
        <LogoUploader />
        <div className="flex flex-col gap-1">
          <EnumButtons<LogoQuickProfile>
            options={['subtle', 'balanced', 'dsg']}
            value={activeQuickProfile}
            onChange={applyQuickProfile}
            labels={quickProfileLabels}
          />
        </div>
        <ProfileSlotsEditor
          title={t.section_saved_profiles}
          hint={t.hint_saved_profiles}
          slots={store.logoProfileSlots}
          activeIndex={activeSavedProfileIndex >= 0 ? activeSavedProfileIndex : null}
          onLoad={store.loadLogoProfileSlot}
          onSave={(index) => void handleSaveProfile(index)}
          onAdd={store.addLogoProfileSlot}
          onDelete={store.removeLogoProfileSlot}
          loadLabel={t.label_load_profile}
          saveLabel={t.label_save_profile}
          slotLabel={t.label_profile_slot}
          emptyLabel={t.profile_slot_empty}
          activeLabel={t.profile_slot_active}
        />
      </TabSection>

      <TabSection title={t.section_logo_transform}>
        <SliderControl label={t.label_base_size} value={store.logoBaseSize} {...LOGO_RANGES.baseSize} onChange={store.setLogoBaseSize} />
        <SliderControl label={t.label_position_x} value={store.logoPositionX} {...LOGO_RANGES.positionX} onChange={store.setLogoPositionX} />
        <SliderControl label={t.label_position_y} value={store.logoPositionY} {...LOGO_RANGES.positionY} onChange={store.setLogoPositionY} />
      </TabSection>

      <TabSection title={t.section_logo_reactivity} hint={t.hint_editor_diag_tip}>
        <AudioChannelSelector value={store.logoBandMode} onChange={store.setLogoBandMode} label={t.label_logo_band_mode} />
        <ToggleControl label={t.label_smoothing} value={store.logoAudioSmoothingEnabled} onChange={store.setLogoAudioSmoothingEnabled} />
        {store.logoAudioSmoothingEnabled ? (
          <SliderControl
            label={t.label_smoothing_amount}
            value={store.logoAudioSmoothing}
            {...AUDIO_ROUTING_RANGES.selectedChannelSmoothing}
            onChange={store.setLogoAudioSmoothing}
          />
        ) : null}
        <SliderControl label={t.label_logo_sensitivity} value={store.logoAudioSensitivity} {...LOGO_RANGES.audioSensitivity} onChange={store.setLogoAudioSensitivity} />
        <SliderControl label={t.label_reactive_scale} value={store.logoReactiveScaleIntensity} {...LOGO_RANGES.reactiveScaleIntensity} onChange={store.setLogoReactiveScaleIntensity} />
        <SliderControl label={t.label_reactivity_speed} value={store.logoReactivitySpeed} {...LOGO_RANGES.reactivitySpeed} onChange={store.setLogoReactivitySpeed} />
        <div className="grid grid-cols-2 gap-3">
          <SliderControl label={t.label_logo_min_scale} value={store.logoMinScale} {...LOGO_RANGES.minScale} onChange={store.setLogoMinScale} />
          <SliderControl label={t.label_logo_max_scale} value={store.logoMaxScale} {...LOGO_RANGES.maxScale} onChange={store.setLogoMaxScale} />
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-left text-[11px] text-cyan-500 underline decoration-cyan-800 hover:text-cyan-300"
        >
          {showAdvanced ? `▼ ${t.label_envelope_params_collapse}` : `▶ ${t.label_envelope_params_expand}`}
        </button>
        {showAdvanced ? (
          <div className="grid grid-cols-1 gap-3 rounded-md border border-cyan-950/60 p-2 md:grid-cols-2">
            <SliderControl label={t.label_logo_punch} value={store.logoPunch} {...LOGO_RANGES.punch} onChange={store.setLogoPunch} />
            <SliderControl label={t.label_logo_attack} value={store.logoAttack} {...LOGO_RANGES.attack} onChange={store.setLogoAttack} />
            <SliderControl label={t.label_logo_release} value={store.logoRelease} {...LOGO_RANGES.release} onChange={store.setLogoRelease} />
            <SliderControl label={t.label_logo_peak_window} value={store.logoPeakWindow} {...LOGO_RANGES.peakWindow} onChange={store.setLogoPeakWindow} />
            <SliderControl label={t.label_logo_peak_floor} value={store.logoPeakFloor} {...LOGO_RANGES.peakFloor} onChange={store.setLogoPeakFloor} />
          </div>
        ) : null}
      </TabSection>

      <TabSection title={t.section_logo_glow_shadow}>
        <ColorInput label={t.label_glow_color} value={store.logoGlowColor} onChange={store.setLogoGlowColor} />
        <SliderControl label={t.label_glow_blur} value={store.logoGlowBlur} {...LOGO_RANGES.glowBlur} onChange={store.setLogoGlowBlur} />
        <ToggleControl label={t.label_shadow} value={store.logoShadowEnabled} onChange={store.setLogoShadowEnabled} />
        {store.logoShadowEnabled ? (
          <>
            <ColorInput label={t.label_shadow_color} value={store.logoShadowColor} onChange={store.setLogoShadowColor} />
            <SliderControl label={t.label_shadow_blur} value={store.logoShadowBlur} {...LOGO_RANGES.shadowBlur} onChange={store.setLogoShadowBlur} />
          </>
        ) : null}
      </TabSection>

      <TabSection title={t.label_backdrop}>
        <ToggleControl label={t.label_backdrop} value={store.logoBackdropEnabled} onChange={store.setLogoBackdropEnabled} />
        {store.logoBackdropEnabled ? (
          <>
            <ColorInput label={t.label_backdrop_color} value={store.logoBackdropColor} onChange={store.setLogoBackdropColor} />
            <SliderControl label={t.label_backdrop_opacity} value={store.logoBackdropOpacity} {...LOGO_RANGES.backdropOpacity} onChange={store.setLogoBackdropOpacity} />
            <SliderControl label={t.label_backdrop_padding} value={store.logoBackdropPadding} {...LOGO_RANGES.backdropPadding} onChange={store.setLogoBackdropPadding} />
          </>
        ) : null}
      </TabSection>
    </>
  )
}
