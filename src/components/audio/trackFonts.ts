import type { WallpaperState } from '@/types/wallpaper';

export type TrackFontStyle = WallpaperState['audioTrackTitleFontStyle'];

// Bundled web fonts (loaded via @fontsource in main.tsx) lead each stack so the
// look is consistent across machines; system fonts remain as fallbacks.
export const TRACK_TITLE_FONT_STACKS: Record<TrackFontStyle, string> = {
	clean: '"Inter", "Segoe UI", "Helvetica Neue", Arial, "Noto Sans", "PingFang SC", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
	condensed:
		'"Oswald", "Arial Narrow", "Roboto Condensed", "Segoe UI", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
	techno: '"Orbitron", "Eurostile", "Trebuchet MS", Verdana, "Segoe UI", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
	mono: '"Space Mono", "SFMono-Regular", Consolas, "Liberation Mono", "Noto Sans Mono", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", monospace',
	serif: '"Playfair Display", Georgia, "Times New Roman", "Noto Serif", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", serif',
	display:
		'"Bebas Neue", "Oswald", "Impact", "Haettenschweiler", "Arial Narrow Bold", sans-serif',
	rounded:
		'"Nunito", "Quicksand", "Varela Round", "Segoe UI", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
	handwritten:
		'"Caveat", "Comic Sans MS", "Bradley Hand", "Segoe Script", cursive'
};

export const TRACK_TITLE_FONT_WEIGHT: Record<TrackFontStyle, number> = {
	clean: 700,
	condensed: 700,
	techno: 800,
	mono: 700,
	serif: 700,
	display: 400,
	rounded: 800,
	handwritten: 700
};

export const TRACK_TITLE_STYLE_SPACING_BONUS: Record<TrackFontStyle, number> = {
	clean: 0,
	condensed: 0.8,
	techno: 2.6,
	mono: 1.2,
	serif: 0.3,
	display: 1.6,
	rounded: 0,
	handwritten: 0
};

export function buildTrackFont(
	fontStyle: TrackFontStyle,
	fontSize: number,
	weight?: number
): string {
	return `${weight ?? TRACK_TITLE_FONT_WEIGHT[fontStyle]} ${fontSize}px ${TRACK_TITLE_FONT_STACKS[fontStyle]}`;
}

// Canvas only paints a web font once the browser has actually loaded the face.
// Nothing in the DOM uses these families, so we explicitly warm them at startup;
// otherwise the first frames fall back to system fonts until a later repaint.
const FONT_WARMUP: ReadonlyArray<readonly [string, number]> = [
	['Inter', 700],
	['Oswald', 700],
	['Orbitron', 800],
	['Space Mono', 700],
	['Playfair Display', 700],
	['Bebas Neue', 400],
	['Nunito', 800],
	['Caveat', 700]
];

let warmed = false;

export function ensureTrackFontsLoaded(): void {
	if (warmed || typeof document === 'undefined' || !document.fonts) return;
	warmed = true;
	for (const [family, weight] of FONT_WARMUP) {
		void document.fonts.load(`${weight} 32px "${family}"`).catch(() => {
			/* font unavailable — stacks fall back to system fonts */
		});
	}
}
