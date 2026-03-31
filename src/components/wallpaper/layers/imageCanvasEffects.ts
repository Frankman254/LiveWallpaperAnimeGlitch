import { clamp } from '@/lib/math'
import type { OverlayImageLayer } from '@/types/layers'

export function seededRandom(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1 + 311.7)) % 1
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
  image: HTMLImageElement,
  width: number,
  height: number,
  glitchAmount: number,
  glitchFrequency: number,
  time: number,
  colorFilter: string,
  opacity: number,
  mirror = false
) {
  const count = Math.max(2, Math.floor(3 + glitchAmount * 12 * (0.5 + glitchFrequency)))
  ctx.save()
  if (mirror) ctx.scale(-1, 1)
  for (let i = 0; i < count; i++) {
    const seed = Math.floor(time * 0.018) * 13.7 + i * 19.3
    const active = seededRandom(seed + 1.1)
    if (active < 1 - glitchFrequency * 0.85) continue

    const sliceHeight = Math.max(10, (0.03 + seededRandom(seed + 2.7) * 0.09) * height)
    const y = -height / 2 + seededRandom(seed + 3.9) * (height - sliceHeight)
    const srcY = ((y + height / 2) / height) * image.naturalHeight
    const srcH = Math.max(1, (sliceHeight / height) * image.naturalHeight)
    const offset = (seededRandom(seed + 4.7) - 0.5) * width * (0.05 + glitchAmount * 0.18)

    ctx.save()
    ctx.filter = colorFilter
    ctx.globalAlpha = clamp((0.12 + glitchAmount * 0.4) * opacity, 0, 0.55)
    ctx.drawImage(image, 0, srcY, image.naturalWidth, srcH, -width / 2 + offset, y, width, sliceHeight)
    ctx.filter = `${colorFilter} sepia(1) saturate(5) hue-rotate(-20deg)`
    ctx.globalAlpha *= 0.65
    ctx.drawImage(image, 0, srcY, image.naturalWidth, srcH, -width / 2 + offset + 10, y, width, sliceHeight)
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
  mirror = false
) {
  const count = Math.max(2, Math.floor(3 + glitchAmount * 10 * (0.5 + glitchFrequency)))
  ctx.save()
  if (mirror) ctx.scale(-1, 1)
  for (let i = 0; i < count; i++) {
    const seed = Math.floor(time * 0.016) * 9.3 + i * 27.1
    const active = seededRandom(seed + 1.3)
    if (active < 1 - glitchFrequency * 0.8) continue

    const boxW = Math.max(16, (0.05 + seededRandom(seed + 2.1) * 0.16) * width)
    const boxH = Math.max(12, (0.04 + seededRandom(seed + 3.7) * 0.12) * height)
    const x = -width / 2 + seededRandom(seed + 5.1) * (width - boxW)
    const y = -height / 2 + seededRandom(seed + 6.2) * (height - boxH)
    const srcX = ((x + width / 2) / width) * image.naturalWidth
    const srcY = ((y + height / 2) / height) * image.naturalHeight
    const srcW = Math.max(1, (boxW / width) * image.naturalWidth)
    const srcH = Math.max(1, (boxH / height) * image.naturalHeight)
    const offsetX = (seededRandom(seed + 7.9) - 0.5) * width * (0.04 + glitchAmount * 0.12)
    const offsetY = (seededRandom(seed + 8.8) - 0.5) * height * (0.01 + glitchAmount * 0.04)

    ctx.save()
    ctx.filter = colorFilter
    ctx.globalAlpha = clamp((0.15 + glitchAmount * 0.32) * opacity, 0, 0.48)
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
  mirror = false
) {
  const count = Math.max(2, Math.floor(2 + glitchAmount * 8 * (0.4 + glitchFrequency)))
  ctx.save()
  if (mirror) ctx.scale(-1, 1)
  ctx.imageSmoothingEnabled = false
  for (let i = 0; i < count; i++) {
    const seed = Math.floor(time * 0.014) * 11.9 + i * 21.4
    if (seededRandom(seed + 0.6) < 1 - glitchFrequency * 0.75) continue

    const cell = Math.max(6, 18 - glitchAmount * 8)
    const boxW = cell * (2 + Math.floor(seededRandom(seed + 1.9) * 8))
    const boxH = cell * (2 + Math.floor(seededRandom(seed + 3.4) * 6))
    const x = -width / 2 + seededRandom(seed + 5.2) * (width - boxW)
    const y = -height / 2 + seededRandom(seed + 6.6) * (height - boxH)
    const srcX = ((x + width / 2) / width) * image.naturalWidth
    const srcY = ((y + height / 2) / height) * image.naturalHeight
    const srcW = Math.max(1, (boxW / width) * image.naturalWidth)
    const srcH = Math.max(1, (boxH / height) * image.naturalHeight)
    const offset = (seededRandom(seed + 7.8) - 0.5) * width * (0.03 + glitchAmount * 0.09)

    ctx.filter = colorFilter
    ctx.globalAlpha = clamp((0.16 + glitchAmount * 0.3) * opacity, 0, 0.42)
    ctx.drawImage(image, srcX, srcY, srcW, srcH, x + offset, y, boxW, boxH)
  }
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

  const particleCount = Math.floor(Math.min(2200, (width * height) / 1400) * noiseIntensity)
  for (let i = 0; i < particleCount; i++) {
    const seed = time * 0.01 + i * 13.17
    const x = -width / 2 + seededRandom(seed) * width
    const y = -height / 2 + seededRandom(seed + 2.2) * height
    const size = 1 + Math.floor(seededRandom(seed + 7.8) * 2)
    const tone = 170 + Math.floor(seededRandom(seed + 5.4) * 85)
    const alpha = seededRandom(seed + 9.1) * noiseIntensity * 0.16 * opacity
    ctx.fillStyle = `rgba(${tone}, ${tone}, ${tone}, ${alpha})`
    ctx.fillRect(x, y, size, size)
  }

  const scratchSeed = Math.floor(time * 0.003) * 7.7
  if (seededRandom(scratchSeed) > 0.5) {
    const x = -width / 2 + seededRandom(scratchSeed + 4.2) * width
    ctx.fillStyle = `rgba(255,255,255,${noiseIntensity * 0.05 * opacity})`
    ctx.fillRect(x, -height / 2, 1, height)
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
