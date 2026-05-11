export const BLUR = {
	none: 'none',
	light: 'blur(8px)',
	medium: 'blur(16px) saturate(140%)',
	heavy: 'blur(24px) saturate(140%)'
} as const;

export type BlurToken = keyof typeof BLUR;
