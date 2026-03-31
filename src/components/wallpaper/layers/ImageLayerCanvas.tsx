import { useEffect, useRef, useState } from 'react'
import { clamp, lerp } from '@/lib/math'
import { useAudioData } from '@/hooks/useAudioData'
import { useWallpaperStore } from '@/store/wallpaperStore'
import type { BackgroundImageLayer, OverlayImageLayer } from '@/types/layers'

type ImageLayer = BackgroundImageLayer | OverlayImageLayer
type BackgroundImageSnapshot = Pick<BackgroundImageLayer, 'scale' | 'positionX' | 'positionY' | 'fitMode'>

const imageCache = new Map<string, HTMLImageElement>()

function seededRandom(seed: number): number {
  return Math.abs(Math.sin(seed * 127.1 + 311.7)) % 1
}

function getCachedImage(url: string, onReady: (image: HTMLImageElement) => void): HTMLImageElement {
  const cached = imageCache.get(url)
  if (cached) {
    if (cached.complete && cached.naturalWidth > 0) onReady(cached)
    else cached.onload = () => onReady(cached)
    return cached
  }

  const image = new Image()
  image.decoding = 'async'
  image.src = url
  image.onload = () => onReady(image)
  imageCache.set(url, image)
  return image
}

function getBackgroundBaseSize(
  canvasWidth: number,
  canvasHeight: number,
  imageWidth: number,
  imageHeight: number,
  fitMode: BackgroundImageLayer['fitMode']
): { width: number; height: number } {
  const imageAspect = imageWidth / Math.max(imageHeight, 1)
  const canvasAspect = canvasWidth / Math.max(canvasHeight, 1)

  if (fitMode === 'stretch') {
    return { width: canvasWidth, height: canvasHeight }
  }

  if (fitMode === 'fit-width') {
    return { width: canvasWidth, height: canvasWidth / Math.max(imageAspect, 0.001) }
  }

  if (fitMode === 'fit-height') {
    return { width: canvasHeight * imageAspect, height: canvasHeight }
  }

  if (fitMode === 'contain') {
    if (canvasAspect > imageAspect) {
      return { width: canvasHeight * imageAspect, height: canvasHeight }
    }
    return { width: canvasWidth, height: canvasWidth / Math.max(imageAspect, 0.001) }
  }

  if (canvasAspect > imageAspect) {
    return { width: canvasWidth, height: canvasWidth / Math.max(imageAspect, 0.001) }
  }
  return { width: canvasHeight * imageAspect, height: canvasHeight }
}

function getLayerRect(
  layer: ImageLayer,
  canvasWidth: number,
  canvasHeight: number,
  image: HTMLImageElement,
  bassBoost: number,
  parallaxX: number,
  parallaxY: number
): { cx: number; cy: number; width: number; height: number } {
  if (layer.type === 'background-image') {
    const base = getBackgroundBaseSize(
      canvasWidth,
      canvasHeight,
      image.naturalWidth || canvasWidth,
      image.naturalHeight || canvasHeight,
      layer.fitMode
    )

    const scale = Math.max(0.01, layer.scale + bassBoost)
    return {
      cx: canvasWidth / 2 + layer.positionX * canvasWidth * 0.5 + parallaxX,
      cy: canvasHeight / 2 - layer.positionY * canvasHeight * 0.5 + parallaxY,
      width: base.width * scale,
      height: base.height * scale,
    }
  }

  return {
    cx: canvasWidth / 2 + layer.positionX * canvasWidth,
    cy: canvasHeight / 2 - layer.positionY * canvasHeight,
    width: layer.width * layer.scale,
    height: layer.height * layer.scale,
  }
}

function getBackgroundRectFromSnapshot(
  canvasWidth: number,
  canvasHeight: number,
  image: HTMLImageElement,
  snapshot: BackgroundImageSnapshot,
  bassBoost: number,
  parallaxX: number,
  parallaxY: number
): { cx: number; cy: number; width: number; height: number } {
  const base = getBackgroundBaseSize(
    canvasWidth,
    canvasHeight,
    image.naturalWidth || canvasWidth,
    image.naturalHeight || canvasHeight,
    snapshot.fitMode
  )

  const scale = Math.max(0.01, snapshot.scale + bassBoost)
  return {
    cx: canvasWidth / 2 + snapshot.positionX * canvasWidth * 0.5 + parallaxX,
    cy: canvasHeight / 2 - snapshot.positionY * canvasHeight * 0.5 + parallaxY,
    width: base.width * scale,
    height: base.height * scale,
  }
}

