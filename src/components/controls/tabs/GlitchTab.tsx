import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import type { GlitchStyle } from '@/types/wallpaper'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'
import ResetButton from '../ui/ResetButton'
import SectionDivider from '../ui/SectionDivider'
import EnumButtons from '../ui/EnumButtons'

const GLITCH_STYLES: GlitchStyle[] = ['bands', 'blocks', 'pixels']
const GLITCH_STYLE_LABELS: Record<GlitchStyle, string> = {
  bands: 'Bands',
  blocks: 'Blocks',
  pixels: 'Pixels',
}

export default function GlitchTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />

      <SectionDivider label={t.label_glitch} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_glitch_style}</span>
        <EnumButtons<GlitchStyle>
          options={GLITCH_STYLES}
          value={store.glitchStyle}
          onChange={store.setGlitchStyle}
          labels={GLITCH_STYLE_LABELS}
        />
      </div>
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
      <ToggleControl
        label={t.label_rgb_shift_audio_reactive}
        value={store.rgbShiftAudioReactive}
        onChange={store.setRgbShiftAudioReactive}
      />
      {store.rgbShiftAudioReactive && (
        <SliderControl
          label={t.label_rgb_shift_audio_sensitivity}
          value={store.rgbShiftAudioSensitivity}
          min={0}
          max={0.03}
          step={0.001}
          onChange={store.setRgbShiftAudioSensitivity}
        />
      )}
    </>
  )
}
