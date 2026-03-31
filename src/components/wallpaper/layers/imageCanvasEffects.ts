import { clamp } from '@/lib/math'
import type { OverlayImageLayer } from '@/types/layers'
import type { GlitchDirection } from '@/types/wallpaper'

type RasterSource = HTMLImageElement | HTMLCanvasElement

export function seededRandom(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1 + 311.7)) % 1
}

function getRasterDimensions(source: RasterSource): { width: number; height: number } {
  if ('naturalWidth' in source) {
    return {
      width: Math.max(1, source.naturalWidth),
      height: Math.max(1, source.naturalHeight),
    }
  }

  return {
    width: Math.max(1, source.width),
    height: Math.max(1, source.height),
  }
}

export function drawRgbShift(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  shiftPx: number,
  colorFilter: string,
  time: number,
  opacity: number,
  mirror = false
) {
  if (shiftPx < 0.25) return

  const redOffset = Math.sin(time * 0.0042) * shiftPx
  const cyanOffset = -Math.cos(time * 0.0034) * shiftPx * 0.9
  const greenOffset = Math.sin(time * 0.0021 + 1.4) * shiftPx * 0.35
  const alpha = clamp(0.08 + shiftPx / 80, 0.08, 0.28) * opacity

  ctx.save()
  if (mirror) ctx.scale(-1, 1)
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = alpha
  ctx.filter = `${colorFilter} sepia(1) saturate(7) hue-rotate(-32deg)`
  ctx.drawImage(image, -width / 2 + redOffset, -height / 2, width, height)
  ctx.filter = `${colorFilter} sepia(1) saturate(8) hue-rotate(165deg)`
  ctx.drawImage(image, -width / 2 + cyanOffset, -height / 2, width, height)
  ctx.filter = `${colorFilter} sepia(1) saturate(6) hue-rotate(75deg)`
  ctx.globalAlpha = alpha * 0.55
  ctx.drawImage(image, -width / 2 + greenOffset, -height / 2, width, height)
  ctx.restore()
}

export function drawBandsGlitch(
  ctx: CanvasRenderingContext2D,
  image: RasterSource,
  width: number,
  height: number,
  glitchAmount: number,
  glitchFrequency: number,
  time: number,
  colorFilter: string,
  opacity: number,
  mirror = false,
  barThickness = 12,
  direction: GlitchDirection = 'horizontal'
) {
  const sourceSize = getRasterDimensions(image)
  const laneSize = direction === 'horizontal' ? height : width
  const safeThickness = clamp(barThickness, 1, Math.max(1, laneSize * 0.4))
  const spacing = Math.max(1.25, safeThickness * 1.08)
  const count = Math.max(4, Math.floor(laneSize / spacing))
  const phase = Math.floor(time * 0.018)
  ctx.save()
  if (mirror) ctx.scale(-1, 1)
  for (let i = 0; i < count; i++) {
    const seed = phase * 13.7 + i * 19.3
    const active = seededRandom(seed + 1.1)
    const threshold = clamp(0.9 - glitchFrequency * 0.68 - glitchAmount * 0.24, 0.12, 0.9)
    if (active < threshold) continue

    const shiftSign = seededRandom(seed + 6.3) > 0.5 ? 1 : -1
    const travelAxisSize = direction === 'horizontal' ? width : height
    const offsetMagnitude = travelAxisSize * (0.008 + glitchAmount * 0.085) * (0.35 + seededRandom(seed + 4.7) * 0.9)
    const offset = shiftSign * offsetMagnitude

    ctx.save()
    ctx.filter = colorFilter === 'none' ? 'none' : colorFilter
    ctx.globalAlpha = clamp((0.14 + glitchAmount * 0.32) * opacity, 0, 0.52)
    if (direction === 'horizontal') {
      const sliceHeight = Math.max(1, safeThickness * (0.92 + seededRandom(seed + 2.7) * 0.92))
      const y = clamp(-height / 2 + i * spacing, -height / 2, height / 2 - sliceHeight)
      const srcY = ((y + height / 2) / height) * sourceSize.height
      const srcH = Math.max(1, (sliceHeight / height) * sourceSize.height)
      ctx.drawImage(image, 0, srcY, sourceSize.width, srcH, -width / 2 + offset, y, width, sliceHeight)
    } else {
      const sliceWidth = Math.max(1, safeThickness * (0.92 + seededRandom(seed + 2.7) * 0.92))
      const x = clamp(-width / 2 + i * spacing, -width / 2, width / 2 - sliceWidth)
      const srcX = ((x + width / 2) / width) * sourceSize.width
      const srcW = Math.max(1, (sliceWidth / width) * sourceSize.width)
      ctx.drawImage(image, srcX, 0, srcW, sourceSize.height, x, -height / 2 + offset, sliceWidth, height)
    }
    ctx.restore()
  }
  ctx.restore()
}

