import type { BackgroundImageLayer } from '@/types/layers'
import ImageLayerCanvas from '@/components/wallpaper/layers/ImageLayerCanvas'
import SceneLayerCanvas from '@/components/wallpaper/layers/SceneLayerCanvas'
import { useWallpaperStore } from '@/store/wallpaperStore'

export default function BackgroundImageLayerView({ layer }: { layer: BackgroundImageLayer }) {
  const backgroundFallbackVisible = useWallpaperStore((state) => state.backgroundFallbackVisible)

  return (
    <>
      {backgroundFallbackVisible && <ImageLayerCanvas layer={layer} />}
      <SceneLayerCanvas layer={layer} />
    </>
  )
}
