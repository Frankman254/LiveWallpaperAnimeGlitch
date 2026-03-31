import type { OverlayLayer } from '@/types/layers'
import type { WallpaperState } from '@/types/wallpaper'
import { drawLogo, getLogoRenderState } from '@/components/audio/ReactiveLogo'
import { drawSpectrum } from '@/components/audio/CircularSpectrum'
import { drawTrackTitleOverlay } from '@/components/audio/TrackTitleOverlay'

interface OverlayRenderContext {
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
  state: WallpaperState
  bins: Uint8Array
  bands: { bass: number; mid: number; treble: number }
  dt: number
  trackTitle: string
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

function averageTopBins(
  bins: Uint8Array,
  start: number,
  end: number,
  take: number
): number {
  const safeStart = Math.max(0, start)
  const safeEnd = Math.min(end, bins.length)
  if (safeEnd <= safeStart || take <= 0) return 0

  const topValues = new Array<number>(take).fill(0)
  for (let i = safeStart; i < safeEnd; i++) {
    const value = bins[i] ?? 0
    for (let j = 0; j < topValues.length; j++) {
      if (value <= topValues[j]) continue
      for (let k = topValues.length - 1; k > j; k--) {
        topValues[k] = topValues[k - 1]
      }
      topValues[j] = value
      break
    }
  }

  const filled = topValues.filter((value) => value > 0)
  if (filled.length === 0) return 0
  return filled.reduce((sum, value) => sum + value, 0) / filled.length / 255
}

function resolveLogoDrive(context: OverlayRenderContext): number {
  const { bins, bands, state } = context
  const weightedBands = (bands.bass * 0.58) + (bands.mid * 0.3) + (bands.treble * 0.12)
  if (bins.length === 0) {
    return Math.min(
      2.4,
      Math.max(
        bands.bass * 1.12,
        (bands.bass * 0.88) + (bands.mid * 0.42) + (bands.treble * 0.18)
      ) * state.logoAudioSensitivity
    )
  }

  const bassPeak = averageTopBins(bins, 1, 14, 3)
  const midPeak = averageTopBins(bins, 14, 90, 4)
  const treblePeak = averageTopBins(bins, 90, 220, 4)
  const fullPeak = averageTopBins(bins, 1, Math.min(240, bins.length), 6)

  let bandDrive = fullPeak
  switch (state.logoBandMode) {
    case 'bass':
      bandDrive = Math.max(bassPeak, bands.bass * 0.96)
      break
    case 'mid':
      bandDrive = Math.max(midPeak, bands.mid * 0.96)
      break
    case 'treble':
      bandDrive = Math.max(treblePeak, bands.treble * 0.96)
      break
    case 'full':
      bandDrive = Math.max(fullPeak * 0.94, weightedBands)
      break
    case 'peak':
    default:
      bandDrive = Math.max(fullPeak, bassPeak * 1.16, midPeak * 0.9)
      break
  }

  const compositeDrive = Math.max(bandDrive, (fullPeak * 0.72) + (weightedBands * 0.45))
  return Math.min(2.4, Math.max(0, compositeDrive) * state.logoAudioSensitivity)
}

function getFollowLogoSpectrumState(state: WallpaperState): WallpaperState {
  let spectrumInnerRadius = state.spectrumInnerRadius
  let spectrumPositionX = state.spectrumPositionX
  let spectrumPositionY = state.spectrumPositionY

  if (state.logoEnabled) {
    const logoScale = getLogoRenderState().scale
    const logoRadius = (state.logoBaseSize * logoScale) / 2
    spectrumInnerRadius = logoRadius + (state.logoBackdropEnabled ? state.logoBackdropPadding : 4)
    spectrumPositionX = state.logoPositionX
    spectrumPositionY = state.logoPositionY
  }

  return {
    ...state,
    spectrumLayout: 'circular',
    spectrumFollowLogo: true,
    spectrumInnerRadius,
    spectrumPositionX,
    spectrumPositionY,
  }
}

function getCloneSpectrumState(state: WallpaperState): WallpaperState {
  let spectrumInnerRadius = state.spectrumInnerRadius
  let spectrumPositionX = state.spectrumPositionX
  let spectrumPositionY = state.spectrumPositionY

  if (state.logoEnabled) {
    const logoScale = getLogoRenderState().scale
    const logoRadius = (state.logoBaseSize * logoScale) / 2
    spectrumInnerRadius = logoRadius + (state.logoBackdropEnabled ? state.logoBackdropPadding : 4) + state.spectrumCloneGap
    spectrumPositionX = state.logoPositionX
    spectrumPositionY = state.logoPositionY
  }

  return {
    ...state,
    spectrumLayout: 'circular',
    spectrumFollowLogo: true,
    spectrumInnerRadius,
    spectrumPositionX,
    spectrumPositionY,
    spectrumOpacity: state.spectrumCloneOpacity,
    spectrumGlowIntensity: state.spectrumCloneGlowIntensity,
    spectrumPrimaryColor: state.spectrumClonePrimaryColor,
    spectrumSecondaryColor: state.spectrumCloneSecondaryColor,
    spectrumColorMode: state.spectrumCloneColorMode,
    spectrumBarCount: state.spectrumCloneBarCount,
    spectrumShape: state.spectrumCloneShape,
    spectrumBarWidth: Math.max(1, state.spectrumBarWidth * state.spectrumCloneScale),
    spectrumMinHeight: Math.max(1, state.spectrumMinHeight * Math.max(0.5, state.spectrumCloneScale)),
    spectrumMaxHeight: Math.max(12, state.spectrumMaxHeight * state.spectrumCloneScale),
  }
}

export function drawOverlayLayer(layer: OverlayLayer, context: OverlayRenderContext): void {
  if (!layer.enabled) return

  if (layer.type === 'overlay-image') {
    drawOverlayImage(layer, context)
    return
  }

  if (layer.type === 'logo') {
    const logoAmplitude = resolveLogoDrive(context)
    drawLogo(context.ctx, context.canvas, logoAmplitude, context.dt, context.state)
    return
  }

  if (layer.type === 'track-title') {
    drawTrackTitleOverlay(context.ctx, context.canvas, context.trackTitle, context.dt, context.state)
    return
  }

  if (layer.type === 'spectrum') {
    const canFollowLogo = layer.layout === 'circular'

    const primarySpectrumState = canFollowLogo && layer.followLogo && context.state.logoEnabled
      ? getFollowLogoSpectrumState(context.state)
      : context.state

    drawSpectrum(context.ctx, context.canvas, context.bins, primarySpectrumState, context.dt, 'primary')

    if (!canFollowLogo && context.state.spectrumCircularClone && context.state.logoEnabled) {
      drawSpectrum(
        context.ctx,
        context.canvas,
        context.bins,
        getCloneSpectrumState(context.state),
        context.dt,
        'clone-circular'
      )
    }
  }
}
