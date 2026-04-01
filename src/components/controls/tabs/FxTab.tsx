import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import { FX_RANGES } from '@/config/ranges'
import SliderControl from '../SliderControl'
import ResetButton from '../ui/ResetButton'

export default function FxTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />
      <SliderControl label={t.label_parallax}          value={store.parallaxStrength} {...FX_RANGES.parallax}         onChange={store.setParallaxStrength} />
      <SliderControl label={t.label_audio_sensitivity} value={store.audioSensitivity} {...FX_RANGES.audioSensitivity} onChange={store.setAudioSensitivity} />
    </>
  )
}
