import { useRef } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import { saveImage } from '@/lib/db/imageDb'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'
import ColorInput from '../ui/ColorInput'
import SectionDivider from '../ui/SectionDivider'
import ResetButton from '../ui/ResetButton'

function LogoUploader() {
  const t = useT()
  const { setLogoUrl, setLogoEnabled, setLogoId } = useWallpaperStore()
  const ref = useRef<HTMLInputElement>(null)
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const id = await saveImage(file)
    const url = URL.createObjectURL(file)
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
  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />
      <ToggleControl label={t.label_enabled} value={store.logoEnabled} onChange={store.setLogoEnabled} />
      <LogoUploader />
      <SectionDivider label="Size & Reactivity" />
      <SliderControl label={t.label_base_size} value={store.logoBaseSize} min={20} max={400} step={5} onChange={store.setLogoBaseSize} />
      <SliderControl label={t.label_logo_sensitivity} value={store.logoAudioSensitivity} min={0} max={10} step={0.1} onChange={store.setLogoAudioSensitivity} />
      <SliderControl label={t.label_reactive_scale} value={store.logoReactiveScaleIntensity} min={0} max={3} step={0.1} onChange={store.setLogoReactiveScaleIntensity} />
      <SliderControl label={t.label_reactivity_speed} value={store.logoReactivitySpeed} min={0.01} max={1} step={0.01} onChange={store.setLogoReactivitySpeed} />
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
