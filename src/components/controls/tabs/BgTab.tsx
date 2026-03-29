import { useRef } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'
import PresetSelector from '../PresetSelector'
import SectionDivider from '../ui/SectionDivider'
import ResetButton from '../ui/ResetButton'
import EnumButtons from '../ui/EnumButtons'
import { saveImage, deleteImage } from '@/lib/db/imageDb'
import type { ImageFitMode } from '@/types/wallpaper'

const FIT_MODES: ImageFitMode[] = ['cover', 'contain', 'stretch', 'fit-width', 'fit-height']

export default function BgTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  const multiRef = useRef<HTMLInputElement>(null)
  const singleRef = useRef<HTMLInputElement>(null)

  async function handleSingleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const id = await saveImage(file)
    const url = URL.createObjectURL(file)
    store.addImageEntry(id, url)
    store.setImageUrl(url)
    e.target.value = ''
  }

  async function handleMultiFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    let firstUrl: string | null = null
    for (const file of files) {
      const id = await saveImage(file)
      const url = URL.createObjectURL(file)
      store.addImageEntry(id, url)
      if (!firstUrl) firstUrl = url
    }
    if (firstUrl) store.setImageUrl(firstUrl)
    e.target.value = ''
  }

  async function removeImage(index: number) {
    const id = store.imageIds[index]
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
              store.setImageUrl(null)
              useWallpaperStore.setState({ imageIds: [] })
            }}
            className="px-2 py-1 text-xs rounded border border-red-900 text-red-500 hover:border-red-600 transition-colors"
          >
            ✕
          </button>
        )}
      </div>
      <input ref={multiRef} type="file" accept="image/*" multiple onChange={handleMultiFiles} className="hidden" />

      {store.imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {store.imageUrls.map((url, i) => (
            <div key={store.imageIds[i] ?? url} className="relative">
              <img
                src={url}
                alt=""
                onClick={() => store.setImageUrl(url)}
                className={`w-10 h-10 object-cover rounded cursor-pointer transition-colors ${
                  store.imageUrl === url ? 'border-2 border-cyan-400' : 'border border-cyan-900 hover:border-cyan-500'
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
          <span className="text-xs text-gray-500 self-end">{store.imageUrls.length} {t.label_images_loaded}</span>
        </div>
      )}

      {store.imageUrls.length > 1 && (
        <>
          <ToggleControl label={t.label_slideshow_enabled} value={store.slideshowEnabled} onChange={store.setSlideshowEnabled} />
          {store.slideshowEnabled && (
            <SliderControl
              label={t.label_slideshow_interval}
              value={store.slideshowInterval}
              min={5} max={300} step={5}
              onChange={store.setSlideshowInterval}
              unit="s"
            />
          )}
        </>
      )}
    </>
  )
}
