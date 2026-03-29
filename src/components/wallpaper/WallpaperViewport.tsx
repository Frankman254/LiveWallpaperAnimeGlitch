import { buildOverlayLayers, buildSceneLayers } from '@/lib/layers'
import { useWallpaperStore } from '@/store/wallpaperStore'
import SlideshowManager from '@/components/SlideshowManager'
import OverlayInteractionStage from '@/components/wallpaper/OverlayInteractionStage'
import SceneLayerCanvas from '@/components/wallpaper/layers/SceneLayerCanvas'
import BackgroundImageLayerView from '@/components/wallpaper/layers/BackgroundImageLayerView'
import OverlayImageLayerView from '@/components/wallpaper/layers/OverlayImageLayerView'
import AudioLayerCanvas from '@/components/audio/layers/AudioLayerCanvas'

export default function WallpaperViewport({ editorMode = false }: { editorMode?: boolean }) {
  const state = useWallpaperStore()
  const sceneLayers = buildSceneLayers(state)
  const overlayLayers = buildOverlayLayers(state)
  const renderableLayers = [...sceneLayers, ...overlayLayers].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <>
      <SlideshowManager />
      <main style={{ position: 'fixed', inset: 0, overflow: 'hidden', isolation: 'isolate' }}>
        {renderableLayers.map((layer) => {
          if (!layer.enabled) return null

          if (layer.type === 'background-image' && layer.imageUrl) {
            return <BackgroundImageLayerView key={layer.id} layer={layer} />
          }

          if (layer.type === 'overlay-image') {
            return <OverlayImageLayerView key={layer.id} layer={layer} />
          }

          if (layer.type === 'logo' || layer.type === 'spectrum') {
            return <AudioLayerCanvas key={layer.id} layer={layer} />
          }

          return <SceneLayerCanvas key={layer.id} layer={layer} />
        })}

        {editorMode && <OverlayInteractionStage />}
      </main>
    </>
  )
}
