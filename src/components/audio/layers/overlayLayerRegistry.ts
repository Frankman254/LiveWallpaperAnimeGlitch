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

export function drawOverlayLayer(layer: OverlayLayer, context: OverlayRenderContext): void {
  if (!layer.enabled) return

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
