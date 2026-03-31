import SliderControl from '@/components/controls/SliderControl'
import SectionDivider from '@/components/controls/ui/SectionDivider'
import BgFitModeSelector from './BgFitModeSelector'
import BgSectionCard from './BgSectionCard'
import type { ImageFitMode } from '@/types/wallpaper'

export default function GlobalBackgroundSection({
  t,
  globalBackgroundId,
  globalBackgroundUrl,
  globalBackgroundFitMode,
  globalBackgroundScale,
  globalBackgroundPositionX,
  globalBackgroundPositionY,
  globalBackgroundOpacity,
  globalBackgroundBrightness,
  globalBackgroundContrast,
  globalBackgroundSaturation,
  globalBackgroundBlur,
  globalBackgroundHueRotate,
  onUploadClick,
  onRemove,
  onChangeFitMode,
  onChangeScale,
  onChangePositionX,
  onChangePositionY,
  onChangeOpacity,
  onChangeBrightness,
  onChangeContrast,
  onChangeSaturation,
  onChangeBlur,
  onChangeHueRotate,
}: {
  t: Record<string, string>
  globalBackgroundId: string | null
  globalBackgroundUrl: string | null
  globalBackgroundFitMode: ImageFitMode
  globalBackgroundScale: number
  globalBackgroundPositionX: number
  globalBackgroundPositionY: number
  globalBackgroundOpacity: number
  globalBackgroundBrightness: number
  globalBackgroundContrast: number
  globalBackgroundSaturation: number
  globalBackgroundBlur: number
  globalBackgroundHueRotate: number
  onUploadClick: () => void
  onRemove: () => void
  onChangeFitMode: (value: ImageFitMode) => void
  onChangeScale: (value: number) => void
  onChangePositionX: (value: number) => void
  onChangePositionY: (value: number) => void
  onChangeOpacity: (value: number) => void
  onChangeBrightness: (value: number) => void
  onChangeContrast: (value: number) => void
  onChangeSaturation: (value: number) => void
  onChangeBlur: (value: number) => void
  onChangeHueRotate: (value: number) => void
}) {
  return (
    <BgSectionCard
      title={t.label_global_background_image}
      hint={t.hint_global_background}
    >
      <div className="flex gap-2">
        <button
          onClick={onUploadClick}
          className="flex-1 rounded border border-cyan-800 px-3 py-1 text-xs text-cyan-400 transition-colors hover:border-cyan-500"
        >
          {t.upload_images}
        </button>
        {globalBackgroundId && (
          <button
            onClick={onRemove}
            className="rounded border border-red-900 px-2 py-1 text-xs text-red-500 transition-colors hover:border-red-600"
          >
            {t.remove_global_background}
          </button>
        )}
      </div>

      {globalBackgroundUrl && (
        <>
          <div className="w-full overflow-hidden rounded border border-cyan-900 bg-black/40">
            <img src={globalBackgroundUrl} alt="" className="h-20 w-full object-cover" />
          </div>

          <BgFitModeSelector
            label={t.label_fit_mode}
            value={globalBackgroundFitMode}
            onChange={onChangeFitMode}
          />

          <SliderControl label={t.label_scale} value={globalBackgroundScale} min={0.1} max={4} step={0.05} onChange={onChangeScale} />
          <SliderControl label={t.label_position_x} value={globalBackgroundPositionX} min={-1} max={1} step={0.02} onChange={onChangePositionX} />
          <SliderControl label={t.label_position_y} value={globalBackgroundPositionY} min={-1} max={1} step={0.02} onChange={onChangePositionY} />
          <SliderControl label={t.label_global_background_opacity} value={globalBackgroundOpacity} min={0} max={1} step={0.05} onChange={onChangeOpacity} />

          <SectionDivider label={t.tab_filters} />
          <SliderControl label={t.label_brightness} value={globalBackgroundBrightness} min={0.2} max={2} step={0.05} onChange={onChangeBrightness} />
          <SliderControl label={t.label_contrast} value={globalBackgroundContrast} min={0.2} max={2} step={0.05} onChange={onChangeContrast} />
          <SliderControl label={t.label_saturation} value={globalBackgroundSaturation} min={0} max={3} step={0.05} onChange={onChangeSaturation} />
          <SliderControl label={t.label_blur} value={globalBackgroundBlur} min={0} max={20} step={0.25} unit="px" onChange={onChangeBlur} />
          <SliderControl label={t.label_hue_rotate} value={globalBackgroundHueRotate} min={0} max={360} step={1} unit="deg" onChange={onChangeHueRotate} />
        </>
      )}
    </BgSectionCard>
  )
}
