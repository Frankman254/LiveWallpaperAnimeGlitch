import type { WallpaperState } from '@/types/wallpaper'

type TrackTitleSettings = Pick<
  WallpaperState,
  | 'audioTrackTitlePositionX'
  | 'audioTrackTitlePositionY'
  | 'audioTrackTitleFontSize'
  | 'audioTrackTitleWidth'
  | 'audioTrackTitleOpacity'
  | 'audioTrackTitleScrollSpeed'
  | 'audioTrackTitleTextColor'
  | 'audioTrackTitleGlowColor'
  | 'audioTrackTitleGlowBlur'
  | 'audioTrackTitleBackdropEnabled'
  | 'audioTrackTitleBackdropColor'
  | 'audioTrackTitleBackdropOpacity'
  | 'audioTrackTitleBackdropPadding'
  | 'audioTrackTitleFilterBrightness'
  | 'audioTrackTitleFilterContrast'
  | 'audioTrackTitleFilterSaturation'
  | 'audioTrackTitleFilterBlur'
  | 'audioTrackTitleFilterHueRotate'
>

type TrackTitleRuntime = {
  offset: number
  lastTitle: string
}

const runtimeState: TrackTitleRuntime = {
  offset: 0,
  lastTitle: '',
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function applyRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = clamp(radius, 0, Math.min(width, height) / 2)
  ctx.beginPath()
  ctx.moveTo(x + safeRadius, y)
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius)
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius)
  ctx.arcTo(x, y + height, x, y, safeRadius)
  ctx.arcTo(x, y, x + width, y, safeRadius)
  ctx.closePath()
}

function buildFilterString(settings: TrackTitleSettings): string {
  return [
    `brightness(${settings.audioTrackTitleFilterBrightness})`,
    `contrast(${settings.audioTrackTitleFilterContrast})`,
    `saturate(${settings.audioTrackTitleFilterSaturation})`,
    `blur(${settings.audioTrackTitleFilterBlur}px)`,
    `hue-rotate(${settings.audioTrackTitleFilterHueRotate}deg)`,
  ].join(' ')
}

export function drawTrackTitleOverlay(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  title: string,
  dt: number,
  settings: TrackTitleSettings
): void {
  const cleanTitle = title.trim()
  if (!cleanTitle) {
    runtimeState.lastTitle = ''
    runtimeState.offset = 0
    return
  }

  if (runtimeState.lastTitle !== cleanTitle) {
    runtimeState.lastTitle = cleanTitle
    runtimeState.offset = 0
  }

  const widthRatio = clamp(settings.audioTrackTitleWidth, 0.2, 1)
  const boxWidth = canvas.width * widthRatio
  const fontSize = clamp(settings.audioTrackTitleFontSize, 12, 160)
  const padding = clamp(settings.audioTrackTitleBackdropPadding, 0, 48)
  const boxHeight = fontSize * 1.55
  const cx = canvas.width / 2 + settings.audioTrackTitlePositionX * canvas.width * 0.5
  const cy = canvas.height / 2 - settings.audioTrackTitlePositionY * canvas.height * 0.5
  const left = cx - boxWidth / 2
  const top = cy - boxHeight / 2
  const gap = fontSize * 1.6

  ctx.save()
  ctx.globalAlpha = clamp(settings.audioTrackTitleOpacity, 0, 1)
  ctx.font = `700 ${fontSize}px system-ui, sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'

  const measuredWidth = ctx.measureText(cleanTitle).width
  const shouldScroll = measuredWidth > boxWidth && settings.audioTrackTitleScrollSpeed > 0
  if (shouldScroll) {
    const cycle = measuredWidth + gap
    runtimeState.offset = (runtimeState.offset + settings.audioTrackTitleScrollSpeed * dt) % cycle
  } else {
    runtimeState.offset = 0
  }

  if (settings.audioTrackTitleBackdropEnabled) {
    ctx.save()
    ctx.fillStyle = settings.audioTrackTitleBackdropColor
    ctx.globalAlpha *= clamp(settings.audioTrackTitleBackdropOpacity, 0, 1)
    applyRoundedRectPath(
      ctx,
      left - padding,
      top - padding * 0.65,
      boxWidth + padding * 2,
      boxHeight + padding * 1.3,
      Math.max(10, fontSize * 0.45)
    )
    ctx.fill()
    ctx.restore()
  }

  ctx.save()
  applyRoundedRectPath(ctx, left, top, boxWidth, boxHeight, Math.max(8, fontSize * 0.35))
  ctx.clip()
  ctx.filter = buildFilterString(settings)
  ctx.fillStyle = settings.audioTrackTitleTextColor
  ctx.shadowColor = settings.audioTrackTitleGlowColor
  ctx.shadowBlur = settings.audioTrackTitleGlowBlur

  if (shouldScroll) {
    const cycle = measuredWidth + gap
    const anchorX = left - runtimeState.offset
    ctx.fillText(cleanTitle, anchorX, cy)
    ctx.fillText(cleanTitle, anchorX + cycle, cy)
  } else {
    ctx.textAlign = 'center'
    ctx.fillText(cleanTitle, cx, cy)
  }

  ctx.restore()
  ctx.restore()
}
