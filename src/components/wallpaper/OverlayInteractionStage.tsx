import { useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { getLogoRenderState } from '@/components/audio/ReactiveLogo'
import { useWallpaperStore } from '@/store/wallpaperStore'

type DragState =
  | {
      kind: 'overlay'
      id: string
      pointerId: number
      startClientX: number
      startClientY: number
      startPositionX: number
      startPositionY: number
    }
  | {
      kind: 'spectrum'
      pointerId: number
      startClientX: number
      startClientY: number
      startPositionX: number
      startPositionY: number
    }
  | {
      kind: 'logo'
      pointerId: number
      startClientX: number
      startClientY: number
      startPositionX: number
      startPositionY: number
    }

export default function OverlayInteractionStage({ visible }: { visible: boolean }) {
  const dragRef = useRef<DragState | null>(null)
  const {
    overlays,
    selectedOverlayId,
    setSelectedOverlayId,
    updateOverlay,
    logoEnabled,
    logoBaseSize,
    logoMinScale,
    logoPositionX,
    logoPositionY,
    logoBackdropEnabled,
    logoBackdropPadding,
    logoGlowBlur,
    setLogoPositionX,
    setLogoPositionY,
    spectrumEnabled,
    spectrumMode,
    spectrumFollowLogo,
    spectrumLinearOrientation,
    spectrumLinearDirection,
    spectrumBarCount,
    spectrumBarWidth,
    spectrumMaxHeight,
    spectrumMirror,
    spectrumShadowBlur,
    spectrumInnerRadius,
    spectrumSpan,
    spectrumPositionX,
    spectrumPositionY,
    setSpectrumPositionX,
    setSpectrumPositionY,
  } = useWallpaperStore()

  const canDragLogo = logoEnabled
  const canDragSpectrum = spectrumEnabled && (spectrumMode === 'linear' || !spectrumFollowLogo)

  const viewportWidth = typeof window === 'undefined' ? 0 : window.innerWidth
  const viewportHeight = typeof window === 'undefined' ? 0 : window.innerHeight

  const logoScale = Math.max(getLogoRenderState().scale, logoMinScale, 0.75)
  const logoCenterX = viewportWidth / 2 + logoPositionX * viewportWidth * 0.5
  const logoCenterY = viewportHeight / 2 - logoPositionY * viewportHeight * 0.5
  const logoRadius = (logoBaseSize * logoScale) / 2
    + (logoBackdropEnabled ? logoBackdropPadding : 0)
    + Math.max(12, logoGlowBlur * 0.35)

  const linearDirection = spectrumLinearOrientation === 'vertical'
    ? (spectrumLinearDirection === 'normal' ? 1 : -1)
    : (spectrumLinearDirection === 'normal' ? -1 : 1)
  const spectrumCenterX = viewportWidth / 2 + spectrumPositionX * viewportWidth * 0.5
  const spectrumCenterY = viewportHeight / 2 - spectrumPositionY * viewportHeight * 0.5
  const shadowPad = Math.max(14, spectrumShadowBlur * 0.45 + 8)
  const clampedSpan = Math.max(0.2, Math.min(1, spectrumSpan ?? 1))
  const linearTotalSpan = (spectrumLinearOrientation === 'vertical' ? viewportHeight : viewportWidth) * clampedSpan
  const linearGap = Math.max(0, linearTotalSpan / Math.max(spectrumBarCount, 1) - spectrumBarWidth)
  const linearStride = spectrumBarWidth + linearGap
  const linearLength = Math.max(0, spectrumBarCount * linearStride - linearGap)
  const linearStart = (spectrumLinearOrientation === 'vertical'
    ? (viewportHeight - linearLength) / 2
    : (viewportWidth - linearLength) / 2)

  const spectrumBounds = (() => {
    if (!canDragSpectrum) return null

    if (spectrumMode === 'linear') {
      const extent = spectrumMaxHeight + shadowPad
      if (spectrumLinearOrientation === 'vertical') {
        const mirroredX = spectrumMirror ? spectrumCenterX - extent * linearDirection : spectrumCenterX
        const forwardX = spectrumCenterX + extent * linearDirection
        const minX = Math.min(spectrumCenterX, forwardX, mirroredX)
        const maxX = Math.max(spectrumCenterX, forwardX, mirroredX)
        return {
          left: minX - shadowPad,
          top: linearStart - shadowPad,
          width: Math.max(28, maxX - minX + shadowPad * 2),
          height: Math.max(28, linearLength + shadowPad * 2),
        }
      }

      const mirroredY = spectrumMirror ? spectrumCenterY - extent * linearDirection : spectrumCenterY
      const forwardY = spectrumCenterY + extent * linearDirection
      const minY = Math.min(spectrumCenterY, forwardY, mirroredY)
      const maxY = Math.max(spectrumCenterY, forwardY, mirroredY)
      return {
        left: linearStart - shadowPad,
        top: minY - shadowPad,
        width: Math.max(28, linearLength + shadowPad * 2),
        height: Math.max(28, maxY - minY + shadowPad * 2),
      }
    }

    const radialOuterRadius = spectrumInnerRadius + spectrumMaxHeight + shadowPad
    return {
      left: spectrumCenterX - radialOuterRadius,
      top: spectrumCenterY - radialOuterRadius,
      width: Math.max(36, radialOuterRadius * 2),
      height: Math.max(36, radialOuterRadius * 2),
    }
  })()

  function finishDrag(pointerId?: number) {
    if (!dragRef.current) return
    if (pointerId !== undefined && dragRef.current.pointerId !== pointerId) return
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    window.removeEventListener('pointercancel', handlePointerUp)
    dragRef.current = null
  }

  function handlePointerMove(event: PointerEvent) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const dx = event.clientX - drag.startClientX
    const dy = event.clientY - drag.startClientY

    if (drag.kind === 'overlay') {
      updateOverlay(drag.id, {
        positionX: drag.startPositionX + dx / Math.max(window.innerWidth, 1),
        positionY: drag.startPositionY - dy / Math.max(window.innerHeight, 1),
      })
      return
    }

    if (drag.kind === 'logo') {
      setLogoPositionX(drag.startPositionX + dx / Math.max(window.innerWidth * 0.5, 1))
      setLogoPositionY(drag.startPositionY - dy / Math.max(window.innerHeight * 0.5, 1))
      return
    }

    setSpectrumPositionX(drag.startPositionX + dx / Math.max(window.innerWidth * 0.5, 1))
    setSpectrumPositionY(drag.startPositionY - dy / Math.max(window.innerHeight * 0.5, 1))
  }

  function handlePointerUp(event: PointerEvent) {
    finishDrag(event.pointerId)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>, id: string) {
    const overlay = overlays.find((item) => item.id === id)
    if (!overlay) return

    setSelectedOverlayId(id)
    dragRef.current = {
      kind: 'overlay',
      id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPositionX: overlay.positionX,
      startPositionY: overlay.positionY,
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  function handleLogoPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    dragRef.current = {
      kind: 'logo',
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPositionX: logoPositionX,
      startPositionY: logoPositionY,
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  function handleSpectrumPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    dragRef.current = {
      kind: 'spectrum',
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPositionX: spectrumPositionX,
      startPositionY: spectrumPositionY,
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  useEffect(() => {
    if (!visible) {
      finishDrag()
    }

    return () => {
      finishDrag()
    }
  }, [visible])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 200,
      }}
    >
      {(() => {
        const overlay = overlays.find((item) => item.id === selectedOverlayId && item.enabled && item.url)
        if (!overlay) return null

        return (
          <button
            key={overlay.id}
            type="button"
            onPointerDown={(event) => handlePointerDown(event, overlay.id)}
            onClick={() => setSelectedOverlayId(overlay.id)}
            style={{
              position: 'absolute',
              left: `calc(50% + ${overlay.positionX * 100}vw)`,
              top: `calc(50% - ${overlay.positionY * 100}vh)`,
              width: overlay.width * overlay.scale,
              height: overlay.height * overlay.scale,
              transform: `translate(-50%, -50%) rotate(${overlay.rotation}deg)`,
              pointerEvents: 'auto',
              zIndex: overlay.zIndex,
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              outline: 'none',
              appearance: 'none',
              cursor: 'grab',
            }}
            aria-label="Drag overlay"
          />
        )
      })()}

      {canDragSpectrum ? (
        <button
          type="button"
          onPointerDown={handleSpectrumPointerDown}
          style={{
            position: 'absolute',
            left: spectrumBounds?.left ?? 0,
            top: spectrumBounds?.top ?? 0,
            width: spectrumBounds?.width ?? 0,
            height: spectrumBounds?.height ?? 0,
            pointerEvents: 'auto',
            border: 'none',
            background: 'transparent',
            boxShadow: 'none',
            outline: 'none',
            appearance: 'none',
            cursor: 'grab',
          }}
          aria-label="Drag spectrum"
        />
      ) : null}

      {canDragLogo ? (
        <button
          type="button"
          onPointerDown={handleLogoPointerDown}
          style={{
            position: 'absolute',
            left: logoCenterX - logoRadius,
            top: logoCenterY - logoRadius,
            width: Math.max(28, logoRadius * 2),
            height: Math.max(28, logoRadius * 2),
            pointerEvents: 'auto',
            border: 'none',
            background: 'transparent',
            boxShadow: 'none',
            outline: 'none',
            appearance: 'none',
            cursor: 'grab',
          }}
          aria-label="Drag logo"
        />
      ) : null}
    </div>
  )
}
