/**
 * Classic Wave draw-order contract (back → front):
 *
 * 1. Echo trace history (previous frames)
 * 2. Wave fill / body
 * 3. Manual glow halo (expanded stroke)
 * 4. RGB split fringes (additive, perpendicular / radial offset)
 * 5. Main trace stroke (gradient + shadow glow)
 * 6. Neon core (thin bright center line, no blur)
 * 7. Peak sparks (additive accents)
 *
 * After all passes: store echo history for next frame.
 *
 * Each pass must ctx.save()/restore() and must not leak globalAlpha,
 * compositeOperation, shadowBlur, shadowColor, transforms, or filters.
 */

export const SPECTRUM_WAVE_DRAW_ORDER = [
	'echo-history',
	'fill',
	'glow-halo',
	'rgb-split',
	'main-trace',
	'neon-core',
	'peak-sparks'
] as const;
