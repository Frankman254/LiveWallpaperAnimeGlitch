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
};

export type EditorThemeClasses = {
	launcher: string;
	launcherOpen: string;
	launcherIcon: string;
	launcherImageRing: string;
	panelShell: string;
	panelHeader: string;
	panelTitle: string;
	panelSubtle: string;
	actionButton: string;
	tabBar: string;
	tabActive: string;
	tabInactive: string;
	overlayShell: string;
	overlayTopBar: string;
	overlayClose: string;
	sectionShell: string;
	sectionHeader: string;
	sectionTitle: string;
	controlAccent: string;
	toggleOn: string;
	toggleOff: string;
};

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
	'--editor-accent-soft': '#ffffff',
	'--editor-accent-muted': 'rgba(255, 255, 255, 0.66)',
	'--editor-accent-border': 'rgba(103, 232, 249, 0.5)',
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

export function getEditorRadiusVars(cornerRadius: number): CSSProperties {
	const base = Number.isFinite(cornerRadius)
		? Math.min(28, Math.max(2, cornerRadius))
		: 10;
	return {
		'--editor-radius-sm': `${Math.max(2, Math.round(base * 0.6))}px`,
		'--editor-radius-md': `${Math.round(base)}px`,
		'--editor-radius-lg': `${Math.round(base + 4)}px`,
		'--editor-radius-xl': `${Math.round(base + 8)}px`
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
	const palette =
		source === 'background'
			? backgroundPalette.sourceUrl
				? backgroundPalette
				: manualPalette ?? getEditorThemePalette(editorTheme)
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
	const accentSoft = isManual
		? manualColors?.textPrimary ?? '#ffffff'
		: mixHexColors(accentText, '#ffffff', 0.18);
	const accentMuted = isManual
		? manualColors?.textSecondary ??
			mixHexColors(manualColors?.textPrimary ?? '#ffffff', manualPalette!.backdrop, 0.28)
		: mixHexColors(accentText, palette.backdrop, 0.22);
	const backdropOpacity = Math.min(
		0.96,
		Math.max(0.08, visualOptions?.backdropOpacity ?? 0.84)
	);
	const blurPx = Math.max(0, visualOptions?.blurPx ?? 18);
	const surfaceOpacity = Math.min(
		0.96,
		Math.max(0.08, visualOptions?.surfaceOpacity ?? 0.34)
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
				Math.min(0.9, Math.max(surfaceOpacity * 0.78, backdropOpacity * 0.22))
			)
		: mixHexColors(chromaAccent, '#020617', 0.72);
	const activeBg = isManual
		? mixHexColorsRgba(
				manualPalette!.accent,
				manualPalette!.backdrop,
				0.12,
				Math.min(0.95, backdropOpacity * 0.82)
			)
		: mixHexColorsRgba(
				chromaAccent,
				'#ffffff',
				0.16,
				Math.min(0.96, Math.max(surfaceOpacity * 0.92, 0.82))
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
				Math.min(0.96, Math.max(surfaceOpacity * 0.92, backdropOpacity * 0.26))
			)
		: mixHexColorsRgba(chromaAccent, palette.backdrop, 0.12, Math.max(0.2, surfaceOpacity * 0.58));
	const tagFg = isManual
		? manualColors?.textSecondary ??
			mixHexColors(manualColors?.textPrimary ?? '#ffffff', manualPalette!.backdrop, 0.28)
		: mixHexColors(accentText, '#ffffff', 0.06);

	const vars: Record<string, string> = {
		'--editor-accent-color': chromaAccent,
		'--editor-accent-soft': accentSoft,
		'--editor-accent-muted': accentMuted,
		'--editor-accent-border': accentBorder,
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

export const EDITOR_THEME_CLASSES: Record<EditorTheme, EditorThemeClasses> = {
	cyber: {
		launcher:
			'border border-cyan-500/35 bg-cyan-400/10 text-cyan-100 shadow-lg shadow-cyan-500/20 backdrop-blur-md',
		launcherOpen: 'bg-cyan-400/16 border-cyan-300/45',
		launcherIcon: 'text-cyan-50',
		launcherImageRing: 'ring-cyan-300/40',
		panelShell:
			'bg-[#05070c]/88 border border-cyan-400/25 shadow-xl shadow-cyan-500/10 backdrop-blur-md',
		panelHeader: 'border-b border-cyan-400/20 bg-cyan-950/20',
		panelTitle: 'text-cyan-200',
		panelSubtle: 'text-cyan-700',
		actionButton:
			'border-cyan-400/25 text-cyan-200 hover:border-cyan-300 hover:text-cyan-100 bg-cyan-400/5',
		tabBar: 'border-b border-cyan-400/15 bg-cyan-950/10',
		tabActive: 'bg-cyan-300 text-black font-bold border border-cyan-200/80',
		tabInactive:
			'text-cyan-300 hover:text-cyan-100 border border-transparent hover:border-cyan-400/20',
		overlayShell: 'bg-[#04060b]/82 backdrop-blur-md',
		overlayTopBar: 'border-b border-cyan-400/15 bg-black/70',
		overlayClose: 'bg-cyan-400/12 text-cyan-100 hover:bg-cyan-400/20',
		sectionShell: 'bg-black/45 border border-cyan-400/15',
		sectionHeader: 'border-b border-cyan-400/15 bg-cyan-950/15',
		sectionTitle: 'text-cyan-300',
		controlAccent: 'accent-cyan-400',
		toggleOn: 'bg-cyan-500',
		toggleOff: 'bg-slate-700/80'
	},
	glass: {
		launcher:
			'border border-white/18 bg-white/8 text-white shadow-lg shadow-black/20 backdrop-blur-xl',
		launcherOpen: 'bg-white/14 border-white/24',
		launcherIcon: 'text-white',
		launcherImageRing: 'ring-white/30',
		panelShell:
			'bg-slate-950/72 border border-white/12 shadow-2xl shadow-black/30 backdrop-blur-xl',
		panelHeader: 'border-b border-white/10 bg-white/4',
		panelTitle: 'text-slate-100',
		panelSubtle: 'text-slate-500',
		actionButton:
			'border-white/12 text-slate-200 hover:border-white/24 hover:text-white bg-white/[0.03]',
		tabBar: 'border-b border-white/10 bg-white/[0.03]',
		tabActive:
			'bg-white/85 text-slate-950 font-bold border border-white/90',
		tabInactive:
			'text-slate-300 hover:text-white border border-transparent hover:border-white/12',
		overlayShell: 'bg-slate-950/68 backdrop-blur-xl',
		overlayTopBar: 'border-b border-white/10 bg-black/35',
		overlayClose: 'bg-white/10 text-white hover:bg-white/16',
		sectionShell: 'bg-white/[0.035] border border-white/10',
		sectionHeader: 'border-b border-white/10 bg-white/[0.035]',
		sectionTitle: 'text-slate-200',
		controlAccent: 'accent-white',
		toggleOn: 'bg-white/90',
		toggleOff: 'bg-slate-700/70'
	},
	sunset: {
		launcher:
			'border border-fuchsia-400/25 bg-gradient-to-br from-orange-400/12 to-fuchsia-500/12 text-orange-50 shadow-lg shadow-fuchsia-900/25 backdrop-blur-md',
		launcherOpen:
			'from-orange-400/16 to-fuchsia-500/16 border-fuchsia-300/35',
		launcherIcon: 'text-orange-50',
		launcherImageRing: 'ring-fuchsia-200/30',
		panelShell:
			'bg-[#12070d]/88 border border-fuchsia-400/20 shadow-xl shadow-fuchsia-900/20 backdrop-blur-md',
		panelHeader:
			'border-b border-fuchsia-400/15 bg-gradient-to-r from-orange-500/10 to-fuchsia-500/10',
		panelTitle: 'text-orange-100',
		panelSubtle: 'text-fuchsia-700',
		actionButton:
			'border-fuchsia-400/20 text-orange-100 hover:border-orange-300 hover:text-white bg-white/[0.03]',
		tabBar: 'border-b border-fuchsia-400/12 bg-white/[0.02]',
		tabActive:
			'bg-gradient-to-r from-orange-300 to-fuchsia-300 text-black font-bold border border-orange-100/60',
		tabInactive:
			'text-orange-100/80 hover:text-white border border-transparent hover:border-fuchsia-300/20',
		overlayShell: 'bg-[#12070d]/80 backdrop-blur-md',
		overlayTopBar: 'border-b border-fuchsia-400/12 bg-black/35',
		overlayClose:
			'bg-fuchsia-500/12 text-orange-50 hover:bg-fuchsia-500/20',
		sectionShell: 'bg-black/30 border border-fuchsia-400/12',
		sectionHeader:
			'border-b border-fuchsia-400/12 bg-gradient-to-r from-orange-500/8 to-fuchsia-500/8',
		sectionTitle: 'text-orange-100',
		controlAccent: 'accent-fuchsia-300',
		toggleOn: 'bg-gradient-to-r from-orange-400 to-fuchsia-500',
		toggleOff: 'bg-slate-700/80'
	},
	terminal: {
		launcher:
			'border border-emerald-400/28 bg-emerald-400/8 text-emerald-100 shadow-lg shadow-emerald-950/25 backdrop-blur-md',
		launcherOpen: 'bg-emerald-400/14 border-emerald-300/38',
		launcherIcon: 'text-emerald-100',
		launcherImageRing: 'ring-emerald-300/35',
		panelShell:
			'bg-[#06110a]/90 border border-emerald-400/18 shadow-xl shadow-emerald-950/20 backdrop-blur-md',
		panelHeader: 'border-b border-emerald-400/14 bg-emerald-950/15',
		panelTitle: 'text-emerald-200',
		panelSubtle: 'text-emerald-700',
		actionButton:
			'border-emerald-400/18 text-emerald-200 hover:border-emerald-300 hover:text-emerald-100 bg-emerald-400/[0.03]',
		tabBar: 'border-b border-emerald-400/10 bg-emerald-950/8',
		tabActive:
			'bg-emerald-300 text-black font-bold border border-emerald-100/70',
		tabInactive:
			'text-emerald-200/80 hover:text-emerald-50 border border-transparent hover:border-emerald-400/18',
		overlayShell: 'bg-[#041009]/84 backdrop-blur-md',
		overlayTopBar: 'border-b border-emerald-400/12 bg-black/40',
		overlayClose:
			'bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/18',
		sectionShell: 'bg-black/35 border border-emerald-400/10',
		sectionHeader: 'border-b border-emerald-400/12 bg-emerald-950/10',
		sectionTitle: 'text-emerald-200',
		controlAccent: 'accent-emerald-400',
		toggleOn: 'bg-emerald-500',
		toggleOff: 'bg-slate-800/80'
	},
	midnight: {
		launcher:
			'border border-indigo-400/28 bg-indigo-400/10 text-indigo-100 shadow-lg shadow-indigo-950/30 backdrop-blur-md',
		launcherOpen: 'bg-indigo-400/16 border-indigo-300/40',
		launcherIcon: 'text-indigo-100',
		launcherImageRing: 'ring-indigo-300/35',
		panelShell:
			'bg-[#060816]/92 border border-indigo-400/18 shadow-xl shadow-indigo-950/30 backdrop-blur-md',
		panelHeader: 'border-b border-indigo-400/14 bg-indigo-950/16',
		panelTitle: 'text-indigo-100',
		panelSubtle: 'text-indigo-400/70',
		actionButton:
			'border-indigo-400/20 text-indigo-100 hover:border-indigo-300 hover:text-white bg-indigo-400/[0.04]',
		tabBar: 'border-b border-indigo-400/10 bg-indigo-950/10',
		tabActive:
			'bg-indigo-300 text-slate-950 font-bold border border-indigo-100/70',
		tabInactive:
			'text-indigo-100/80 hover:text-white border border-transparent hover:border-indigo-300/20',
		overlayShell: 'bg-[#050815]/86 backdrop-blur-md',
		overlayTopBar: 'border-b border-indigo-400/12 bg-black/40',
		overlayClose: 'bg-indigo-400/12 text-indigo-100 hover:bg-indigo-400/20',
		sectionShell: 'bg-indigo-950/12 border border-indigo-400/10',
		sectionHeader: 'border-b border-indigo-400/12 bg-indigo-950/12',
		sectionTitle: 'text-indigo-100',
		controlAccent: 'accent-indigo-300',
		toggleOn: 'bg-indigo-400',
		toggleOff: 'bg-slate-800/80'
	},
	carbon: {
		launcher:
			'border border-zinc-400/25 bg-zinc-200/8 text-zinc-100 shadow-lg shadow-black/30 backdrop-blur-md',
		launcherOpen: 'bg-zinc-200/12 border-zinc-300/30',
		launcherIcon: 'text-zinc-50',
		launcherImageRing: 'ring-zinc-200/25',
		panelShell:
			'bg-[#0a0a0b]/92 border border-zinc-400/14 shadow-xl shadow-black/35 backdrop-blur-md',
		panelHeader: 'border-b border-zinc-400/10 bg-zinc-900/30',
		panelTitle: 'text-zinc-100',
		panelSubtle: 'text-zinc-500',
		actionButton:
			'border-zinc-400/12 text-zinc-200 hover:border-zinc-200/25 hover:text-white bg-white/[0.03]',
		tabBar: 'border-b border-zinc-400/10 bg-zinc-900/25',
		tabActive: 'bg-zinc-100 text-black font-bold border border-zinc-50/90',
		tabInactive:
			'text-zinc-300 hover:text-white border border-transparent hover:border-zinc-400/15',
		overlayShell: 'bg-[#090909]/88 backdrop-blur-md',
		overlayTopBar: 'border-b border-zinc-400/10 bg-black/50',
		overlayClose: 'bg-zinc-200/10 text-zinc-100 hover:bg-zinc-200/16',
		sectionShell: 'bg-white/[0.02] border border-zinc-400/10',
		sectionHeader: 'border-b border-zinc-400/10 bg-zinc-900/18',
		sectionTitle: 'text-zinc-200',
		controlAccent: 'accent-zinc-100',
		toggleOn: 'bg-zinc-100',
		toggleOff: 'bg-zinc-700/80'
	},
	aurora: {
		launcher:
			'border border-teal-300/28 bg-gradient-to-br from-teal-400/10 to-violet-500/12 text-teal-50 shadow-lg shadow-violet-950/25 backdrop-blur-md',
		launcherOpen: 'from-teal-400/16 to-violet-500/18 border-violet-300/35',
		launcherIcon: 'text-teal-50',
		launcherImageRing: 'ring-violet-200/30',
		panelShell:
			'bg-[#071211]/90 border border-teal-300/16 shadow-xl shadow-violet-950/20 backdrop-blur-md',
		panelHeader:
			'border-b border-teal-300/12 bg-gradient-to-r from-teal-500/8 to-violet-500/10',
		panelTitle: 'text-teal-50',
		panelSubtle: 'text-teal-300/55',
		actionButton:
			'border-teal-300/18 text-teal-50 hover:border-violet-300/28 hover:text-white bg-white/[0.03]',
		tabBar: 'border-b border-teal-300/10 bg-white/[0.02]',
		tabActive:
			'bg-gradient-to-r from-teal-300 to-violet-300 text-slate-950 font-bold border border-white/50',
		tabInactive:
			'text-teal-50/80 hover:text-white border border-transparent hover:border-violet-300/18',
		overlayShell: 'bg-[#06110f]/84 backdrop-blur-md',
		overlayTopBar: 'border-b border-teal-300/10 bg-black/40',
		overlayClose: 'bg-violet-400/12 text-teal-50 hover:bg-violet-400/18',
		sectionShell: 'bg-white/[0.02] border border-teal-300/10',
		sectionHeader:
			'border-b border-teal-300/10 bg-gradient-to-r from-teal-500/6 to-violet-500/6',
		sectionTitle: 'text-teal-50',
		controlAccent: 'accent-teal-300',
		toggleOn: 'bg-gradient-to-r from-teal-400 to-violet-500',
		toggleOff: 'bg-slate-700/80'
	},
	rose: {
		launcher:
			'border border-rose-300/28 bg-gradient-to-br from-rose-400/10 to-pink-500/12 text-rose-50 shadow-lg shadow-rose-950/25 backdrop-blur-md',
		launcherOpen: 'from-rose-400/16 to-pink-500/18 border-pink-300/35',
		launcherIcon: 'text-rose-50',
		launcherImageRing: 'ring-pink-200/30',
		panelShell:
			'bg-[#170910]/90 border border-rose-300/18 shadow-xl shadow-rose-950/25 backdrop-blur-md',
		panelHeader:
			'border-b border-rose-300/14 bg-gradient-to-r from-rose-500/10 to-pink-500/10',
		panelTitle: 'text-rose-50',
		panelSubtle: 'text-rose-300/60',
		actionButton:
			'border-rose-300/18 text-rose-50 hover:border-pink-300/28 hover:text-white bg-white/[0.03]',
		tabBar: 'border-b border-rose-300/10 bg-white/[0.02]',
		tabActive:
			'bg-gradient-to-r from-rose-300 to-pink-300 text-slate-950 font-bold border border-white/50',
		tabInactive:
			'text-rose-50/82 hover:text-white border border-transparent hover:border-pink-300/18',
		overlayShell: 'bg-[#13080e]/84 backdrop-blur-md',
		overlayTopBar: 'border-b border-rose-300/10 bg-black/40',
		overlayClose: 'bg-pink-400/12 text-rose-50 hover:bg-pink-400/18',
		sectionShell: 'bg-white/[0.02] border border-rose-300/10',
		sectionHeader:
			'border-b border-rose-300/10 bg-gradient-to-r from-rose-500/6 to-pink-500/6',
		sectionTitle: 'text-rose-50',
		controlAccent: 'accent-rose-300',
		toggleOn: 'bg-gradient-to-r from-rose-400 to-pink-500',
		toggleOff: 'bg-slate-700/80'
	},
	ocean: {
		launcher:
			'border border-sky-300/28 bg-gradient-to-br from-sky-400/10 to-blue-500/12 text-sky-50 shadow-lg shadow-blue-950/25 backdrop-blur-md',
		launcherOpen: 'from-sky-400/16 to-blue-500/18 border-blue-300/35',
		launcherIcon: 'text-sky-50',
		launcherImageRing: 'ring-blue-200/30',
		panelShell:
			'bg-[#07111b]/92 border border-sky-300/18 shadow-xl shadow-blue-950/30 backdrop-blur-md',
		panelHeader:
			'border-b border-sky-300/12 bg-gradient-to-r from-sky-500/8 to-blue-500/10',
		panelTitle: 'text-sky-50',
		panelSubtle: 'text-sky-300/58',
		actionButton:
			'border-sky-300/18 text-sky-50 hover:border-blue-300/28 hover:text-white bg-white/[0.03]',
		tabBar: 'border-b border-sky-300/10 bg-white/[0.02]',
		tabActive:
			'bg-gradient-to-r from-sky-300 to-blue-300 text-slate-950 font-bold border border-white/50',
		tabInactive:
			'text-sky-50/82 hover:text-white border border-transparent hover:border-blue-300/18',
		overlayShell: 'bg-[#06101a]/86 backdrop-blur-md',
		overlayTopBar: 'border-b border-sky-300/10 bg-black/40',
		overlayClose: 'bg-blue-400/12 text-sky-50 hover:bg-blue-400/18',
		sectionShell: 'bg-white/[0.02] border border-sky-300/10',
		sectionHeader:
			'border-b border-sky-300/10 bg-gradient-to-r from-sky-500/6 to-blue-500/6',
		sectionTitle: 'text-sky-50',
		controlAccent: 'accent-sky-300',
		toggleOn: 'bg-gradient-to-r from-sky-400 to-blue-500',
		toggleOff: 'bg-slate-700/80'
	},
	amber: {
		launcher:
			'border border-amber-300/28 bg-gradient-to-br from-amber-400/10 to-orange-500/12 text-amber-50 shadow-lg shadow-amber-950/25 backdrop-blur-md',
		launcherOpen: 'from-amber-400/16 to-orange-500/18 border-orange-300/35',
		launcherIcon: 'text-amber-50',
		launcherImageRing: 'ring-orange-200/30',
		panelShell:
			'bg-[#181007]/92 border border-amber-300/18 shadow-xl shadow-amber-950/30 backdrop-blur-md',
		panelHeader:
			'border-b border-amber-300/12 bg-gradient-to-r from-amber-500/8 to-orange-500/10',
		panelTitle: 'text-amber-50',
		panelSubtle: 'text-amber-300/58',
		actionButton:
			'border-amber-300/18 text-amber-50 hover:border-orange-300/28 hover:text-white bg-white/[0.03]',
		tabBar: 'border-b border-amber-300/10 bg-white/[0.02]',
		tabActive:
			'bg-gradient-to-r from-amber-300 to-orange-300 text-slate-950 font-bold border border-white/50',
		tabInactive:
			'text-amber-50/82 hover:text-white border border-transparent hover:border-orange-300/18',
		overlayShell: 'bg-[#140d06]/86 backdrop-blur-md',
		overlayTopBar: 'border-b border-amber-300/10 bg-black/40',
		overlayClose: 'bg-orange-400/12 text-amber-50 hover:bg-orange-400/18',
		sectionShell: 'bg-white/[0.02] border border-amber-300/10',
		sectionHeader:
			'border-b border-amber-300/10 bg-gradient-to-r from-amber-500/6 to-orange-500/6',
		sectionTitle: 'text-amber-50',
		controlAccent: 'accent-amber-300',
		toggleOn: 'bg-gradient-to-r from-amber-400 to-orange-500',
		toggleOff: 'bg-slate-700/80'
	},
	rainbow: {
		launcher:
			'editor-rgb-theme-panel border text-white shadow-lg shadow-fuchsia-950/25 backdrop-blur-md',
		launcherOpen: 'editor-rgb-theme-surface border-white/40',
		launcherIcon: 'text-white',
		launcherImageRing: 'ring-white/35',
		panelShell:
			'editor-rgb-theme-panel border shadow-xl shadow-fuchsia-950/25 backdrop-blur-md',
		panelHeader: 'editor-rgb-theme-header border-b',
		panelTitle: 'text-white',
		panelSubtle: 'text-white/70',
		actionButton:
			'editor-rgb-theme-surface text-white hover:text-white border border-white/28',
		tabBar: 'editor-rgb-theme-header border-b',
		tabActive:
			'editor-rgb-theme-active text-slate-950 font-bold border border-white/65',
		tabInactive:
			'text-white/88 hover:text-white border border-transparent hover:border-white/28',
		overlayShell: 'editor-rgb-theme-overlay backdrop-blur-md',
		overlayTopBar: 'editor-rgb-theme-header border-b',
		overlayClose: 'editor-rgb-theme-surface text-white hover:text-white',
		sectionShell: 'editor-rgb-theme-surface border border-white/18',
		sectionHeader: 'editor-rgb-theme-header border-b border-white/16',
		sectionTitle: 'text-white',
		controlAccent: 'accent-fuchsia-300',
		toggleOn: 'editor-rgb-theme-active',
		toggleOff: 'bg-slate-700/80'
	}
};
