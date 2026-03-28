import type { WallpaperState } from '@/types/wallpaper'

type SpectrumSettings = Pick<
  WallpaperState,
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
>

let smoothedHeights: Float32Array = new Float32Array(0)
let peakHeights: Float32Array = new Float32Array(0)
let rotation = 0
let idleTime = 0

// ─── helpers ────────────────────────────────────────────────────────────────

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
  if (spectrumColorMode === 'rainbow') return `hsl(${Math.round(t * 360)},100%,60%)`
  const [r1, g1, b1] = hexToRgb(spectrumPrimaryColor)
  const [r2, g2, b2] = hexToRgb(spectrumSecondaryColor)
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`
}

function sampleBins(bins: Uint8Array, i: number, barCount: number, settings: SpectrumSettings): number {
  if (bins.length === 0) return 0
  const { spectrumBandMode } = settings
  const startBin = spectrumBandMode === 'bass' ? 1 : spectrumBandMode === 'mid' ? 10 : spectrumBandMode === 'treble' ? 80 : 1
  const endBin   = spectrumBandMode === 'bass' ? 10 : spectrumBandMode === 'mid' ? 80 : spectrumBandMode === 'treble' ? 200
    : Math.max(10, Math.floor(bins.length * 0.75))
  const logT = Math.pow(i / Math.max(barCount - 1, 1), 1.5)
  const binIdx = Math.floor(startBin + logT * (endBin - startBin))
  const val = bins[Math.min(binIdx, bins.length - 1)]
  return (val ?? 0) / 255
}

// ─── circular draw modes ─────────────────────────────────────────────────────

function drawCircularBars(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  heights: Float32Array,
  peaks: Float32Array,
  barCount: number,
  settings: SpectrumSettings
) {
  const { spectrumInnerRadius, spectrumBarWidth, spectrumMinHeight, spectrumPeakHold, spectrumGlowIntensity, spectrumShadowBlur } = settings
  for (let i = 0; i < barCount; i++) {
    const t = i / barCount
    const angle = t * Math.PI * 2 + rotation - Math.PI / 2
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
  cx: number, cy: number,
  heights: Float32Array,
  barCount: number,
  settings: SpectrumSettings
) {
  const { spectrumInnerRadius, spectrumBarWidth, spectrumGlowIntensity, spectrumShadowBlur } = settings
  const lineW = Math.max(spectrumBarWidth, 1.5)

  for (let i = 0; i < barCount; i++) {
    const t = i / barCount
    const angle = t * Math.PI * 2 + rotation - Math.PI / 2
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
    // Per-line glow matching bar color for crisp neon look
    ctx.shadowColor = color
    ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity * 1.5
    ctx.stroke()

    // Bright dot at the tip for visibility
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
  cx: number, cy: number,
  heights: Float32Array,
  barCount: number,
  settings: SpectrumSettings
) {
  const { spectrumInnerRadius, spectrumBarWidth, spectrumGlowIntensity, spectrumShadowBlur, spectrumPrimaryColor } = settings
  const color = getColor(settings, 0.5)
  ctx.beginPath()
  for (let i = 0; i <= barCount; i++) {
    const t = (i % barCount) / barCount
    const angle = t * Math.PI * 2 + rotation - Math.PI / 2
    const r = spectrumInnerRadius + heights[i % barCount]
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.strokeStyle = color
  ctx.lineWidth = spectrumBarWidth
  ctx.shadowColor = spectrumPrimaryColor
  ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity
  ctx.stroke()
  // Subtle fill inside
  ctx.fillStyle = color
  ctx.globalAlpha *= 0.12
  ctx.fill()
  ctx.globalAlpha /= 0.12
}

function drawCircularDots(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  heights: Float32Array,
  barCount: number,
  settings: SpectrumSettings
) {
  const { spectrumInnerRadius, spectrumBarWidth, spectrumGlowIntensity, spectrumShadowBlur } = settings
  const dotR = Math.max(spectrumBarWidth * 0.8, 1.5)
  for (let i = 0; i < barCount; i++) {
    const t = i / barCount
    const angle = t * Math.PI * 2 + rotation - Math.PI / 2
    const r = spectrumInnerRadius + heights[i]
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    const color = getColor(settings, t)
    ctx.beginPath()
    ctx.arc(x, y, dotR, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity
    ctx.fill()
  }
}

// ─── horizontal bars (vertical bars from bottom, classic equalizer) ──────────

function drawHorizontalBars(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  heights: Float32Array,
  peaks: Float32Array,
  barCount: number,
  settings: SpectrumSettings
) {
  const { spectrumBarWidth, spectrumMinHeight, spectrumPeakHold, spectrumMirror, spectrumGlowIntensity, spectrumShadowBlur } = settings
  const W = canvas.width
  const H = canvas.height
  const gap = Math.max(1, Math.round(spectrumBarWidth * 0.25))
  const totalWidth = barCount * (spectrumBarWidth + gap)
  const startX = (W - totalWidth) / 2

  if (spectrumMirror) {
    // Bars grow from center — up AND down (symmetrical)
    const baseY = H * 0.5
    for (let i = 0; i < barCount; i++) {
      const t = i / barCount
      const x = startX + i * (spectrumBarWidth + gap)
      const h = heights[i]
      const color = getColor(settings, t)
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity
      ctx.fillRect(x, baseY - h, spectrumBarWidth, h)
      ctx.fillRect(x, baseY, spectrumBarWidth, h)
      if (spectrumPeakHold && peaks[i] > spectrumMinHeight + 1) {
        ctx.fillStyle = '#ffffff'
        ctx.shadowBlur = 0
        ctx.fillRect(x, baseY - peaks[i] - 2, spectrumBarWidth, 2)
        ctx.fillRect(x, baseY + peaks[i], spectrumBarWidth, 2)
      }
    }
  } else {
    // Classic equalizer: bars grow upward from near bottom
    const baseY = H * 0.88
    for (let i = 0; i < barCount; i++) {
      const t = i / barCount
      const x = startX + i * (spectrumBarWidth + gap)
      const h = heights[i]
      const color = getColor(settings, t)
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity
      ctx.fillRect(x, baseY - h, spectrumBarWidth, h)
      if (spectrumPeakHold && peaks[i] > spectrumMinHeight + 1) {
        ctx.fillStyle = '#ffffff'
        ctx.shadowBlur = 0
        ctx.fillRect(x, baseY - peaks[i] - 2, spectrumBarWidth, 2)
      }
    }
  }
}

function drawHorizontalWave(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  heights: Float32Array,
  barCount: number,
  settings: SpectrumSettings
) {
  const { spectrumBarWidth, spectrumGlowIntensity, spectrumShadowBlur, spectrumPrimaryColor } = settings
  const W = canvas.width
  const H = canvas.height * 0.88 // anchor near bottom like bars
  const xStep = W / Math.max(barCount - 1, 1)
  const color = getColor(settings, 0.5)

  ctx.beginPath()
  for (let i = 0; i < barCount; i++) {
    const x = i * xStep
    const y = H - heights[i]
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  for (let i = barCount - 1; i >= 0; i--) {
    const x = i * xStep
    ctx.lineTo(x, H)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.globalAlpha *= 0.35
  ctx.fill()
  ctx.globalAlpha /= 0.35

  ctx.beginPath()
  for (let i = 0; i < barCount; i++) {
    const x = i * xStep
    const y = H - heights[i]
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.strokeStyle = color
  ctx.lineWidth = spectrumBarWidth
  ctx.shadowColor = spectrumPrimaryColor
  ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity
  ctx.stroke()
}

// ─── main export ─────────────────────────────────────────────────────────────

export function drawSpectrum(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  bins: Uint8Array,
  settings: SpectrumSettings,
  dt: number
): void {
  idleTime += dt

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
    spectrumLayout,
  } = settings

  const isCircular = spectrumLayout === 'circular'
  const barCount = isCircular && spectrumMirror ? Math.floor(spectrumBarCount / 2) : spectrumBarCount
  const totalBars = isCircular && spectrumMirror ? barCount * 2 : barCount

  if (smoothedHeights.length !== totalBars) {
    smoothedHeights = new Float32Array(totalBars)
    peakHeights = new Float32Array(totalBars)
  }

  rotation += spectrumRotationSpeed * dt

  const cx = canvas.width / 2
  const cy = canvas.height / 2

  ctx.save()
  ctx.globalAlpha = spectrumOpacity
  // Global shadow for shapes that don't set per-element shadow
  ctx.shadowBlur = spectrumShadowBlur * spectrumGlowIntensity
  ctx.shadowColor = spectrumPrimaryColor

  // Update smoothed heights
  for (let i = 0; i < barCount; i++) {
    let rawValue: number
    if (bins.length === 0) {
      rawValue = (Math.sin(idleTime * 1.5 + i * 0.25) * 0.5 + 0.5) * 0.08
    } else {
      rawValue = sampleBins(bins, i, barCount, settings)
    }
    smoothedHeights[i] = smoothedHeights[i] * spectrumSmoothing + rawValue * (1 - spectrumSmoothing)

    const h = spectrumMinHeight + smoothedHeights[i] * (spectrumMaxHeight - spectrumMinHeight)

    if (spectrumPeakHold) {
      if (h > peakHeights[i]) peakHeights[i] = h
      else peakHeights[i] = Math.max(spectrumMinHeight, peakHeights[i] - spectrumPeakDecay * spectrumMaxHeight)
    }

    // Mirror (circular only)
    if (isCircular && spectrumMirror) {
      const mi = totalBars - 1 - i
      smoothedHeights[mi] = smoothedHeights[i]
      peakHeights[mi] = peakHeights[i]
    }
  }

  // Compute pixel heights for draw functions
  const pixelHeights = new Float32Array(totalBars)
  for (let i = 0; i < totalBars; i++) {
    pixelHeights[i] = spectrumMinHeight + smoothedHeights[i] * (spectrumMaxHeight - spectrumMinHeight)
  }
  const pixelPeaks = new Float32Array(totalBars)
  for (let i = 0; i < totalBars; i++) {
    pixelPeaks[i] = peakHeights[i]
  }

  // Draw
  if (isCircular) {
    switch (spectrumShape) {
      case 'bars':  drawCircularBars(ctx, cx, cy, pixelHeights, pixelPeaks, totalBars, settings); break
      case 'lines': drawCircularLines(ctx, cx, cy, pixelHeights, totalBars, settings); break
      case 'wave':  drawCircularWave(ctx, cx, cy, pixelHeights, totalBars, settings); break
      case 'dots':  drawCircularDots(ctx, cx, cy, pixelHeights, totalBars, settings); break
    }
  } else {
    switch (spectrumShape) {
      case 'wave':  drawHorizontalWave(ctx, canvas, pixelHeights, totalBars, settings); break
      default:      drawHorizontalBars(ctx, canvas, pixelHeights, pixelPeaks, totalBars, settings); break
    }
  }

  ctx.restore()
}

export function resetSpectrum(): void {
  smoothedHeights = new Float32Array(0)
  peakHeights = new Float32Array(0)
  rotation = 0
  idleTime = 0
}
