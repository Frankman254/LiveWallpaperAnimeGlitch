import { describe, expect, it } from 'vitest';
import {
	parseOutputFpsDebugFlag,
	resolveOutputFpsDebugVisible
} from './outputDebugOverlay';

describe('parseOutputFpsDebugFlag', () => {
	it('detects the flag in a hash-route query', () => {
		expect(parseOutputFpsDebugFlag('#/present?debug=fps', '')).toBe(true);
		expect(parseOutputFpsDebugFlag('#/record?debug=fps', '')).toBe(true);
	});

	it('detects the flag in a top-level query', () => {
		expect(parseOutputFpsDebugFlag('#/present', '?debug=fps')).toBe(true);
	});

	it('is false for clean output routes', () => {
		expect(parseOutputFpsDebugFlag('#/present', '')).toBe(false);
		expect(parseOutputFpsDebugFlag('#/record', '')).toBe(false);
		expect(parseOutputFpsDebugFlag('', '')).toBe(false);
	});
});

describe('resolveOutputFpsDebugVisible', () => {
	const clean = {
		dev: false,
		hash: '#/present',
		search: '',
		storageValue: null
	};

	it('is hidden by default in production (OBS-safe)', () => {
		expect(resolveOutputFpsDebugVisible(clean)).toBe(false);
	});

	it('always shows in DEV', () => {
		expect(resolveOutputFpsDebugVisible({ ...clean, dev: true })).toBe(
			true
		);
	});

	it('shows when the session toggle is set', () => {
		expect(
			resolveOutputFpsDebugVisible({ ...clean, storageValue: '1' })
		).toBe(true);
		expect(
			resolveOutputFpsDebugVisible({ ...clean, storageValue: '0' })
		).toBe(false);
	});

	it('shows when the URL flag is present', () => {
		expect(
			resolveOutputFpsDebugVisible({
				...clean,
				hash: '#/record?debug=fps'
			})
		).toBe(true);
	});
});
