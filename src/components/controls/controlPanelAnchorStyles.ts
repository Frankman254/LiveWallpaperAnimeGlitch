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


export const PANEL_SCALE_ORIGIN: Record<ControlPanelAnchor, string> = {
	'top-left': 'top left',
	'top-right': 'top right',
	'bottom-left': 'bottom left',
	'bottom-right': 'bottom right'
};