function targetMatches(layer: ImageLayer, filterTarget: string, selectedOverlayId: string | null): boolean {
  if (filterTarget === 'all-images') return true
  if (filterTarget === 'background') return layer.type === 'background-image'
  return layer.type === 'overlay-image' && layer.id === selectedOverlayId
}

function drawRgbShift(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  shiftPx: number,
  colorFilter: string,
  time: number,
  opacity: number
) {
  if (shiftPx < 0.25) return

  const redOffset = Math.sin(time * 0.0042) * shiftPx
  const cyanOffset = -Math.cos(time * 0.0034) * shiftPx * 0.9
  const greenOffset = Math.sin(time * 0.0021 + 1.4) * shiftPx * 0.35
  const alpha = clamp(0.08 + shiftPx / 80, 0.08, 0.28) * opacity

  ctx.save()
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

function drawBandsGlitch(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  glitchAmount: number,
  glitchFrequency: number,
  time: number,
  colorFilter: string,
  opacity: number
) {
  const count = Math.max(2, Math.floor(3 + glitchAmount * 12 * (0.5 + glitchFrequency)))
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
}

function drawBlocksGlitch(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  glitchAmount: number,
  glitchFrequency: number,
  time: number,
  colorFilter: string,
  opacity: number
) {
  const count = Math.max(2, Math.floor(3 + glitchAmount * 10 * (0.5 + glitchFrequency)))
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
}

function drawPixelsGlitch(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  glitchAmount: number,
  glitchFrequency: number,
  time: number,
  colorFilter: string,
  opacity: number
) {
  const count = Math.max(2, Math.floor(2 + glitchAmount * 8 * (0.4 + glitchFrequency)))
  ctx.save()
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

function drawFilmNoise(
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

function getScanlineAmount(mode: string, intensity: number, time: number, amplitude: number): number {
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

function drawScanlines(
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

function applySoftEdgeMask(
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

function applyOverlayShapeClip(
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

function drawOverlayGlow(
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

function getCanvasBlendMode(layer: ImageLayer): React.CSSProperties['mixBlendMode'] {
  if (layer.type !== 'overlay-image') return 'normal'
  if (layer.blendMode === 'screen') return 'screen'
  if (layer.blendMode === 'lighten') return 'lighten'
  if (layer.blendMode === 'multiply') return 'multiply'
  return 'normal'
}

export default function ImageLayerCanvas({ layer }: { layer: ImageLayer }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const mouseRef = useRef({ x: 0, y: 0 })
  const smoothedMouseRef = useRef({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement | null>(null)
  const loadedImageUrlRef = useRef<string | null>(null)
  const previousBackgroundImageRef = useRef<HTMLImageElement | null>(null)
  const previousBackgroundParamsRef = useRef<BackgroundImageSnapshot>({
    scale: layer.type === 'background-image' ? layer.scale : 1,
    positionX: layer.type === 'background-image' ? layer.positionX : 0,
    positionY: layer.type === 'background-image' ? layer.positionY : 0,
    fitMode: layer.type === 'background-image' ? layer.fitMode : 'cover',
  })
  const renderedBackgroundParamsRef = useRef<BackgroundImageSnapshot>({
    scale: layer.type === 'background-image' ? layer.scale : 1,
    positionX: layer.type === 'background-image' ? layer.positionX : 0,
    positionY: layer.type === 'background-image' ? layer.positionY : 0,
    fitMode: layer.type === 'background-image' ? layer.fitMode : 'cover',
  })
  const currentRequestedBackgroundUrlRef = useRef<string | null>(layer.type === 'background-image' ? layer.imageUrl : null)
  const transitionStartRef = useRef<number | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const { getBands, getAmplitude } = useAudioData()

  useEffect(() => {
    if (!layer.imageUrl) {
      setImage(null)
      imageRef.current = null
      loadedImageUrlRef.current = null
      previousBackgroundImageRef.current = null
      transitionStartRef.current = null
      return
    }

    if (layer.type === 'background-image' && currentRequestedBackgroundUrlRef.current && currentRequestedBackgroundUrlRef.current !== layer.imageUrl) {
      if (imageRef.current && loadedImageUrlRef.current === currentRequestedBackgroundUrlRef.current) {
        previousBackgroundImageRef.current = imageRef.current
        previousBackgroundParamsRef.current = renderedBackgroundParamsRef.current
      }
      transitionStartRef.current = null
    }

    currentRequestedBackgroundUrlRef.current = layer.type === 'background-image' ? layer.imageUrl : currentRequestedBackgroundUrlRef.current

    const requestedUrl = layer.imageUrl
    const nextImage = getCachedImage(requestedUrl, (loadedImage) => {
      if (layer.type === 'background-image' && currentRequestedBackgroundUrlRef.current !== requestedUrl) return
      if (layer.type === 'background-image' && previousBackgroundImageRef.current && loadedImageUrlRef.current !== requestedUrl) {
        transitionStartRef.current = performance.now()
      }
      imageRef.current = loadedImage
      loadedImageUrlRef.current = requestedUrl
      setImage(loadedImage)
    })
    if (nextImage.complete && nextImage.naturalWidth > 0) {
      if (layer.type === 'background-image' && previousBackgroundImageRef.current && loadedImageUrlRef.current !== requestedUrl) {
        transitionStartRef.current = performance.now()
      }
      imageRef.current = nextImage
      loadedImageUrlRef.current = requestedUrl
      setImage(nextImage)
    }
  }, [layer.imageUrl])

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const canRenderBackgroundFallback = layer.type === 'background-image' && Boolean(imageRef.current || previousBackgroundImageRef.current)
    if (!canvas || (!image && !canRenderBackgroundFallback)) return
    const context = canvas.getContext('2d')
    if (context === null) return
    const ctx = context
    const loadedImage = imageRef.current ?? image

    function resize() {
      const currentCanvas = canvasRef.current
      if (!currentCanvas) return
      currentCanvas.width = window.innerWidth
      currentCanvas.height = window.innerHeight
    }

    resize()
    window.addEventListener('resize', resize)

    function frame(time: number) {
      const currentCanvas = canvasRef.current
      if (!currentCanvas) return

      if (currentCanvas.width !== window.innerWidth || currentCanvas.height !== window.innerHeight) {
        currentCanvas.width = window.innerWidth
        currentCanvas.height = window.innerHeight
      }

      const state = useWallpaperStore.getState()
      const filterActive = targetMatches(layer, state.filterTarget, state.selectedOverlayId)
      const amplitude = getAmplitude()
      const bass = getBands().bass

      smoothedMouseRef.current.x = lerp(smoothedMouseRef.current.x, mouseRef.current.x, 0.05)
      smoothedMouseRef.current.y = lerp(smoothedMouseRef.current.y, mouseRef.current.y, 0.05)

      const parallaxX = layer.type === 'background-image'
        ? smoothedMouseRef.current.x * state.parallaxStrength * currentCanvas.width * 0.08
        : 0
      const parallaxY = layer.type === 'background-image'
        ? smoothedMouseRef.current.y * state.parallaxStrength * currentCanvas.height * 0.08
        : 0

      const bassBoost = layer.type === 'background-image' && layer.audioReactiveConfig?.enabled
        ? bass * (layer.audioReactiveConfig.sensitivity ?? 0)
        : 0

      const rect = loadedImage
        ? getLayerRect(
            layer,
            currentCanvas.width,
            currentCanvas.height,
            loadedImage,
            bassBoost,
            parallaxX,
            -parallaxY
          )
        : null

      ctx.clearRect(0, 0, currentCanvas.width, currentCanvas.height)

      const brightness = filterActive ? state.filterBrightness : 1
      const contrast = filterActive ? state.filterContrast : 1
      const saturation = filterActive ? state.filterSaturation : 1
      const blur = filterActive ? state.filterBlur : 0
      const hue = filterActive ? state.filterHueRotate : 0
      const overlayBlur = layer.type === 'overlay-image' ? layer.edgeBlur : 0
      const totalBlur = blur + overlayBlur
      const baseFilter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) blur(${totalBlur}px) hue-rotate(${hue}deg)`
      const colorFilter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) hue-rotate(${hue}deg)`
      const rgbShiftBoost = state.rgbShiftAudioReactive
        ? bass * state.audioSensitivity * state.rgbShiftAudioSensitivity
        : 0
      const rgbShiftPixels = filterActive
        ? clamp((state.rgbShift + rgbShiftBoost) * Math.min(currentCanvas.width, currentCanvas.height) * 0.65, 0, 36)
        : 0
      const glitchBoost = state.glitchAudioReactive
        ? bass * state.audioSensitivity * state.glitchAudioSensitivity
        : 0
      const glitchAmount = filterActive ? clamp(state.glitchIntensity + glitchBoost, 0, 1.2) : 0
      const scanlineAmount = filterActive
        ? getScanlineAmount(state.scanlineMode, state.scanlineIntensity, time, amplitude)
        : 0
      const filmNoiseAmount = filterActive ? state.noiseIntensity : 0

      if (layer.type === 'background-image') {
        const activeImage = loadedImage && loadedImageUrlRef.current === layer.imageUrl ? loadedImage : null
        const transitionDurationMs = Math.max(100, state.slideshowTransitionDuration * 1000)
        const progress = (activeImage && previousBackgroundImageRef.current && transitionStartRef.current !== null)
          ? clamp((time - transitionStartRef.current) / transitionDurationMs, 0, 1)
          : 1
        const easedProgress = progress * progress * (3 - 2 * progress)
        const transitionForce = clamp(
          state.slideshowTransitionIntensity + (bass * state.audioSensitivity * state.slideshowTransitionAudioDrive),
          0.2,
          3.5
        )
        const baseFilter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) blur(${blur}px) hue-rotate(${hue}deg)`
        const activeSnapshot: BackgroundImageSnapshot = {
          scale: layer.scale,
          positionX: layer.positionX,
          positionY: layer.positionY,
          fitMode: layer.fitMode,
        }

        const drawBackgroundImage = (
          sourceImage: HTMLImageElement,
          snapshot: BackgroundImageSnapshot,
          alpha: number,
          transitionOffsetX = 0,
          transitionOffsetY = 0,
          scaleMultiplier = 1,
          blurBoost = 0
        ) => {
          const rect = getBackgroundRectFromSnapshot(
            currentCanvas.width,
            currentCanvas.height,
            sourceImage,
            {
              ...snapshot,
              scale: snapshot.scale * scaleMultiplier,
            },
            bassBoost,
            parallaxX + transitionOffsetX,
            -parallaxY + transitionOffsetY
          )

          ctx.save()
          ctx.globalAlpha = clamp(alpha, 0, 1)
          ctx.filter = blurBoost > 0 ? `${baseFilter} blur(${blur + blurBoost}px)` : baseFilter
          ctx.drawImage(sourceImage, rect.cx - rect.width / 2, rect.cy - rect.height / 2, rect.width, rect.height)
          ctx.restore()
        }

        const drawClippedBackgroundImage = (
          sourceImage: HTMLImageElement,
          snapshot: BackgroundImageSnapshot,
          clipX: number,
          clipY: number,
          clipWidth: number,
          clipHeight: number,
          alpha: number,
          transitionOffsetX = 0,
          transitionOffsetY = 0,
          scaleMultiplier = 1,
          blurBoost = 0
        ) => {
          if (clipWidth <= 0 || clipHeight <= 0) return
          ctx.save()
          ctx.beginPath()
          ctx.rect(clipX, clipY, clipWidth, clipHeight)
          ctx.clip()
          drawBackgroundImage(
            sourceImage,
            snapshot,
            alpha,
            transitionOffsetX,
            transitionOffsetY,
            scaleMultiplier,
            blurBoost
          )
          ctx.restore()
        }

        const drawBarRevealTransition = (
          axis: 'horizontal' | 'vertical',
          sourceImage: HTMLImageElement,
          sourceSnapshot: BackgroundImageSnapshot,
          revealProgress: number
        ) => {
          const segments = Math.max(8, Math.floor(axis === 'horizontal'
            ? 12 + transitionForce * 2
            : 18 + transitionForce * 4))
          const fullWidth = currentCanvas.width
          const fullHeight = currentCanvas.height
          const bandLength = axis === 'horizontal' ? fullHeight / segments : fullWidth / segments

          for (let index = 0; index < segments; index++) {
            const delay = seededRandom(index * 17.3 + 9.1) * 0.48
            const local = clamp((revealProgress - delay) / Math.max(0.18, 1 - delay), 0, 1)
            if (local <= 0.001) continue

            const offsetSeed = seededRandom(Math.floor(time * 0.03) * 23.1 + index * 7.7) - 0.5
            const jitter = offsetSeed * (axis === 'horizontal' ? fullWidth : fullHeight) * 0.09 * transitionForce * (1 - local)

            if (axis === 'horizontal') {
              drawClippedBackgroundImage(
                sourceImage,
                sourceSnapshot,
                0,
                index * bandLength,
                fullWidth,
                Math.ceil(bandLength + 1),
                local,
                jitter,
                0
              )
            } else {
              drawClippedBackgroundImage(
                sourceImage,
                sourceSnapshot,
                index * bandLength,
                0,
                Math.ceil(bandLength + 1),
                fullHeight,
                local,
                0,
                jitter
              )
            }
          }
        }

        const drawDissolveTransition = (
          sourceImage: HTMLImageElement,
          sourceSnapshot: BackgroundImageSnapshot,
          revealProgress: number
        ) => {
          const cols = Math.max(12, Math.floor(16 + transitionForce * 3))
          const rows = Math.max(7, Math.floor(9 + transitionForce * 2))
          const tileWidth = currentCanvas.width / cols
          const tileHeight = currentCanvas.height / rows

          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
              const delay = seededRandom(x * 13.1 + y * 17.7 + 4.3) * 0.52
              const local = clamp((revealProgress - delay) / Math.max(0.18, 1 - delay), 0, 1)
              if (local <= 0.001) continue

              const warpX = (seededRandom(x * 3.7 + y * 11.3 + Math.floor(time * 0.01)) - 0.5) * tileWidth * 0.75 * transitionForce * (1 - local)
              const warpY = (seededRandom(x * 7.9 + y * 5.1 + Math.floor(time * 0.012)) - 0.5) * tileHeight * 0.5 * transitionForce * (1 - local)

              drawClippedBackgroundImage(
                sourceImage,
                sourceSnapshot,
                x * tileWidth,
                y * tileHeight,
                Math.ceil(tileWidth + 1),
                Math.ceil(tileHeight + 1),
                local,
                warpX,
                warpY,
                1,
                (1 - local) * (4 + transitionForce * 2)
              )
            }
          }
        }

        if (previousBackgroundImageRef.current && progress < 1) {
          const slideDistance = currentCanvas.width
          const type = state.slideshowTransitionType

          if (type === 'slide-left') {
            drawBackgroundImage(previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1, -easedProgress * slideDistance * lerp(0.92, 1.18, Math.min(1, transitionForce / 2.5)))
            if (activeImage) {
              drawBackgroundImage(activeImage, activeSnapshot, 1, (1 - easedProgress) * slideDistance * lerp(0.92, 1.18, Math.min(1, transitionForce / 2.5)))
            }
          } else if (type === 'slide-right') {
            drawBackgroundImage(previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1, easedProgress * slideDistance * lerp(0.92, 1.18, Math.min(1, transitionForce / 2.5)))
            if (activeImage) {
              drawBackgroundImage(activeImage, activeSnapshot, 1, -(1 - easedProgress) * slideDistance * lerp(0.92, 1.18, Math.min(1, transitionForce / 2.5)))
            }
          } else if (type === 'zoom-in') {
            drawBackgroundImage(previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1 - easedProgress)
            if (activeImage) {
              drawBackgroundImage(activeImage, activeSnapshot, easedProgress, 0, 0, lerp(Math.max(0.2, 0.6 - transitionForce * 0.14), 1, easedProgress))
            }
          } else if (type === 'blur-dissolve') {
            drawBackgroundImage(previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1, 0, 0, 1, easedProgress * (4 + transitionForce * 1.8))
            if (activeImage) {
              drawDissolveTransition(activeImage, activeSnapshot, easedProgress)
            }
          } else if (type === 'bars-horizontal') {
            drawBackgroundImage(previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1 - easedProgress * 0.45)
            if (activeImage) {
              drawBarRevealTransition('horizontal', activeImage, activeSnapshot, easedProgress)
            }
          } else if (type === 'bars-vertical') {
            drawBackgroundImage(previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1 - easedProgress * 0.45)
            if (activeImage) {
              drawBarRevealTransition('vertical', activeImage, activeSnapshot, easedProgress)
            }
          } else if (type === 'rgb-shift') {
            drawBackgroundImage(previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1 - easedProgress)
            if (activeImage) {
              const jitter = Math.sin(time * 0.015) * currentCanvas.width * 0.035 * transitionForce * (1 - easedProgress)
              drawBackgroundImage(activeImage, activeSnapshot, easedProgress, jitter)
              ctx.save()
              const rgbBoost = Math.max(8, currentCanvas.width * 0.02 * transitionForce * (1 - easedProgress))
              const rectForRgb = getBackgroundRectFromSnapshot(
                currentCanvas.width,
                currentCanvas.height,
                activeImage,
                activeSnapshot,
                bassBoost,
                parallaxX + jitter,
                -parallaxY
              )
              ctx.translate(rectForRgb.cx, rectForRgb.cy)
              drawRgbShift(ctx, activeImage, rectForRgb.width, rectForRgb.height, rgbBoost, colorFilter, time, easedProgress)
              ctx.restore()
            }
          } else if (type === 'distortion') {
            drawBackgroundImage(previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1 - easedProgress * 0.6)
            if (activeImage) {
              const segments = Math.max(10, Math.floor(14 + transitionForce * 5))
              const sliceHeight = currentCanvas.height / segments
              for (let index = 0; index < segments; index++) {
                const wave = Math.sin(time * 0.01 + index * 0.85) * currentCanvas.width * 0.05 * transitionForce * (1 - easedProgress)
                drawClippedBackgroundImage(
                  activeImage,
                  activeSnapshot,
                  0,
                  index * sliceHeight,
                  currentCanvas.width,
                  Math.ceil(sliceHeight + 1),
                  easedProgress,
                  wave,
                  0
                )
              }
            }
          } else {
            drawBackgroundImage(previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1 - easedProgress)
            if (activeImage) {
              drawBackgroundImage(activeImage, activeSnapshot, easedProgress)
            }
          }

          if (progress >= 1 && activeImage) {
            previousBackgroundImageRef.current = null
            transitionStartRef.current = null
          }
        } else if (activeImage) {
          drawBackgroundImage(activeImage, activeSnapshot, 1)
        } else if (previousBackgroundImageRef.current) {
          drawBackgroundImage(previousBackgroundImageRef.current, previousBackgroundParamsRef.current, 1)
        }

        renderedBackgroundParamsRef.current = {
          scale: layer.scale,
          positionX: layer.positionX,
          positionY: layer.positionY,
          fitMode: layer.fitMode,
        }

        rafRef.current = requestAnimationFrame(frame)
        return
      }

      if (!loadedImage || !rect) {
        rafRef.current = requestAnimationFrame(frame)
        return
      }

      ctx.save()
      ctx.translate(rect.cx, rect.cy)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      ctx.globalAlpha = clamp(layer.opacity, 0, 1)
      if (layer.type === 'overlay-image') {
        applyOverlayShapeClip(ctx, rect.width, rect.height, layer.cropShape)
      }
      if (layer.type === 'overlay-image') {
        drawOverlayGlow(ctx, loadedImage, rect.width, rect.height, layer.edgeGlow, ctx.globalAlpha)
      }
      ctx.filter = baseFilter
      ctx.drawImage(loadedImage, -rect.width / 2, -rect.height / 2, rect.width, rect.height)
      ctx.filter = 'none'

      if (filterActive) {
        drawRgbShift(ctx, loadedImage, rect.width, rect.height, rgbShiftPixels, colorFilter, time, ctx.globalAlpha)

        if (glitchAmount > 0.001) {
          if (state.glitchStyle === 'bands') {
            drawBandsGlitch(ctx, loadedImage, rect.width, rect.height, glitchAmount, state.glitchFrequency, time, colorFilter, ctx.globalAlpha)
          } else if (state.glitchStyle === 'blocks') {
            drawBlocksGlitch(ctx, loadedImage, rect.width, rect.height, glitchAmount, state.glitchFrequency, time, colorFilter, ctx.globalAlpha)
          } else {
            drawPixelsGlitch(ctx, loadedImage, rect.width, rect.height, glitchAmount, state.glitchFrequency, time, colorFilter, ctx.globalAlpha)
          }
        }

        drawFilmNoise(ctx, rect.width, rect.height, filmNoiseAmount, time, ctx.globalAlpha)
        drawScanlines(
          ctx,
          rect.width,
          rect.height,
          scanlineAmount,
          state.scanlineSpacing,
          state.scanlineThickness,
          ctx.globalAlpha
        )
      }

      if (layer.type === 'overlay-image') {
        applySoftEdgeMask(ctx, rect.width, rect.height, layer.edgeFade)
      }

      ctx.restore()
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [getAmplitude, getBands, image, layer])

  if (!layer.enabled || !layer.imageUrl) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: layer.zIndex,
        mixBlendMode: getCanvasBlendMode(layer),
      }}
    />
  )
}
