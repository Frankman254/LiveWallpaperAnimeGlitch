import type { OverlayImageLayer } from '@/types/layers'
import ImageLayerCanvas from '@/components/wallpaper/layers/ImageLayerCanvas'

export default function OverlayImageLayerView({ layer }: { layer: OverlayImageLayer }) {
  return <ImageLayerCanvas layer={layer} />
}
