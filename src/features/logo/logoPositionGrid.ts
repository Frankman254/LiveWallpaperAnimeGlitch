import { LOGO_RANGES } from '@/config/ranges';

/**
 * Logo position grid for the HUD. Divides the canvas into a matrix of cells;
 * tapping a cell centers the logo in that cell. Only position changes — logo
 * reactivity, size, and presets are untouched.
 *
 * Logo position is normalized (`[-0.9, 0.9]`, 0 = centered) — the same units the
 * Logo tab sliders use — so this works at any resolution, including ultrawide.
 *
 * Sign convention (matches the renderer in OverlayInteractionStage):
 *   x+ → right · x- → left · y+ → up · y- → down
 */

const LOGO_MIN = LOGO_RANGES.positionX.min;
const LOGO_MAX = LOGO_RANGES.positionX.max;

/** Cells along the short axis. The long axis scales from the aspect ratio so
 *  every cell is the same square — more cells horizontally on ultrawide. */
export const LOGO_GRID_SHORT_DIVISIONS = 3;
/** Long-axis clamp so the matrix always fits the HUD. */
const LOGO_GRID_MIN_LONG = 4;
const LOGO_GRID_MAX_LONG = 8;

export type LogoGridDims = { cols: number; rows: number };
export type LogoGridCell = { col: number; row: number };

/** Fine-adjustment nudge step (the grid handles coarse jumps). */
export const LOGO_POSITION_NUDGE_STEP = 0.05;
/** Centered/reset logo position. */
export const LOGO_POSITION_CENTER = { x: 0, y: 0 } as const;
export type LogoNudgeDirection = 'up' | 'down' | 'left' | 'right';

function clampLogo(value: number): number {
	return Math.min(LOGO_MAX, Math.max(LOGO_MIN, value));
}

/** Nudge one axis by `step`, clamped + snapped to the step grid (no drift). */
export function nudgeLogoAxis(
	value: number,
	delta: number,
	step = LOGO_POSITION_NUDGE_STEP
): number {
	const next = clampLogo(value + delta * step);
	return Math.round(next / step) * step;
}

/** Fine directional nudge. y+ = up (matches the renderer + the grid). */
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

function clampLong(value: number): number {
	return Math.min(LOGO_GRID_MAX_LONG, Math.max(LOGO_GRID_MIN_LONG, value));
}

/**
 * Resolve grid dimensions from the canvas aspect ratio (width / height) so all
 * cells are equal squares and the matrix mirrors the canvas shape. The short
 * axis is fixed at 3 divisions; the long axis scales with the aspect:
 *   16:9 → 5×3 · 4:3 → 4×3 · 21:9 ultrawide → 7×3 (capped at 8).
 * Portrait canvases simply transpose (3 columns, more rows).
 */
export function resolveLogoGridDims(aspectRatio: number): LogoGridDims {
	const safeAspect =
		Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 16 / 9;
	if (safeAspect >= 1) {
		return {
			cols: clampLong(Math.round(LOGO_GRID_SHORT_DIVISIONS * safeAspect)),
			rows: LOGO_GRID_SHORT_DIVISIONS
		};
	}
	return {
		cols: LOGO_GRID_SHORT_DIVISIONS,
		rows: clampLong(Math.round(LOGO_GRID_SHORT_DIVISIONS / safeAspect))
	};
}

/**
 * Normalized logo position for the CENTER of a grid cell. col 0 = left, row 0 =
 * top. Result is clamped to the logo position range.
 */
export function cellToLogoPosition(
	cell: LogoGridCell,
	dims: LogoGridDims
): { x: number; y: number } {
	const fx = (cell.col + 0.5) / dims.cols; // 0..1 left→right
	const fy = (cell.row + 0.5) / dims.rows; // 0..1 top→bottom
	return {
		x: clampLogo(2 * fx - 1),
		y: clampLogo(1 - 2 * fy) // y+ = up
	};
}

/**
 * Inverse: which cell currently holds the logo (for highlighting the active
 * cell). Clamped to valid cell indices.
 */
export function logoPositionToCell(
	position: { x: number; y: number },
	dims: LogoGridDims
): LogoGridCell {
	const fx = (position.x + 1) / 2;
	const fy = (1 - position.y) / 2;
	const col = Math.min(
		dims.cols - 1,
		Math.max(0, Math.round(fx * dims.cols - 0.5))
	);
	const row = Math.min(
		dims.rows - 1,
		Math.max(0, Math.round(fy * dims.rows - 0.5))
	);
	return { col, row };
}
