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
		(top, current) => (current.saturation > top.saturation ? current : top),
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
	'--lwag-accent': '#67e8f9',
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

// ─────────────────────────────────────────────────────────────────────────────
// THEME ISOLATION
// ─────────────────────────────────────────────────────────────────────────────
// Each `ThemeColorSource` resolves to a COMPLETE CSS var set built from ONLY
// its own inputs. There is no cross-source fallback inside a branch — if a
// source has nothing to draw from (e.g. image source with no image), it uses
// `NEUTRAL_NO_INPUT_PALETTE` so the switch is visibly distinct from theme.
//
// Rainbow boost is now applied uniformly when `editorTheme === 'rainbow'`
// regardless of source so manual users on rainbow theme still get the
// vibrant chrome treatment (text/swatch overrides only kick in when their
// branch already used neutral text).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Neutral fallback palette for sources that have no live input
 * (e.g. image source while no image is loaded). Intentionally desaturated so
 * the user sees that NEITHER theme NOR image is contributing.
 */
const NEUTRAL_NO_INPUT_PALETTE: BackgroundPalette = {
	sourceUrl: 'neutral:no-input',
	colors: ['#94a3b8', '#cbd5e1', '#64748b', '#475569', '#334155', '#1e293b'],
	dominant: '#94a3b8',
	secondary: '#64748b',
	rainbow: ['#94a3b8', '#cbd5e1', '#64748b', '#475569', '#334155', '#1e293b'],
	accent: '#94a3b8',
	backdrop: '#1e293b'
};

type VisualOpts = {
	backdropOpacity: number;
	blurPx: number;
	surfaceOpacity: number;
	itemOpacity: number;
};

function clampVisualOptions(opts?: EditorVisualOptions): VisualOpts {
	return {
		backdropOpacity: Math.min(
			0.96,
			Math.max(0.08, opts?.backdropOpacity ?? 0.84)
		),
		blurPx: Math.max(0, opts?.blurPx ?? 18),
		surfaceOpacity: Math.min(
			0.96,
			Math.max(0.01, opts?.surfaceOpacity ?? 0.34)
		),
		itemOpacity: Math.min(0.96, Math.max(0.01, opts?.itemOpacity ?? 0.28))
	};
}

/** Vars shared across every branch — built from the working palette only. */
function buildChromeVarsFromPalette(
	palette: BackgroundPalette,
	chromaAccent: string,
	accentSoft: string,
	accentMuted: string,
	opts: VisualOpts
): Record<string, string> {
	const secondaryTone = palette.secondary;
	const shellBg = mixHexColorsRgba(
		palette.backdrop,
		'#020617',
		0.18,
		opts.backdropOpacity
	);
	const hudBg = mixHexColorsRgba(
		palette.backdrop,
		'#020617',
		0.32,
		Math.min(0.94, opts.surfaceOpacity * 0.92)
	);
	// surfaceBg is the "raised inner surface" — slightly lifted from shell.
	const surfaceBg = mixHexColorsRgba(
		palette.backdrop,
		'#0b1120',
		0.22,
		Math.min(0.94, opts.surfaceOpacity)
	);
	// editorBg is the "outer card background" — slightly darker than tag-bg
	// so SectionCard / list items separate visually from their contents.
	const editorBg = mixHexColorsRgba(
		palette.backdrop,
		'#020617',
		0.36,
		Math.min(0.92, opts.surfaceOpacity * 1.05)
	);
	const headerBg = mixHexColorsRgba(
		secondaryTone,
		palette.backdrop,
		0.68,
		Math.min(
			0.96,
			Math.max(opts.surfaceOpacity * 0.86, opts.backdropOpacity * 0.42)
		)
	);
	const tabBarBg = mixHexColorsRgba(
		secondaryTone,
		palette.backdrop,
		0.72,
		Math.min(
			0.92,
			Math.max(opts.surfaceOpacity * 0.82, opts.backdropOpacity * 0.34)
		)
	);
	const accentBorder = mixHexColors(chromaAccent, '#ffffff', 0.22);
	return {
		'--editor-accent-color': chromaAccent,
		'--lwag-accent': chromaAccent,
		'--editor-accent-fg': accentSoft,
		'--editor-accent-soft': accentSoft,
		'--editor-accent-muted': accentMuted,
		'--editor-accent-border': accentBorder,
		'--editor-bg': editorBg,
		'--editor-surface-bg': surfaceBg,
		'--editor-shell-bg': shellBg,
		'--editor-shell-border': mixHexColors(secondaryTone, '#ffffff', 0.3),
		'--editor-header-bg': headerBg,
		'--editor-header-border': mixHexColors(secondaryTone, '#ffffff', 0.24),
		'--editor-tabbar-bg': tabBarBg,
		'--editor-tabbar-border': mixHexColors(secondaryTone, '#ffffff', 0.18),
		'--editor-hud-bg': hudBg,
		'--editor-shell-blur': `${opts.blurPx}px`
	};
}

