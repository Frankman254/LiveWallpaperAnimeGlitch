import { useRef } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'

interface DragState {
  id: string
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
  } = useWallpaperStore()

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

    updateOverlay(drag.id, {
      positionX: drag.startPositionX + dx / Math.max(window.innerWidth, 1),
      positionY: drag.startPositionY - dy / Math.max(window.innerHeight, 1),
    })
  }

  function handlePointerUp(event: PointerEvent) {
    finishDrag(event.pointerId)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>, id: string) {
    const overlay = overlays.find((item) => item.id === id)
    if (!overlay) return

    setSelectedOverlayId(id)
    dragRef.current = {
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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 200,
      }}
    >
      {overlays
        .filter((overlay) => overlay.enabled && overlay.url)
        .map((overlay) => {
          const selected = overlay.id === selectedOverlayId
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
                background: selected ? 'rgba(34, 211, 238, 0.08)' : 'transparent',
                border: `1px dashed ${selected ? 'rgba(34, 211, 238, 0.9)' : 'rgba(34, 211, 238, 0.22)'}`,
                boxShadow: selected ? '0 0 0 1px rgba(34, 211, 238, 0.2)' : 'none',
                cursor: 'grab',
              }}
              title={overlay.name}
            >
              {selected && (
                <span
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: -24,
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#67e8f9',
                    background: 'rgba(0, 0, 0, 0.75)',
                    border: '1px solid rgba(8, 145, 178, 0.7)',
                    borderRadius: 999,
                    padding: '2px 8px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {overlay.name}
                </span>
              )}
            </button>
          )
        })}
    </div>
  )
}
