import { clamp } from '@/lib/math'
import type { OverlayImageLayer } from '@/types/layers'

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
  const alpha = clamp(0.035 + shiftPx / 180, 0.035, 0.14) * opacity

  ctx.save()
  if (mirror) ctx.scale(-1, 1)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = alpha
  ctx.filter = `${colorFilter} saturate(1.18) hue-rotate(-20deg)`
  ctx.drawImage(image, -width / 2 + redOffset, -height / 2, width, height)
  ctx.filter = `${colorFilter} saturate(1.18) hue-rotate(170deg)`
  ctx.drawImage(image, -width / 2 + cyanOffset, -height / 2, width, height)
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
