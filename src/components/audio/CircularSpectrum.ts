import type { SpectrumBandMode, SpectrumLayout, WallpaperState } from '@/types/wallpaper'

type SpectrumSettings = Pick<
  WallpaperState,
  | 'spectrumFollowLogo'
  | 'spectrumRadius'
  | 'spectrumInnerRadius'
  | 'spectrumBarCount'
  | 'spectrumBarWidth'
  | 'spectrumMinHeight'
  | 'spectrumMaxHeight'
  | 'spectrumOpacity'
  | 'spectrumGlowIntensity'
  | 'spectrumShadowBlur'
  | 'spectrumPrimaryColor'
  | 'spectrumSecondaryColor'
  | 'spectrumColorMode'
  | 'spectrumBandMode'
  | 'spectrumMirror'
  | 'spectrumPeakHold'
  | 'spectrumPeakDecay'
  | 'spectrumRotationSpeed'
  | 'spectrumSmoothing'
  | 'spectrumShape'
  | 'spectrumLayout'
  | 'spectrumDirection'
  | 'spectrumPositionX'
  | 'spectrumPositionY'
>

type SpectrumRuntimeState = {
  smoothedHeights: Float32Array
  peakHeights: Float32Array
  rotation: number
  idleTime: number
  lastModeSignature: string
  modeTransitionElapsed: number
  modeTransitionSnapshotCanvas: HTMLCanvasElement | null
  previousFrameCanvas: HTMLCanvasElement | null
}

const spectrumRuntimeMap = new Map<string, SpectrumRuntimeState>()

const MODE_TRANSITION_DURATION = 0.32

function createSpectrumRuntimeState(): SpectrumRuntimeState {
  return {
    smoothedHeights: new Float32Array(0),
    peakHeights: new Float32Array(0),
    rotation: 0,
    idleTime: 0,
    lastModeSignature: '',
    modeTransitionElapsed: MODE_TRANSITION_DURATION,
    modeTransitionSnapshotCanvas: null,
    previousFrameCanvas: null,
  }
}

function getSpectrumRuntimeState(instanceKey: string): SpectrumRuntimeState {
  const existing = spectrumRuntimeMap.get(instanceKey)
  if (existing) return existing
  const created = createSpectrumRuntimeState()
  spectrumRuntimeMap.set(instanceKey, created)
  return created
}

function resizeFloatArrayPreserve(source: Float32Array, nextLength: number): Float32Array {
  if (nextLength <= 0) return new Float32Array(0)
  if (source.length === 0) return new Float32Array(nextLength)
  if (source.length === nextLength) return source.slice()

  const next = new Float32Array(nextLength)
  for (let i = 0; i < nextLength; i++) {
    const t = nextLength === 1 ? 0 : i / Math.max(nextLength - 1, 1)
    const sourceIndex = t * Math.max(source.length - 1, 0)
    const lower = Math.floor(sourceIndex)
    const upper = Math.min(source.length - 1, Math.ceil(sourceIndex))
    const alpha = sourceIndex - lower
    next[i] = source[lower] * (1 - alpha) + source[upper] * alpha
  }
  return next
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ]
}

function getColor(settings: SpectrumSettings, t: number): string {
  const { spectrumColorMode, spectrumPrimaryColor, spectrumSecondaryColor } = settings
  if (spectrumColorMode === 'solid') return spectrumPrimaryColor
  if (spectrumColorMode === 'rainbow') return `hsl(${Math.round(t * 360)}, 100%, 60%)`
  const [r1, g1, b1] = hexToRgb(spectrumPrimaryColor)
  const [r2, g2, b2] = hexToRgb(spectrumSecondaryColor)
  return `rgb(${Math.round(r1 + (r2 - r1) * t)}, ${Math.round(g1 + (g2 - g1) * t)}, ${Math.round(b1 + (b2 - b1) * t)})`
}

