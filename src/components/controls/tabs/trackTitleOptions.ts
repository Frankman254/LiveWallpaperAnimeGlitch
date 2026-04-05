import type {
	TrackTitleFontStyle,
	TrackTitleLayoutMode
} from '@/types/wallpaper';

export const TRACK_TITLE_LAYOUTS: TrackTitleLayoutMode[] = [
	'free',
	'centered',
	'left-dock',
	'right-dock'
];
export const TRACK_TITLE_LAYOUT_LABELS: Record<TrackTitleLayoutMode, string> = {
	free: 'Free',
	centered: 'Centered',
	'left-dock': 'Left Dock',
	'right-dock': 'Right Dock'
};

export const TRACK_TITLE_FONTS: TrackTitleFontStyle[] = [
	'clean',
	'condensed',
	'techno',
	'mono',
	'serif'
];
export const TRACK_TITLE_FONT_LABELS: Record<TrackTitleFontStyle, string> = {
	clean: 'Clean',
	condensed: 'Condensed',
	techno: 'Techno',
	mono: 'Mono',
	serif: 'Serif'
};
