import { useRef } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import SliderControl from '../SliderControl'
import ToggleControl from '../ToggleControl'
import PresetSelector from '../PresetSelector'
import ImageUploader from '../ImageUploader'
import SectionDivider from '../ui/SectionDivider'
import ResetButton from '../ui/ResetButton'

export default function BgTab({ onReset }: { onReset: () => void }) {
  const t = useT()
  const store = useWallpaperStore()
  const multiRef = useRef<HTMLInputElement>(null)

  function handleMultiFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const urls = files.map((f) => URL.createObjectURL(f))
    const combined = [...store.imageUrls, ...urls]
    store.setImageUrls(combined)
    // Set first newly added image as current background
    store.setImageUrl(urls[0])
    // Reset input so same files can be re-selected
    e.target.value = ''
  }

  function removeImage(index: number) {
    const next = store.imageUrls.filter((_, i) => i !== index)
    store.setImageUrls(next)
    if (next.length > 0) store.setImageUrl(next[0])
    else store.setImageUrl(null)
  }

  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />
      <PresetSelector />
      <SectionDivider label={t.section_image} />
      <ImageUploader />

      {/* Multi-image slideshow */}
      <SectionDivider label={t.section_slideshow} />
      <div className="flex gap-2">
        <button
          onClick={() => multiRef.current?.click()}
          className="flex-1 px-3 py-1 text-xs rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
        >
          {t.upload_images}
        </button>
        {store.imageUrls.length > 0 && (
          <button
            onClick={() => { store.setImageUrls([]); store.setImageUrl(null) }}
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
            <div key={url} className="relative">
              <img
                src={url}
                alt=""
                onClick={() => store.setImageUrl(url)}
                className="w-10 h-10 object-cover rounded border border-cyan-900 cursor-pointer hover:border-cyan-500"
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
              min={5}
              max={300}
              step={5}
              onChange={store.setSlideshowInterval}
            />
          )}
        </>
      )}

      <SectionDivider />
      <SliderControl label={t.label_scale} value={store.imageScale} min={0.1} max={4} step={0.05} onChange={store.setImageScale} />
      <SliderControl label={t.label_position_x} value={store.imagePositionX} min={-1} max={1} step={0.02} onChange={store.setImagePositionX} />
      <SliderControl label={t.label_position_y} value={store.imagePositionY} min={-1} max={1} step={0.02} onChange={store.setImagePositionY} />
      <SectionDivider label={t.section_bass_reactive} />
      <ToggleControl label={t.label_bass_zoom} value={store.imageBassReactive} onChange={store.setImageBassReactive} />
      {store.imageBassReactive && (
        <SliderControl label={t.label_zoom_intensity} value={store.imageBassScaleIntensity} min={0.05} max={1} step={0.05} onChange={store.setImageBassScaleIntensity} />
      )}
    </>
  )
}
