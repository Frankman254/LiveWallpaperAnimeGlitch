import type { WallpaperState } from '@/types/wallpaper'

type TrackTitleSettings = Pick<
  WallpaperState,
  | 'audioTrackTitleFontStyle'
  | 'audioTrackTitleLayoutMode'
  | 'audioTrackTitleUppercase'
  | 'audioTrackTitlePositionX'
  | 'audioTrackTitlePositionY'
  | 'audioTrackTitleFontSize'
  | 'audioTrackTitleLetterSpacing'
  | 'audioTrackTitleWidth'
  | 'audioTrackTitleOpacity'
  | 'audioTrackTitleScrollSpeed'
  | 'audioTrackTitleRgbShift'
  | 'audioTrackTitleScanlineIntensity'
  | 'audioTrackTitleScanlineSpacing'
  | 'audioTrackTitleScanlineThickness'
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

const TRACK_TITLE_FONT_STACKS: Record<TrackTitleSettings['audioTrackTitleFontStyle'], string> = {
  clean: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
  condensed: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
  techno: '"Trebuchet MS", Verdana, "Arial Black", sans-serif',
  mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  serif: 'Georgia, "Times New Roman", serif',
}

const TRACK_TITLE_FONT_WEIGHT: Record<TrackTitleSettings['audioTrackTitleFontStyle'], number> = {
  clean: 700,
  condensed: 800,
  techno: 800,
  mono: 700,
  serif: 700,
}

const TRACK_TITLE_STYLE_SPACING_BONUS: Record<TrackTitleSettings['audioTrackTitleFontStyle'], number> = {
  clean: 0,
  condensed: 0.8,
  techno: 2.6,
  mono: 1.2,
  serif: 0.3,
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

function resolveHorizontalCenter(
  canvas: HTMLCanvasElement,
  settings: TrackTitleSettings,
  boxWidth: number,
  padding: number
): number {
  switch (settings.audioTrackTitleLayoutMode) {
    case 'left-dock':
      return boxWidth / 2 + padding + 16
    case 'right-dock':
      return canvas.width - (boxWidth / 2 + padding + 16)
    case 'centered':
      return canvas.width / 2
    case 'free':
    default:
      return canvas.width / 2 + settings.audioTrackTitlePositionX * canvas.width * 0.5
  }
}

function drawTextRun(
  ctx: CanvasRenderingContext2D,
  title: string,
  anchorX: number,
  centerY: number,
  rgbShift: number,
  textColor: string,
  letterSpacing: number
) {
  const drawSpacedText = (offsetX: number, color: string) => {
    ctx.save()
    ctx.fillStyle = color
    let cursor = anchorX + offsetX
    for (const char of title) {
      ctx.fillText(char, cursor, centerY)
      cursor += ctx.measureText(char).width + letterSpacing
    }
    ctx.restore()
  }

  if (rgbShift > 0) {
    ctx.save()
    ctx.shadowBlur = 0
    drawSpacedText(-rgbShift, 'rgba(255, 70, 120, 0.55)')
    drawSpacedText(rgbShift, 'rgba(0, 234, 255, 0.55)')
    ctx.restore()
  }

  drawSpacedText(0, textColor)
}

function measureSpacedText(ctx: CanvasRenderingContext2D, title: string, letterSpacing: number): number {
  if (title.length === 0) return 0
  let width = 0
  for (let i = 0; i < title.length; i++) {
    width += ctx.measureText(title[i]).width
    if (i < title.length - 1) width += letterSpacing
  }
  return width
}

export function drawTrackTitleOverlay(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  title: string,
  dt: number,
  settings: TrackTitleSettings
): void {
  const cleanTitle = (settings.audioTrackTitleUppercase ? title.toUpperCase() : title).trim()
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
  const cx = resolveHorizontalCenter(canvas, settings, boxWidth, padding)
  const cy = canvas.height / 2 - settings.audioTrackTitlePositionY * canvas.height * 0.5
  const left = cx - boxWidth / 2
  const top = cy - boxHeight / 2
  const gap = fontSize * 1.6
  const rgbShiftPx = clamp(settings.audioTrackTitleRgbShift, 0, 0.03) * canvas.width
  const effectiveLetterSpacing = clamp(
    settings.audioTrackTitleLetterSpacing + TRACK_TITLE_STYLE_SPACING_BONUS[settings.audioTrackTitleFontStyle],
    0,
    fontSize * 0.4
  )

  ctx.save()
  ctx.globalAlpha = clamp(settings.audioTrackTitleOpacity, 0, 1)
  ctx.font = `${TRACK_TITLE_FONT_WEIGHT[settings.audioTrackTitleFontStyle]} ${fontSize}px ${TRACK_TITLE_FONT_STACKS[settings.audioTrackTitleFontStyle]}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'

  const measuredWidth = measureSpacedText(ctx, cleanTitle, effectiveLetterSpacing)
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
  ctx.shadowColor = settings.audioTrackTitleGlowColor
  ctx.shadowBlur = settings.audioTrackTitleGlowBlur

  if (shouldScroll) {
    const cycle = measuredWidth + gap
    const anchorX = left - runtimeState.offset
    drawTextRun(ctx, cleanTitle, anchorX, cy, rgbShiftPx, settings.audioTrackTitleTextColor, effectiveLetterSpacing)
    drawTextRun(ctx, cleanTitle, anchorX + cycle, cy, rgbShiftPx, settings.audioTrackTitleTextColor, effectiveLetterSpacing)
  } else {
    ctx.textAlign = 'center'
    drawTextRun(ctx, cleanTitle, cx - measuredWidth / 2, cy, rgbShiftPx, settings.audioTrackTitleTextColor, effectiveLetterSpacing)
  }

  const scanlineIntensity = clamp(settings.audioTrackTitleScanlineIntensity, 0, 1)
  if (scanlineIntensity > 0) {
    const spacing = clamp(settings.audioTrackTitleScanlineSpacing, 24, 800)
    const thickness = clamp(settings.audioTrackTitleScanlineThickness, 0.5, 6)
    ctx.save()
    ctx.shadowBlur = 0
    ctx.fillStyle = `rgba(0, 0, 0, ${0.12 + scanlineIntensity * 0.3})`
    const startY = top - ((top % spacing) + spacing) % spacing
    for (let y = startY; y < top + boxHeight + spacing; y += spacing) {
      ctx.fillRect(left, y, boxWidth, thickness)
    }
    ctx.restore()
  }

  ctx.restore()
  ctx.restore()
}
