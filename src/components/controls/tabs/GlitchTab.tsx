import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import { GLITCH_RANGES } from '@/config/ranges'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'
import ResetButton from '../ui/ResetButton'
import SectionDivider from '../ui/SectionDivider'

export default function GlitchTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />

      <SectionDivider label={t.label_glitch} />
      <SliderControl
        label={t.label_glitch}
        value={store.glitchIntensity}
        {...GLITCH_RANGES.intensity}
        onChange={store.setGlitchIntensity}
      />
      <SliderControl
        label={t.label_bar_width}
        value={store.glitchBarWidth}
        {...GLITCH_RANGES.barWidth}
        onChange={store.setGlitchBarWidth}
        unit="px"
      />
      <SliderControl
        label={t.label_glitch_frequency}
        value={store.glitchFrequency}
        {...GLITCH_RANGES.frequency}
        onChange={store.setGlitchFrequency}
      />
      <ToggleControl
        label={t.label_glitch_audio_reactive}
        value={store.glitchAudioReactive}
        onChange={store.setGlitchAudioReactive}
      />
      {store.glitchAudioReactive && (
        <SliderControl
          label={t.label_glitch_audio_sensitivity}
          value={store.glitchAudioSensitivity}
          {...GLITCH_RANGES.audioSensitivity}
          onChange={store.setGlitchAudioSensitivity}
        />
      )}

      <SectionDivider label={t.label_rgb_shift} />
      <ToggleControl
        label={t.label_rgb_shift_audio_reactive}
        value={store.rgbShiftAudioReactive}
        onChange={store.setRgbShiftAudioReactive}
      />
      {store.rgbShiftAudioReactive && (
        <SliderControl
          label={t.label_rgb_shift_audio_sensitivity}
          value={store.rgbShiftAudioSensitivity}
          {...GLITCH_RANGES.rgbAudioSensitivity}
          onChange={store.setRgbShiftAudioSensitivity}
        />
      )}
    </>
  )
}