export function drawBlocksGlitch(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  glitchAmount: number,
  glitchFrequency: number,
  time: number,
  colorFilter: string,
  opacity: number,
  mirror = false,
  barThickness = 12,
  direction: GlitchDirection = 'horizontal'
) {
  const count = Math.max(4, Math.floor(4 + glitchAmount * 12 * (0.45 + glitchFrequency)))
  ctx.save()
  if (mirror) ctx.scale(-1, 1)
  for (let i = 0; i < count; i++) {
    const seed = Math.floor(time * 0.016) * 9.3 + i * 27.1
    const active = seededRandom(seed + 1.3)
    if (active < clamp(0.85 - glitchFrequency * 0.58 - glitchAmount * 0.16, 0.22, 0.88)) continue

    const lane = clamp(barThickness, 6, 40)
    const boxW = direction === 'horizontal'
      ? Math.max(28, (0.09 + seededRandom(seed + 2.1) * 0.2) * width)
      : Math.max(6, lane * (1.1 + seededRandom(seed + 2.1) * 2.6))
    const boxH = direction === 'horizontal'
      ? Math.max(6, lane * (1.1 + seededRandom(seed + 3.7) * 2.6))
      : Math.max(28, (0.09 + seededRandom(seed + 3.7) * 0.2) * height)
    const x = -width / 2 + seededRandom(seed + 5.1) * Math.max(1, width - boxW)
    const y = -height / 2 + seededRandom(seed + 6.2) * Math.max(1, height - boxH)
    const srcX = ((x + width / 2) / width) * image.naturalWidth
    const srcY = ((y + height / 2) / height) * image.naturalHeight
    const srcW = Math.max(1, (boxW / width) * image.naturalWidth)
    const srcH = Math.max(1, (boxH / height) * image.naturalHeight)
    const travel = (direction === 'horizontal' ? width : height) * (0.012 + glitchAmount * 0.12)
    const signedOffset = (seededRandom(seed + 7.9) > 0.5 ? 1 : -1) * travel * (0.3 + seededRandom(seed + 8.8) * 0.9)
    const offsetX = direction === 'horizontal' ? signedOffset : 0
    const offsetY = direction === 'vertical' ? signedOffset : 0

    ctx.save()
    ctx.filter = colorFilter === 'none' ? 'none' : colorFilter
    ctx.globalAlpha = clamp((0.18 + glitchAmount * 0.3) * opacity, 0, 0.52)
    ctx.drawImage(image, srcX, srcY, srcW, srcH, x + offsetX, y + offsetY, boxW, boxH)
    ctx.restore()
  }
  ctx.restore()
}

export function drawPixelsGlitch(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  glitchAmount: number,
  glitchFrequency: number,
  time: number,
  colorFilter: string,
  opacity: number,
  mirror = false,
  barThickness = 12,
  direction: GlitchDirection = 'horizontal'
) {
  const count = Math.max(6, Math.floor(6 + glitchAmount * 14 * (0.45 + glitchFrequency)))
  ctx.save()
  if (mirror) ctx.scale(-1, 1)
  ctx.imageSmoothingEnabled = false
  for (let i = 0; i < count; i++) {
    const seed = Math.floor(time * 0.014) * 11.9 + i * 21.4
    if (seededRandom(seed + 0.6) < clamp(0.82 - glitchFrequency * 0.5 - glitchAmount * 0.14, 0.18, 0.86)) continue

    const cell = Math.max(3, Math.round(barThickness * 0.45))
    const boxW = direction === 'horizontal'
      ? cell * (4 + Math.floor(seededRandom(seed + 1.9) * 10))
      : cell * (2 + Math.floor(seededRandom(seed + 1.9) * 4))
    const boxH = direction === 'horizontal'
      ? cell * (2 + Math.floor(seededRandom(seed + 3.4) * 4))
      : cell * (4 + Math.floor(seededRandom(seed + 3.4) * 10))
    const x = -width / 2 + seededRandom(seed + 5.2) * Math.max(1, width - boxW)
    const y = -height / 2 + seededRandom(seed + 6.6) * Math.max(1, height - boxH)
    const srcX = ((x + width / 2) / width) * image.naturalWidth
    const srcY = ((y + height / 2) / height) * image.naturalHeight
    const srcW = Math.max(1, (boxW / width) * image.naturalWidth)
    const srcH = Math.max(1, (boxH / height) * image.naturalHeight)
    const travel = (direction === 'horizontal' ? width : height) * (0.014 + glitchAmount * 0.085)
    const signedOffset = (seededRandom(seed + 7.8) > 0.5 ? 1 : -1) * travel * (0.3 + seededRandom(seed + 8.2) * 0.85)
    const offsetX = direction === 'horizontal' ? signedOffset : 0
    const offsetY = direction === 'vertical' ? signedOffset : 0

    ctx.filter = colorFilter === 'none' ? 'none' : colorFilter
    ctx.globalAlpha = clamp((0.2 + glitchAmount * 0.28) * opacity, 0, 0.48)
    ctx.drawImage(image, srcX, srcY, srcW, srcH, x + offsetX, y + offsetY, boxW, boxH)
  }
  ctx.imageSmoothingEnabled = true
  ctx.restore()
}

