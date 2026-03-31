import { useRef, useState, type ReactNode } from 'react'
import { isBackgroundImageUsingDefaultLayout } from '@/lib/backgroundImages'
import { deleteImage, loadImage, saveImage } from '@/lib/db/imageDb'
import { useT } from '@/lib/i18n'
import { useWallpaperStore } from '@/store/wallpaperStore'
import type { ImageFitMode, SlideshowTransitionType } from '@/types/wallpaper'
import PresetSelector from '../PresetSelector'
import ResetButton from '../ui/ResetButton'
import SectionDivider from '../ui/SectionDivider'
import EnumButtons from '../ui/EnumButtons'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'

const FIT_MODES: ImageFitMode[] = ['cover', 'contain', 'stretch', 'fit-width', 'fit-height']
const TRANSITION_TYPES: SlideshowTransitionType[] = [
  'fade',
  'slide-left',
  'slide-right',
  'zoom-in',
  'blur-dissolve',
  'bars-horizontal',
  'bars-vertical',
  'rgb-shift',
  'distortion',
]

const TRANSITION_LABELS: Record<SlideshowTransitionType, string> = {
  fade: 'Fade',
  'slide-left': '← Slide',
  'slide-right': 'Slide →',
  'zoom-in': 'Zoom',
  'blur-dissolve': 'Dissolve',
  'bars-horizontal': 'Bars H',
  'bars-vertical': 'Bars V',
  'rgb-shift': 'RGB Split',
  distortion: 'Distort',
}

