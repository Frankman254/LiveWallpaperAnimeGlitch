import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import type { ScanlineMode } from '@/types/wallpaper'
import SliderControl from '../SliderControl'
import EnumButtons from '../ui/EnumButtons'
import ResetButton from '../ui/ResetButton'

const SCANLINE_MODES: ScanlineMode[] = ['always', 'pulse', 'burst', 'beat']
const SCANLINE_MODE_LABELS: Record<ScanlineMode, string> = {
  always: 'Always',
  pulse: 'Pulse',
  burst: 'Burst',
  beat: 'Beat',
}

export default function FxTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />
      <SliderControl label={t.label_scanlines} value={store.scanlineIntensity} min={0} max={0.5} step={0.01} onChange={store.setScanlineIntensity} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_scanline_mode}</span>
        <EnumButtons<ScanlineMode>
          options={SCANLINE_MODES}
          value={store.scanlineMode}
          onChange={store.setScanlineMode}
          labels={SCANLINE_MODE_LABELS}
        />
      </div>
      <SliderControl label={t.label_spacing} value={store.scanlineSpacing} min={200} max={1600} step={25} onChange={store.setScanlineSpacing} />
      <SliderControl label={t.label_thickness} value={store.scanlineThickness} min={0.5} max={4} step={0.1} onChange={store.setScanlineThickness} />
      <SliderControl label={t.label_parallax} value={store.parallaxStrength} min={0} max={0.1} step={0.005} onChange={store.setParallaxStrength} />
      <SliderControl label={t.label_audio_sensitivity} value={store.audioSensitivity} min={0} max={5} step={0.1} onChange={store.setAudioSensitivity} />
    </>
  )
}
