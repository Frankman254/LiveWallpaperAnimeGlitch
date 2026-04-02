import { useState } from 'react'
import type { ImageBassZoomPresetId } from '@/features/presets/imageBassZoomProfiles'
import { IMAGE_RANGES, LOGO_RANGES } from '@/config/ranges'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import SliderControl from '../../SliderControl'
import ToggleControl from '../../ToggleControl'
import AudioChannelSelector from '../../ui/AudioChannelSelector'
import SectionDivider from '../../ui/SectionDivider'
import { EDITOR_THEME_CLASSES } from '../../editorTheme'

const BASS_SCALE_INTENSITY_RANGE = { min: 0.01, max: 2.5, step: 0.01 }

export default function BgZoomAudioSection() {
  const t = useT()
  const store = useWallpaperStore()
  const [showAdvanced, setShowAdvanced] = useState(true)
  const theme = EDITOR_THEME_CLASSES[store.editorTheme]

  const presetLabels: Record<ImageBassZoomPresetId, string> = {
    classic: t.label_bg_zoom_preset_classic,
    smooth: t.label_bg_zoom_preset_smooth,
    punchy: t.label_bg_zoom_preset_punchy,
  }

  const activePreset = store.imageBassZoomPresetId

  return (
    <>
      <SectionDivider label={t.section_bg_zoom_audio} />
      <p className="text-[11px] leading-snug text-cyan-800">{t.hint_bg_zoom_audio}</p>
      <p className="text-[11px] leading-snug text-cyan-700">{t.hint_editor_diag_tip}</p>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wide text-cyan-600">{t.label_bg_zoom_preset_active}</span>
        <div className="flex flex-wrap gap-1">
          {(['classic', 'smooth', 'punchy'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => store.applyImageBassZoomPreset(id)}
              className={`rounded border px-2 py-0.5 text-xs transition-colors ${
                activePreset === id ? theme.tabActive : theme.tabInactive
              }`}
            >
              {presetLabels[id]}
            </button>
          ))}
        </div>
      </div>

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
    </>
  )
}
