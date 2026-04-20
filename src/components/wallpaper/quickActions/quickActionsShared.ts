export const PANEL_WIDTH = 808;
export const PANEL_DEFAULT_HEIGHT = 172;
export const PANEL_MARGIN = 12;

export const EDITOR_THEMES = [
	'cyber',
	'glass',
	'sunset',
	'terminal',
	'midnight',
	'carbon',
	'aurora',
	'rose',
	'ocean',
	'amber',
	'rainbow'
] as const;

export type EditorThemeOption = (typeof EDITOR_THEMES)[number];

export type ExpandPanel =
	| 'layers'
	| 'looks'
	| 'looks_slots'
	| 'spectrum'
	| 'spectrum_slots'
	| 'motion'
	| 'motion_slots'
	| 'particles_slots'
	| 'rain_slots'
	| 'audio'
	| 'logo'
	| 'logo_slots'
	| 'title'
	| 'title_slots'
	| 'system'
	| 'themes'
	| null;

export function normalizedToPixel(
	norm: number,
	elementSize: number,
	viewportSize: number,
	margin: number
): number {
	const usable = Math.max(0, viewportSize - elementSize - margin * 2);
	return margin + Math.min(1, Math.max(0, norm)) * usable;
}

export function formatClock(totalSeconds: number): string {
	if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '00:00';
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = Math.floor(totalSeconds % 60);
	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