/** Strictly manual: uses ONLY user-picked manual palette + manual text. */
function buildManualVars(
	manualColors: Partial<EditorManualColors>,
	manualPalette: BackgroundPalette,
	opts: VisualOpts
): Record<string, string> {
	const chromaAccent = manualPalette.accent;
	const accentSoft = manualColors.textPrimary ?? '#ffffff';
	const accentMuted =
		manualColors.textSecondary ??
		mixHexColors(
			manualColors.textPrimary ?? '#ffffff',
			manualPalette.backdrop,
			0.28
		);
	const chrome = buildChromeVarsFromPalette(
		manualPalette,
		chromaAccent,
		accentSoft,
		accentMuted,
		opts
	);
	const buttonBg = mixHexColorsRgba(
		manualPalette.secondary,
		manualPalette.backdrop,
		0.42,
		opts.itemOpacity
	);
	const buttonBorder = mixHexColorsRgba(
		manualPalette.secondary,
		manualPalette.accent,
		0.22,
		0.82
	);
	const activeBg = mixHexColorsRgba(
		manualPalette.accent,
		manualPalette.backdrop,
		0.12,
		Math.min(0.95, opts.itemOpacity * 1.2)
	);
	const activeFg = manualColors.textPrimary ?? '#ffffff';
	const tagBorder = mixHexColorsRgba(
		manualPalette.secondary,
		manualPalette.accent,
		0.28,
		0.52
	);
	const tagBg = mixHexColorsRgba(
		manualPalette.backdrop,
		manualPalette.secondary,
		0.1,
		opts.itemOpacity
	);
	const tagFg =
		manualColors.textSecondary ??
		mixHexColors(
			manualColors.textPrimary ?? '#ffffff',
			manualPalette.backdrop,
			0.28
		);
	return {
		...chrome,
		'--editor-button-bg': buttonBg,
		'--editor-button-fg': accentSoft,
		'--editor-button-border': buttonBorder,
		'--editor-tag-bg': tagBg,
		'--editor-tag-border': tagBorder,
		'--editor-tag-fg': tagFg,
		'--editor-active-bg': activeBg,
		'--editor-active-fg': activeFg
	};
}

/** Strictly palette-driven (theme or image). */
function buildPaletteVars(
	palette: BackgroundPalette,
	opts: VisualOpts
): Record<string, string> {
	const chromaAccent = pickChromaticAccent(palette);
	// theme/image modes always use a stable near-white text so contrast doesn't
	// fight whichever image or theme palette is active.
	const accentSoft = '#f0f4ff';
	const accentMuted = 'rgba(240, 244, 255, 0.62)';
	const accentText = pickReadableAccent(palette);
	const chrome = buildChromeVarsFromPalette(
		palette,
		chromaAccent,
		accentSoft,
		accentMuted,
		opts
	);
	const buttonBg = mixHexColors(chromaAccent, '#020617', 0.72);
	const accentBorder = chrome['--editor-accent-border']!;
	const activeBg = mixHexColorsRgba(
		chromaAccent,
		'#ffffff',
		0.16,
		Math.min(0.96, Math.max(opts.itemOpacity * 1.5, 0.82))
	);
	const tagBorder = mixHexColorsRgba(chromaAccent, '#ffffff', 0.18, 0.28);
	const tagBg = mixHexColorsRgba(
		chromaAccent,
		palette.backdrop,
		0.12,
		opts.itemOpacity
	);
	const tagFg = mixHexColors(accentText, '#ffffff', 0.06);
	return {
		...chrome,
		'--editor-button-bg': buttonBg,
		'--editor-button-fg': accentSoft,
		'--editor-button-border': accentBorder,
		'--editor-tag-bg': tagBg,
		'--editor-tag-border': tagBorder,
		'--editor-tag-fg': tagFg,
		'--editor-active-bg': activeBg,
		'--editor-active-fg': getReadableForeground(activeBg)
	};
}

