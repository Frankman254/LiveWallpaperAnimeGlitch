import type { ControlPanelAnchor } from '@/types/wallpaper';

export const PANEL_ANCHOR_WRAPPER_CLASS: Record<ControlPanelAnchor, string> = {
	'top-left': 'top-12 left-8',
	'top-right': 'top-12 right-8',
	'bottom-left': 'bottom-8 left-8',
	'bottom-right': 'bottom-8 right-8'
};

export const PANEL_ANCHOR_OVERLAY_CLASS: Record<ControlPanelAnchor, string> = {
	'top-left': 'top-12 left-0',
	'top-right': 'top-12 right-0',
	'bottom-left': 'bottom-12 left-0',
	'bottom-right': 'bottom-12 right-0'
};

// Maximum height for the floating panel shell so it never overflows the viewport.
//
// Top anchors:   wrapper top-12 (3 rem) + panel top-12 (3 rem) = 6 rem offset from
//                the viewport top → reserve 6.5 rem (0.5 rem breathing room at bottom).
// Bottom anchors: wrapper bottom-8 (2 rem) + panel bottom-12 (3 rem) = 5 rem offset from
//                the viewport bottom → reserve 5.5 rem (0.5 rem breathing room at top).
export const PANEL_ANCHOR_MAX_H_CLASS: Record<ControlPanelAnchor, string> = {
	'top-left': 'max-h-[calc(100dvh-6.5rem)]',
	'top-right': 'max-h-[calc(100dvh-6.5rem)]',
	'bottom-left': 'max-h-[calc(100dvh-5.5rem)]',
	'bottom-right': 'max-h-[calc(100dvh-5.5rem)]'
};

export const PANEL_SCALE_ORIGIN: Record<ControlPanelAnchor, string> = {
	'top-left': 'top left',
	'top-right': 'top right',
	'bottom-left': 'bottom left',
	'bottom-right': 'bottom right'
};
