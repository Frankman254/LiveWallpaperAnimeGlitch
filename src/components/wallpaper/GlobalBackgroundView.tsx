import { useEffect, useRef, useState } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import type { ImageFitMode } from '@/types/wallpaper'

const imageCache = new Map<string, HTMLImageElement>()

function getCachedImage(url: string, onReady: (image: HTMLImageElement) => void): HTMLImageElement {
  const cached = imageCache.get(url)
  if (cached) {
    if (cached.complete && cached.naturalWidth > 0) onReady(cached)
    else cached.onload = () => onReady(cached)
    return cached
  }

  const image = new Image()
  image.decoding = 'async'
  image.onload = () => onReady(image)
  image.src = url
  imageCache.set(url, image)
  return image
}

function getBaseSize(
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number,
  fitMode: ImageFitMode
) {
  const imageAspect = imageWidth / Math.max(imageHeight, 1)
  const canvasAspect = canvasWidth / Math.max(canvasHeight, 1)

  if (fitMode === 'stretch') return { width: canvasWidth, height: canvasHeight }
  if (fitMode === 'fit-width') return { width: canvasWidth, height: canvasWidth / Math.max(imageAspect, 0.001) }
  if (fitMode === 'fit-height') return { width: canvasHeight * imageAspect, height: canvasHeight }

  if (fitMode === 'contain') {
    if (canvasAspect > imageAspect) {
      return { width: canvasHeight * imageAspect, height: canvasHeight }
    }
    return { width: canvasWidth, height: canvasWidth / Math.max(imageAspect, 0.001) }
  }

  if (canvasAspect > imageAspect) {
    return { width: canvasWidth, height: canvasWidth / Math.max(imageAspect, 0.001) }
  }

  return { width: canvasHeight * imageAspect, height: canvasHeight }
}

export default function GlobalBackgroundView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const {
    globalBackgroundEnabled,
    globalBackgroundUrl,
    globalBackgroundScale,
    globalBackgroundPositionX,
    globalBackgroundPositionY,
    globalBackgroundFitMode,
    globalBackgroundOpacity,
    globalBackgroundBrightness,
    globalBackgroundContrast,
    globalBackgroundSaturation,
    globalBackgroundBlur,
    globalBackgroundHueRotate,
  } = useWallpaperStore()

  useEffect(() => {
    if (!globalBackgroundEnabled) {
      setImage(null)
      return
    }

    if (!globalBackgroundUrl) {
      setImage(null)
      return
    }

    const nextImage = getCachedImage(globalBackgroundUrl, setImage)
    if (nextImage.complete && nextImage.naturalWidth > 0) setImage(nextImage)
  }, [globalBackgroundEnabled, globalBackgroundUrl])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image || !globalBackgroundUrl) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      const currentCanvas = canvasRef.current
      if (!currentCanvas) return
      currentCanvas.width = window.innerWidth
      currentCanvas.height = window.innerHeight

      const base = getBaseSize(
        currentCanvas.width,
        currentCanvas.height,
        image.naturalWidth || currentCanvas.width,
        image.naturalHeight || currentCanvas.height,
        globalBackgroundFitMode
      )

      const width = base.width * Math.max(0.01, globalBackgroundScale)
      const height = base.height * Math.max(0.01, globalBackgroundScale)
      const cx = currentCanvas.width / 2 + globalBackgroundPositionX * currentCanvas.width * 0.5
      const cy = currentCanvas.height / 2 - globalBackgroundPositionY * currentCanvas.height * 0.5

      ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height)
      ctx.save()
      ctx.globalAlpha = Math.max(0, Math.min(1, globalBackgroundOpacity))
      ctx.filter = `brightness(${globalBackgroundBrightness}) contrast(${globalBackgroundContrast}) saturate(${globalBackgroundSaturation}) blur(${globalBackgroundBlur}px) hue-rotate(${globalBackgroundHueRotate}deg)`
      ctx.drawImage(image, cx - width / 2, cy - height / 2, width, height)
      ctx.restore()
    }

    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [
    globalBackgroundBlur,
    globalBackgroundBrightness,
    globalBackgroundContrast,
    globalBackgroundFitMode,
    globalBackgroundHueRotate,
    globalBackgroundOpacity,
    globalBackgroundPositionX,
    globalBackgroundPositionY,
    globalBackgroundSaturation,
    globalBackgroundScale,
    globalBackgroundUrl,
    image,
  ])

  if (!globalBackgroundEnabled || !globalBackgroundUrl || !image) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -10,
      }}
    />
  )
}
