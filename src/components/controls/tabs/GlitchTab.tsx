import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
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
        min={0} max={0.5} step={0.01}
        onChange={store.setGlitchIntensity}
      />
      <SliderControl
        label={t.label_glitch_frequency}
        value={store.glitchFrequency}
        min={0} max={1} step={0.01}
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
          min={0} max={1} step={0.01}
          onChange={store.setGlitchAudioSensitivity}
        />
      )}

      <SectionDivider label={t.label_rgb_shift} />
      <SliderControl
        label={t.label_rgb_shift}
        value={store.rgbShift}
        min={0} max={0.02} step={0.001}
        onChange={store.setRgbShift}
      />
      <ToggleControl
        label={t.label_rgb_shift_audio_reactive}
        value={store.rgbShiftAudioReactive}
        onChange={store.setRgbShiftAudioReactive}
      />
      {store.rgbShiftAudioReactive && (
        <SliderControl
          label={t.label_rgb_shift_audio_sensitivity}
          value={store.rgbShiftAudioSensitivity}
          min={0} max={0.03} step={0.001}
          onChange={store.setRgbShiftAudioSensitivity}
        />
      )}

      <SectionDivider label={t.label_noise_intensity} />
      <SliderControl
        label={t.label_noise_intensity}
        value={store.noiseIntensity}
        min={0} max={0.5} step={0.01}
        onChange={store.setNoiseIntensity}
      />
    </>
  )
}