function BackgroundCard({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-cyan-950/80 bg-cyan-950/10 p-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-widest text-cyan-400">{title}</span>
        {hint && <span className="text-[11px] text-cyan-700">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function FitModeSelector({
  label,
  value,
  onChange,
}: {
  label: string
  value: ImageFitMode
  onChange: (value: ImageFitMode) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-cyan-400">{label}</span>
      <EnumButtons<ImageFitMode>
        options={FIT_MODES}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

function SlideshowControls() {
  const t = useT()
  const store = useWallpaperStore()
  const [useMinutes, setUseMinutes] = useState(false)

  const intervalSeconds = store.slideshowInterval
  const displayInterval = useMinutes ? intervalSeconds / 60 : intervalSeconds
  const minInterval = useMinutes ? 1 : 5
  const maxInterval = useMinutes ? 60 : 300
  const stepInterval = useMinutes ? 1 : 5

  function handleIntervalChange(value: number) {
    store.setSlideshowInterval(useMinutes ? Math.round(value * 60) : value)
  }

  return (
    <>
      <ToggleControl label={t.label_slideshow_enabled} value={store.slideshowEnabled} onChange={store.setSlideshowEnabled} />
      {store.slideshowEnabled && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SliderControl
                label={`Interval (${useMinutes ? 'min' : 'sec'})`}
                value={displayInterval}
                min={minInterval}
                max={maxInterval}
                step={stepInterval}
                onChange={handleIntervalChange}
                unit={useMinutes ? 'min' : 's'}
              />
            </div>
            <button
              onClick={() => setUseMinutes((prev) => !prev)}
              className="mt-3 shrink-0 rounded border border-cyan-900 px-2 py-1 text-xs text-cyan-500 transition-colors hover:border-cyan-600"
            >
              {useMinutes ? 'sec' : 'min'}
            </button>
          </div>

          <SliderControl
            label={t.label_transition_duration}
            value={store.slideshowTransitionDuration}
            min={0.2}
            max={4}
            step={0.1}
            unit="s"
            onChange={store.setSlideshowTransitionDuration}
          />

          <div className="flex flex-col gap-1">
            <span className="text-xs text-cyan-400">Transition Style</span>
            <EnumButtons<SlideshowTransitionType>
              options={TRANSITION_TYPES}
              value={store.slideshowTransitionType}
              onChange={store.setSlideshowTransitionType}
              labels={TRANSITION_LABELS}
            />
          </div>

          <SliderControl
            label={t.label_transition_intensity}
            value={store.slideshowTransitionIntensity}
            min={0.4}
            max={2.5}
            step={0.05}
            onChange={store.setSlideshowTransitionIntensity}
          />

          <SliderControl
            label={t.label_transition_audio_drive}
            value={store.slideshowTransitionAudioDrive}
            min={0}
            max={1.5}
            step={0.05}
            onChange={store.setSlideshowTransitionAudioDrive}
          />
        </>
      )}
    </>
  )
}

export default function BgTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  const multiRef = useRef<HTMLInputElement>(null)
  const globalRef = useRef<HTMLInputElement>(null)
  const activeImage = store.backgroundImages.find((image) => image.assetId === store.activeImageId)
    ?? store.backgroundImages[0]
    ?? null
  const defaultLayoutCount = store.backgroundImages.filter((image) => (
    image.assetId !== store.activeImageId && isBackgroundImageUsingDefaultLayout(image)
  )).length

  async function handleGlobalBackgroundFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const previousId = store.globalBackgroundId
    const id = await saveImage(file)
    const url = await loadImage(id)
    if (!url) return

    store.setGlobalBackgroundId(id)
    store.setGlobalBackgroundUrl(url)

    if (previousId && previousId !== id) {
      await deleteImage(previousId).catch(() => undefined)
    }

    event.target.value = ''
  }

  async function handleMultiFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    let firstAddedId: string | null = null
    for (const file of files) {
      const id = await saveImage(file)
      const url = await loadImage(id)
      if (!url) continue
      store.addImageEntry(id, url)
      if (!firstAddedId) firstAddedId = id
    }

    if (!store.activeImageId && firstAddedId) {
      store.setActiveImageId(firstAddedId)
    }

    event.target.value = ''
  }

  async function removeImage(index: number) {
    const id = store.backgroundImages[index]?.assetId
    if (!id) return
    await deleteImage(id)
    store.removeImageEntry(id)
  }

  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />
      <PresetSelector />

      <SectionDivider label={t.section_image} />
      <BackgroundCard
        title={t.label_active_wallpaper}
        hint={activeImage ? t.hint_per_image_settings : t.hint_slideshow_pool}
      >
        {activeImage?.url ? (
          <div className="w-full overflow-hidden rounded border border-cyan-900 bg-black/40">
            <img src={activeImage.url} alt="" className="h-28 w-full object-cover" />
          </div>
        ) : (
          <button
            onClick={() => multiRef.current?.click()}
            className="rounded border border-cyan-800 px-3 py-2 text-xs text-cyan-400 transition-colors hover:border-cyan-500"
          >
            {t.upload_images}
          </button>
        )}

        <FitModeSelector
          label={t.label_fit_mode}
          value={store.imageFitMode}
          onChange={store.setImageFitMode}
        />

        <SliderControl label={t.label_scale} value={store.imageScale} min={0.1} max={4} step={0.05} onChange={store.setImageScale} />
        <SliderControl label={t.label_position_x} value={store.imagePositionX} min={-1} max={1} step={0.02} onChange={store.setImagePositionX} />
        <SliderControl label={t.label_position_y} value={store.imagePositionY} min={-1} max={1} step={0.02} onChange={store.setImagePositionY} />

        {activeImage && (
          <button
            onClick={store.applyActiveImageConfigToDefaultImages}
            disabled={defaultLayoutCount === 0}
            className="rounded border border-cyan-800 px-3 py-1.5 text-xs text-cyan-400 transition-colors hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {`${t.label_apply_to_default_images} (${defaultLayoutCount})`}
          </button>
        )}
      </BackgroundCard>

      <SectionDivider label={t.section_slideshow} />
      <BackgroundCard
        title={t.label_slideshow_pool}
        hint={t.hint_slideshow_pool}
      >
        <div className="flex gap-2">
          <button
            onClick={() => multiRef.current?.click()}
            className="flex-1 rounded border border-cyan-800 px-3 py-1 text-xs text-cyan-400 transition-colors hover:border-cyan-500"
          >
            {t.upload_images}
          </button>
          {store.imageIds.length > 0 && (
            <button
              onClick={async () => {
                for (const id of store.imageIds) await deleteImage(id)
                store.setImageUrls([])
              }}
              className="rounded border border-red-900 px-2 py-1 text-xs text-red-500 transition-colors hover:border-red-600"
            >
              ✕
            </button>
          )}
        </div>
        <input ref={multiRef} type="file" accept="image/*" multiple onChange={handleMultiFiles} className="hidden" />

        {store.backgroundImages.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {store.backgroundImages.map((image, index) => (
              <div key={image.assetId} className="relative">
                <img
                  src={image.url ?? ''}
                  alt=""
                  onClick={() => store.setActiveImageId(image.assetId)}
                  className={`h-12 w-12 cursor-pointer rounded object-cover transition-colors ${
                    store.activeImageId === image.assetId
                      ? 'border-2 border-cyan-400'
                      : 'border border-cyan-900 hover:border-cyan-500'
                  }`}
                />
                <button
                  onClick={() => void removeImage(index)}
                  className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-xs leading-none text-white"
                >
                  ×
                </button>
              </div>
            ))}
            <span className="self-end text-xs text-gray-500">{store.backgroundImages.length} {t.label_images_loaded}</span>
          </div>
        )}

        <SectionDivider label={t.section_bass_reactive} />
        <span className="text-[11px] text-cyan-700">{t.hint_shared_bg_settings}</span>
        <ToggleControl label={t.label_bass_zoom} value={store.imageBassReactive} onChange={store.setImageBassReactive} />
        {store.imageBassReactive && (
          <SliderControl
            label={t.label_zoom_intensity}
            value={store.imageBassScaleIntensity}
            min={0.05}
            max={1}
            step={0.05}
            onChange={store.setImageBassScaleIntensity}
          />
        )}

        {store.backgroundImages.length > 1 ? (
          <>
            <SectionDivider label={t.section_slideshow} />
            <SlideshowControls />
          </>
        ) : (
          <span className="text-[11px] text-cyan-700">{t.hint_slideshow_pool}</span>
        )}
      </BackgroundCard>

      <SectionDivider label={t.section_global_background} />
      <BackgroundCard
        title={t.label_global_background_image}
        hint={t.hint_global_background}
      >
        <div className="flex gap-2">
          <button
            onClick={() => globalRef.current?.click()}
            className="flex-1 rounded border border-cyan-800 px-3 py-1 text-xs text-cyan-400 transition-colors hover:border-cyan-500"
          >
            {t.upload_images}
          </button>
          {store.globalBackgroundId && (
            <button
              onClick={async () => {
                const previousId = store.globalBackgroundId
                if (previousId) await deleteImage(previousId).catch(() => undefined)
                store.setGlobalBackgroundId(null)
                store.setGlobalBackgroundUrl(null)
              }}
              className="rounded border border-red-900 px-2 py-1 text-xs text-red-500 transition-colors hover:border-red-600"
            >
              {t.remove_global_background}
            </button>
          )}
        </div>
        <input ref={globalRef} type="file" accept="image/*" onChange={handleGlobalBackgroundFile} className="hidden" />

        {store.globalBackgroundUrl && (
          <>
            <div className="w-full overflow-hidden rounded border border-cyan-900 bg-black/40">
              <img src={store.globalBackgroundUrl} alt="" className="h-20 w-full object-cover" />
            </div>

            <FitModeSelector
              label={t.label_fit_mode}
              value={store.globalBackgroundFitMode}
              onChange={store.setGlobalBackgroundFitMode}
            />

            <SliderControl label={t.label_scale} value={store.globalBackgroundScale} min={0.1} max={4} step={0.05} onChange={store.setGlobalBackgroundScale} />
            <SliderControl label={t.label_position_x} value={store.globalBackgroundPositionX} min={-1} max={1} step={0.02} onChange={store.setGlobalBackgroundPositionX} />
            <SliderControl label={t.label_position_y} value={store.globalBackgroundPositionY} min={-1} max={1} step={0.02} onChange={store.setGlobalBackgroundPositionY} />
            <SliderControl label={t.label_global_background_opacity} value={store.globalBackgroundOpacity} min={0} max={1} step={0.05} onChange={store.setGlobalBackgroundOpacity} />

            <SectionDivider label={t.tab_filters} />
            <SliderControl label={t.label_brightness} value={store.globalBackgroundBrightness} min={0.2} max={2} step={0.05} onChange={store.setGlobalBackgroundBrightness} />
            <SliderControl label={t.label_contrast} value={store.globalBackgroundContrast} min={0.2} max={2} step={0.05} onChange={store.setGlobalBackgroundContrast} />
            <SliderControl label={t.label_saturation} value={store.globalBackgroundSaturation} min={0} max={3} step={0.05} onChange={store.setGlobalBackgroundSaturation} />
            <SliderControl label={t.label_blur} value={store.globalBackgroundBlur} min={0} max={20} step={0.25} unit="px" onChange={store.setGlobalBackgroundBlur} />
            <SliderControl label={t.label_hue_rotate} value={store.globalBackgroundHueRotate} min={0} max={360} step={1} unit="deg" onChange={store.setGlobalBackgroundHueRotate} />
          </>
        )}
      </BackgroundCard>
    </>
  )
}
