import { describe, expect, it } from 'vitest';
import {
	LOGO_POSITION_MAX,
	LOGO_POSITION_MIN,
	LOGO_POSITION_NUDGE_STEP,
	nudgeLogoAxis,
	nudgeLogoPosition
} from './logoPositionNudge';
import { en } from '@/lib/i18n/en';
import { es } from '@/lib/i18n/es';

describe('nudgeLogoAxis', () => {
	it('moves by one step in the given direction', () => {
		expect(nudgeLogoAxis(0, 1)).toBeCloseTo(LOGO_POSITION_NUDGE_STEP, 6);
		expect(nudgeLogoAxis(0, -1)).toBeCloseTo(-LOGO_POSITION_NUDGE_STEP, 6);
	});

	it('clamps at the max bound', () => {
		expect(nudgeLogoAxis(LOGO_POSITION_MAX, 1)).toBe(LOGO_POSITION_MAX);
		expect(nudgeLogoAxis(LOGO_POSITION_MAX - 0.01, 1)).toBe(
			LOGO_POSITION_MAX
		);
	});

	it('clamps at the min bound', () => {
		expect(nudgeLogoAxis(LOGO_POSITION_MIN, -1)).toBe(LOGO_POSITION_MIN);
	});

	it('snaps to the step grid (no float drift over repeated nudges)', () => {
		let v = 0;
		for (let i = 0; i < 5; i += 1) v = nudgeLogoAxis(v, 1);
		expect(v).toBeCloseTo(5 * LOGO_POSITION_NUDGE_STEP, 6);
	});
});

describe('nudgeLogoPosition (direction + sign convention)', () => {
	const center = { x: 0, y: 0 };

	it('right/left move X; up/down move Y (y+ = up)', () => {
		expect(nudgeLogoPosition(center, 'right').x).toBeGreaterThan(0);
		expect(nudgeLogoPosition(center, 'left').x).toBeLessThan(0);
		expect(nudgeLogoPosition(center, 'up').y).toBeGreaterThan(0);
		expect(nudgeLogoPosition(center, 'down').y).toBeLessThan(0);
	});

	it('only touches the intended axis', () => {
		expect(nudgeLogoPosition(center, 'right').y).toBe(0);
		expect(nudgeLogoPosition(center, 'up').x).toBe(0);
	});

	it('never exceeds the normalized range', () => {
		const far = { x: LOGO_POSITION_MAX, y: LOGO_POSITION_MAX };
		const next = nudgeLogoPosition(far, 'up');
		expect(next.y).toBeLessThanOrEqual(LOGO_POSITION_MAX);
		expect(nudgeLogoPosition(far, 'right').x).toBeLessThanOrEqual(
			LOGO_POSITION_MAX
		);
	});
});

describe('HUD logo control i18n parity', () => {
	const keys = [
		'qa_logo_up',
		'qa_logo_up_t',
		'qa_logo_down',
		'qa_logo_down_t',
		'qa_logo_left',
		'qa_logo_left_t',
		'qa_logo_right',
		'qa_logo_right_t',
		'qa_logo_center',
		'qa_logo_center_t'
	] as const;

	it('defines every new key in EN and ES', () => {
		for (const key of keys) {
			expect(en[key], `EN missing ${key}`).toBeTruthy();
			expect(es[key], `ES missing ${key}`).toBeTruthy();
		}
	});
});
