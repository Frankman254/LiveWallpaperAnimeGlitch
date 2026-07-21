/**
 * UI system colors. These are infrastructure tokens for surfaces, strokes, and
 * text — NOT theme accent colors. The theme accent flows in through
 * `--lwag-accent` (aliased from `--editor-accent-color` in editorTheme.ts) and
 * is exposed below as `accent` so components have a single canonical entry.
 *
 * All values are CSS-var references so the theme pipeline drives them at
 * runtime; the fallback after each comma is what a fresh install sees before
 * the theme setter has run.
 */

export const UI_COLORS = {
	// Surface tiers (layered glass over the wallpaper)
	shell: 'var(--editor-shell-bg, rgba(11, 14, 22, 0.86))',
	panel: 'var(--editor-tag-bg, rgba(20, 25, 36, 0.72))',
	raised: 'var(--editor-surface-bg, rgba(34, 41, 56, 0.92))',
	panelGradient:
		'linear-gradient(180deg, color-mix(in srgb, var(--editor-surface-bg, rgba(34, 41, 56, 0.92)) 42%, var(--editor-tag-bg, rgba(20, 25, 36, 0.72))), var(--editor-tag-bg, rgba(20, 25, 36, 0.72)))',
	raisedGradient:
		'linear-gradient(180deg, color-mix(in srgb, var(--editor-surface-bg, rgba(34, 41, 56, 0.92)) 92%, white 8%), var(--editor-surface-bg, rgba(34, 41, 56, 0.92)))',
	hover: 'rgba(255, 255, 255, 0.06)',
	hud: 'var(--editor-hud-bg, rgba(10, 15, 26, 0.58))',
	overlay: 'rgba(0, 0, 0, 0.32)',
	overlayHi: 'rgba(0, 0, 0, 0.55)',
	sheen: 'rgba(255, 255, 255, 0.04)',
	sheenSoft: 'rgba(255, 255, 255, 0.025)',

	// Strokes
	hairline: 'rgba(255, 255, 255, 0.06)',
	border: 'var(--editor-tag-border, rgba(255, 255, 255, 0.10))',
	borderStrong: 'var(--editor-shell-border, rgba(255, 255, 255, 0.18))',

	// Text
	fg: 'var(--editor-accent-fg, rgba(255, 255, 255, 0.96))',
	fgMute: 'var(--editor-accent-muted, rgba(255, 255, 255, 0.62))',
	fgFaint: 'rgba(255, 255, 255, 0.38)',
	inverseFg: 'var(--editor-active-fg, #020617)',
	thumb: 'var(--editor-control-thumb, rgba(255, 255, 255, 0.96))',

	// Theme accent (single canonical entry — drives every "active" highlight)
	accent: 'var(--lwag-accent, #67e8f9)',
	accentSoft:
		'color-mix(in srgb, var(--lwag-accent, #67e8f9) 14%, transparent)',
	accentBorder:
		'color-mix(in srgb, var(--lwag-accent, #67e8f9) 42%, transparent)',
	accentFg: 'var(--editor-active-fg, #020617)',
	focusRing:
		'0 0 0 3px color-mix(in srgb, var(--lwag-accent, #67e8f9) 16%, transparent)',

	// Semantic
	danger: '#ff6b6b',
	dangerSoft: 'rgba(248, 113, 113, 0.10)',
	dangerBorder: 'rgba(248, 113, 113, 0.45)',
	warn: '#fdba74',
	warnSoft: 'rgba(251, 146, 60, 0.10)',
	warnBorder: 'rgba(251, 146, 60, 0.45)',
	ok: '#4ade80'
} as const;

export type UIColorToken = keyof typeof UI_COLORS;

export const FONT = {
	ui: '"Inter", system-ui, -apple-system, sans-serif',
	mono: '"JetBrains Mono", "SF Mono", ui-monospace, monospace'
} as const;
