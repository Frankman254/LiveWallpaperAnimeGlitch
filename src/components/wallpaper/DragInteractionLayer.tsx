import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import {
	isInsideHitArea,
	resolveDragHitArea,
	type DragTool
} from './dragHitArea';

/**
 * DragInteractionLayer — when enableDragMode is on and the user picked a
 * tool (logo / spectrum / track-title / lyrics), this overlay captures pointer
 * events and translates them into normalized position updates for the selected
 * subsystem.
 *
 * Why it exists: logo, spectrum and the text overlays are drawn into a
 * <canvas>, not DOM, so there is nothing to attach native drag handlers
 * to. This overlay sits above the canvas, intercepts the drag, and the
 * targeted subsystem's renderer picks up the new store position next frame.
 *
 * It spans the viewport so a drag can continue past the element's edge, but it
 * is only pointer-interactive over the element itself (see `dragHitArea`).
 * Capturing everywhere meant a grab cursor over the entire screen and a
 * transparent capture surface sitting on top of HUD buttons that had nothing to
 * do with the element being dragged.
 *
 * HUD drag is intentionally NOT handled here — `QuickActionsPanel` already
 * owns its own positional drag because the HUD is a DOM element.
 *
 * Mounted by `WallpaperViewport` inside its `<main>`, not next to it: see the
 * z-index note on `style` below for why that placement is load-bearing.
 */
const DRAG_TARGETS: ReadonlyArray<DragTool> = [
	'logo',
	'spectrum',
	'track-title',
	'lyrics'
];

type DragTarget = DragTool;

/**
 * True when interactive UI sits under this point.
 *
 * `elementsFromPoint` already skips `pointer-events: none` nodes, so the HUD's
 * full-screen transparent shell never counts — only its actual controls do,
 * and `closest` walks up from them to the `data-drag-blocker` root.
 */
function isOverUiChrome(x: number, y: number): boolean {
	if (typeof document === 'undefined') return false;
	// The overlay itself is in this stack when interactive, but it never sits
	// inside a blocker, so it simply never matches.
	return document
		.elementsFromPoint(x, y)
		.some(element => element.closest('[data-drag-blocker]') !== null);
}

