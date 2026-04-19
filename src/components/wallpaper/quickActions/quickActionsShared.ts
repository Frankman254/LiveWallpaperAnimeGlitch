export const PANEL_WIDTH = 808;
export const PANEL_MIN_HEIGHT = 172;
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
	| 'spectrum'
	| 'motion'
	| 'audio'
	| 'logo'
	| 'title'
	| 'system'
	| 'slots'
	| 'logo_slots'
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
