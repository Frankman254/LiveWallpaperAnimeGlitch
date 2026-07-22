/**
 * Typographic scale. Before this, font sizes were hardcoded across ~380 call
 * sites in 9 unrelated values (8/9/10/11/12/13/14/16/18px) — the main reason
 * the dense editor read as inconsistent even though each component was fine.
 *
 * These steps intentionally preserve the values the editor already shipped, so
 * adopting them is a no-op visually; the win is that spacing between steps now
 * has meaning and a future density change is one edit here, not 380.
 *
 * Naming is by ROLE, not size, so intent survives a rescale:
 *   micro   – tiny uppercase badges / status pills
 *   caption – hints, secondary sublabels
 *   label   – control labels (the workhorse, most common)
 *   body    – values, body copy, inputs
 *   title   – section titles
 *   heading – prominent headings
 */
export const TYPE = {
	micro: 9,
	caption: 10,
	label: 11,
	body: 12,
	title: 13,
	heading: 16
} as const;

export type TypeToken = keyof typeof TYPE;

/** Font weights, named by role so components don't sprinkle raw numbers. */
export const WEIGHT = {
	normal: 400,
	medium: 500,
	semibold: 600,
	bold: 700,
	heavy: 800
} as const;

export type WeightToken = keyof typeof WEIGHT;
