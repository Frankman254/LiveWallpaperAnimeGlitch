import { useEffect, useRef } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { buildControllerLayers } from '@/lib/layers'

/** Cycles through imageUrls at the configured interval. Renders nothing. */
export default function SlideshowManager() {
  const state = useWallpaperStore()
  const { imageUrls, setImageUrl } = state
  const slideshowLayer = buildControllerLayers(state).find((layer) => layer.type === 'slideshow')
  const slideshowEnabled = slideshowLayer?.enabled ?? false
  const slideshowInterval = slideshowLayer?.interval ?? 0
  const indexRef = useRef(0)

  useEffect(() => {
    if (!slideshowEnabled || imageUrls.length < 2) return

    const id = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % imageUrls.length
      setImageUrl(imageUrls[indexRef.current])
    }, slideshowInterval * 1000)

    return () => clearInterval(id)
  }, [slideshowEnabled, slideshowInterval, imageUrls, setImageUrl])

  return null
}
