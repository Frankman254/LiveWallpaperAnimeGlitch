/**
 * Design tokens for the editor UI.
 *
 * Centralizes the three concerns that drift most: icon sizes, button
 * hierarchy, and section headers. Existing inline styles still work; adopt
 * these incrementally for new code and during polish passes.
 *
 * Button variants:
 *   primary     — main action (Activate scene, Apply, Save)
 *   secondary   — neutral action (Rename, New, Edit)
 *   destructive — delete / reset
 *   ghost       — transparent; only a hover tint
 */

import type { CSSProperties } from 'react';

export const ICON_SIZE = {
	xs: 11, // metadata labels, small tag icons
	sm: 13, // current editor header default
	md: 14, // HUD transport buttons, tab icons
	lg: 16 // primary action buttons
} as const;

export type ButtonVariant =
	| 'primary'
	| 'secondary'
	| 'destructive'
	| 'ghost';

export const BUTTON_BASE_CLASS =
	'rounded border px-2 py-1 text-[10px] font-medium transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40';

export function getButtonStyle(variant: ButtonVariant): CSSProperties {
	switch (variant) {
		case 'primary':
			return {
				borderRadius: 'var(--editor-radius-sm)',
				borderColor: 'var(--editor-accent-color)',
				background: 'var(--editor-active-bg)',
				color: 'var(--editor-active-fg)'
			};
		case 'secondary':
			return {
				borderRadius: 'var(--editor-radius-sm)',
				borderColor: 'var(--editor-accent-border)',
				background: 'var(--editor-tag-bg)',
				color: 'var(--editor-tag-fg)'
			};
		case 'destructive':
			return {
				borderRadius: 'var(--editor-radius-sm)',
				borderColor: 'rgba(248, 113, 113, 0.45)',
				background: 'rgba(248, 113, 113, 0.08)',
				color: 'rgba(252, 165, 165, 0.95)'
			};
		case 'ghost':
			return {
				borderRadius: 'var(--editor-radius-sm)',
				borderColor: 'transparent',
				background: 'transparent',
				color: 'var(--editor-accent-muted)'
			};
	}
}

/**
 * Shell style for editor cards (sections, slots, list items). Pass
 * `active: true` to use the accent-colored border for the currently selected
 * card — this is the single rule for "selected state" across the panel.
 */
export function getCardStyle(active = false): CSSProperties {
	return {
		borderRadius: 'var(--editor-radius-md)',
		borderColor: active
			? 'var(--editor-accent-color)'
			: 'var(--editor-accent-border)',
		background: 'var(--editor-tag-bg)'
	};
}

/**
 * Tailwind class token for uniform section headers across tabs. Applied to a
 * span/h3 element; pair with `color: var(--editor-accent-soft)` inline.
 */
export const SECTION_HEADER_CLASS =
	'text-[11px] font-semibold uppercase tracking-[0.08em]';

/**
 * Muted secondary text — hints, captions, "active:" labels, counts.
 */
export const CAPTION_CLASS = 'text-[10px] leading-snug';

/**
 * Lucide icon strokeWidth values. Use `bold` for transport/action icons,
 * `default` for decorative/label icons.
 */
export const ICON_STROKE = { default: 2, bold: 2.25 } as const;

/**
 * Warning / caution button style — for potentially destructive-but-reversible
 * actions like "Pause All Audio". Uses amber/orange, not the red destructive.
 */
export function getWarningButtonStyle(): CSSProperties {
	return {
		borderRadius: 'var(--editor-radius-sm)',
		borderColor: 'rgba(251, 146, 60, 0.45)',
		background: 'rgba(251, 146, 60, 0.10)',
		color: 'rgba(253, 186, 116, 0.95)'
	};
}
