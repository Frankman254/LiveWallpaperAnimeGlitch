import SliderControl from '@/components/controls/SliderControl'
import ToggleControl from '@/components/controls/ToggleControl'
import SectionDivider from '@/components/controls/ui/SectionDivider'
import AudioChannelSelector from '@/components/controls/ui/AudioChannelSelector'
import type { AudioReactiveChannel, BackgroundImageItem } from '@/types/wallpaper'
import BgSectionCard from './BgSectionCard'
import BgSlideshowControls from './BgSlideshowControls'

export default function SlideshowPoolSection({
  t,
  imageIds,
  backgroundImages,
  activeImage,
  activeImageIndex,
  showPoolThumbnails,
  thumbnailWindowStart,
  maxThumbnailWindowStart,
  visibleBackgroundImages,
  bassReactive,
  bassIntensity,
  bassDecay,
  audioChannel,
  onToggleShowThumbnails,
  onChangeThumbnailWindowStart,
  onMultiUploadClick,
  onClearAllImages,
  onSetActiveImage,
  onRemoveImage,
  onMoveLeft,
  onMoveRight,
  onShuffle,
  onToggleBassReactive,
  onChangeBassIntensity,
  onChangeBassDecay,
  onChangeAudioChannel,
}: {
  t: Record<string, string>
  imageIds: string[]
  backgroundImages: BackgroundImageItem[]
  activeImage: BackgroundImageItem | null
  activeImageIndex: number
  showPoolThumbnails: boolean
  thumbnailWindowStart: number
  maxThumbnailWindowStart: number
  visibleBackgroundImages: BackgroundImageItem[]
  bassReactive: boolean
  bassIntensity: number
  bassDecay: number
  audioChannel: AudioReactiveChannel
  onToggleShowThumbnails: (value: boolean) => void
  onChangeThumbnailWindowStart: (value: number) => void
  onMultiUploadClick: () => void
  onClearAllImages: () => void
  onSetActiveImage: (id: string) => void
  onRemoveImage: (index: number) => void
  onMoveLeft: () => void
  onMoveRight: () => void
  onShuffle: () => void
  onToggleBassReactive: (value: boolean) => void
  onChangeBassIntensity: (value: number) => void
  onChangeBassDecay: (value: number) => void
  onChangeAudioChannel: (value: AudioReactiveChannel) => void
}) {
  return (
    <BgSectionCard
      title={t.label_slideshow_pool}
      hint={t.hint_slideshow_pool}
    >
      <div className="flex gap-2">
        <button
          onClick={onMultiUploadClick}
          className="flex-1 rounded border border-cyan-800 px-3 py-1 text-xs text-cyan-400 transition-colors hover:border-cyan-500"
        >
          {t.upload_images}
        </button>
        {imageIds.length > 0 && (
          <button
            onClick={onClearAllImages}
            className="rounded border border-red-900 px-2 py-1 text-xs text-red-500 transition-colors hover:border-red-600"
          >
            ✕
          </button>
        )}
      </div>

      {backgroundImages.length > 0 && (
        <div className="flex flex-col gap-2">
          <ToggleControl
            label={t.label_show_bg_thumbnails}
            value={showPoolThumbnails}
            onChange={onToggleShowThumbnails}
            tooltip={t.hint_show_bg_thumbnails}
          />

          {activeImage && backgroundImages.length > 1 && (
            <>
              <span className="text-[11px] text-cyan-700">{t.hint_shuffle_order}</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={onMoveLeft}
                  disabled={activeImageIndex <= 0}
                  className="rounded border border-cyan-800 px-3 py-1 text-xs text-cyan-400 transition-colors hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t.label_move_left}
                </button>
                <button
                  onClick={onMoveRight}
                  disabled={activeImageIndex < 0 || activeImageIndex >= backgroundImages.length - 1}
                  className="rounded border border-cyan-800 px-3 py-1 text-xs text-cyan-400 transition-colors hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t.label_move_right}
                </button>
                <button
                  onClick={onShuffle}
                  className="rounded border border-cyan-800 px-3 py-1 text-xs text-cyan-400 transition-colors hover:border-cyan-500"
                >
                  {t.label_shuffle_order}
                </button>
              </div>
            </>
          )}

          {showPoolThumbnails && maxThumbnailWindowStart > 0 && (
            <SliderControl
              label={t.label_pool_scroll}
              value={thumbnailWindowStart}
              min={0}
              max={maxThumbnailWindowStart}
              step={1}
              onChange={onChangeThumbnailWindowStart}
            />
          )}

          {showPoolThumbnails && (
            <div className="flex flex-wrap gap-1">
              {visibleBackgroundImages.map((image, visibleIndex) => {
                const imageIndex = thumbnailWindowStart + visibleIndex
                return (
                  <div key={image.assetId} className="relative">
                    <img
                      src={image.url ?? ''}
                      alt=""
                      onClick={() => onSetActiveImage(image.assetId)}
                      className={`h-12 w-12 cursor-pointer rounded object-cover transition-colors ${
                        activeImage?.assetId === image.assetId
                          ? 'border-2 border-cyan-400'
                          : 'border border-cyan-900 hover:border-cyan-500'
                      }`}
                    />
                    <button
                      onClick={() => onRemoveImage(imageIndex)}
                      className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-xs leading-none text-white"
                    >
                      ×
                    </button>
                    <span className="pointer-events-none absolute bottom-0 left-0 rounded-tr bg-black/70 px-1 text-[9px] text-cyan-300">
                      {imageIndex + 1}
                    </span>
                  </div>
                )
              })}
              <span className="self-end text-xs text-gray-500">
                {backgroundImages.length} {t.label_images_loaded}
                {maxThumbnailWindowStart > 0 && ` • ${thumbnailWindowStart + 1}-${Math.min(backgroundImages.length, thumbnailWindowStart + visibleBackgroundImages.length)}`}
              </span>
            </div>
          )}

          {!showPoolThumbnails && (
            <span className="text-[11px] text-cyan-700">
              {backgroundImages.length} {t.label_images_loaded}
            </span>
          )}
        </div>
      )}

      <SectionDivider label={t.section_bass_reactive} />
      <span className="text-[11px] text-cyan-700">{t.hint_shared_bg_settings}</span>
      <ToggleControl label={t.label_bass_zoom} value={bassReactive} onChange={onToggleBassReactive} />
      {bassReactive && (
        <>
          <AudioChannelSelector value={audioChannel} onChange={onChangeAudioChannel} label={t.label_zoom_audio_channel} />
          <SliderControl
            label={t.label_zoom_intensity}
            value={bassIntensity}
            min={0.05}
            max={1}
            step={0.05}
            onChange={onChangeBassIntensity}
          />
          <SliderControl
            label={t.label_zoom_decay}
            value={bassDecay}
            min={0.05}
            max={0.95}
            step={0.01}
            onChange={onChangeBassDecay}
          />
        </>
      )}

      {backgroundImages.length > 1 ? (
        <>
          <SectionDivider label={t.section_slideshow} />
          <BgSlideshowControls />
        </>
      ) : (
        <span className="text-[11px] text-cyan-700">{t.hint_slideshow_pool}</span>
      )}
    </BgSectionCard>
  )
}