/** Rainbow chrome boost — applied uniformly across every source. */
function applyRainbowBoost(
	vars: Record<string, string>,
	palette: BackgroundPalette,
	opts: VisualOpts
): Record<string, string> {
	const chromaAccent = pickChromaticAccent(palette);
	return {
		...vars,
		'--editor-shell-bg': mixHexColorsRgba(
			palette.backdrop,
			'#020617',
			0.15,
			opts.backdropOpacity
		),
		'--editor-header-bg': mixHexColorsRgba(
			chromaAccent,
			palette.backdrop,
			0.75,
			Math.min(0.94, opts.surfaceOpacity * 1.2)
		),
		'--editor-tabbar-bg': mixHexColorsRgba(
			palette.secondary,
			palette.backdrop,
			0.78,
			Math.min(0.92, opts.surfaceOpacity * 1.1)
		),
		'--editor-surface-bg': mixHexColorsRgba(
			palette.backdrop,
			'#0b1120',
			0.25,
			Math.min(0.94, opts.surfaceOpacity)
		),
		'--editor-accent-fg': '#ffffff',
		'--editor-accent-soft': '#ffffff',
		'--editor-accent-muted': 'rgba(255, 255, 255, 0.7)',
		'--editor-tag-fg': '#ffffff',
		'--editor-button-bg': mixHexColorsRgba(
			chromaAccent,
			palette.backdrop,
			0.5,
			opts.itemOpacity
		),
		'--editor-active-bg': mixHexColorsRgba(
			chromaAccent,
			'#ffffff',
			0.1,
			Math.min(0.95, opts.itemOpacity * 1.4)
		)
	};
}

export function getEditorThemeColorVars(
	source: ThemeColorSource,
	backgroundPalette: BackgroundPalette,
	editorTheme: EditorTheme,
	manualColors?: Partial<EditorManualColors>,
	visualOptions?: EditorVisualOptions
): CSSProperties {
	const opts = clampVisualOptions(visualOptions);
	const manualPalette = getManualPalette(manualColors);

	let vars: Record<string, string>;
	let paletteForRainbow: BackgroundPalette;

	if (source === 'manual' && manualPalette) {
		vars = buildManualVars(manualColors ?? {}, manualPalette, opts);
		paletteForRainbow = manualPalette;
	} else if (source === 'image' && backgroundPalette.sourceUrl) {
		vars = buildPaletteVars(backgroundPalette, opts);
		paletteForRainbow = backgroundPalette;
	} else if (source === 'image') {
		// no image loaded — neutral fallback so the switch is visibly distinct
		vars = buildPaletteVars(NEUTRAL_NO_INPUT_PALETTE, opts);
		paletteForRainbow = NEUTRAL_NO_INPUT_PALETTE;
	} else {
		// 'theme' or 'manual' with missing manualPalette → theme palette
		const themePalette = getEditorThemePalette(editorTheme);
		vars = buildPaletteVars(themePalette, opts);
		paletteForRainbow = themePalette;
	}

	if (editorTheme === 'rainbow') {
		vars = applyRainbowBoost(vars, paletteForRainbow, opts);
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
	// Spread DEFAULTS first so any var the branch fails to set still has a
	// concrete value — this is the last line of defence against silent leaks
	// where a missing override would inherit from the document element.
	return {
		...(DEFAULT_EDITOR_COLOR_VARS as CSSProperties),
		...getEditorThemeColorVars(
			source,
			palette,
			editorTheme,
			manualColors,
			visualOptions
		)
	};
}

/**
 * Canonical UI color resolver — alias of `getScopedEditorThemeColorVars`.
 *
 * Per design-system spec: UI shell colors flow through ONE resolver. Content
 * colors (spectrum/logo/particles/rain/track/lyrics) have their own per-feature
 * resolvers in `@/features/*` and intentionally do NOT share this pipeline so
 * a UI theme change can never bleed into content rendering.
 */
export const resolveUIColor = getScopedEditorThemeColorVars;
