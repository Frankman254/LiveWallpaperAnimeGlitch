import {
  createAudioChannelSelectionState,
  resolveAudioChannelValue,
  type AudioSnapshot,
} from '@/lib/audio/audioChannels'
import type { OverlayLayer } from '@/types/layers'
import type { WallpaperState } from '@/types/wallpaper'
import { drawLogo, getLogoRenderState } from '@/components/audio/ReactiveLogo'
import { drawSpectrum } from '@/components/audio/CircularSpectrum'
import { drawTrackTitleOverlay } from '@/components/audio/TrackTitleOverlay'

interface OverlayRenderContext {
  ctx: CanvasRenderingContext2D
  canvas: HTMLCanvasElement
  state: WallpaperState
  audio: AudioSnapshot
  dt: number
  trackTitle: string
}

const imageCache = new Map<string, HTMLImageElement>()
const logoChannelSelection = createAudioChannelSelectionState('kick')

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

function resolveLogoDrive(context: OverlayRenderContext): number {
  const { state, audio } = context
  const { value } = resolveAudioChannelValue(
    audio.channels,
    state.logoBandMode,
    logoChannelSelection,
    state.audioSelectedChannelSmoothing,
    state.audioAutoKickThreshold,
    state.audioAutoSwitchHoldMs,
    audio.timestampMs
  )
  return Math.min(3.2, Math.max(0, value) * state.logoAudioSensitivity * 1.18)
}

function getFollowLogoSpectrumState(state: WallpaperState): WallpaperState {
  let spectrumInnerRadius = state.spectrumInnerRadius
  let spectrumPositionX = state.spectrumPositionX
  let spectrumPositionY = state.spectrumPositionY

  if (state.logoEnabled) {
    const logoScale = getLogoRenderState().scale
    const logoRadius = (state.logoBaseSize * logoScale) / 2
    spectrumInnerRadius = logoRadius + (state.logoBackdropEnabled ? state.logoBackdropPadding : 4) + state.spectrumLogoGap
    spectrumPositionX = state.logoPositionX
    spectrumPositionY = state.logoPositionY
  }

  return {
    ...state,
    spectrumMode: 'radial',
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
    spectrumMode: 'radial',
    spectrumFollowLogo: true,
    spectrumRadialFitLogo: true,
    spectrumInnerRadius,
    spectrumPositionX,
    spectrumPositionY,
    spectrumOpacity: state.spectrumCloneOpacity,
    spectrumRadialShape: state.spectrumCloneRadialShape,
    spectrumRadialAngle: state.spectrumCloneRadialAngle,
    spectrumShape: state.spectrumCloneStyle,
    spectrumBarCount: state.spectrumCloneBarCount,
    spectrumBarWidth: Math.max(1, state.spectrumCloneBarWidth),
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
    const canFollowLogo = layer.mode === 'radial'

    const primarySpectrumState = canFollowLogo && layer.followLogo && context.state.logoEnabled
      ? getFollowLogoSpectrumState(context.state)
      : context.state

    drawSpectrum(context.ctx, context.canvas, context.audio, primarySpectrumState, context.dt, 'primary')

    if (!canFollowLogo && context.state.spectrumCircularClone && context.state.logoEnabled) {
      drawSpectrum(
        context.ctx,
        context.canvas,
        context.audio,
        getCloneSpectrumState(context.state),
        context.dt,
        'clone-circular'
      )
    }
  }
}
