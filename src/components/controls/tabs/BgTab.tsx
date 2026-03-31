import { useRef, useState } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'
import PresetSelector from '../PresetSelector'
import SectionDivider from '../ui/SectionDivider'
import ResetButton from '../ui/ResetButton'
import EnumButtons from '../ui/EnumButtons'
import { saveImage, deleteImage, loadImage } from '@/lib/db/imageDb'
import type { ImageFitMode, SlideshowTransitionType } from '@/types/wallpaper'

const FIT_MODES: ImageFitMode[] = ['cover', 'contain', 'stretch', 'fit-width', 'fit-height']
const TRANSITION_TYPES: SlideshowTransitionType[] = ['fade', 'slide-left', 'slide-right', 'zoom-in', 'blur-dissolve']
const TRANSITION_LABELS: Record<SlideshowTransitionType, string> = {
  'fade': 'Fade',
  'slide-left': '← Slide',
  'slide-right': 'Slide →',
  'zoom-in': 'Zoom',
  'blur-dissolve': 'Dissolve',
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

  function handleIntervalChange(v: number) {
    store.setSlideshowInterval(useMinutes ? Math.round(v * 60) : v)
  }

  function toggleUnit() {
    setUseMinutes((prev) => !prev)
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
              onClick={toggleUnit}
              className="px-2 py-1 text-xs rounded border border-cyan-900 text-cyan-500 hover:border-cyan-600 transition-colors mt-3 shrink-0"
            >
              {useMinutes ? 'sec' : 'min'}
            </button>
          </div>
          <SliderControl label={t.label_transition_duration} value={store.slideshowTransitionDuration} min={0.2} max={4} step={0.1} onChange={store.setSlideshowTransitionDuration} unit="s" />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-cyan-400">Transition Style</span>
            <EnumButtons<SlideshowTransitionType>
              options={TRANSITION_TYPES}
              value={store.slideshowTransitionType}
              onChange={store.setSlideshowTransitionType}
              labels={TRANSITION_LABELS}
            />
          </div>
        </>
      )}
    </>
  )
}

export default function BgTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  const multiRef = useRef<HTMLInputElement>(null)
  const singleRef = useRef<HTMLInputElement>(null)

  async function handleSingleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const id = await saveImage(file)
    const url = await loadImage(id)
    if (!url) return
    store.addImageEntry(id, url)
    store.setActiveImageId(id)
    e.target.value = ''
  }

  async function handleMultiFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
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
    e.target.value = ''
  }

  async function removeImage(index: number) {
    const id = store.backgroundImages[index]?.assetId
    if (!id) return
    if (id) await deleteImage(id)
    store.removeImageEntry(id)
  }

  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />
      <PresetSelector />

      <SectionDivider label={t.section_image} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">Background Image</span>
        <button
          onClick={() => singleRef.current?.click()}
          className="px-3 py-1 text-xs rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
        >
          {t.upload_logo.replace('Logo', 'Image')}
        </button>
        <input ref={singleRef} type="file" accept="image/*" onChange={handleSingleFile} className="hidden" />
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400">{t.label_fit_mode}</span>
        <EnumButtons<ImageFitMode>
          options={FIT_MODES}
          value={store.imageFitMode}
          onChange={store.setImageFitMode}
        />
      </div>

      <SliderControl label={t.label_scale} value={store.imageScale} min={0.1} max={4} step={0.05} onChange={store.setImageScale} />
      <SliderControl label={t.label_position_x} value={store.imagePositionX} min={-1} max={1} step={0.02} onChange={store.setImagePositionX} />
      <SliderControl label={t.label_position_y} value={store.imagePositionY} min={-1} max={1} step={0.02} onChange={store.setImagePositionY} />
      <span className="text-[11px] text-cyan-700">{t.hint_per_image_settings}</span>

      <SectionDivider label={t.section_bass_reactive} />
      <ToggleControl label={t.label_bass_zoom} value={store.imageBassReactive} onChange={store.setImageBassReactive} />
      {store.imageBassReactive && (
        <SliderControl label={t.label_zoom_intensity} value={store.imageBassScaleIntensity} min={0.05} max={1} step={0.05} onChange={store.setImageBassScaleIntensity} />
      )}

      <SectionDivider label={t.section_slideshow} />
      <div className="flex gap-2">
        <button
          onClick={() => multiRef.current?.click()}
          className="flex-1 px-3 py-1 text-xs rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
        >
          {t.upload_images}
        </button>
        {store.imageIds.length > 0 && (
          <button
            onClick={async () => {
              for (const id of store.imageIds) await deleteImage(id)
              store.setImageUrls([])
            }}
            className="px-2 py-1 text-xs rounded border border-red-900 text-red-500 hover:border-red-600 transition-colors"
          >
            ✕
          </button>
        )}
      </div>
      <input ref={multiRef} type="file" accept="image/*" multiple onChange={handleMultiFiles} className="hidden" />

      {store.backgroundImages.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {store.backgroundImages.map((image, i) => (
            <div key={image.assetId} className="relative">
              <img
                src={image.url ?? ''}
                alt=""
                onClick={() => store.setActiveImageId(image.assetId)}
                className={`w-10 h-10 object-cover rounded cursor-pointer transition-colors ${
                  store.activeImageId === image.assetId ? 'border-2 border-cyan-400' : 'border border-cyan-900 hover:border-cyan-500'
                }`}
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center leading-none"
              >
                ×
              </button>
            </div>
          ))}
          <span className="text-xs text-gray-500 self-end">{store.backgroundImages.length} {t.label_images_loaded}</span>
        </div>
      )}

      {store.backgroundImages.length > 1 && (
        <SlideshowControls />
      )}
    </>
  )
}
