import { useEffect, useRef } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'

/** Cycles through imageUrls at the configured interval. Renders nothing. */
export default function SlideshowManager() {
  const { imageUrls, slideshowEnabled, slideshowInterval, setImageUrl } = useWallpaperStore()
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
