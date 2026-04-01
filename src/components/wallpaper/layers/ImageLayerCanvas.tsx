import { useEffect, useRef, useState } from 'react'
import { clamp, lerp } from '@/lib/math'
import { useAudioData } from '@/hooks/useAudioData'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { createAudioEnvelope } from '@/utils/audioEnvelope'
import { createDebugScope } from '@/utils/debug'

const debugBass = createDebugScope('BassZoom')
import { renderBackgroundFrame } from './imageCanvasBackgroundRenderer'
import { applyOverlayShapeClip, applySoftEdgeMask, drawFilmNoise, drawOverlayGlow, drawRgbShift, drawScanlines, getScanlineAmount } from './imageCanvasEffects'
import { getCachedImage, getCanvasBlendMode, getLayerRect, targetMatches, type BackgroundImageSnapshot, type BackgroundTransitionSnapshot, type ImageLayer } from './imageCanvasShared'

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
    mirror: layer.type === 'background-image' ? layer.mirror : false,
  })
  const renderedBackgroundParamsRef = useRef<BackgroundImageSnapshot>({
    scale: layer.type === 'background-image' ? layer.scale : 1,
    positionX: layer.type === 'background-image' ? layer.positionX : 0,
    positionY: layer.type === 'background-image' ? layer.positionY : 0,
    fitMode: layer.type === 'background-image' ? layer.fitMode : 'cover',
    mirror: layer.type === 'background-image' ? layer.mirror : false,
  })
  const previousBackgroundTransitionRef = useRef<BackgroundTransitionSnapshot>({
    transitionType: layer.type === 'background-image' ? layer.transitionType : 'fade',
    transitionDuration: layer.type === 'background-image' ? layer.transitionDuration : 1,
    transitionIntensity: layer.type === 'background-image' ? layer.transitionIntensity : 1,
    transitionAudioDrive: layer.type === 'background-image' ? layer.transitionAudioDrive : 0,
  })
  const renderedBackgroundTransitionRef = useRef<BackgroundTransitionSnapshot>({
    transitionType: layer.type === 'background-image' ? layer.transitionType : 'fade',
    transitionDuration: layer.type === 'background-image' ? layer.transitionDuration : 1,
    transitionIntensity: layer.type === 'background-image' ? layer.transitionIntensity : 1,
    transitionAudioDrive: layer.type === 'background-image' ? layer.transitionAudioDrive : 0,
  })
  const currentRequestedBackgroundUrlRef = useRef<string | null>(layer.type === 'background-image' ? layer.imageUrl : null)
  const transitionStartRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)
  const effectiveTimeRef = useRef(0)
  const backgroundEnvelopeRef = useRef(createAudioEnvelope())
  const prevBassRef = useRef(0)
  const bassPulseRef = useRef(0)
  const debugFrameRef = useRef(0)
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
        previousBackgroundTransitionRef.current = renderedBackgroundTransitionRef.current
      }
      transitionStartRef.current = null
    }

    currentRequestedBackgroundUrlRef.current = layer.type === 'background-image' ? layer.imageUrl : currentRequestedBackgroundUrlRef.current

    const requestedUrl = layer.imageUrl
    const nextImage = getCachedImage(requestedUrl, (loadedImage) => {
      if (layer.type === 'background-image' && currentRequestedBackgroundUrlRef.current !== requestedUrl) return
      if (layer.type === 'background-image' && previousBackgroundImageRef.current && loadedImageUrlRef.current !== requestedUrl) {
        transitionStartRef.current = effectiveTimeRef.current
      }
      imageRef.current = loadedImage
      loadedImageUrlRef.current = requestedUrl
      setImage(loadedImage)
    })
    if (nextImage.complete && nextImage.naturalWidth > 0) {
      if (layer.type === 'background-image' && previousBackgroundImageRef.current && loadedImageUrlRef.current !== requestedUrl) {
        transitionStartRef.current = effectiveTimeRef.current
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

    function frame(now: number) {
      const currentCanvas = canvasRef.current
      if (!currentCanvas) return

      const deltaMs = lastFrameTimeRef.current === 0 ? 0 : now - lastFrameTimeRef.current
      const dt = Math.min(deltaMs / 1000, 0.1)
      lastFrameTimeRef.current = now

      if (currentCanvas.width !== window.innerWidth || currentCanvas.height !== window.innerHeight) {
        currentCanvas.width = window.innerWidth
        currentCanvas.height = window.innerHeight
      }

      const state = useWallpaperStore.getState()
      if (state.motionPaused) {
        rafRef.current = requestAnimationFrame(frame)
        return
      }
      effectiveTimeRef.current += deltaMs
      const time = effectiveTimeRef.current
      const filterActive = targetMatches(layer, state.filterTarget, state.selectedOverlayId)
      const bands = getBands()
      const amplitude = getAmplitude()
      const bass = bands.bass

      smoothedMouseRef.current.x = lerp(smoothedMouseRef.current.x, mouseRef.current.x, 0.05)
      smoothedMouseRef.current.y = lerp(smoothedMouseRef.current.y, mouseRef.current.y, 0.05)

      const parallaxX = layer.type === 'background-image'
        ? smoothedMouseRef.current.x * state.parallaxStrength * currentCanvas.width * 0.08
        : 0
      const parallaxY = layer.type === 'background-image'
        ? smoothedMouseRef.current.y * state.parallaxStrength * currentCanvas.height * 0.08
        : 0

      // Transient-only bass pulse: only fires on upward edges (kick/hit detection).
      // delta > 0 only when bass is rising; decays quickly between hits.
      const bassSignalDt = Math.max(dt, 1 / 120)
      const bassDelta = Math.max(0, bass - prevBassRef.current)
      prevBassRef.current = bass
      const bassPulseDecay = Math.exp(-bassSignalDt * 14)
      bassPulseRef.current = Math.max(bassDelta * 5.0, bassPulseRef.current * bassPulseDecay)
      const bassPulse = clamp(bassPulseRef.current, 0, 1)

      const bassBoost = layer.type === 'background-image' && layer.audioReactiveConfig?.enabled
        ? backgroundEnvelopeRef.current.tick(bassPulse, Math.max(dt, 1 / 120), {
            attack: 0.88,
            release: 0.06,
            responseSpeed: 2.4,
            peakWindow: 1.15,
            peakFloor: 0.02,
            punch: 0.16,
            scaleIntensity: 1.28,
            min: 0,
            max: layer.audioReactiveConfig.sensitivity ?? 0,
          }).value
        : 0

      // Dev signal trace: logs raw → pulse → boost once per second so the console stays readable.
      debugFrameRef.current++
      if (layer.type === 'background-image' && layer.audioReactiveConfig?.enabled && debugFrameRef.current % 60 === 0) {
        debugBass(`raw=${bass.toFixed(3)}  pulse=${bassPulse.toFixed(3)}  boost=${bassBoost.toFixed(3)}`)
      }

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
      const scanlineAmount = filterActive
        ? getScanlineAmount(state.scanlineMode, state.scanlineIntensity, time, amplitude)
        : 0
      const filmNoiseAmount = filterActive ? state.noiseIntensity : 0

      if (layer.type === 'background-image') {
        renderBackgroundFrame({
          ctx,
          layer,
          canvasWidth: currentCanvas.width,
          canvasHeight: currentCanvas.height,
          loadedImage: loadedImage && loadedImageUrlRef.current === layer.imageUrl ? loadedImage : null,
          time,
          bass,
          bassBoost,
          amplitude,
          parallaxX,
          parallaxY,
          brightness,
          contrast,
          saturation,
          blur,
          hue,
          colorFilter,
          filterActive,
          rgbShiftPixels,
          scanlineMode: state.scanlineMode,
          scanlineIntensity: state.scanlineIntensity,
          scanlineSpacing: state.scanlineSpacing,
          scanlineThickness: state.scanlineThickness,
          filmNoiseAmount,
          audioSensitivity: state.audioSensitivity,
          previousBackgroundImageRef,
          previousBackgroundParamsRef,
          previousBackgroundTransitionRef,
          renderedBackgroundParamsRef,
          renderedBackgroundTransitionRef,
          transitionStartRef,
        })
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
      backgroundEnvelopeRef.current.reset()
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
