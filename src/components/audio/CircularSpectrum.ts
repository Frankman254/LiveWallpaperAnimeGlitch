import {
  createAudioChannelSelectionState,
  resolveAudioChannelValue,
  type AudioSnapshot,
} from '@/lib/audio/audioChannels'
import { publishSpectrumDiagnosticsSlice } from '@/lib/debug/spectrumDiagnosticsTelemetry'
import { setDebugSpectrumAudio } from '@/lib/debug/frameAudioDebugSnapshot'
import { sampleBinsForChannel } from '@/lib/audio/spectrumBinSampling'
import { useWallpaperStore } from '@/store/wallpaperStore'
import type {
  ResolvedAudioReactiveChannel,
  SpectrumBandMode,
  SpectrumLinearDirection,
  SpectrumLinearOrientation,
  SpectrumRadialShape,
  SpectrumShape,
  WallpaperState,
} from '@/types/wallpaper'
import { createAudioEnvelope, type AudioEnvelope } from '@/utils/audioEnvelope'

type SpectrumSettings = Pick<
  WallpaperState,
  | 'spectrumMode'
  | 'spectrumLinearOrientation'
  | 'spectrumLinearDirection'
  | 'spectrumRadialShape'
  | 'spectrumRadialAngle'
  | 'spectrumRadialFitLogo'
  | 'spectrumFollowLogo'
  | 'spectrumLogoGap'
  | 'spectrumSpan'
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
  | 'spectrumPositionX'
  | 'spectrumPositionY'
  | 'audioSelectedChannelSmoothing'
  | 'audioAutoKickThreshold'
  | 'audioAutoSwitchHoldMs'
>

type SpectrumRuntimeState = {
  smoothedHeights: Float32Array
  peakHeights: Float32Array
  pixelHeights: Float32Array
  pixelPeaks: Float32Array
  rotation: number
  idleTime: number
  lastModeSignature: string
  modeTransitionElapsed: number
  modeTransitionSnapshotCanvas: HTMLCanvasElement | null
  previousFrameCanvas: HTMLCanvasElement | null
  energyEnvelope: AudioEnvelope
  channelSelection: ReturnType<typeof createAudioChannelSelectionState>
}

const spectrumRuntimeMap = new Map<string, SpectrumRuntimeState>()
const MODE_TRANSITION_DURATION = 0.32