export function drawFilmNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  noiseIntensity: number,
  time: number,
  opacity: number
) {
  if (noiseIntensity <= 0.001) return

  ctx.save()
  ctx.beginPath()
  ctx.rect(-width / 2, -height / 2, width, height)
  ctx.clip()

  const particleCount = Math.floor(Math.min(5600, (width * height) / 700) * noiseIntensity)
  for (let i = 0; i < particleCount; i++) {
    const seed = time * 0.01 + i * 13.17
    const x = -width / 2 + seededRandom(seed) * width
    const y = -height / 2 + seededRandom(seed + 2.2) * height
    const size = 1 + Math.floor(seededRandom(seed + 7.8) * 2)
    const toneBias = seededRandom(seed + 5.4)
    const tone = toneBias > 0.55
      ? 175 + Math.floor(toneBias * 80)
      : 25 + Math.floor(toneBias * 70)
    const alpha = (0.07 + seededRandom(seed + 9.1) * 0.28) * noiseIntensity * opacity
    ctx.fillStyle = `rgba(${tone}, ${tone}, ${tone}, ${alpha})`
    ctx.fillRect(x, y, size, size)
  }

  const scratchSeed = Math.floor(time * 0.003) * 7.7
  if (seededRandom(scratchSeed) > 0.28) {
    const x = -width / 2 + seededRandom(scratchSeed + 4.2) * width
    const scratchWidth = 1 + Math.floor(seededRandom(scratchSeed + 5.7) * 2)
    ctx.fillStyle = `rgba(255,255,255,${noiseIntensity * 0.16 * opacity})`
    ctx.fillRect(x, -height / 2, scratchWidth, height)
  }

  const bandSeed = Math.floor(time * 0.0046) * 9.1
  if (seededRandom(bandSeed + 1.3) > 0.42) {
    const bandY = -height / 2 + seededRandom(bandSeed + 2.7) * height
    const bandHeight = Math.max(2, height * (0.008 + seededRandom(bandSeed + 3.1) * 0.022))
    ctx.fillStyle = `rgba(255,255,255,${noiseIntensity * 0.12 * opacity})`
    ctx.fillRect(-width / 2, bandY, width, bandHeight)
  }

  const shadowBandSeed = Math.floor(time * 0.0052) * 11.3
  if (seededRandom(shadowBandSeed + 0.8) > 0.48) {
    const bandY = -height / 2 + seededRandom(shadowBandSeed + 1.9) * height
    const bandHeight = Math.max(2, height * (0.006 + seededRandom(shadowBandSeed + 3.8) * 0.018))
    ctx.fillStyle = `rgba(0,0,0,${noiseIntensity * 0.09 * opacity})`
    ctx.fillRect(-width / 2, bandY, width, bandHeight)
  }

  ctx.restore()
}

export function getScanlineAmount(mode: string, intensity: number, time: number, amplitude: number): number {
  if (mode === 'pulse') {
    return intensity * (0.45 + 0.55 * (Math.sin(time * 0.0026) * 0.5 + 0.5))
  }
  if (mode === 'burst') {
    return intensity * (0.25 + seededRandom(Math.floor(time * 0.002) + 11.0) * 1.1)
  }
  if (mode === 'beat') {
    return intensity * (0.35 + Math.min(1.5, amplitude * 1.25))
  }
  return intensity
}