export default function DragInteractionLayer() {
	const {
		enableDragMode,
		activeTool,
		setLogoPositionX,
		setLogoPositionY,
		setSpectrumPositionX,
		setSpectrumPositionY,
		setAudioTrackTitlePositionX,
		setAudioTrackTitlePositionY,
		setAudioLyricsPositionX,
		setAudioLyricsPositionY
	} = useWallpaperStore(
		useShallow(s => ({
			enableDragMode: s.enableDragMode,
			activeTool: s.activeTool,
			setLogoPositionX: s.setLogoPositionX,
			setLogoPositionY: s.setLogoPositionY,
			setSpectrumPositionX: s.setSpectrumPositionX,
			setSpectrumPositionY: s.setSpectrumPositionY,
			setAudioTrackTitlePositionX: s.setAudioTrackTitlePositionX,
			setAudioTrackTitlePositionY: s.setAudioTrackTitlePositionY,
			setAudioLyricsPositionX: s.setAudioLyricsPositionX,
			setAudioLyricsPositionY: s.setAudioLyricsPositionY
		}))
	);

	const dragStateRef = useRef<{ pointerId: number } | null>(null);
	// Whether the pointer is currently over the element this tool drags. Drives
	// `pointerEvents`, so everything outside the element (HUD buttons, editor
	// panel, bare wallpaper) keeps its own cursor and stays clickable.
	const [overTarget, setOverTarget] = useState(false);
	// Mirrors `dragStateRef` for rendering: the ref alone cannot keep the
	// overlay interactive across a re-render mid-drag.
	const [dragging, setDragging] = useState(false);

	useEffect(
		() => () => {
			dragStateRef.current = null;
		},
		[]
	);

	const isActiveTarget =
		enableDragMode && DRAG_TARGETS.includes(activeTool as DragTarget);

	// Tracked on `window` rather than on the overlay itself: while the overlay
	// is `pointer-events: none` it receives no events of its own, so it could
	// never learn that the pointer came back over the element.
	useEffect(() => {
		if (!isActiveTarget) {
			setOverTarget(false);
			return undefined;
		}
		const handleMove = (event: PointerEvent) => {
			// Mid-drag the answer is always yes — the pointer is captured and
			// may legitimately travel outside the element's original bounds.
			if (dragStateRef.current) return;
			// UI always wins over the wallpaper underneath it. Geometry alone
			// is not enough: a bottom-edge linear spectrum spans the full width
			// of the canvas, so its hit area legitimately covers the HUD.
			if (isOverUiChrome(event.clientX, event.clientY)) {
				setOverTarget(false);
				return;
			}
			const area = resolveDragHitArea(
				activeTool as DragTool,
				useWallpaperStore.getState(),
				{ width: window.innerWidth, height: window.innerHeight }
			);
			setOverTarget(isInsideHitArea(area, event.clientX, event.clientY));
		};
		window.addEventListener('pointermove', handleMove, { passive: true });
		return () => window.removeEventListener('pointermove', handleMove);
	}, [activeTool, isActiveTarget]);
	if (!isActiveTarget) return null;

	function viewportToNormalized(clientX: number, clientY: number) {
		// Renderer math (ReactiveLogo / CircularSpectrum):
		//   screenX = canvas.width / 2 + posX * canvas.width * 0.5
		//   screenY = canvas.height / 2 - posY * canvas.height * 0.5   (Y up)
		// Inverse: posX = (screenX - w/2) / (w * 0.5); posY = -(screenY - h/2) / (h * 0.5).
		// We use viewport size as a proxy for canvas size — the wallpaper canvas
		// fills the viewport.
		const w = window.innerWidth;
		const h = window.innerHeight;
		const x = (clientX - w / 2) / (w * 0.5);
		const y = -(clientY - h / 2) / (h * 0.5);
		return {
			x: Math.max(-1, Math.min(1, x)),
			y: Math.max(-1, Math.min(1, y))
		};
	}

	function commit(clientX: number, clientY: number) {
		const { x, y } = viewportToNormalized(clientX, clientY);
		switch (activeTool) {
			case 'logo':
				setLogoPositionX(x);
				setLogoPositionY(y);
				return;
			case 'spectrum':
				setSpectrumPositionX(x);
				setSpectrumPositionY(y);
				return;
			case 'track-title':
				setAudioTrackTitlePositionX(x);
				setAudioTrackTitlePositionY(y);
				return;
			case 'lyrics':
				setAudioLyricsPositionX(x);
				setAudioLyricsPositionY(y);
				return;
			default:
				return;
		}
	}

	const style: CSSProperties = {
		position: 'fixed',
		inset: 0,
		// Above every wallpaper canvas (flashlight is the highest at 90) and
		// below the HUD (126) and the FPS overlay (120), so HUD controls stay
		// clickable while a drag tool is armed.
		//
		// This only works because the layer is mounted INSIDE the viewport's
		// `<main>`, which is `isolation: isolate`. Mounted as a sibling of the
		// viewport it painted above the whole subtree whatever its z-index, and
		// a spectrum sitting under the HUD made the HUD unclickable.
		zIndex: 100,
		// Transparent to the pointer unless it is actually over the element, so
		// the grab cursor and the capture surface only exist where a drag makes
		// sense. Keeps the HUD and the editor fully usable with a tool armed.
		pointerEvents: overTarget || dragging ? 'auto' : 'none',
		cursor: dragging ? 'grabbing' : 'grab',
		background: 'transparent'
	};

	return (
		<div
			role="presentation"
			style={style}
			onPointerDown={event => {
				if (event.button !== 0) return;
				(event.currentTarget as HTMLElement).setPointerCapture(
					event.pointerId
				);
				dragStateRef.current = { pointerId: event.pointerId };
				setDragging(true);
				commit(event.clientX, event.clientY);
			}}
			onPointerMove={event => {
				if (!dragStateRef.current) return;
				commit(event.clientX, event.clientY);
			}}
			onPointerUp={event => {
				if (!dragStateRef.current) return;
				try {
					(event.currentTarget as HTMLElement).releasePointerCapture(
						event.pointerId
					);
				} catch {
					/* already released */
				}
				dragStateRef.current = null;
				setDragging(false);
			}}
			onPointerCancel={() => {
				dragStateRef.current = null;
				setDragging(false);
			}}
		/>
	);
}
