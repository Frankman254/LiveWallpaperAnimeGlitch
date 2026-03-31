import type { BackgroundImageLayer } from '@/types/layers'
import ImageLayerCanvas from '@/components/wallpaper/layers/ImageLayerCanvas'
import SceneLayerCanvas from '@/components/wallpaper/layers/SceneLayerCanvas'
export default function BackgroundImageLayerView({ layer }: { layer: BackgroundImageLayer }) {
  return (
    <>
      <SceneLayerCanvas layer={layer} />
      <ImageLayerCanvas layer={layer} />
    </>
  )
}
