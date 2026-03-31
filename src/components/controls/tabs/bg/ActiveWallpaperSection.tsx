import type { ReactNode } from 'react'
import SectionDivider from '@/components/controls/ui/SectionDivider'
import EnumButtons from '@/components/controls/ui/EnumButtons'
import SliderControl from '@/components/controls/SliderControl'
import ToggleControl from '@/components/controls/ToggleControl'
import type { BackgroundImageItem, SlideshowTransitionType } from '@/types/wallpaper'
import BgFitModeSelector from './BgFitModeSelector'
import BgSectionCard from './BgSectionCard'
import { TRANSITION_LABELS, TRANSITION_TYPES } from './constants'

export default function ActiveWallpaperSection({
  t,
  activeImage,
  activeImageIndex,
  imageCount,
  imageFitMode,
  imageScale,
  imagePositionX,
  imagePositionY,
  imageMirror,
  transitionType,
  transitionDuration,
  transitionIntensity,
  transitionAudioDrive,
  defaultLayoutCount,
  onAutoFitActiveImage,
  onUploadClick,
  onChangeFitMode,
  onChangeScale,
  onChangePositionX,
  onChangePositionY,
  onChangeMirror,
  onChangeTransitionType,
  onChangeTransitionDuration,
  onChangeTransitionIntensity,
  onChangeTransitionAudioDrive,
  onApplyLayoutToDefaults,
}: {
  t: Record<string, string>
  activeImage: BackgroundImageItem | null
  activeImageIndex: number
  imageCount: number
  imageFitMode: Parameters<typeof BgFitModeSelector>[0]['value']
  imageScale: number
  imagePositionX: number
  imagePositionY: number
  imageMirror: boolean
  transitionType: SlideshowTransitionType
  transitionDuration: number
  transitionIntensity: number
  transitionAudioDrive: number
  defaultLayoutCount: number
  onUploadClick: () => void
  onChangeFitMode: (value: Parameters<typeof BgFitModeSelector>[0]['value']) => void
  onChangeScale: (value: number) => void
  onChangePositionX: (value: number) => void
  onChangePositionY: (value: number) => void
  onChangeMirror: (value: boolean) => void
  onChangeTransitionType: (value: SlideshowTransitionType) => void
  onChangeTransitionDuration: (value: number) => void
  onChangeTransitionIntensity: (value: number) => void
  onChangeTransitionAudioDrive: (value: number) => void
  onApplyLayoutToDefaults: () => void
  onAutoFitActiveImage: () => void
}) {
  return (
    <BackgroundCardShell
      t={t}
      activeImage={activeImage}
      activeImageIndex={activeImageIndex}
      imageCount={imageCount}
      onUploadClick={onUploadClick}
    >
      <BgFitModeSelector
        label={t.label_fit_mode}
        value={imageFitMode}
        onChange={onChangeFitMode}
      />

      <SliderControl label={t.label_scale} value={imageScale} min={0.1} max={4} step={0.05} onChange={onChangeScale} />
      <SliderControl label={t.label_position_x} value={imagePositionX} min={-1} max={1} step={0.02} onChange={onChangePositionX} />
      <SliderControl label={t.label_position_y} value={imagePositionY} min={-1} max={1} step={0.02} onChange={onChangePositionY} />
      <ToggleControl label={t.label_mirror_image} value={imageMirror} onChange={onChangeMirror} />

      {activeImage && (
        <>
          <SectionDivider label={t.section_transition_next} />
          <span className="text-[11px] text-cyan-700">{t.hint_transition_next}</span>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-cyan-400">Transition Style</span>
            <EnumButtons<SlideshowTransitionType>
              options={TRANSITION_TYPES}
              value={transitionType}
              onChange={onChangeTransitionType}
              labels={TRANSITION_LABELS}
            />
          </div>

          <SliderControl
            label={t.label_transition_duration}
            value={transitionDuration}
            min={0.2}
            max={4}
            step={0.1}
            unit="s"
            onChange={onChangeTransitionDuration}
          />

          <SliderControl
            label={t.label_transition_intensity}
            value={transitionIntensity}
            min={0.4}
            max={2.5}
            step={0.05}
            onChange={onChangeTransitionIntensity}
          />

          <SliderControl
            label={t.label_transition_audio_drive}
            value={transitionAudioDrive}
            min={0}
            max={1.5}
            step={0.05}
            onChange={onChangeTransitionAudioDrive}
          />
        </>
      )}

      {activeImage && (
        <button
          onClick={onApplyLayoutToDefaults}
          disabled={defaultLayoutCount === 0}
          className="rounded border border-cyan-800 px-3 py-1.5 text-xs text-cyan-400 transition-colors hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {`${t.label_apply_to_default_images} (${defaultLayoutCount})`}
        </button>
      )}
      {activeImage && (
        <button
          onClick={onAutoFitActiveImage}
          className="rounded border border-cyan-800 px-3 py-1.5 text-xs text-cyan-400 transition-colors hover:border-cyan-500"
          title={t.hint_auto_fit_image}
        >
          {t.label_auto_fit_image}
        </button>
      )}
    </BackgroundCardShell>
  )
}

function BackgroundCardShell({
  t,
  activeImage,
  activeImageIndex,
  imageCount,
  onUploadClick,
  children,
}: {
  t: Record<string, string>
  activeImage: BackgroundImageItem | null
  activeImageIndex: number
  imageCount: number
  onUploadClick: () => void
  children: ReactNode
}) {
  return (
    <BgSectionCard
      title={t.label_active_wallpaper}
      hint={activeImage ? t.hint_per_image_settings : t.hint_slideshow_pool}
    >
      {activeImage?.url ? (
        <div className="w-full overflow-hidden rounded border border-cyan-900 bg-black/40">
          <img src={activeImage.url} alt="" className="h-28 w-full object-cover" />
        </div>
      ) : (
        <button
          onClick={onUploadClick}
          className="rounded border border-cyan-800 px-3 py-2 text-xs text-cyan-400 transition-colors hover:border-cyan-500"
        >
          {t.upload_images}
        </button>
      )}

      {activeImageIndex >= 0 && (
        <span className="text-[11px] text-cyan-700">
          {t.label_image_order} {activeImageIndex + 1} / {imageCount}
        </span>
      )}

      {children}
    </BgSectionCard>
  )
}
