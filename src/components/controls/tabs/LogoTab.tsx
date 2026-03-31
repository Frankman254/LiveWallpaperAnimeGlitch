import { useRef } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import { saveImage, loadImage } from '@/lib/db/imageDb'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'
import ColorInput from '../ui/ColorInput'
import SectionDivider from '../ui/SectionDivider'
import ResetButton from '../ui/ResetButton'
import EnumButtons from '../ui/EnumButtons'
import type { LogoBandMode, WallpaperState } from '@/types/wallpaper'

type LogoQuickProfile = 'subtle' | 'balanced' | 'dsg'

const QUICK_PROFILES: Record<LogoQuickProfile, Partial<WallpaperState>> = {
  subtle: {
    logoBandMode: 'peak',
    logoAudioSensitivity: 2.1,
    logoReactiveScaleIntensity: 0.22,
    logoReactivitySpeed: 0.55,
    logoMinScale: 0.98,
    logoMaxScale: 1.55,
    logoPunch: 0.16,
    logoAttack: 0.72,
    logoRelease: 0.08,
    logoPeakWindow: 2.8,
    logoPeakFloor: 0.2,
  },
  balanced: {
    logoBandMode: 'peak',
    logoAudioSensitivity: 2.9,
    logoReactiveScaleIntensity: 0.46,
    logoReactivitySpeed: 0.7,
    logoMinScale: 0.98,
    logoMaxScale: 2.05,
    logoPunch: 0.32,
    logoAttack: 0.95,
    logoRelease: 0.055,
    logoPeakWindow: 2.15,
    logoPeakFloor: 0.15,
  },
  dsg: {
    logoBandMode: 'peak',
    logoAudioSensitivity: 3.7,
    logoReactiveScaleIntensity: 0.88,
    logoReactivitySpeed: 0.95,
    logoMinScale: 0.96,
    logoMaxScale: 2.75,
    logoPunch: 0.58,
    logoAttack: 1.2,
    logoRelease: 0.035,
    logoPeakWindow: 1.75,
    logoPeakFloor: 0.1,
  },
}

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
  const logoBandLabels: Record<LogoBandMode, string> = {
    peak: 'Peak',
    full: 'Full',
    bass: 'Bass',
    mid: 'Mid',
    treble: 'Treble',
  }
  const quickProfileLabels: Record<LogoQuickProfile, string> = {
    subtle: t.profile_subtle,
    balanced: t.profile_balanced,
    dsg: t.profile_dsg,
  }
  const activeQuickProfile = (Object.entries(QUICK_PROFILES) as Array<[LogoQuickProfile, Partial<WallpaperState>]>)
    .find(([, profile]) => (
      Object.entries(profile).every(([key, value]) => store[key as keyof WallpaperState] === value)
    ))?.[0] ?? 'balanced'

  function applyQuickProfile(profile: LogoQuickProfile) {
    useWallpaperStore.setState(QUICK_PROFILES[profile])
  }

  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />
      <ToggleControl label={t.label_enabled} value={store.logoEnabled} onChange={store.setLogoEnabled} />
      <LogoUploader />
      <SectionDivider label={t.section_logo_profiles} />
      <div className="flex flex-col gap-1">
        <EnumButtons<LogoQuickProfile>
          options={['subtle', 'balanced', 'dsg']}
          value={activeQuickProfile}
          onChange={applyQuickProfile}
          labels={quickProfileLabels}
        />
        <span className="text-[11px] leading-relaxed text-cyan-700">{t.hint_logo_profiles}</span>
      </div>
      <SectionDivider label="Size & Reactivity" />
      <SliderControl label={t.label_base_size} value={store.logoBaseSize} min={20} max={400} step={5} onChange={store.setLogoBaseSize} />
      <SliderControl label={t.label_position_x} value={store.logoPositionX} min={-0.9} max={0.9} step={0.01} onChange={store.setLogoPositionX} />
      <SliderControl label={t.label_position_y} value={store.logoPositionY} min={-0.9} max={0.9} step={0.01} onChange={store.setLogoPositionY} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_logo_band_mode}</span>
        <EnumButtons<LogoBandMode>
          options={['peak', 'full', 'bass', 'mid', 'treble']}
          value={store.logoBandMode}
          onChange={store.setLogoBandMode}
          labels={logoBandLabels}
        />
        <span className="text-[11px] leading-relaxed text-cyan-700">{t.hint_logo_peak_mode}</span>
      </div>
      <SliderControl label={t.label_logo_sensitivity} value={store.logoAudioSensitivity} min={0} max={10} step={0.1} onChange={store.setLogoAudioSensitivity} />
      <SliderControl label={t.label_reactive_scale} value={store.logoReactiveScaleIntensity} min={0.01} max={1.5} step={0.01} onChange={store.setLogoReactiveScaleIntensity} />
      <SliderControl label={t.label_reactivity_speed} value={store.logoReactivitySpeed} min={0.1} max={1.5} step={0.05} onChange={store.setLogoReactivitySpeed} />
      <SliderControl label={t.label_logo_min_scale} value={store.logoMinScale} min={0.5} max={2} step={0.05} onChange={store.setLogoMinScale} />
      <SliderControl label={t.label_logo_max_scale} value={store.logoMaxScale} min={1} max={4} step={0.05} onChange={store.setLogoMaxScale} />
      <SliderControl label={t.label_logo_punch} value={store.logoPunch} min={0} max={1.5} step={0.05} onChange={store.setLogoPunch} />
      <SliderControl label={t.label_logo_attack} value={store.logoAttack} min={0.05} max={1.5} step={0.05} onChange={store.setLogoAttack} />
      <SliderControl label={t.label_logo_release} value={store.logoRelease} min={0.01} max={0.7} step={0.01} onChange={store.setLogoRelease} />
      <SliderControl label={t.label_logo_peak_window} value={store.logoPeakWindow} min={0.5} max={5} step={0.1} onChange={store.setLogoPeakWindow} />
      <SliderControl label={t.label_logo_peak_floor} value={store.logoPeakFloor} min={0} max={0.45} step={0.01} onChange={store.setLogoPeakFloor} />
      <SectionDivider label={t.label_glow} />
      <ColorInput label={t.label_glow_color} value={store.logoGlowColor} onChange={store.setLogoGlowColor} />
      <SliderControl label={t.label_glow_blur} value={store.logoGlowBlur} min={0} max={80} step={2} onChange={store.setLogoGlowBlur} />
      <ToggleControl label={t.label_shadow} value={store.logoShadowEnabled} onChange={store.setLogoShadowEnabled} />
      {store.logoShadowEnabled && (
        <>
          <ColorInput label={t.label_shadow_color} value={store.logoShadowColor} onChange={store.setLogoShadowColor} />
          <SliderControl label={t.label_shadow_blur} value={store.logoShadowBlur} min={0} max={100} step={5} onChange={store.setLogoShadowBlur} />
        </>
      )}
      <SectionDivider label={t.label_backdrop} />
      <ToggleControl label={t.label_backdrop} value={store.logoBackdropEnabled} onChange={store.setLogoBackdropEnabled} />
      {store.logoBackdropEnabled && (
        <>
          <ColorInput label={t.label_backdrop_color} value={store.logoBackdropColor} onChange={store.setLogoBackdropColor} />
          <SliderControl label={t.label_backdrop_opacity} value={store.logoBackdropOpacity} min={0} max={1} step={0.05} onChange={store.setLogoBackdropOpacity} />
          <SliderControl label={t.label_backdrop_padding} value={store.logoBackdropPadding} min={0} max={80} step={2} onChange={store.setLogoBackdropPadding} />
        </>
      )}
    </>
  )
}
