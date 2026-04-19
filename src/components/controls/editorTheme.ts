import type { CSSProperties } from 'react';
import type { ThemeColorSource, EditorTheme } from '@/types/wallpaper';
import {
	getEditorThemePalette,
	type BackgroundPalette
} from '@/lib/backgroundPalette';

export type EditorManualColors = {
	accent: string;
	secondary: string;
	backdrop: string;
	textPrimary?: string;
	textSecondary?: string;
};

export type EditorVisualOptions = {
	backdropOpacity?: number;
	blurPx?: number;
	surfaceOpacity?: number;
	itemOpacity?: number;
};

export type { EditorThemeClasses } from './editorThemeClasses';
export { EDITOR_THEME_CLASSES } from './editorThemeClasses';

function hexToRgb(hex: string): [number, number, number] {
	const clean = hex.replace('#', '');
	return [
		parseInt(clean.slice(0, 2), 16),
		parseInt(clean.slice(2, 4), 16),
		parseInt(clean.slice(4, 6), 16)
	];
}

function mixHexColors(a: string, b: string, amount: number): string {
	const [r1, g1, b1] = hexToRgb(a);
	const [r2, g2, b2] = hexToRgb(b);
	return `rgb(${Math.round(r1 + (r2 - r1) * amount)}, ${Math.round(
		g1 + (g2 - g1) * amount
	)}, ${Math.round(b1 + (b2 - b1) * amount)})`;
}

/** Mix two hex colors and apply an alpha value in one step. */
function mixHexColorsRgba(
	a: string,
	b: string,
	mixAmount: number,
	alpha: number
): string {
	const [r1, g1, b1] = hexToRgb(a);
	const [r2, g2, b2] = hexToRgb(b);
	const safeAlpha = Math.min(1, Math.max(0, alpha));
	return `rgba(${Math.round(r1 + (r2 - r1) * mixAmount)}, ${Math.round(
		g1 + (g2 - g1) * mixAmount
	)}, ${Math.round(b1 + (b2 - b1) * mixAmount)}, ${safeAlpha})`;
}



