import type { BackgroundImageLayer } from '@/types/layers'
import ImageLayerCanvas from '@/components/wallpaper/layers/ImageLayerCanvas'

export default function BackgroundImageLayerView({ layer }: { layer: BackgroundImageLayer }) {
  return <ImageLayerCanvas layer={layer} />
}
