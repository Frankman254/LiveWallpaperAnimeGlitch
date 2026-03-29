import type { WallpaperState } from '@/types/wallpaper'

type LogoSettings = Pick<
  WallpaperState,
  | 'logoUrl'
  | 'logoBaseSize'
  | 'logoReactiveScaleIntensity'
  | 'logoReactivitySpeed'
  | 'logoAttack'
  | 'logoRelease'
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
  settings: LogoSettings
): void {
  const {
    logoUrl,
    logoBaseSize,
    logoReactiveScaleIntensity,
    logoReactivitySpeed,
    logoAttack,
    logoRelease,
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

  const cx = canvas.width / 2
  const cy = canvas.height / 2

  // Separate attack (fast follow on loud beat) and release (slow decay after beat drops).
  // Falls back to logoReactivitySpeed if the new fields are somehow missing.
  const attack = Math.max(0.01, Math.min(1, logoAttack ?? logoReactivitySpeed))
  const release = Math.max(0.005, Math.min(1, logoRelease ?? (logoReactivitySpeed * 0.2)))
  if (amplitude > smoothedAmplitude) {
    smoothedAmplitude += (amplitude - smoothedAmplitude) * attack
  } else {
    smoothedAmplitude += (amplitude - smoothedAmplitude) * release
  }
  const scale = 1 + smoothedAmplitude * logoReactiveScaleIntensity
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
  ctx.shadowBlur = logoGlowBlur * (1 + smoothedAmplitude * 2)
  ctx.shadowColor = logoGlowColor
  ctx.strokeStyle = logoGlowColor
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.5 + smoothedAmplitude * 0.5
  ctx.beginPath()
  ctx.arc(cx, cy, size / 2 + (logoBackdropEnabled ? logoBackdropPadding : 0), 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  if (!logoUrl) return

  const img = getImage(logoUrl)
  if (!img || !img.complete || img.naturalWidth === 0) return

  ctx.save()
  if (logoShadowEnabled) {
    ctx.shadowBlur = logoShadowBlur * (1 + smoothedAmplitude * 1.5)
    ctx.shadowColor = logoShadowColor
  }
  ctx.globalAlpha = 1
  ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size)
  ctx.restore()
}

export function getSmoothedAmplitude(): number {
  return smoothedAmplitude
}

export function resetLogo(): void {
  smoothedAmplitude = 0
}
