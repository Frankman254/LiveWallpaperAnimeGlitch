export const MOTION = {
	duration: {
		instant: '80ms',
		fast: '120ms',
		base: '160ms',
		slow: '240ms',
		deliberate: '320ms'
	},
	easing: {
		standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
		emphasized: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
		linear: 'linear'
	}
} as const;

export type DurationToken = keyof typeof MOTION.duration;
export type EasingToken = keyof typeof MOTION.easing;

export function transition(
	properties: string,
	duration: DurationToken = 'fast',
	easing: EasingToken = 'standard'
): string {
	return `${properties} ${MOTION.duration[duration]} ${MOTION.easing[easing]}`;
}
