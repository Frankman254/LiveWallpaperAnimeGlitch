import { useEffect, useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
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

export default function OverlayInteractionStage() {
  const dragRef = useRef<DragState | null>(null)
  const {
    overlays,
    selectedOverlayId,
    setSelectedOverlayId,
    updateOverlay,
    spectrumEnabled,
    spectrumMode,
    spectrumFollowLogo,
    spectrumPositionX,
    spectrumPositionY,
    setSpectrumPositionX,
    setSpectrumPositionY,
    editorPanelOpen,
    editorOverlayOpen,
  } = useWallpaperStore()

  const interactionVisible = editorPanelOpen || editorOverlayOpen
  const canDragSpectrum = spectrumEnabled && (spectrumMode === 'linear' || !spectrumFollowLogo)

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
    if (!interactionVisible) {
      finishDrag()
    }

    return () => {
      finishDrag()
    }
  }, [interactionVisible])

  if (!interactionVisible) return null

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
            left: `calc(50% + ${spectrumPositionX * 50}vw)`,
            top: `calc(50% - ${spectrumPositionY * 50}vh)`,
            width: 18,
            height: 18,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'auto',
            borderRadius: '9999px',
            border: '1px solid rgba(34, 211, 238, 0.55)',
            background: 'rgba(34, 211, 238, 0.14)',
            boxShadow: '0 0 12px rgba(34, 211, 238, 0.22)',
            backdropFilter: 'blur(4px)',
            cursor: 'grab',
          }}
          aria-label="Drag spectrum"
        />
      ) : null}
    </div>
  )
}
