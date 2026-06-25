import { describe, it, expect, beforeEach } from 'vitest';

const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
	getItem: (k: string) => mem.get(k) ?? null,
	setItem: (k: string, v: string) => void mem.set(k, v),
	removeItem: (k: string) => void mem.delete(k),
	clear: () => void mem.clear()
};

const { readPersistedSpectrumTarget, writePersistedSpectrumTarget } =
	await import('@/features/spectrum/spectrumTargetPreference');

describe('spectrum target localStorage preference', () => {
	beforeEach(() => mem.clear());

	it('defaults to main when nothing is stored', () => {
		expect(readPersistedSpectrumTarget()).toBe('main');
	});

	it('reads the new key', () => {
		mem.set('lwag-spectrum-target', 'instance');
		expect(readPersistedSpectrumTarget()).toBe('instance');
	});

	it('falls back to the legacy key when the new key is absent', () => {
		mem.set('lwag-modern-spectrum-target', 'instance');
		expect(readPersistedSpectrumTarget()).toBe('instance');
	});

	it('prefers the new key over the legacy key', () => {
		mem.set('lwag-spectrum-target', 'main');
		mem.set('lwag-modern-spectrum-target', 'instance');
		expect(readPersistedSpectrumTarget()).toBe('main');
	});

	it('writes only the new key', () => {
		writePersistedSpectrumTarget('instance');
		expect(mem.get('lwag-spectrum-target')).toBe('instance');
		expect(mem.get('lwag-modern-spectrum-target')).toBeUndefined();
	});
});