function createSpectrumRuntimeState(): SpectrumRuntimeState {
  return {
    smoothedHeights: new Float32Array(0),
    peakHeights: new Float32Array(0),
    pixelHeights: new Float32Array(0),
    pixelPeaks: new Float32Array(0),
    rotation: 0,
    idleTime: 0,
    lastModeSignature: '',
    modeTransitionElapsed: MODE_TRANSITION_DURATION,
    modeTransitionSnapshotCanvas: null,
    previousFrameCanvas: null,
    energyEnvelope: createAudioEnvelope(),
    channelSelection: createAudioChannelSelectionState('instrumental'),
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

function ensureFloatArrayLength(source: Float32Array, nextLength: number): Float32Array {
  return source.length === nextLength ? source : new Float32Array(nextLength)
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
  orientation: SpectrumLinearOrientation | 'radial',
  cx = canvas.width / 2,
  cy = canvas.height / 2,
  radius = Math.max(canvas.width, canvas.height) * 0.5
): CanvasGradient | string {
  if (settings.spectrumColorMode === 'solid') return settings.spectrumPrimaryColor

  if (orientation === 'vertical') {
    const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
    addGradientStops(gradient, settings)
    return gradient
  }

  if (orientation === 'radial') {
    const gradient = ctx.createRadialGradient(cx, cy, Math.max(4, radius * 0.25), cx, cy, radius)
    addGradientStops(gradient, settings)
    return gradient
  }

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
  addGradientStops(gradient, settings)
  return gradient
}

function buildModeSignature(settings: SpectrumSettings): string {
  return [
    settings.spectrumMode,
    settings.spectrumLinearOrientation,
    settings.spectrumLinearDirection,
    settings.spectrumRadialShape,
    settings.spectrumRadialFitLogo ? 'fit-logo' : 'free-radial',
    settings.spectrumShape,
    settings.spectrumMirror ? 'mirror' : 'single',
    settings.spectrumColorMode,
    settings.spectrumBandMode,
    settings.spectrumBarCount,
    settings.spectrumFollowLogo ? 'follow' : 'free',
  ].join('|')
}

function ensureSnapshotCanvas(existing: HTMLCanvasElement | null, width: number, height: number): HTMLCanvasElement | null {
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

function drawPeakMarker(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  ctx.fillStyle = '#ffffff'
  ctx.shadowBlur = 0
  ctx.fillRect(x, y, width, height)
}

function normalizeAngle(angle: number): number {
  const fullTurn = Math.PI * 2
  let next = angle % fullTurn
  if (next < 0) next += fullTurn
  return next
}

function getPolygonRadius(baseRadius: number, sides: number, angle: number): number {
  const sector = (Math.PI * 2) / sides
  const local = normalizeAngle(angle + sector / 2) % sector - sector / 2
  return (baseRadius * Math.cos(Math.PI / sides)) / Math.cos(local)
}

function getRadialBaseRadius(
  shape: SpectrumRadialShape,
  baseRadius: number,
  angle: number,
  radialAngle: number,
  minimumSafeRadius = 0
): number {
  const shapedAngle = angle + radialAngle
  let radius = baseRadius
  switch (shape) {
    case 'square':
      radius = getPolygonRadius(baseRadius, 4, shapedAngle + Math.PI / 4)
      break
    case 'triangle':
      radius = getPolygonRadius(baseRadius, 3, shapedAngle + Math.PI / 2)
      break
    case 'star': {
      const pulse = (Math.cos(shapedAngle * 5) + 1) * 0.5
      radius = baseRadius * (0.64 + pulse * 0.36)
      break
    }
    case 'circle':
    default:
      radius = baseRadius
      break
  }
  return Math.max(radius, minimumSafeRadius)
}

function drawRadialBars(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  heights: Float32Array,
  peaks: Float32Array,
  barCount: number,
  settings: SpectrumSettings,
  rotationOffset: number,
  radialAngle: number
) {
  const { spectrumBarWidth, spectrumMinHeight, spectrumPeakHold, spectrumGlowIntensity, spectrumShadowBlur, spectrumInnerRadius } = settings
  const safeRadius = settings.spectrumFollowLogo && settings.spectrumRadialFitLogo ? spectrumInnerRadius : 0
  for (let i = 0; i < barCount; i++) {
    const t = i / barCount
    const angle = t * Math.PI * 2 + rotationOffset - Math.PI / 2
    const baseRadius = getRadialBaseRadius(settings.spectrumRadialShape, spectrumInnerRadius, angle, radialAngle, safeRadius)
    const h = heights[i]
    const color = getColor(settings, t)
    const startX = cx + Math.cos(angle) * baseRadius
    const startY = cy + Math.sin(angle) * baseRadius
    ctx.save()
    ctx.translate(startX, startY)
    ctx.rotate(angle)
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity
    ctx.fillRect(0, -spectrumBarWidth / 2, h, spectrumBarWidth)
    if (spectrumPeakHold && peaks[i] > spectrumMinHeight + 1) {
      ctx.fillStyle = '#ffffff'
      ctx.shadowBlur = 0
      ctx.fillRect(peaks[i], -spectrumBarWidth / 2, 2, spectrumBarWidth)
    }
    ctx.restore()
  }
}

function drawRadialLines(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  heights: Float32Array,
  barCount: number,
  settings: SpectrumSettings,
  rotationOffset: number,
  radialAngle: number
) {
  const { spectrumBarWidth, spectrumGlowIntensity, spectrumShadowBlur, spectrumInnerRadius } = settings
  const lineWidth = Math.max(spectrumBarWidth, 1.5)
  const safeRadius = settings.spectrumFollowLogo && settings.spectrumRadialFitLogo ? spectrumInnerRadius : 0
  for (let i = 0; i < barCount; i++) {
    const t = i / barCount
    const angle = t * Math.PI * 2 + rotationOffset - Math.PI / 2
    const baseRadius = getRadialBaseRadius(settings.spectrumRadialShape, spectrumInnerRadius, angle, radialAngle, safeRadius)
    const h = heights[i]
    const color = getColor(settings, t)
    const x1 = cx + Math.cos(angle) * baseRadius
    const y1 = cy + Math.sin(angle) * baseRadius
    const x2 = cx + Math.cos(angle) * (baseRadius + h)
    const y2 = cy + Math.sin(angle) * (baseRadius + h)
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.shadowColor = color
    ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity * 1.4
    ctx.stroke()
  }
}

function drawRadialWave(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  cx: number,
  cy: number,
  heights: Float32Array,
  barCount: number,
  settings: SpectrumSettings,
  rotationOffset: number,
  radialAngle: number
) {
  const gradient = createWaveGradient(ctx, canvas, settings, 'radial', cx, cy, settings.spectrumInnerRadius + settings.spectrumMaxHeight)
  const safeRadius = settings.spectrumFollowLogo && settings.spectrumRadialFitLogo ? settings.spectrumInnerRadius : 0
  ctx.beginPath()
  for (let i = 0; i <= barCount; i++) {
    const t = (i % barCount) / barCount
    const angle = t * Math.PI * 2 + rotationOffset - Math.PI / 2
    const baseRadius = getRadialBaseRadius(settings.spectrumRadialShape, settings.spectrumInnerRadius, angle, radialAngle, safeRadius)
    const radius = baseRadius + heights[i % barCount]
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.strokeStyle = gradient
  ctx.lineWidth = settings.spectrumBarWidth
  ctx.shadowColor = settings.spectrumPrimaryColor
  ctx.shadowBlur = settings.spectrumShadowBlur * settings.spectrumGlowIntensity
  ctx.stroke()
}

function drawRadialDots(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  heights: Float32Array,
  barCount: number,
  settings: SpectrumSettings,
  rotationOffset: number,
  radialAngle: number
) {
  const dotRadius = Math.max(settings.spectrumBarWidth * 0.8, 1.5)
  const safeRadius = settings.spectrumFollowLogo && settings.spectrumRadialFitLogo ? settings.spectrumInnerRadius : 0
  for (let i = 0; i < barCount; i++) {
    const t = i / barCount
    const angle = t * Math.PI * 2 + rotationOffset - Math.PI / 2
    const baseRadius = getRadialBaseRadius(settings.spectrumRadialShape, settings.spectrumInnerRadius, angle, radialAngle, safeRadius)
    const radius = baseRadius + heights[i]
    const color = getColor(settings, t)
    ctx.beginPath()
    ctx.arc(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, dotRadius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = settings.spectrumShadowBlur * settings.spectrumGlowIntensity
    ctx.fill()
  }
}

function resolveLinearDirection(
  orientation: SpectrumLinearOrientation,
  direction: SpectrumLinearDirection
): 1 | -1 {
  if (orientation === 'vertical') {
    return direction === 'normal' ? 1 : -1
  }
  return direction === 'normal' ? -1 : 1
}

function getLinearBase(canvas: HTMLCanvasElement, settings: SpectrumSettings): { baseX: number; baseY: number; direction: 1 | -1 } {
  const baseX = canvas.width / 2 + (settings.spectrumPositionX ?? 0) * canvas.width * 0.5
  const baseY = canvas.height / 2 - (settings.spectrumPositionY ?? 0) * canvas.height * 0.5
  return {
    baseX,
    baseY,
    direction: resolveLinearDirection(settings.spectrumLinearOrientation, settings.spectrumLinearDirection),
  }
}

function getLinearMetrics(canvas: HTMLCanvasElement, settings: SpectrumSettings, barCount: number) {
  const totalSpan = (settings.spectrumLinearOrientation === 'vertical' ? canvas.height : canvas.width) * Math.max(0.2, Math.min(1, settings.spectrumSpan ?? 1))
  const gap = Math.max(0, totalSpan / Math.max(barCount, 1) - settings.spectrumBarWidth)
  const stride = settings.spectrumBarWidth + gap
  const totalLength = Math.max(0, barCount * stride - gap)
  return { totalSpan, gap, stride, totalLength }
}

function drawLinearBars(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  heights: Float32Array,
  peaks: Float32Array,
  barCount: number,
  settings: SpectrumSettings
) {
  const { baseX, baseY, direction } = getLinearBase(canvas, settings)
  const { stride, totalLength } = getLinearMetrics(canvas, settings, barCount)
  const start = (settings.spectrumLinearOrientation === 'vertical'
    ? (canvas.height - totalLength) / 2
    : (canvas.width - totalLength) / 2)
  const showMirror = settings.spectrumMirror

  for (let i = 0; i < barCount; i++) {
    const t = i / Math.max(barCount - 1, 1)
    const color = getColor(settings, t)
    const h = heights[i]
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = settings.spectrumShadowBlur * settings.spectrumGlowIntensity

    if (settings.spectrumLinearOrientation === 'vertical') {
      const y = start + i * stride
      ctx.fillRect(baseX, y, h * direction, settings.spectrumBarWidth)
      if (showMirror) ctx.fillRect(baseX, y, h * -direction, settings.spectrumBarWidth)
      if (settings.spectrumPeakHold && peaks[i] > settings.spectrumMinHeight + 1) {
        drawPeakMarker(ctx, baseX + peaks[i] * direction, y, 2 * direction, settings.spectrumBarWidth)
        if (showMirror) drawPeakMarker(ctx, baseX - peaks[i] * direction, y, -2 * direction, settings.spectrumBarWidth)
      }
    } else {
      const x = start + i * stride
      ctx.fillRect(x, baseY, settings.spectrumBarWidth, h * direction)
      if (showMirror) ctx.fillRect(x, baseY, settings.spectrumBarWidth, h * -direction)
      if (settings.spectrumPeakHold && peaks[i] > settings.spectrumMinHeight + 1) {
        drawPeakMarker(ctx, x, baseY + peaks[i] * direction, settings.spectrumBarWidth, 2 * direction)
        if (showMirror) drawPeakMarker(ctx, x, baseY - peaks[i] * direction, settings.spectrumBarWidth, -2 * direction)
      }
    }
  }
}

function drawLinearLinesOrDots(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  heights: Float32Array,
  barCount: number,
  settings: SpectrumSettings
) {
  const { baseX, baseY, direction } = getLinearBase(canvas, settings)
  const { stride, totalLength } = getLinearMetrics(canvas, settings, barCount)
  const start = (settings.spectrumLinearOrientation === 'vertical'
    ? (canvas.height - totalLength) / 2
    : (canvas.width - totalLength) / 2)
  const isDots = settings.spectrumShape === 'dots'
  const dotRadius = Math.max(settings.spectrumBarWidth * 0.7, 1.5)

  for (let i = 0; i < barCount; i++) {
    const t = i / Math.max(barCount - 1, 1)
    const color = getColor(settings, t)
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = settings.spectrumShadowBlur * settings.spectrumGlowIntensity

    if (settings.spectrumLinearOrientation === 'vertical') {
      const y = start + i * stride + settings.spectrumBarWidth / 2
      const x = baseX + heights[i] * direction
      if (isDots) {
        ctx.beginPath()
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
        ctx.fill()
        if (settings.spectrumMirror) {
          ctx.beginPath()
          ctx.arc(baseX - heights[i] * direction, y, dotRadius, 0, Math.PI * 2)
          ctx.fill()
        }
      } else {
        ctx.beginPath()
        ctx.moveTo(baseX, y)
        ctx.lineTo(x, y)
        ctx.lineWidth = Math.max(1, settings.spectrumBarWidth * 0.8)
        ctx.lineCap = 'round'
        ctx.stroke()
        if (settings.spectrumMirror) {
          ctx.beginPath()
          ctx.moveTo(baseX, y)
          ctx.lineTo(baseX - heights[i] * direction, y)
          ctx.stroke()
        }
      }
    } else {
      const x = start + i * stride + settings.spectrumBarWidth / 2
      const y = baseY + heights[i] * direction
      if (isDots) {
        ctx.beginPath()
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2)
        ctx.fill()
        if (settings.spectrumMirror) {
          ctx.beginPath()
          ctx.arc(x, baseY - heights[i] * direction, dotRadius, 0, Math.PI * 2)
          ctx.fill()
        }
      } else {
        ctx.beginPath()
        ctx.moveTo(x, baseY)
        ctx.lineTo(x, y)
        ctx.lineWidth = Math.max(1, settings.spectrumBarWidth * 0.8)
        ctx.lineCap = 'round'
        ctx.stroke()
        if (settings.spectrumMirror) {
          ctx.beginPath()
          ctx.moveTo(x, baseY)
          ctx.lineTo(x, baseY - heights[i] * direction)
          ctx.stroke()
        }
      }
    }
  }
}

function drawLinearWave(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  heights: Float32Array,
  barCount: number,
  settings: SpectrumSettings
) {
  const { baseX, baseY, direction } = getLinearBase(canvas, settings)
  const totalSpan = (settings.spectrumLinearOrientation === 'vertical' ? canvas.height : canvas.width) * Math.max(0.2, Math.min(1, settings.spectrumSpan ?? 1))
  const start = (settings.spectrumLinearOrientation === 'vertical'
    ? (canvas.height - totalSpan) / 2
    : (canvas.width - totalSpan) / 2)
  const step = totalSpan / Math.max(barCount - 1, 1)
  const gradient = createWaveGradient(ctx, canvas, settings, settings.spectrumLinearOrientation)

  ctx.beginPath()
  for (let i = 0; i < barCount; i++) {
    if (settings.spectrumLinearOrientation === 'vertical') {
      const y = start + i * step
      const x = baseX + heights[i] * direction
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    } else {
      const x = start + i * step
      const y = baseY + heights[i] * direction
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
  }

  if (settings.spectrumMirror) {
    for (let i = barCount - 1; i >= 0; i--) {
      if (settings.spectrumLinearOrientation === 'vertical') {
        ctx.lineTo(baseX - heights[i] * direction, start + i * step)
      } else {
        ctx.lineTo(start + i * step, baseY - heights[i] * direction)
      }
    }
  } else if (settings.spectrumLinearOrientation === 'vertical') {
    ctx.lineTo(baseX, start + totalSpan)
    ctx.lineTo(baseX, start)
  } else {
    ctx.lineTo(start + totalSpan, baseY)
    ctx.lineTo(start, baseY)
  }

  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.save()
  ctx.globalAlpha *= 0.28
  ctx.fill()
  ctx.restore()

  ctx.beginPath()
  for (let i = 0; i < barCount; i++) {
    if (settings.spectrumLinearOrientation === 'vertical') {
      const y = start + i * step
      const x = baseX + heights[i] * direction
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    } else {
      const x = start + i * step
      const y = baseY + heights[i] * direction
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
  }
  ctx.strokeStyle = gradient
  ctx.lineWidth = settings.spectrumBarWidth
  ctx.shadowColor = settings.spectrumPrimaryColor
  ctx.shadowBlur = settings.spectrumShadowBlur * settings.spectrumGlowIntensity
  ctx.stroke()
}

export function drawSpectrum(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  audio: AudioSnapshot,
  settings: SpectrumSettings,
  dt: number,
  instanceKey = 'primary'
): void {
  const runtime = getSpectrumRuntimeState(instanceKey)
  const bins = audio.bins
  runtime.idleTime += dt

  const modeSignature = buildModeSignature(settings)
  if (runtime.lastModeSignature && modeSignature !== runtime.lastModeSignature) {
    runtime.modeTransitionSnapshotCanvas = ensureSnapshotCanvas(runtime.modeTransitionSnapshotCanvas, canvas.width, canvas.height)
    copyCanvas(runtime.previousFrameCanvas ?? canvas, runtime.modeTransitionSnapshotCanvas)
    runtime.modeTransitionElapsed = 0
  }
  runtime.lastModeSignature = modeSignature

  const barCount = settings.spectrumBarCount
  if (runtime.smoothedHeights.length !== barCount) {
    runtime.smoothedHeights = resizeFloatArrayPreserve(runtime.smoothedHeights, barCount)
    runtime.peakHeights = resizeFloatArrayPreserve(runtime.peakHeights, barCount)
    runtime.pixelHeights = ensureFloatArrayLength(runtime.pixelHeights, barCount)
    runtime.pixelPeaks = ensureFloatArrayLength(runtime.pixelPeaks, barCount)
  }

  runtime.rotation += settings.spectrumRotationSpeed * dt
  let accumulatedEnergy = 0
  const {
    resolvedChannel,
    instantLevel: channelInstant,
    value: channelSmoothed,
  } = resolveAudioChannelValue(
    audio.channels,
    settings.spectrumBandMode,
    runtime.channelSelection,
    settings.audioSelectedChannelSmoothing,
    settings.audioAutoKickThreshold,
    settings.audioAutoSwitchHoldMs,
    audio.timestampMs
  )

  for (let i = 0; i < barCount; i++) {
    const rawValue = bins.length === 0
      ? (Math.sin(runtime.idleTime * 1.5 + i * 0.25) * 0.5 + 0.5) * 0.08
      : sampleBinsForChannel(bins, i, barCount, resolvedChannel)
    accumulatedEnergy += rawValue

    runtime.smoothedHeights[i] = runtime.smoothedHeights[i] * settings.spectrumSmoothing + rawValue * (1 - settings.spectrumSmoothing)
    const height = settings.spectrumMinHeight + runtime.smoothedHeights[i] * (settings.spectrumMaxHeight - settings.spectrumMinHeight)

    if (settings.spectrumPeakHold) {
      if (height > runtime.peakHeights[i]) runtime.peakHeights[i] = height
      else runtime.peakHeights[i] = Math.max(settings.spectrumMinHeight, runtime.peakHeights[i] - settings.spectrumPeakDecay * settings.spectrumMaxHeight)
    }
  }

  const energyEnvelopeState = runtime.energyEnvelope.tick(
    accumulatedEnergy / Math.max(barCount, 1),
    Math.max(dt, 1 / 120),
    {
      attack: 0.52,
      release: 0.12,
      responseSpeed: 1.55,
      peakWindow: 1.8,
      peakFloor: 0.06,
      punch: 0.04,
      scaleIntensity: 1,
      min: 0,
      max: 1,
    }
  )
  const globalGain = 0.84 + energyEnvelopeState.normalizedAmplitude * 0.24

  for (let i = 0; i < barCount; i++) {
    runtime.pixelHeights[i] = settings.spectrumMinHeight + runtime.smoothedHeights[i] * (settings.spectrumMaxHeight - settings.spectrumMinHeight) * globalGain
    runtime.pixelPeaks[i] = settings.spectrumMinHeight + Math.max(0, runtime.peakHeights[i] - settings.spectrumMinHeight) * globalGain
  }

  const cx = canvas.width / 2 + (settings.spectrumPositionX ?? 0) * canvas.width * 0.5
  const cy = canvas.height / 2 - (settings.spectrumPositionY ?? 0) * canvas.height * 0.5

  const meanBinEnergy = accumulatedEnergy / Math.max(barCount, 1)
  setDebugSpectrumAudio({
    bandModeRequested: settings.spectrumBandMode,
    resolvedChannel,
    channelInstant,
    channelRouterSmoothed: channelSmoothed,
    meanBinEnergy,
    globalGain,
    barCount,
    instance: instanceKey === 'clone-circular' ? 'clone' : 'primary',
  })

  if (useWallpaperStore.getState().showSpectrumDiagnosticsHud) {
    const store = useWallpaperStore.getState()
    const followEffective = Boolean(settings.spectrumFollowLogo && store.logoEnabled)
    publishSpectrumDiagnosticsSlice({
      instance: instanceKey === 'clone-circular' ? 'clone-circular' : 'primary',
      bandModeRequested: settings.spectrumBandMode,
      resolvedChannel,
      channelInstant,
      channelSmoothed,
      meanBinEnergy,
      envelopeNormalized: energyEnvelopeState.normalizedAmplitude,
      globalGain,
      spectrumMode: settings.spectrumMode,
      followLogoSetting: settings.spectrumFollowLogo,
      followLogoEffective: followEffective,
      innerRadius: settings.spectrumInnerRadius,
      canvasCx: cx,
      canvasCy: cy,
      positionNormX: settings.spectrumPositionX ?? 0,
      positionNormY: settings.spectrumPositionY ?? 0,
      barCount,
    })
  }
  const radialAngle = (settings.spectrumRadialAngle * Math.PI) / 180

  ctx.save()
  ctx.globalAlpha = settings.spectrumOpacity
  ctx.shadowBlur = settings.spectrumShadowBlur * settings.spectrumGlowIntensity
  ctx.shadowColor = settings.spectrumPrimaryColor

  if (settings.spectrumMode === 'radial') {
    switch (settings.spectrumShape) {
      case 'bars':
        drawRadialBars(ctx, cx, cy, runtime.pixelHeights, runtime.pixelPeaks, barCount, settings, runtime.rotation, radialAngle)
        break
      case 'lines':
        drawRadialLines(ctx, cx, cy, runtime.pixelHeights, barCount, settings, runtime.rotation, radialAngle)
        break
      case 'wave':
        drawRadialWave(ctx, canvas, cx, cy, runtime.pixelHeights, barCount, settings, runtime.rotation, radialAngle)
        break
      case 'dots':
        drawRadialDots(ctx, cx, cy, runtime.pixelHeights, barCount, settings, runtime.rotation, radialAngle)
        break
    }
  } else if (settings.spectrumShape === 'wave') {
    drawLinearWave(ctx, canvas, runtime.pixelHeights, barCount, settings)
  } else if (settings.spectrumShape === 'lines' || settings.spectrumShape === 'dots') {
    drawLinearLinesOrDots(ctx, canvas, runtime.pixelHeights, barCount, settings)
  } else {
    drawLinearBars(ctx, canvas, runtime.pixelHeights, runtime.pixelPeaks, barCount, settings)
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
