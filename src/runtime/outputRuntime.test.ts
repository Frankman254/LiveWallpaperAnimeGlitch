import { describe, expect, it, beforeEach, afterEach } from 'vitest';

const {
	RECORDING_RENDER_SCALE_OPTIONS,
	useOutputPerformanceStore,
	resolveEffectiveDevicePixelRatio
} = await import('@/runtime/outputPerformanceStore');
const { isOutputModeRoute } = await import('@/runtime/isOutputModeRoute');

describe('recording render scale normalization', () => {
	beforeEach(() => {
		useOutputPerformanceStore.getState().reset();
	});

	it('only accepts the documented scale options', () => {
		expect(RECORDING_RENDER_SCALE_OPTIONS).toEqual([0.5, 0.75, 1]);
	});

	it('accepts valid scales', () => {
		for (const scale of RECORDING_RENDER_SCALE_OPTIONS) {
			useOutputPerformanceStore.getState().setRecordingRenderScale(scale);
			expect(
				useOutputPerformanceStore.getState().recordingRenderScale
			).toBe(scale);
		}
	});

	it('falls back to 1 for out-of-range / invalid scales', () => {
		const set =
			useOutputPerformanceStore.getState().setRecordingRenderScale;
		for (const bad of [0.25, 0.6, 2, 0, -1, Number.NaN]) {
			set(bad as 0.5 | 0.75 | 1);
			expect(
				useOutputPerformanceStore.getState().recordingRenderScale
			).toBe(1);
		}
	});
});

describe('resolveEffectiveDevicePixelRatio', () => {
	const realWindow = (globalThis as Record<string, unknown>).window;

	afterEach(() => {
		if (realWindow === undefined) {
			delete (globalThis as Record<string, unknown>).window;
		} else {
			(globalThis as Record<string, unknown>).window = realWindow;
		}
	});

	it('returns 1 when there is no window', () => {
		delete (globalThis as Record<string, unknown>).window;
		expect(resolveEffectiveDevicePixelRatio('recording', 0.5)).toBe(1);
	});

	it('ignores render scale outside recording mode', () => {
		(globalThis as Record<string, unknown>).window = {
			devicePixelRatio: 2
		};
		expect(resolveEffectiveDevicePixelRatio('edit', 0.5)).toBe(2);
		expect(resolveEffectiveDevicePixelRatio('presentation', 0.5)).toBe(2);
	});

	it('scales and clamps the DPR in recording mode', () => {
		(globalThis as Record<string, unknown>).window = {
			devicePixelRatio: 2
		};
		expect(resolveEffectiveDevicePixelRatio('recording', 0.5)).toBe(1);
		expect(resolveEffectiveDevicePixelRatio('recording', 0.75)).toBe(1.5);
		expect(resolveEffectiveDevicePixelRatio('recording', 1)).toBe(2);
		// Out-of-range scales are clamped to [0.5, 1].
		expect(resolveEffectiveDevicePixelRatio('recording', 0.1)).toBe(1);
		expect(resolveEffectiveDevicePixelRatio('recording', 4)).toBe(2);
	});
});

describe('isOutputModeRoute', () => {
	const realWindow = (globalThis as Record<string, unknown>).window;

	function setHash(hash: string) {
		(globalThis as Record<string, unknown>).window = { location: { hash } };
	}

	afterEach(() => {
		if (realWindow === undefined) {
			delete (globalThis as Record<string, unknown>).window;
		} else {
			(globalThis as Record<string, unknown>).window = realWindow;
		}
	});

	it('is true for clean output shells', () => {
		setHash('#/present');
		expect(isOutputModeRoute()).toBe(true);
		setHash('#/record');
		expect(isOutputModeRoute()).toBe(true);
	});

	it('is false for editor / preview routes', () => {
		setHash('#/edit');
		expect(isOutputModeRoute()).toBe(false);
		setHash('#/preview');
		expect(isOutputModeRoute()).toBe(false);
		setHash('');
		expect(isOutputModeRoute()).toBe(false);
	});
});
