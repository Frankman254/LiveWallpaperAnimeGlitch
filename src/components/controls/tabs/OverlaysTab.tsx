import { useRef } from 'react'
import { deleteImage, loadImage, saveImage } from '@/lib/db/imageDb'
import { useT } from '@/lib/i18n'
import { useWallpaperStore } from '@/store/wallpaperStore'
import SliderControl from '@/components/controls/SliderControl'
import ToggleControl from '@/components/controls/ToggleControl'
import ResetButton from '@/components/controls/ui/ResetButton'
import SectionDivider from '@/components/controls/ui/SectionDivider'

function createOverlayId(): string {
  return `overlay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      resolve({
        width: image.naturalWidth || 200,
        height: image.naturalHeight || 200,
      })
    }
    image.onerror = () => resolve({ width: 200, height: 200 })
    image.src = url
  })
}

function fitOverlayBox(width: number, height: number): { width: number; height: number } {
  const maxSize = 220
  const ratio = Math.min(1, maxSize / Math.max(width, height, 1))
  return {
    width: Math.max(48, Math.round(width * ratio)),
    height: Math.max(48, Math.round(height * ratio)),
  }
}

export default function OverlaysTab({ onReset }: { onReset: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const t = useT()
  const store = useWallpaperStore()
  const selectedOverlay = store.overlays.find((overlay) => overlay.id === store.selectedOverlayId) ?? null

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return
    const baseZIndex = 55 + store.overlays.length

    for (const [index, file] of files.entries()) {
      const assetId = await saveImage(file)
      const url = await loadImage(assetId)
      if (!url) continue
      const dimensions = await getImageDimensions(url)
      const initialSize = fitOverlayBox(dimensions.width, dimensions.height)

      store.addOverlay({
        id: createOverlayId(),
        assetId,
        name: file.name.replace(/\.[^.]+$/, '') || 'Overlay',
        url,
        enabled: true,
        zIndex: baseZIndex + index,
        positionX: 0,
        positionY: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
        width: initialSize.width,
        height: initialSize.height,
      })
    }

    event.target.value = ''
  }

  async function removeOverlay(id: string, assetId: string) {
    await deleteImage(assetId)
    store.removeOverlay(id)
  }

  return (
    <>
      <ResetButton label={t.reset_tab} onClick={onReset} />

      <SectionDivider label={t.section_overlays} />
      <div className="flex flex-col gap-2">
        <button
          onClick={() => inputRef.current?.click()}
          className="px-3 py-1 text-xs rounded border border-cyan-800 text-cyan-400 hover:border-cyan-500 transition-colors"
        >
          {t.label_add_overlay}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
        <span className="text-[11px] text-cyan-700">{t.label_overlay_hint}</span>
      </div>

      {store.overlays.length === 0 ? (
        <div className="text-xs text-cyan-700">{t.empty_overlays}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {store.overlays
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((overlay) => {
              const selected = overlay.id === store.selectedOverlayId
              return (
                <div
                  key={overlay.id}
                  className={`rounded border px-3 py-2 transition-colors ${
                    selected ? 'border-cyan-400 bg-cyan-950/30' : 'border-cyan-900 bg-black/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => store.setSelectedOverlayId(overlay.id)}
                      className="flex-1 text-left"
                    >
                      <div className="text-xs text-cyan-300">{overlay.name}</div>
                      <div className="text-[11px] text-cyan-700">
                        z {overlay.zIndex} • {overlay.enabled ? t.label_enabled : 'Off'}
                      </div>
                    </button>
                    <button
                      onClick={() => void removeOverlay(overlay.id, overlay.assetId)}
                      className="px-2 py-1 text-[11px] rounded border border-red-900 text-red-400 hover:border-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {selectedOverlay && (
        <>
          <SectionDivider label={t.label_selected_overlay} />
          <ToggleControl
            label={t.label_enabled}
            value={selectedOverlay.enabled}
            onChange={(value) => store.updateOverlay(selectedOverlay.id, { enabled: value })}
          />
          <SliderControl
            label={t.label_z_index}
            value={selectedOverlay.zIndex}
            min={0}
            max={120}
            step={1}
            onChange={(value) => store.updateOverlay(selectedOverlay.id, { zIndex: value })}
          />
          <SliderControl
            label={t.label_scale}
            value={selectedOverlay.scale}
            min={0.1}
            max={4}
            step={0.05}
            onChange={(value) => store.updateOverlay(selectedOverlay.id, { scale: value })}
          />
          <SliderControl
            label={t.label_rotation}
            value={selectedOverlay.rotation}
            min={-180}
            max={180}
            step={1}
            onChange={(value) => store.updateOverlay(selectedOverlay.id, { rotation: value })}
            unit="deg"
          />
          <SliderControl
            label={t.label_opacity}
            value={selectedOverlay.opacity}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => store.updateOverlay(selectedOverlay.id, { opacity: value })}
          />
          <SliderControl
            label={t.label_position_x}
            value={selectedOverlay.positionX}
            min={-0.9}
            max={0.9}
            step={0.01}
            onChange={(value) => store.updateOverlay(selectedOverlay.id, { positionX: value })}
          />
          <SliderControl
            label={t.label_position_y}
            value={selectedOverlay.positionY}
            min={-0.9}
            max={0.9}
            step={0.01}
            onChange={(value) => store.updateOverlay(selectedOverlay.id, { positionY: value })}
          />
        </>
      )}
    </>
  )
}
