import type { WallpaperState } from '@/types/wallpaper'
import { createAudioEnvelope } from '@/utils/audioEnvelope'

type LogoSettings = Pick<
  WallpaperState,
  | 'logoUrl'
  | 'logoBaseSize'
  | 'logoPositionX'
  | 'logoPositionY'
  | 'logoBandMode'
  | 'logoAudioSmoothingEnabled'
  | 'logoAudioSmoothing'
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

// Single envelope instance — encapsulates all per-frame smoothing state
const logoEnvelope = createAudioEnvelope()

interface LogoRenderState {
  scale: number
  normalizedAmplitude: number
  smoothedAmplitude: number
  adaptivePeak: number
  adaptiveFloor: number
}

function getImage(url: string): HTMLImageElement | null {
  if (cachedLogoUrl === url && cachedImg) return cachedImg
  const img = new Image()
  img.src = url
  cachedLogoUrl = url
  cachedImg = img
  return img.complete ? img : null
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

  const envelopeState = logoEnvelope.tick(amplitude, dt, {
    attack: settings.logoAttack,
    release: settings.logoRelease,
    responseSpeed: settings.logoReactivitySpeed * 2.4,
    peakWindow: settings.logoPeakWindow,
    peakFloor: settings.logoPeakFloor,
    punch: settings.logoPunch,
    scaleIntensity: settings.logoReactiveScaleIntensity,
    min: settings.logoMinScale,
    max: settings.logoMaxScale,
  })

  const scale = envelopeState.value
  const { normalizedAmplitude } = envelopeState
  const size = logoBaseSize * scale

  const cx = canvas.width / 2 + logoPositionX * canvas.width * 0.5
  const cy = canvas.height / 2 - logoPositionY * canvas.height * 0.5

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
  ctx.shadowBlur = logoGlowBlur * (1 + normalizedAmplitude * 2.6)
  ctx.shadowColor = logoGlowColor
  ctx.strokeStyle = logoGlowColor
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.42 + normalizedAmplitude * 0.58
  ctx.beginPath()
  ctx.arc(cx, cy, size / 2 + (logoBackdropEnabled ? logoBackdropPadding : 0), 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  if (!logoUrl) return

  const img = getImage(logoUrl)
  if (!img || !img.complete || img.naturalWidth === 0) return

  ctx.save()
  if (logoShadowEnabled) {
    ctx.shadowBlur = logoShadowBlur * (1 + normalizedAmplitude * 1.8)
    ctx.shadowColor = logoShadowColor
  }
  ctx.globalAlpha = 1
  ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size)
  ctx.restore()
}

export function getSmoothedAmplitude(): number {
  return logoEnvelope.getState().smoothedAmplitude
}

export function getLogoRenderState(): LogoRenderState {
  const s = logoEnvelope.getState()
  return {
    scale: s.value,
    normalizedAmplitude: s.normalizedAmplitude,
    smoothedAmplitude: s.smoothedAmplitude,
    adaptivePeak: s.adaptivePeak,
    adaptiveFloor: s.adaptiveFloor,
  }
}

export function resetLogo(): void {
  logoEnvelope.reset()
}
