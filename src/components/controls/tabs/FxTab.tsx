import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import SliderControl from '../SliderControl'
import ResetButton from '../ui/ResetButton'

export default function FxTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />
      <SliderControl label={t.label_glitch} value={store.glitchIntensity} min={0} max={0.5} step={0.01} onChange={store.setGlitchIntensity} />
      <SliderControl label={t.label_rgb_shift} value={store.rgbShift} min={0} max={0.02} step={0.001} onChange={store.setRgbShift} />
      <SliderControl label={t.label_scanlines} value={store.scanlineIntensity} min={0} max={0.5} step={0.01} onChange={store.setScanlineIntensity} />
      <SliderControl label={t.label_parallax} value={store.parallaxStrength} min={0} max={0.1} step={0.005} onChange={store.setParallaxStrength} />
      <SliderControl label={t.label_audio_sensitivity} value={store.audioSensitivity} min={0} max={5} step={0.1} onChange={store.setAudioSensitivity} />
    </>
  )
}