export function drawScanlines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  amount: number,
  spacingValue: number,
  thicknessValue: number,
  opacity: number
) {
  if (amount <= 0.001) return

  const lineCount = Math.max(18, spacingValue / 4)
  const spacing = Math.max(2, height / lineCount)
  const thickness = Math.max(1, thicknessValue * 1.7)

  ctx.save()
  ctx.beginPath()
  ctx.rect(-width / 2, -height / 2, width, height)
  ctx.clip()

  for (let y = -height / 2; y < height / 2; y += spacing) {
    ctx.fillStyle = `rgba(0, 0, 0, ${clamp(amount * 0.78 * opacity, 0, 0.82)})`
    ctx.fillRect(-width / 2, y, width, thickness)
    ctx.fillStyle = `rgba(255, 255, 255, ${clamp(amount * 0.12 * opacity, 0, 0.2)})`
    ctx.fillRect(-width / 2, y + thickness, width, 1)
  }

  ctx.restore()
}

export function applySoftEdgeMask(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fadeRatio: number
) {
  const fadeX = Math.min(width / 2, Math.max(0, width * fadeRatio))
  const fadeY = Math.min(height / 2, Math.max(0, height * fadeRatio))

  if (fadeX <= 0.5 && fadeY <= 0.5) return

  ctx.save()
  ctx.globalCompositeOperation = 'destination-in'

  if (fadeX > 0.5) {
    const left = ctx.createLinearGradient(-width / 2, 0, -width / 2 + fadeX, 0)
    left.addColorStop(0, 'rgba(255,255,255,0)')
    left.addColorStop(1, 'rgba(255,255,255,1)')
    ctx.fillStyle = left
    ctx.fillRect(-width / 2, -height / 2, fadeX, height)

    const centerWidth = Math.max(0, width - fadeX * 2)
    if (centerWidth > 0) {
      ctx.fillStyle = 'rgba(255,255,255,1)'
      ctx.fillRect(-width / 2 + fadeX, -height / 2, centerWidth, height)
    }

    const right = ctx.createLinearGradient(width / 2 - fadeX, 0, width / 2, 0)
    right.addColorStop(0, 'rgba(255,255,255,1)')
    right.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = right
    ctx.fillRect(width / 2 - fadeX, -height / 2, fadeX, height)
  }

  if (fadeY > 0.5) {
    const top = ctx.createLinearGradient(0, -height / 2, 0, -height / 2 + fadeY)
    top.addColorStop(0, 'rgba(255,255,255,0)')
    top.addColorStop(1, 'rgba(255,255,255,1)')
    ctx.fillStyle = top
    ctx.fillRect(-width / 2, -height / 2, width, fadeY)

    const centerHeight = Math.max(0, height - fadeY * 2)
    if (centerHeight > 0) {
      ctx.fillStyle = 'rgba(255,255,255,1)'
      ctx.fillRect(-width / 2, -height / 2 + fadeY, width, centerHeight)
    }

    const bottom = ctx.createLinearGradient(0, height / 2 - fadeY, 0, height / 2)
    bottom.addColorStop(0, 'rgba(255,255,255,1)')
    bottom.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = bottom
    ctx.fillRect(-width / 2, height / 2 - fadeY, width, fadeY)
  }

  ctx.restore()
}

export function applyOverlayShapeClip(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  shape: OverlayImageLayer['cropShape']
) {
  ctx.beginPath()
  if (shape === 'circle') {
    ctx.arc(0, 0, Math.min(width, height) * 0.5, 0, Math.PI * 2)
  } else if (shape === 'rounded') {
    const radius = Math.max(10, Math.min(width, height) * 0.12)
    ctx.roundRect(-width / 2, -height / 2, width, height, radius)
  } else if (shape === 'diamond') {
    ctx.moveTo(0, -height / 2)
    ctx.lineTo(width / 2, 0)
    ctx.lineTo(0, height / 2)
    ctx.lineTo(-width / 2, 0)
    ctx.closePath()
  } else {
    ctx.rect(-width / 2, -height / 2, width, height)
  }
  ctx.clip()
}

export function drawOverlayGlow(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  glow: number,
  opacity: number
) {
  if (glow <= 0.001) return

  ctx.save()
  ctx.globalAlpha = clamp(opacity * glow * 0.22, 0, 0.25)
  ctx.shadowColor = 'rgba(255,255,255,0.75)'
  ctx.shadowBlur = 12 + glow * 40
  ctx.drawImage(image, -width / 2, -height / 2, width, height)
  ctx.restore()
}
