import { MAX_LOGO_FIT_INFLATION } from '@/features/spectrum/geometry/radialGeometry';
import { resolveSpectrumPlacement } from '@/features/spectrum/runtime/spectrumPlacement';
import type { WallpaperState } from '@/types/wallpaper';

export type DragTool = 'logo' | 'spectrum' | 'track-title' | 'lyrics';

export type Viewport = { width: number; height: number };

/**
 * Where a drag tool's element actually is on screen.
 *
 * The drag overlay used to capture the whole viewport, so a grab cursor
 * appeared everywhere and HUD buttons sat under a transparent capture surface
 * even when the element being dragged was nowhere near them. Restricting
 * capture to the element's own area is what makes the rest of the UI usable
 * while a tool is armed.
 */
export type DragHitArea =
	| { kind: 'circle'; cx: number; cy: number; radius: number }
	| {
			kind: 'rect';
			left: number;
			top: number;
			right: number;
			bottom: number;
	  };

/**
 * Generous padding (px) so grabbing slightly outside the drawn pixels still
 * works. Glow and shadow spill past the geometry, and a hit area that demands
 * pixel accuracy feels broken.
 */
const GRAB_PADDING = 24;

/** Same mapping the renderers use: X grows right, Y grows UP in store space. */
function toScreen(
	normalizedX: number,
	normalizedY: number,
	viewport: Viewport
): { x: number; y: number } {
	return {
		x: viewport.width / 2 + normalizedX * viewport.width * 0.5,
		y: viewport.height / 2 - normalizedY * viewport.height * 0.5
	};
}

function resolveSpectrumArea(
	state: WallpaperState,
	viewport: Viewport
): DragHitArea {
	const placement = resolveSpectrumPlacement(state);
	const { x, y } = toScreen(
		placement.spectrumPositionX,
		placement.spectrumPositionY,
		viewport
	);
	const scale = state.spectrumScale || 1;

	if (placement.spectrumMode === 'radial') {
		// Worst case: "fit around logo" can scale the base ring up to the
		// inflation cap, then bars grow `spectrumMaxHeight` beyond that.
		const inflation = placement.spectrumRadialFitLogo
			? MAX_LOGO_FIT_INFLATION
			: 1;
		const radius =
			(placement.spectrumInnerRadius * inflation +
				state.spectrumMaxHeight) *
				scale +
			GRAB_PADDING;
		return { kind: 'circle', cx: x, cy: y, radius };
	}

	// Linear: a band across the canvas, thick enough to cover the tallest bar.
	const half = state.spectrumMaxHeight * scale + GRAB_PADDING;
	if (state.spectrumLinearOrientation === 'vertical') {
		return {
			kind: 'rect',
			left: x - half,
			top: 0,
			right: x + half,
			bottom: viewport.height
		};
	}
	return {
		kind: 'rect',
		left: 0,
		top: y - half,
		right: viewport.width,
		bottom: y + half
	};
}

function resolveLogoArea(
	state: WallpaperState,
	viewport: Viewport
): DragHitArea {
	const { x, y } = toScreen(
		state.logoPositionX,
		state.logoPositionY,
		viewport
	);
	// The logo pulses with audio; `logoMinScale` is the floor, and it can grow
	// past 1, so allow headroom rather than tracking the live scale.
	const scale = Math.max(state.logoMinScale, 1);
	const radius = (state.logoBaseSize * scale) / 2 + GRAB_PADDING;
	return { kind: 'circle', cx: x, cy: y, radius };
}

/**
 * Text overlays are drawn from a font size we know but a string length we do
 * not, so this is a deliberately wide box: too small and the user cannot grab
 * their own text, which is worse than overlapping a little UI.
 */
function resolveTextArea(
	positionX: number,
	positionY: number,
	fontSize: number,
	viewport: Viewport
): DragHitArea {
	const { x, y } = toScreen(positionX, positionY, viewport);
	const halfHeight = fontSize * 1.2 + GRAB_PADDING;
	const halfWidth = Math.min(
		viewport.width / 2,
		fontSize * 12 + GRAB_PADDING
	);
	return {
		kind: 'rect',
		left: x - halfWidth,
		top: y - halfHeight,
		right: x + halfWidth,
		bottom: y + halfHeight
	};
}

export function resolveDragHitArea(
	tool: DragTool,
	state: WallpaperState,
	viewport: Viewport
): DragHitArea | null {
	switch (tool) {
		case 'spectrum':
			return resolveSpectrumArea(state, viewport);
		case 'logo':
			return state.logoEnabled ? resolveLogoArea(state, viewport) : null;
		case 'track-title':
			return resolveTextArea(
				state.audioTrackTitlePositionX,
				state.audioTrackTitlePositionY,
				state.audioTrackTitleFontSize,
				viewport
			);
		case 'lyrics':
			return resolveTextArea(
				state.audioLyricsPositionX,
				state.audioLyricsPositionY,
				state.audioLyricsFontSize,
				viewport
			);
		default:
			return null;
	}
}

export function isInsideHitArea(
	area: DragHitArea | null,
	x: number,
	y: number
): boolean {
	// No resolvable area (element disabled) — nothing to grab.
	if (!area) return false;
	if (area.kind === 'circle') {
		return Math.hypot(x - area.cx, y - area.cy) <= area.radius;
	}
	return (
		x >= area.left && x <= area.right && y >= area.top && y <= area.bottom
	);
}
