import { useEffect, useRef, type CSSProperties } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';

/**
 * DragInteractionLayer — when enableDragMode is on and the user picked a
 * tool (logo / spectrum / track-title / lyrics), this full-viewport
 * transparent overlay captures pointer events and translates them into
 * normalized position updates for the selected subsystem.
 *
 * Why it exists: logo, spectrum and the text overlays are drawn into a
 * <canvas>, not DOM, so there is nothing to attach native drag handlers
 * to. This overlay sits above the canvas, intercepts the drag, and the
 * targeted subsystem's renderer picks up the new store position next frame.
 *
 * HUD drag is intentionally NOT handled here — `QuickActionsPanel` already
 * owns its own positional drag because the HUD is a DOM element.
 */
const DRAG_TARGETS: ReadonlyArray<'logo' | 'spectrum' | 'track-title' | 'lyrics'> = [
	'logo',
	'spectrum',
	'track-title',
	'lyrics'
];

type DragTarget = (typeof DRAG_TARGETS)[number];

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

	useEffect(() => () => {
		dragStateRef.current = null;
	}, []);

	const isActiveTarget = enableDragMode && DRAG_TARGETS.includes(activeTool as DragTarget);
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
		// Sits above the canvas but below the editor panel (z-40 keeps the
		// editor at z-50 reachable so the user can still toggle/change tool).
		zIndex: 40,
		cursor: 'crosshair',
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
			}}
			onPointerCancel={() => {
				dragStateRef.current = null;
			}}
		/>
	);
}
