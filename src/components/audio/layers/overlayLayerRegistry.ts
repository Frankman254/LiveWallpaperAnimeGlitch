import type { OverlayLayer } from '@/types/layers'
import type { WallpaperState } from '@/types/wallpaper'
import { drawLogo, getSmoothedAmplitude } from '@/components/audio/ReactiveLogo'
import { drawSpectrum } from '@/components/audio/CircularSpectrum'

interface OverlayRenderContext {
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
  state: WallpaperState
  bins: Uint8Array
  bassAmplitude: number
  dt: number
}

const imageCache = new Map<string, HTMLImageElement>()

function getCachedImage(url: string): HTMLImageElement {
  const cached = imageCache.get(url)
  if (cached) return cached

  const image = new Image()
  image.src = url
  imageCache.set(url, image)
  return image
}

function drawOverlayImage(
  layer: Extract<OverlayLayer, { type: 'overlay-image' }>,
  context: OverlayRenderContext
): void {
  if (!layer.imageUrl) return

  const image = getCachedImage(layer.imageUrl)
  if (!image.complete || image.naturalWidth === 0) return

  const cx = context.canvas.width / 2 + layer.positionX * context.canvas.width
  const cy = context.canvas.height / 2 - layer.positionY * context.canvas.height
  const width = layer.width * layer.scale
  const height = layer.height * layer.scale

  context.ctx.save()
  context.ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity))
  context.ctx.translate(cx, cy)
  context.ctx.rotate((layer.rotation * Math.PI) / 180)
  context.ctx.drawImage(image, -width / 2, -height / 2, width, height)
  context.ctx.restore()
}

export function drawOverlayLayer(layer: OverlayLayer, context: OverlayRenderContext): void {
  if (!layer.enabled) return

  if (layer.type === 'overlay-image') {
    drawOverlayImage(layer, context)
    return
  }

  if (layer.type === 'logo') {
    drawLogo(context.ctx, context.canvas, context.bassAmplitude, context.state)
    return
  }

  if (layer.type === 'spectrum') {
    let spectrumInnerRadius = context.state.spectrumInnerRadius
    if (layer.followLogo && context.state.logoEnabled) {
      const smoothedAmp = getSmoothedAmplitude()
      const logoScale = 1 + smoothedAmp * context.state.logoReactiveScaleIntensity
      const logoRadius = (context.state.logoBaseSize * logoScale) / 2
      spectrumInnerRadius = logoRadius + (context.state.logoBackdropEnabled ? context.state.logoBackdropPadding : 4)
    }
    drawSpectrum(context.ctx, context.canvas, context.bins, { ...context.state, spectrumInnerRadius }, context.dt)
  }
}
