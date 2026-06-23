import { LOGO_RANGES } from '@/config/ranges';

/**
 * Quick logo-position helpers for the HUD. Logo position is normalized
 * (`[-0.9, 0.9]`, 0 = centered) — the same units the Logo tab sliders use — so
 * these work identically at any resolution, including ultrawide 3440×1440.
 *
 * Sign convention (matches the renderer in OverlayInteractionStage):
 *   x+ → right · x- → left · y+ → up · y- → down
 */
export const LOGO_POSITION_NUDGE_STEP = 0.05;
export const LOGO_POSITION_MIN = LOGO_RANGES.positionX.min;
export const LOGO_POSITION_MAX = LOGO_RANGES.positionX.max;
/** Centered/reset logo position. */
export const LOGO_POSITION_CENTER = { x: 0, y: 0 } as const;

export type LogoNudgeDirection = 'up' | 'down' | 'left' | 'right';

function clampLogoPosition(value: number): number {
	return Math.min(LOGO_POSITION_MAX, Math.max(LOGO_POSITION_MIN, value));
}

/** Nudge a single axis value by `step`, clamped to the logo position range. */
export function nudgeLogoAxis(
	value: number,
	delta: number,
	step = LOGO_POSITION_NUDGE_STEP
): number {
	// Round to the step grid so repeated nudges stay on clean increments and
	// don't accumulate floating-point drift.
	const next = clampLogoPosition(value + delta * step);
	return Math.round(next / step) * step;
}

/**
 * Resolve the next {x, y} for a directional nudge. Pure so the HUD wiring stays
 * a thin adapter over the same `logoPositionX/Y` state the Logo tab edits.
 */
export function nudgeLogoPosition(
	position: { x: number; y: number },
	direction: LogoNudgeDirection,
	step = LOGO_POSITION_NUDGE_STEP
): { x: number; y: number } {
	switch (direction) {
		case 'right':
			return { x: nudgeLogoAxis(position.x, 1, step), y: position.y };
		case 'left':
			return { x: nudgeLogoAxis(position.x, -1, step), y: position.y };
		case 'up':
			return { x: position.x, y: nudgeLogoAxis(position.y, 1, step) };
		case 'down':
			return { x: position.x, y: nudgeLogoAxis(position.y, -1, step) };
	}
}