function addGradientStops(gradient: CanvasGradient, settings: SpectrumSettings): void {
  if (settings.spectrumColorMode === 'solid') {
    gradient.addColorStop(0, settings.spectrumPrimaryColor)
    gradient.addColorStop(1, settings.spectrumPrimaryColor)
    return
  }

  if (settings.spectrumColorMode === 'gradient') {
    gradient.addColorStop(0, settings.spectrumPrimaryColor)
    gradient.addColorStop(1, settings.spectrumSecondaryColor)
    return
  }

  const rainbowStops: Array<[number, string]> = [
    [0.0, '#ff004c'],
    [0.18, '#ff7a00'],
    [0.34, '#ffe600'],
    [0.5, '#2cff95'],
    [0.68, '#00d4ff'],
    [0.84, '#5566ff'],
    [1.0, '#e100ff'],
  ]
  for (const [stop, color] of rainbowStops) {
    gradient.addColorStop(stop, color)
  }
}

function createWaveGradient(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  settings: SpectrumSettings,
  orientation: 'horizontal' | 'vertical' | 'radial',
  cx?: number,
  cy?: number,
  radius?: number
): CanvasGradient | string {
  if (settings.spectrumColorMode === 'solid') return settings.spectrumPrimaryColor

  if (orientation === 'vertical') {
    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
    addGradientStops(gradient, settings)
    return gradient
  }

  if (orientation === 'radial') {
    const gradient = ctx.createRadialGradient(
      cx ?? canvas.width / 2,
      cy ?? canvas.height / 2,
      Math.max(4, (radius ?? canvas.width / 3) * 0.25),
      cx ?? canvas.width / 2,
      cy ?? canvas.height / 2,
      radius ?? canvas.width / 2
    )
    addGradientStops(gradient, settings)
    return gradient
  }

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
  addGradientStops(gradient, settings)
  return gradient
}

function getBandRange(mode: SpectrumBandMode, binsLength: number): [number, number] {
  switch (mode) {
    case 'bass':
      return [1, 12]
    case 'low-mid':
      return [12, 40]
    case 'mid':
      return [40, 90]
    case 'high-mid':
      return [90, 150]
    case 'treble':
      return [150, 240]
    default:
      return [1, Math.max(10, Math.floor(binsLength * 0.8))]
  }
}

function sampleBins(bins: Uint8Array, i: number, barCount: number, settings: SpectrumSettings): number {
  if (bins.length === 0) return 0
  const [startBin, endBin] = getBandRange(settings.spectrumBandMode, bins.length)
  const logT = Math.pow(i / Math.max(barCount - 1, 1), 1.5)
  const binIdx = Math.floor(startBin + logT * (endBin - startBin))
  return (bins[Math.min(binIdx, bins.length - 1)] ?? 0) / 255
}

function normalizeLayout(layout: SpectrumLayout): Exclude<SpectrumLayout, 'horizontal'> {
  return layout === 'horizontal' ? 'bottom' : layout
}

function buildModeSignature(settings: SpectrumSettings): string {
  return [
    settings.spectrumLayout,
    settings.spectrumShape,
    settings.spectrumMirror ? 'mirror' : 'single',
    settings.spectrumDirection,
    settings.spectrumColorMode,
    settings.spectrumBandMode,
    settings.spectrumBarCount,
    settings.spectrumFollowLogo ? 'follow' : 'free',
  ].join('|')
}

function ensureSnapshotCanvas(
  existing: HTMLCanvasElement | null,
  width: number,
  height: number
): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return existing
  const canvas = existing ?? document.createElement('canvas')
  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height
  return canvas
}

function copyCanvas(source: HTMLCanvasElement, target: HTMLCanvasElement | null): void {
  if (!target) return
  const context = target.getContext('2d')
  if (!context) return
  context.clearRect(0, 0, target.width, target.height)
  context.drawImage(source, 0, 0, target.width, target.height)
}

