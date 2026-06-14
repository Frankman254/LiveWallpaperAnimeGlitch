import type { WallpaperState } from '@/types/wallpaper';

export type TrackFontStyle = WallpaperState['audioTrackTitleFontStyle'];

export const TRACK_TITLE_FONT_STACKS: Record<TrackFontStyle, string> = {
	clean: '"Inter", "Segoe UI", "Helvetica Neue", Arial, "Noto Sans", "Apple SD Gothic Neo", "PingFang SC", "Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols 2", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
	condensed:
		'"Arial Narrow", "Roboto Condensed", "Segoe UI", Arial, "Noto Sans", "PingFang SC", "Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols 2", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
	techno: '"Orbitron", "Eurostile", "Trebuchet MS", Verdana, "Segoe UI", "Noto Sans", "PingFang SC", "Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols 2", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
	mono: '"SFMono-Regular", Consolas, "Liberation Mono", "Noto Sans Mono", "PingFang SC", "Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols 2", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", monospace',
	serif: 'Georgia, "Times New Roman", "Noto Serif", "Songti SC", "Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols 2", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", serif'
};

export const TRACK_TITLE_FONT_WEIGHT: Record<TrackFontStyle, number> = {
	clean: 700,
	condensed: 800,
	techno: 800,
	mono: 700,
	serif: 700
};

export const TRACK_TITLE_STYLE_SPACING_BONUS: Record<TrackFontStyle, number> = {
	clean: 0,
	condensed: 0.8,
	techno: 2.6,
	mono: 1.2,
	serif: 0.3
};

export function buildTrackFont(
	fontStyle: TrackFontStyle,
	fontSize: number,
	weight?: number
): string {
	return `${weight ?? TRACK_TITLE_FONT_WEIGHT[fontStyle]} ${fontSize}px ${TRACK_TITLE_FONT_STACKS[fontStyle]}`;
}