function getRelativeLuminance(hex: string): number {
	const [r, g, b] = hexToRgb(hex).map(channel => {
		const normalized = channel / 255;
		return normalized <= 0.03928
			? normalized / 12.92
			: ((normalized + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getSaturationScore(hex: string): number {
	const [r, g, b] = hexToRgb(hex);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	return max === 0 ? 0 : (max - min) / max;
}

function getReadableForeground(hex: string): string {
	return getRelativeLuminance(hex) >= 0.42 ? '#020617' : '#f8fafc';
}

function pickReadableAccent(palette: BackgroundPalette): string {
	const candidates = [
		palette.accent,
		palette.dominant,
		palette.secondary,
		...palette.colors
	].filter(Boolean);
	const brightest = candidates.reduce(
		(best, current) =>
			getRelativeLuminance(current) > getRelativeLuminance(best)
				? current
				: best,
		candidates[0] ?? '#ffffff'
	);
	return getRelativeLuminance(brightest) >= 0.34 ? brightest : '#ffffff';
}

function pickChromaticAccent(palette: BackgroundPalette): string {
	const candidates = [
		palette.accent,
		palette.secondary,
		palette.dominant,
		...palette.colors
	].filter(Boolean);
	const ranked = candidates
		.map(color => ({
			color,
			luminance: getRelativeLuminance(color),
			saturation: getSaturationScore(color)
		}))
		.filter(candidate => candidate.luminance >= 0.14);
	const best = ranked.reduce(
		(top, current) =>
			current.saturation > top.saturation ? current : top,
		ranked[0] ?? {
			color: palette.secondary,
			luminance: getRelativeLuminance(palette.secondary),
			saturation: getSaturationScore(palette.secondary)
		}
	);
	return best?.color ?? '#67e8f9';
}

export const DEFAULT_EDITOR_COLOR_VARS = {
	'--editor-accent-color': '#67e8f9',
	/** Primary foreground for titles / list rows (was referenced as --editor-accent-fg in tabs). */
	'--editor-accent-fg': '#ffffff',
	'--editor-accent-soft': '#ffffff',
	'--editor-accent-muted': 'rgba(255, 255, 255, 0.66)',
	'--editor-accent-border': 'rgba(103, 232, 249, 0.5)',
	/** Unselected card / control surface behind list tiles. */
	'--editor-bg': 'rgba(103, 232, 249, 0.08)',
	'--editor-surface-bg': 'rgba(255, 255, 255, 0.06)',
	'--editor-shell-bg': 'rgba(7, 10, 18, 0.88)',
	'--editor-shell-border': 'rgba(103, 232, 249, 0.28)',
	'--editor-header-bg': 'rgba(255, 255, 255, 0.04)',
	'--editor-header-border': 'rgba(103, 232, 249, 0.2)',
	'--editor-tabbar-bg': 'rgba(255, 255, 255, 0.03)',
	'--editor-tabbar-border': 'rgba(103, 232, 249, 0.18)',
	'--editor-button-bg': 'rgba(103, 232, 249, 0.1)',
	'--editor-button-fg': '#ffffff',
	'--editor-button-border': 'rgba(103, 232, 249, 0.42)',
	'--editor-tag-bg': 'rgba(103, 232, 249, 0.08)',
	'--editor-tag-border': 'rgba(103, 232, 249, 0.42)',
	'--editor-tag-fg': '#ffffff',
	'--editor-hud-bg': 'rgba(10, 15, 26, 0.58)',
	'--editor-active-bg': '#67e8f9',
	'--editor-active-fg': '#020617',
	'--editor-shell-blur': '18px',
	'--editor-radius-sm': '6px',
	'--editor-radius-md': '10px',
	'--editor-radius-lg': '14px',
	'--editor-radius-xl': '18px'
} as const;

export function getEditorRadiusVars(
	shellCornerRadius: number,
	controlCornerRadius = shellCornerRadius
): CSSProperties {
	const shellBase = Number.isFinite(shellCornerRadius)
		? Math.min(28, Math.max(0, shellCornerRadius))
		: 10;
	const controlBase = Number.isFinite(controlCornerRadius)
		? Math.min(28, Math.max(0, controlCornerRadius))
		: 10;
	const sm = Math.round(controlBase * 0.6);
	const md = Math.round(controlBase);
	const lg = Math.round(shellBase * 1.35);
	const xl = Math.round(shellBase * 1.7);
	return {
		'--editor-radius-sm': `${sm}px`,
		'--editor-radius-md': `${md}px`,
		'--editor-radius-lg': `${lg}px`,
		'--editor-radius-xl': `${xl}px`
	} as CSSProperties;
}

function getManualPalette(
	manualColors?: Partial<EditorManualColors>
): BackgroundPalette | null {
	if (
		!manualColors?.accent ||
		!manualColors?.secondary ||
		!manualColors?.backdrop
	) {
		return null;
	}

	return {
		sourceUrl: 'manual:editor',
		colors: [
			manualColors.accent,
			manualColors.secondary,
			mixHexColors(manualColors.accent, '#ffffff', 0.18),
			mixHexColors(manualColors.secondary, '#ffffff', 0.14),
			mixHexColors(manualColors.accent, manualColors.secondary, 0.5),
			mixHexColors(manualColors.secondary, manualColors.backdrop, 0.32)
		],
		dominant: manualColors.accent,
		secondary: manualColors.secondary,
		rainbow: [
			manualColors.accent,
			mixHexColors(manualColors.accent, manualColors.secondary, 0.25),
			manualColors.secondary,
			mixHexColors(manualColors.secondary, '#ffffff', 0.2),
			mixHexColors(manualColors.accent, '#ffffff', 0.12),
			mixHexColors(manualColors.secondary, manualColors.backdrop, 0.2)
		],
		accent: manualColors.accent,
		backdrop: manualColors.backdrop
	};
}

export function getEditorThemeColorVars(
	source: ThemeColorSource,
	backgroundPalette: BackgroundPalette,
	editorTheme: EditorTheme,
	manualColors?: Partial<EditorManualColors>,
	visualOptions?: EditorVisualOptions
): CSSProperties | undefined {
	const manualPalette = getManualPalette(manualColors);
	// background mode never falls back to manual colors — it uses theme as its
	// no-image fallback so that switching modes produces independent results.
	const palette =
		source === 'image'
			? backgroundPalette.sourceUrl
				? backgroundPalette
				: getEditorThemePalette(editorTheme)
			: source === 'manual'
				? manualPalette ?? getEditorThemePalette(editorTheme)
				: getEditorThemePalette(editorTheme);
	const isManual = source === 'manual' && Boolean(manualPalette);
	const chromaAccent = isManual
		? manualPalette!.accent
		: pickChromaticAccent(palette);
	const accentText = isManual
		? manualColors?.textPrimary ?? '#ffffff'
		: pickReadableAccent(palette);
	// In theme/background modes text must be a stable near-white so it remains
	// readable regardless of which image or theme palette is active.
	// Only manual mode lets the user override these with custom colors.
	const accentSoft = isManual
		? manualColors?.textPrimary ?? '#ffffff'
		: '#f0f4ff';
	const accentMuted = isManual
		? manualColors?.textSecondary ??
			mixHexColors(manualColors?.textPrimary ?? '#ffffff', manualPalette!.backdrop, 0.28)
		: 'rgba(240, 244, 255, 0.62)';
	const backdropOpacity = Math.min(
		0.96,
		Math.max(0.08, visualOptions?.backdropOpacity ?? 0.84)
	);
	const blurPx = Math.max(0, visualOptions?.blurPx ?? 18);
	const surfaceOpacity = Math.min(
		0.96,
		Math.max(0.01, visualOptions?.surfaceOpacity ?? 0.34)
	);
	const itemOpacity = Math.min(
		0.96,
		Math.max(0.01, visualOptions?.itemOpacity ?? 0.28)
	);

	// All backgrounds are opacity-aware regardless of source so that the
	// opacity and blur sliders have visible effect in every color mode.
	const shellBg = mixHexColorsRgba(
		palette.backdrop,
		'#020617',
		0.18,
		backdropOpacity
	);
	const hudBg = mixHexColorsRgba(
		palette.backdrop,
		'#020617',
		0.32,
		Math.min(0.94, surfaceOpacity * 0.92)
	);
	const surfaceBg = mixHexColorsRgba(
		palette.backdrop,
		'#0b1120',
		0.22,
		Math.min(0.94, surfaceOpacity)
	);
	const headerBg = mixHexColorsRgba(
		chromaAccent,
		palette.backdrop,
		0.72,
		Math.min(0.96, Math.max(surfaceOpacity * 0.86, backdropOpacity * 0.42))
	);
	const tabBarBg = mixHexColorsRgba(
		palette.secondary,
		palette.backdrop,
		0.74,
		Math.min(0.92, Math.max(surfaceOpacity * 0.82, backdropOpacity * 0.34))
	);

	const buttonBg = isManual
		? mixHexColorsRgba(
				manualPalette!.accent,
				manualPalette!.backdrop,
				0.48,
				itemOpacity
			)
		: mixHexColors(chromaAccent, '#020617', 0.72);
	const activeBg = isManual
		? mixHexColorsRgba(
				manualPalette!.accent,
				manualPalette!.backdrop,
				0.12,
				Math.min(0.95, itemOpacity * 1.2)
			)
		: mixHexColorsRgba(
				chromaAccent,
				'#ffffff',
				0.16,
				Math.min(0.96, Math.max(itemOpacity * 1.5, 0.82))
			);
	const activeFg = isManual
		? manualColors?.textPrimary ?? '#ffffff'
		: getReadableForeground(activeBg);
	const accentBorder = mixHexColors(chromaAccent, '#ffffff', 0.22);

	// Inactive/tag elements should be very dark with only a faint accent tint.
	// Using a low mix ratio prevents primary color bleed on unselected items.
	const tagBorder = isManual
		? mixHexColorsRgba(
				manualPalette!.accent,
				manualPalette!.secondary,
				0.2,
				0.48
			)
		: mixHexColorsRgba(chromaAccent, '#ffffff', 0.18, 0.28);
	const tagBg = isManual
		? mixHexColorsRgba(
				manualPalette!.backdrop,
				manualPalette!.accent,
				0.08,
				itemOpacity
			)
		: mixHexColorsRgba(chromaAccent, palette.backdrop, 0.12, itemOpacity);
	const tagFg = isManual
		? manualColors?.textSecondary ??
			mixHexColors(manualColors?.textPrimary ?? '#ffffff', manualPalette!.backdrop, 0.28)
		: mixHexColors(accentText, '#ffffff', 0.06);

	const vars: Record<string, string> = {
		'--editor-accent-color': chromaAccent,
		'--editor-accent-fg': accentSoft,
		'--editor-accent-soft': accentSoft,
		'--editor-accent-muted': accentMuted,
		'--editor-accent-border': accentBorder,
		'--editor-bg': tagBg,
		'--editor-surface-bg': surfaceBg,
		'--editor-shell-bg': shellBg,
		'--editor-shell-border': mixHexColors(chromaAccent, '#ffffff', 0.3),
		'--editor-header-bg': headerBg,
		'--editor-header-border': mixHexColors(chromaAccent, '#ffffff', 0.24),
		'--editor-tabbar-bg': tabBarBg,
		'--editor-tabbar-border': mixHexColors(chromaAccent, '#ffffff', 0.18),
		'--editor-button-bg': buttonBg,
		'--editor-button-fg': accentSoft,
		'--editor-button-border': accentBorder,
		'--editor-tag-bg': tagBg,
		'--editor-tag-border': tagBorder,
		'--editor-tag-fg': tagFg,
		'--editor-hud-bg': hudBg,
		'--editor-active-bg': activeBg,
		'--editor-active-fg': activeFg,
		'--editor-shell-blur': `${blurPx}px`
	};

	// Rainbow theme: boost chrome for theme/image sources. Manual source keeps user text/swatch colors.
	if (editorTheme === 'rainbow' && source !== 'manual') {
		// Respect manual sliders even in Rainbow mode for a fully responsive UI.
		// We use slightly higher opacity bases to ensure the rainbow gradients remain clearly visible.
		vars['--editor-shell-bg'] = mixHexColorsRgba(palette.backdrop, '#020617', 0.15, backdropOpacity);
		vars['--editor-header-bg'] = mixHexColorsRgba(chromaAccent, palette.backdrop, 0.75, Math.min(0.94, surfaceOpacity * 1.2));
		vars['--editor-tabbar-bg'] = mixHexColorsRgba(palette.secondary, palette.backdrop, 0.78, Math.min(0.92, surfaceOpacity * 1.1));
		vars['--editor-surface-bg'] = mixHexColorsRgba(palette.backdrop, '#0b1120', 0.25, Math.min(0.94, surfaceOpacity));
		
		// Text elements in Rainbow mode should remain high-contrast (vibrant white/silver)
		// to be readable over the moving colorful background.
		vars['--editor-accent-fg'] = '#ffffff';
		vars['--editor-accent-soft'] = '#ffffff';
		vars['--editor-accent-muted'] = 'rgba(255, 255, 255, 0.7)';
		vars['--editor-tag-fg'] = '#ffffff';
		vars['--editor-bg'] = vars['--editor-tag-bg'] ?? tagBg;

		// Button and active states in Rainbow already have strong CSS gradients,
		// but we still want them to respect the item opacity for a cohesive look.
		vars['--editor-button-bg'] = mixHexColorsRgba(chromaAccent, palette.backdrop, 0.5, itemOpacity);
		vars['--editor-active-bg'] = mixHexColorsRgba(chromaAccent, '#ffffff', 0.1, Math.min(0.95, itemOpacity * 1.4));
	}

	return vars as CSSProperties;
}

export function getScopedEditorThemeColorVars(
	source: ThemeColorSource,
	palette: BackgroundPalette,
	editorTheme: EditorTheme,
	manualColors?: Partial<EditorManualColors>,
	visualOptions?: EditorVisualOptions
): CSSProperties {
	return (
		getEditorThemeColorVars(
			source,
			palette,
			editorTheme,
			manualColors,
			visualOptions
		) ??
		(DEFAULT_EDITOR_COLOR_VARS as CSSProperties)
	);
}