function drawCircularBars(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  heights: Float32Array,
  peaks: Float32Array,
  barCount: number,
  settings: SpectrumSettings,
  rotationOffset: number
) {
  const {
    spectrumInnerRadius,
    spectrumBarWidth,
    spectrumMinHeight,
    spectrumPeakHold,
    spectrumGlowIntensity,
    spectrumShadowBlur,
  } = settings

  for (let i = 0; i < barCount; i++) {
    const t = i / barCount
    const angle = t * Math.PI * 2 + rotationOffset - Math.PI / 2
    const h = heights[i]
    const color = getColor(settings, t)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity
    ctx.fillRect(spectrumInnerRadius, -spectrumBarWidth / 2, h, spectrumBarWidth)
    if (spectrumPeakHold && peaks[i] > spectrumMinHeight + 1) {
      ctx.fillStyle = '#ffffff'
      ctx.shadowBlur = 0
      ctx.fillRect(spectrumInnerRadius + peaks[i], -spectrumBarWidth / 2, 2, spectrumBarWidth)
    }
    ctx.restore()
  }
}

function drawCircularLines(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  heights: Float32Array,
  barCount: number,
  settings: SpectrumSettings,
  rotationOffset: number
) {
  const { spectrumInnerRadius, spectrumBarWidth, spectrumGlowIntensity, spectrumShadowBlur } = settings
  const lineW = Math.max(spectrumBarWidth, 1.5)

  for (let i = 0; i < barCount; i++) {
    const t = i / barCount
    const angle = t * Math.PI * 2 + rotationOffset - Math.PI / 2
    const h = heights[i]
    const color = getColor(settings, t)

    const x1 = cx + Math.cos(angle) * spectrumInnerRadius
    const y1 = cy + Math.sin(angle) * spectrumInnerRadius
    const x2 = cx + Math.cos(angle) * (spectrumInnerRadius + h)
    const y2 = cy + Math.sin(angle) * (spectrumInnerRadius + h)

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = color
    ctx.lineWidth = lineW
    ctx.lineCap = 'round'
    ctx.shadowColor = color
    ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity * 1.5
    ctx.stroke()

    if (h > 4) {
      ctx.beginPath()
      ctx.arc(x2, y2, lineW * 0.8, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    }
  }
}

function drawCircularWave(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  cx: number,
  cy: number,
  heights: Float32Array,
  barCount: number,
  settings: SpectrumSettings,
  rotationOffset: number
) {
  const { spectrumInnerRadius, spectrumBarWidth, spectrumGlowIntensity, spectrumShadowBlur } = settings
  const radius = spectrumInnerRadius + settings.spectrumMaxHeight
  const gradient = createWaveGradient(ctx, canvas, settings, 'radial', cx, cy, radius)

  ctx.beginPath()
  for (let i = 0; i <= barCount; i++) {
    const t = (i % barCount) / barCount
    const angle = t * Math.PI * 2 + rotationOffset - Math.PI / 2
    const r = spectrumInnerRadius + heights[i % barCount]
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.strokeStyle = gradient
  ctx.lineWidth = spectrumBarWidth
  ctx.shadowColor = settings.spectrumPrimaryColor
  ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity
  ctx.stroke()

  ctx.save()
  ctx.fillStyle = gradient
  ctx.globalAlpha *= 0.12
  ctx.fill()
  ctx.restore()
}

function drawCircularDots(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  heights: Float32Array,
  barCount: number,
  settings: SpectrumSettings,
  rotationOffset: number
) {
  const { spectrumInnerRadius, spectrumBarWidth, spectrumGlowIntensity, spectrumShadowBlur } = settings
  const dotRadius = Math.max(spectrumBarWidth * 0.8, 1.5)
  for (let i = 0; i < barCount; i++) {
    const t = i / barCount
    const angle = t * Math.PI * 2 + rotationOffset - Math.PI / 2
    const r = spectrumInnerRadius + heights[i]
    const color = getColor(settings, t)
    ctx.beginPath()
    ctx.arc(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, dotRadius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity
    ctx.fill()
  }
}

function getHorizontalBase(layout: Exclude<SpectrumLayout, 'horizontal'>, height: number): number {
  switch (layout) {
    case 'top':
      return height * 0.12
    case 'top-inverted':
      return height * 0.2
    case 'center':
      return height * 0.5
    default:
      return height * 0.88
  }
}

function getHorizontalPrimaryDirection(layout: Exclude<SpectrumLayout, 'horizontal'>): 1 | -1 {
  switch (layout) {
    case 'top':
      return 1
    default:
      return -1
  }
}

function getVerticalBase(layout: Exclude<SpectrumLayout, 'horizontal'>, width: number): number {
  return layout === 'left' ? width * 0.12 : width * 0.88
}

function getVerticalPrimaryDirection(layout: Exclude<SpectrumLayout, 'horizontal'>): 1 | -1 {
  return layout === 'left' ? 1 : -1
}

function drawPeakMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  ctx.fillStyle = '#ffffff'
  ctx.shadowBlur = 0
  ctx.fillRect(x, y, width, height)
}

function drawLinearBars(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  heights: Float32Array,
  peaks: Float32Array,
  barCount: number,
  settings: SpectrumSettings,
  offsetX = 0,
  offsetY = 0
) {
  const { spectrumBarWidth, spectrumMinHeight, spectrumPeakHold, spectrumMirror, spectrumGlowIntensity, spectrumShadowBlur } = settings
  const layout = normalizeLayout(settings.spectrumLayout)
  const gap = Math.max(1, Math.round(spectrumBarWidth * 0.25))

  if (layout === 'left' || layout === 'right') {
    const totalHeight = barCount * (spectrumBarWidth + gap)
    const startY = (canvas.height - totalHeight) / 2 + offsetY
    const baseX = getVerticalBase(layout, canvas.width) + offsetX
    const primaryDirection = getVerticalPrimaryDirection(layout)

    for (let i = 0; i < barCount; i++) {
      const t = i / barCount
      const y = startY + i * (spectrumBarWidth + gap)
      const h = heights[i]
      const color = getColor(settings, t)
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity
      ctx.fillRect(baseX, y, h * primaryDirection, spectrumBarWidth)
      if (spectrumMirror) {
        ctx.fillRect(baseX, y, h * -primaryDirection, spectrumBarWidth)
      }
      if (spectrumPeakHold && peaks[i] > spectrumMinHeight + 1) {
        drawPeakMarker(ctx, baseX + peaks[i] * primaryDirection, y, 2 * primaryDirection, spectrumBarWidth)
        if (spectrumMirror) {
          drawPeakMarker(ctx, baseX - peaks[i] * primaryDirection, y, -2 * primaryDirection, spectrumBarWidth)
        }
      }
    }
    return
  }

  const totalWidth = barCount * (spectrumBarWidth + gap)
  const startX = (canvas.width - totalWidth) / 2 + offsetX
  const baseY = getHorizontalBase(layout, canvas.height) + offsetY
  const primaryDirection = getHorizontalPrimaryDirection(layout)
  const showMirror = spectrumMirror || layout === 'center'

  for (let i = 0; i < barCount; i++) {
    const t = i / barCount
    const x = startX + i * (spectrumBarWidth + gap)
    const h = heights[i]
    const color = getColor(settings, t)
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity
    ctx.fillRect(x, baseY, spectrumBarWidth, h * primaryDirection)
    if (showMirror) {
      ctx.fillRect(x, baseY, spectrumBarWidth, h * -primaryDirection)
    }
    if (spectrumPeakHold && peaks[i] > spectrumMinHeight + 1) {
      drawPeakMarker(ctx, x, baseY + peaks[i] * primaryDirection, spectrumBarWidth, 2 * primaryDirection)
      if (showMirror) {
        drawPeakMarker(ctx, x, baseY - peaks[i] * primaryDirection, spectrumBarWidth, -2 * primaryDirection)
      }
    }
  }
}

function drawLinearLinesOrDots(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  heights: Float32Array,
  barCount: number,
  settings: SpectrumSettings,
  offsetX = 0,
  offsetY = 0
) {
  const { spectrumBarWidth, spectrumShape, spectrumMirror, spectrumGlowIntensity, spectrumShadowBlur } = settings
  const layout = normalizeLayout(settings.spectrumLayout)
  const gap = Math.max(1, Math.round(spectrumBarWidth * 0.25))
  const dotRadius = Math.max(spectrumBarWidth * 0.7, 1.5)
  const isDots = spectrumShape === 'dots'

  if (layout === 'left' || layout === 'right') {
    const totalHeight = barCount * (spectrumBarWidth + gap)
    const startY = (canvas.height - totalHeight) / 2 + offsetY
    const baseX = getVerticalBase(layout, canvas.width) + offsetX
    const primaryDirection = getVerticalPrimaryDirection(layout)

    for (let i = 0; i < barCount; i++) {
      const t = i / barCount
      const y = startY + i * (spectrumBarWidth + gap) + spectrumBarWidth / 2
      const x = baseX + heights[i] * primaryDirection
      const color = getColor(settings, t)
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity

      if (isDots) {
        ctx.beginPath()
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
        ctx.fill()
        if (spectrumMirror) {
          ctx.beginPath()
          ctx.arc(baseX - heights[i] * primaryDirection, y, dotRadius, 0, Math.PI * 2)
          ctx.fill()
        }
      } else {
        ctx.beginPath()
        ctx.moveTo(baseX, y)
        ctx.lineTo(x, y)
        ctx.lineWidth = Math.max(1, spectrumBarWidth * 0.8)
        ctx.lineCap = 'round'
        ctx.stroke()
        if (spectrumMirror) {
          ctx.beginPath()
          ctx.moveTo(baseX, y)
          ctx.lineTo(baseX - heights[i] * primaryDirection, y)
          ctx.stroke()
        }
      }
    }
    return
  }

  const totalWidth = barCount * (spectrumBarWidth + gap)
  const startX = (canvas.width - totalWidth) / 2 + offsetX
  const baseY = getHorizontalBase(layout, canvas.height) + offsetY
  const primaryDirection = getHorizontalPrimaryDirection(layout)
  const showMirror = spectrumMirror || layout === 'center'

  for (let i = 0; i < barCount; i++) {
    const t = i / barCount
    const x = startX + i * (spectrumBarWidth + gap) + spectrumBarWidth / 2
    const y = baseY + heights[i] * primaryDirection
    const color = getColor(settings, t)
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity

    if (isDots) {
      ctx.beginPath()
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
      ctx.fill()
      if (showMirror) {
        ctx.beginPath()
        ctx.arc(x, baseY - heights[i] * primaryDirection, dotRadius, 0, Math.PI * 2)
        ctx.fill()
      }
    } else {
      ctx.beginPath()
      ctx.moveTo(x, baseY)
      ctx.lineTo(x, y)
      ctx.lineWidth = Math.max(1, spectrumBarWidth * 0.8)
      ctx.lineCap = 'round'
      ctx.stroke()
      if (showMirror) {
        ctx.beginPath()
        ctx.moveTo(x, baseY)
        ctx.lineTo(x, baseY - heights[i] * primaryDirection)
        ctx.stroke()
      }
    }
  }
}

function drawLinearWave(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  heights: Float32Array,
  barCount: number,
  settings: SpectrumSettings,
  offsetX = 0,
  offsetY = 0
) {
  const { spectrumBarWidth, spectrumMirror, spectrumGlowIntensity, spectrumShadowBlur } = settings
  const layout = normalizeLayout(settings.spectrumLayout)
  const gradient = createWaveGradient(
    ctx,
    canvas,
    settings,
    layout === 'left' || layout === 'right' ? 'vertical' : 'horizontal'
  )

  if (layout === 'left' || layout === 'right') {
    const xBase = getVerticalBase(layout, canvas.width) + offsetX
    const dir = getVerticalPrimaryDirection(layout)
    const yStep = canvas.height / Math.max(barCount - 1, 1)

    ctx.beginPath()
    for (let i = 0; i < barCount; i++) {
      const y = i * yStep
      const x = xBase + heights[i] * dir
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    if (spectrumMirror) {
      for (let i = barCount - 1; i >= 0; i--) {
        ctx.lineTo(xBase - heights[i] * dir, i * yStep)
      }
    } else {
      ctx.lineTo(xBase, canvas.height)
      ctx.lineTo(xBase, 0)
    }
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.save()
    ctx.globalAlpha *= 0.3
    ctx.fill()
    ctx.restore()

    ctx.beginPath()
    for (let i = 0; i < barCount; i++) {
      const y = i * yStep
      const x = xBase + heights[i] * dir
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = gradient
    ctx.lineWidth = spectrumBarWidth
    ctx.shadowColor = settings.spectrumPrimaryColor
    ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity
    ctx.stroke()
    return
  }

  const baseY = getHorizontalBase(layout, canvas.height) + offsetY
  const dir = getHorizontalPrimaryDirection(layout)
  const showMirror = spectrumMirror || layout === 'center'
  const xStep = canvas.width / Math.max(barCount - 1, 1)

  ctx.beginPath()
  for (let i = 0; i < barCount; i++) {
    const x = i * xStep + offsetX
    const y = baseY + heights[i] * dir
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  if (showMirror) {
    for (let i = barCount - 1; i >= 0; i--) {
      ctx.lineTo(i * xStep + offsetX, baseY - heights[i] * dir)
    }
  } else {
    ctx.lineTo(canvas.width + offsetX, baseY)
    ctx.lineTo(0 + offsetX, baseY)
  }
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.save()
  ctx.globalAlpha *= 0.3
  ctx.fill()
  ctx.restore()

  ctx.beginPath()
  for (let i = 0; i < barCount; i++) {
    const x = i * xStep + offsetX
    const y = baseY + heights[i] * dir
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.strokeStyle = gradient
  ctx.lineWidth = spectrumBarWidth
  ctx.shadowColor = settings.spectrumPrimaryColor
  ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity
  ctx.stroke()
}

export function drawSpectrum(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  bins: Uint8Array,
  settings: SpectrumSettings,
  dt: number,
  instanceKey = 'primary'
): void {
  const runtime = getSpectrumRuntimeState(instanceKey)
  runtime.idleTime += dt

  const modeSignature = buildModeSignature(settings)
  if (runtime.lastModeSignature && modeSignature !== runtime.lastModeSignature) {
    runtime.modeTransitionSnapshotCanvas = ensureSnapshotCanvas(runtime.modeTransitionSnapshotCanvas, canvas.width, canvas.height)
    copyCanvas(runtime.previousFrameCanvas ?? canvas, runtime.modeTransitionSnapshotCanvas)
    runtime.modeTransitionElapsed = 0
  }
  runtime.lastModeSignature = modeSignature

  const {
    spectrumBarCount,
    spectrumMirror,
    spectrumSmoothing,
    spectrumMinHeight,
    spectrumMaxHeight,
    spectrumOpacity,
    spectrumGlowIntensity,
    spectrumShadowBlur,
    spectrumPrimaryColor,
    spectrumPeakHold,
    spectrumPeakDecay,
    spectrumRotationSpeed,
    spectrumShape,
    spectrumDirection,
  } = settings

  const layout = normalizeLayout(settings.spectrumLayout)
  const isCircular = layout === 'circular'
  const barCount = isCircular && spectrumMirror ? Math.floor(spectrumBarCount / 2) : spectrumBarCount
  const totalBars = isCircular && spectrumMirror ? barCount * 2 : barCount

  if (runtime.smoothedHeights.length !== totalBars) {
    runtime.smoothedHeights = resizeFloatArrayPreserve(runtime.smoothedHeights, totalBars)
    runtime.peakHeights = resizeFloatArrayPreserve(runtime.peakHeights, totalBars)
  }

  const directionSign = spectrumDirection === 'counterclockwise' ? -1 : 1
  runtime.rotation += spectrumRotationSpeed * directionSign * dt

  // Position offsets: range [-1, 1] mapped to canvas dimensions
  const cx = canvas.width / 2 + (settings.spectrumPositionX ?? 0) * canvas.width * 0.5
  const cy = canvas.height / 2 - (settings.spectrumPositionY ?? 0) * canvas.height * 0.5

  ctx.save()
  ctx.globalAlpha = spectrumOpacity
  ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity
  ctx.shadowColor = spectrumPrimaryColor

  for (let i = 0; i < barCount; i++) {
    const rawValue = bins.length === 0
      ? (Math.sin(runtime.idleTime * 1.5 + i * 0.25) * 0.5 + 0.5) * 0.08
      : sampleBins(bins, i, barCount, settings)

    runtime.smoothedHeights[i] = runtime.smoothedHeights[i] * spectrumSmoothing + rawValue * (1 - spectrumSmoothing)
    const h = spectrumMinHeight + runtime.smoothedHeights[i] * (spectrumMaxHeight - spectrumMinHeight)

    if (spectrumPeakHold) {
      if (h > runtime.peakHeights[i]) runtime.peakHeights[i] = h
      else runtime.peakHeights[i] = Math.max(spectrumMinHeight, runtime.peakHeights[i] - spectrumPeakDecay * spectrumMaxHeight)
    }

    if (isCircular && spectrumMirror) {
      const mirrorIndex = totalBars - 1 - i
      runtime.smoothedHeights[mirrorIndex] = runtime.smoothedHeights[i]
      runtime.peakHeights[mirrorIndex] = runtime.peakHeights[i]
    }
  }

  const pixelHeights = new Float32Array(totalBars)
  const pixelPeaks = new Float32Array(totalBars)
  for (let i = 0; i < totalBars; i++) {
    pixelHeights[i] = spectrumMinHeight + runtime.smoothedHeights[i] * (spectrumMaxHeight - spectrumMinHeight)
    pixelPeaks[i] = runtime.peakHeights[i]
  }

  if (isCircular) {
    switch (spectrumShape) {
      case 'bars':
        drawCircularBars(ctx, cx, cy, pixelHeights, pixelPeaks, totalBars, settings, runtime.rotation)
        break
      case 'lines':
        drawCircularLines(ctx, cx, cy, pixelHeights, totalBars, settings, runtime.rotation)
        break
      case 'wave':
        drawCircularWave(ctx, canvas, cx, cy, pixelHeights, totalBars, settings, runtime.rotation)
        break
      case 'dots':
        drawCircularDots(ctx, cx, cy, pixelHeights, totalBars, settings, runtime.rotation)
        break
    }
  } else {
    // Pixel offsets for linear layouts: spectrumPositionX/Y in [-1,1] mapped to canvas space
    const linOffX = (settings.spectrumPositionX ?? 0) * canvas.width * 0.5
    const linOffY = -(settings.spectrumPositionY ?? 0) * canvas.height * 0.5
    if (spectrumShape === 'wave') {
      drawLinearWave(ctx, canvas, pixelHeights, totalBars, settings, linOffX, linOffY)
    } else if (spectrumShape === 'lines' || spectrumShape === 'dots') {
      drawLinearLinesOrDots(ctx, canvas, pixelHeights, totalBars, settings, linOffX, linOffY)
    } else {
      drawLinearBars(ctx, canvas, pixelHeights, pixelPeaks, totalBars, settings, linOffX, linOffY)
    }
  }

  ctx.restore()

  if (runtime.modeTransitionSnapshotCanvas && runtime.modeTransitionElapsed < MODE_TRANSITION_DURATION) {
    runtime.modeTransitionElapsed = Math.min(MODE_TRANSITION_DURATION, runtime.modeTransitionElapsed + dt)
    const progress = runtime.modeTransitionElapsed / MODE_TRANSITION_DURATION
    const eased = progress * progress * (3 - 2 * progress)
    const alpha = 1 - eased
    if (alpha > 0.001) {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.drawImage(runtime.modeTransitionSnapshotCanvas, 0, 0, canvas.width, canvas.height)
      ctx.restore()
    } else {
      runtime.modeTransitionSnapshotCanvas = null
    }
  }

  runtime.previousFrameCanvas = ensureSnapshotCanvas(runtime.previousFrameCanvas, canvas.width, canvas.height)
  copyCanvas(canvas, runtime.previousFrameCanvas)
}

export function resetSpectrum(): void {
  spectrumRuntimeMap.clear()
}
