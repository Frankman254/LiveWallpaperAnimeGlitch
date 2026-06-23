import { describe, expect, it } from 'vitest';
import { LOGO_RANGES } from '@/config/ranges';
import {
	cellToLogoPosition,
	logoPositionToCell,
	nudgeLogoAxis,
	nudgeLogoPosition,
	resolveLogoGridDims,
	LOGO_POSITION_NUDGE_STEP
} from './logoPositionGrid';
import { en } from '@/lib/i18n/en';
import { es } from '@/lib/i18n/es';

const MIN = LOGO_RANGES.positionX.min;
const MAX = LOGO_RANGES.positionX.max;

describe('resolveLogoGridDims', () => {
	it('yields 5×3 for 16:9 and 4×3 for 4:3 (square cells)', () => {
		expect(resolveLogoGridDims(16 / 9)).toEqual({ cols: 5, rows: 3 });
		expect(resolveLogoGridDims(4 / 3)).toEqual({ cols: 4, rows: 3 });
	});

	it('adds more columns on ultrawide, capped', () => {
		expect(resolveLogoGridDims(21 / 9).cols).toBe(7);
		expect(resolveLogoGridDims(32 / 9).cols).toBe(8); // capped
	});

	it('transposes for portrait canvases', () => {
		const dims = resolveLogoGridDims(9 / 16);
		expect(dims.cols).toBe(3);
		expect(dims.rows).toBeGreaterThanOrEqual(4);
	});

	it('falls back to 16:9 for invalid aspect', () => {
		expect(resolveLogoGridDims(0)).toEqual({ cols: 5, rows: 3 });
		expect(resolveLogoGridDims(Number.NaN)).toEqual({ cols: 5, rows: 3 });
	});
});

describe('cellToLogoPosition', () => {
	const dims = { cols: 5, rows: 3 };

	it('centers the middle cell at the origin', () => {
		expect(cellToLogoPosition({ col: 2, row: 1 }, dims)).toEqual({
			x: 0,
			y: 0
		});
	});

	it('maps corners to the expected signs (y+ = up)', () => {
		const topLeft = cellToLogoPosition({ col: 0, row: 0 }, dims);
		expect(topLeft.x).toBeLessThan(0); // left
		expect(topLeft.y).toBeGreaterThan(0); // up

		const bottomRight = cellToLogoPosition(
			{ col: dims.cols - 1, row: dims.rows - 1 },
			dims
		);
		expect(bottomRight.x).toBeGreaterThan(0); // right
		expect(bottomRight.y).toBeLessThan(0); // down
	});

	it('never exceeds the logo position range', () => {
		for (let r = 0; r < dims.rows; r += 1) {
			for (let c = 0; c < dims.cols; c += 1) {
				const p = cellToLogoPosition({ col: c, row: r }, dims);
				expect(p.x).toBeGreaterThanOrEqual(MIN);
				expect(p.x).toBeLessThanOrEqual(MAX);
				expect(p.y).toBeGreaterThanOrEqual(MIN);
				expect(p.y).toBeLessThanOrEqual(MAX);
			}
		}
	});
});

describe('logoPositionToCell round-trips with cellToLogoPosition', () => {
	const dims = { cols: 5, rows: 3 };
	it('maps every cell center back to itself', () => {
		for (let r = 0; r < dims.rows; r += 1) {
			for (let c = 0; c < dims.cols; c += 1) {
				const pos = cellToLogoPosition({ col: c, row: r }, dims);
				expect(logoPositionToCell(pos, dims)).toEqual({
					col: c,
					row: r
				});
			}
		}
	});

	it('clamps out-of-range positions to valid cells', () => {
		const cell = logoPositionToCell({ x: 99, y: -99 }, dims);
		expect(cell.col).toBe(dims.cols - 1);
		expect(cell.row).toBe(dims.rows - 1);
	});
});

describe('nudgeLogoAxis / nudgeLogoPosition (fine adjustment)', () => {
	it('moves one step and clamps at bounds', () => {
		expect(nudgeLogoAxis(0, 1)).toBeCloseTo(LOGO_POSITION_NUDGE_STEP, 6);
		expect(nudgeLogoAxis(MAX, 1)).toBe(MAX);
		expect(nudgeLogoAxis(MIN, -1)).toBe(MIN);
	});

	it('respects the up/down/left/right sign convention (y+ = up)', () => {
		const c = { x: 0, y: 0 };
		expect(nudgeLogoPosition(c, 'right').x).toBeGreaterThan(0);
		expect(nudgeLogoPosition(c, 'left').x).toBeLessThan(0);
		expect(nudgeLogoPosition(c, 'up').y).toBeGreaterThan(0);
		expect(nudgeLogoPosition(c, 'down').y).toBeLessThan(0);
	});

	it('only touches the intended axis', () => {
		expect(nudgeLogoPosition({ x: 0, y: 0 }, 'right').y).toBe(0);
		expect(nudgeLogoPosition({ x: 0, y: 0 }, 'up').x).toBe(0);
	});
});

describe('HUD logo position i18n parity', () => {
	it('defines the position + nudge keys in EN and ES', () => {
		for (const key of [
			'qa_logo_position',
			'qa_logo_position_t',
			'qa_logo_up_t',
			'qa_logo_down_t',
			'qa_logo_left_t',
			'qa_logo_right_t',
			'qa_logo_center_t'
		] as const) {
			expect(en[key], `EN missing ${key}`).toBeTruthy();
			expect(es[key], `ES missing ${key}`).toBeTruthy();
		}
	});
});
