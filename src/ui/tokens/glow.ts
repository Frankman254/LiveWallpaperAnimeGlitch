export const GLOW = {
	none: 'none',
	sm: '0 0 8px color-mix(in srgb, var(--lwag-accent, #67e8f9) 35%, transparent)',
	md: '0 0 12px color-mix(in srgb, var(--lwag-accent, #67e8f9) 40%, transparent)',
	lg: '0 0 18px color-mix(in srgb, var(--lwag-accent, #67e8f9) 50%, transparent)',
	ring: '0 0 0 3px color-mix(in srgb, var(--lwag-accent, #67e8f9) 22%, transparent)',
	panel: '0 8px 24px rgba(0, 0, 0, 0.35)',
	modal: '0 24px 60px rgba(0, 0, 0, 0.45)',
	popover: '0 16px 40px rgba(0, 0, 0, 0.55)'
} as const;

export type GlowToken = keyof typeof GLOW;
