import type { WallpaperState } from '@/types/wallpaper'

type LogoSettings = Pick<
  WallpaperState,
  | 'logoUrl'
  | 'logoBaseSize'
  | 'logoPositionX'
  | 'logoPositionY'
  | 'logoBandMode'
  | 'logoReactiveScaleIntensity'
  | 'logoReactivitySpeed'
  | 'logoAttack'
  | 'logoRelease'
  | 'logoMinScale'
  | 'logoMaxScale'
  | 'logoPunch'
  | 'logoPeakWindow'
  | 'logoPeakFloor'
  | 'logoGlowColor'
  | 'logoGlowBlur'
  | 'logoShadowEnabled'
  | 'logoShadowColor'
  | 'logoShadowBlur'
  | 'logoBackdropEnabled'
  | 'logoBackdropColor'
  | 'logoBackdropOpacity'
  | 'logoBackdropPadding'
>

// Cached image element
let cachedLogoUrl: string | null = null
let cachedImg: HTMLImageElement | null = null
let smoothedAmplitude = 0
let lastAmplitude = 0
let adaptivePeak = 0.35
let adaptiveFloor = 0
let renderedScale = 1

interface LogoRenderState {
  scale: number
  normalizedAmplitude: number
  smoothedAmplitude: number
  adaptivePeak: number
  adaptiveFloor: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getImage(url: string): HTMLImageElement | null {
  if (cachedLogoUrl === url && cachedImg) return cachedImg
  const img = new Image()
  img.src = url
  cachedLogoUrl = url
  cachedImg = img
  return img.complete ? img : null
}

function resolveLogoState(
  amplitude: number,
  dt: number,
  settings: LogoSettings
): LogoRenderState {
  const responseSpeed = Math.max(0.2, settings.logoReactivitySpeed * 2.4)
  const attack = Math.max(0.05, settings.logoAttack ?? settings.logoReactivitySpeed)
  const release = Math.max(0.01, settings.logoRelease ?? (settings.logoReactivitySpeed * 0.2))
  const peakWindow = Math.max(0.45, settings.logoPeakWindow ?? 2.4)
  const peakFloor = clamp(settings.logoPeakFloor ?? 0.18, 0, 0.75)
  const safeDt = Math.max(dt, 1 / 120)
  const riseStep = 1 - Math.exp(-(3 + attack * 14) * responseSpeed * safeDt)
  const fallStep = 1 - Math.exp(-(0.8 + release * 16) * responseSpeed * safeDt)

  if (amplitude > smoothedAmplitude) {
    smoothedAmplitude += (amplitude - smoothedAmplitude) * riseStep
  } else {
    smoothedAmplitude += (amplitude - smoothedAmplitude) * fallStep
  }

  const peakDecay = Math.exp(-safeDt / peakWindow)
  adaptivePeak = Math.max(smoothedAmplitude, adaptivePeak * peakDecay, 0.16)

  const floorTarget = smoothedAmplitude * peakFloor
  const floorRiseStep = 1 - Math.exp(-(0.35 + release * 8) * safeDt)
  const floorDropStep = 1 - Math.exp(-(2.2 + attack * 10) * safeDt)
  if (floorTarget > adaptiveFloor) {
    adaptiveFloor += (floorTarget - adaptiveFloor) * floorRiseStep
  } else {
    adaptiveFloor += (floorTarget - adaptiveFloor) * floorDropStep
  }

  const usableRange = Math.max(0.08, adaptivePeak - adaptiveFloor)
  const normalizedAmplitude = clamp((smoothedAmplitude - adaptiveFloor) / usableRange, 0, 1)
  const transient = Math.max(0, amplitude - lastAmplitude)
  lastAmplitude = amplitude
  const reactiveScale = clamp(settings.logoReactiveScaleIntensity, 0.01, 2.5)

  const excitedAmplitude = clamp(
    normalizedAmplitude * (0.12 + reactiveScale * 0.88) +
      transient * Math.max(0, settings.logoPunch) * 0.65,
    0,
    1.2
  )
  const targetScale = clamp(
    settings.logoMinScale +
      (settings.logoMaxScale - settings.logoMinScale) * clamp(excitedAmplitude, 0, 1),
    settings.logoMinScale,
    settings.logoMaxScale
  )
  const scaleFollowStep = targetScale > renderedScale ? riseStep : fallStep
  renderedScale += (targetScale - renderedScale) * scaleFollowStep
  renderedScale = clamp(renderedScale, settings.logoMinScale, settings.logoMaxScale)

  return {
    scale: renderedScale,
    normalizedAmplitude,
    smoothedAmplitude,
    adaptivePeak,
    adaptiveFloor,
  }
}

export function drawLogo(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  amplitude: number,
  dt: number,
  settings: LogoSettings
): void {
  const {
    logoUrl,
    logoBaseSize,
    logoPositionX,
    logoPositionY,
    logoGlowColor,
    logoGlowBlur,
    logoShadowEnabled,
    logoShadowColor,
    logoShadowBlur,
    logoBackdropEnabled,
    logoBackdropColor,
    logoBackdropOpacity,
    logoBackdropPadding,
  } = settings

  const cx = canvas.width / 2 + logoPositionX * canvas.width * 0.5
  const cy = canvas.height / 2 - logoPositionY * canvas.height * 0.5

  const logoState = resolveLogoState(amplitude, dt, settings)
  const scale = logoState.scale
  const size = logoBaseSize * scale

  // Backdrop circle
  if (logoBackdropEnabled) {
    const r = size / 2 + logoBackdropPadding
    ctx.save()
    ctx.globalAlpha = logoBackdropOpacity
    ctx.fillStyle = logoBackdropColor
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Glow ring
  ctx.save()
  ctx.shadowBlur = logoGlowBlur * (1 + logoState.normalizedAmplitude * 2.6)
  ctx.shadowColor = logoGlowColor
  ctx.strokeStyle = logoGlowColor
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.42 + logoState.normalizedAmplitude * 0.58
  ctx.beginPath()
  ctx.arc(cx, cy, size / 2 + (logoBackdropEnabled ? logoBackdropPadding : 0), 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  if (!logoUrl) return

  const img = getImage(logoUrl)
  if (!img || !img.complete || img.naturalWidth === 0) return

  ctx.save()
  if (logoShadowEnabled) {
    ctx.shadowBlur = logoShadowBlur * (1 + logoState.normalizedAmplitude * 1.8)
    ctx.shadowColor = logoShadowColor
  }
  ctx.globalAlpha = 1
  ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size)
  ctx.restore()
}

export function getSmoothedAmplitude(): number {
  return smoothedAmplitude
}

export function getLogoRenderState(): LogoRenderState {
  return {
    scale: renderedScale,
    normalizedAmplitude: clamp((smoothedAmplitude - adaptiveFloor) / Math.max(0.08, adaptivePeak - adaptiveFloor), 0, 1),
    smoothedAmplitude,
    adaptivePeak,
    adaptiveFloor,
  }
}

export function resetLogo(): void {
  smoothedAmplitude = 0
  lastAmplitude = 0
  adaptivePeak = 0.35
  adaptiveFloor = 0
  renderedScale = 1
}
