export const RADIUS = {
	xs: 'var(--editor-radius-sm)',
	sm: 'var(--editor-radius-sm)',
	md: 'var(--editor-radius-md)',
	lg: 'var(--editor-radius-lg)',
	xl: 'var(--editor-radius-xl)',
	pill: '999px'
} as const;

export type RadiusToken = keyof typeof RADIUS;
