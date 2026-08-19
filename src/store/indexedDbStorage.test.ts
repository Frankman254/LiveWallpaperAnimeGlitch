import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	indexedDbStorage,
	resetIndexedDbStorageForTests
} from './indexedDbStorage';

const local = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
	getItem: (k: string) => local.get(k) ?? null,
	setItem: (k: string, v: string) => void local.set(k, v),
	removeItem: (k: string) => void local.delete(k),
	clear: () => void local.clear()
};

describe('indexedDbStorage', () => {
	beforeEach(() => {
		local.clear();
		resetIndexedDbStorageForTests();
	});

	it('misses on an unknown key', async () => {
		expect(await indexedDbStorage.getItem('nothing-here')).toBeNull();
	});

	it('round-trips a value', async () => {
		await indexedDbStorage.setItem('k1', JSON.stringify({ a: 1 }));
		expect(await indexedDbStorage.getItem('k1')).toBe('{"a":1}');
	});

	it('stores far more than the localStorage quota would allow', async () => {
		// The whole reason for the switch: a real project exceeds ~5 MB.
		const big = JSON.stringify({ blob: 'x'.repeat(8 * 1024 * 1024) });
		await indexedDbStorage.setItem('big', big);
		expect((await indexedDbStorage.getItem('big'))?.length).toBe(
			big.length
		);
	});

	it('adopts an existing localStorage state on first read', async () => {
		// An install that predates the switch must keep its project.
		local.set('lwag-state', JSON.stringify({ state: { legacy: true } }));

		const first = await indexedDbStorage.getItem('lwag-state');
		expect(first).toContain('legacy');

		// And it is now in IndexedDB, so a later localStorage wipe is harmless.
		local.clear();
		expect(await indexedDbStorage.getItem('lwag-state')).toContain(
			'legacy'
		);
	});

	it('prefers IndexedDB over a stale localStorage copy', async () => {
		await indexedDbStorage.setItem('k2', JSON.stringify({ from: 'idb' }));
		local.set('k2', JSON.stringify({ from: 'localStorage' }));
		expect(await indexedDbStorage.getItem('k2')).toContain('idb');
	});

	it('ignores corrupted payloads instead of throwing', async () => {
		// Persist would crash the editor on a parse error; falling back to
		// defaults is recoverable.
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		await indexedDbStorage.setItem('broken', '{not json');
		expect(await indexedDbStorage.getItem('broken')).toBeNull();
		expect(spy).toHaveBeenCalled();
		spy.mockRestore();
	});

	it('ignores a corrupted legacy localStorage value', async () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		local.set('legacy-broken', 'not json at all');
		expect(await indexedDbStorage.getItem('legacy-broken')).toBeNull();
		spy.mockRestore();
	});

	it('removes from both stores', async () => {
		await indexedDbStorage.setItem('k3', '{"a":1}');
		local.set('k3', '{"a":1}');
		await indexedDbStorage.removeItem('k3');

		expect(await indexedDbStorage.getItem('k3')).toBeNull();
		expect(local.get('k3')).toBeUndefined();
	});

	it('falls back to localStorage when IndexedDB is unavailable', async () => {
		const realIndexedDb = globalThis.indexedDB;
		// @ts-expect-error — simulating a browser with storage blocked.
		delete globalThis.indexedDB;
		resetIndexedDbStorageForTests();

		try {
			await indexedDbStorage.setItem('k4', '{"a":2}');
			expect(local.get('k4')).toBe('{"a":2}');
			expect(await indexedDbStorage.getItem('k4')).toBe('{"a":2}');
		} finally {
			globalThis.indexedDB = realIndexedDb;
			resetIndexedDbStorageForTests();
		}
	});

	it('reports a quota failure rather than throwing when falling back', async () => {
		const realIndexedDb = globalThis.indexedDB;
		// @ts-expect-error — simulating a browser with storage blocked.
		delete globalThis.indexedDB;
		resetIndexedDbStorageForTests();

		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const setItem = vi
			.spyOn(globalThis.localStorage, 'setItem')
			.mockImplementation(() => {
				const error = new Error('quota');
				error.name = 'QuotaExceededError';
				throw error;
			});

		try {
			// Must not throw — a failed persist write cannot be allowed to crash
			// the editor mid-session.
			await expect(
				indexedDbStorage.setItem('k5', '{"a":3}')
			).resolves.toBeUndefined();
			expect(spy).toHaveBeenCalled();
		} finally {
			setItem.mockRestore();
			spy.mockRestore();
			globalThis.indexedDB = realIndexedDb;
			resetIndexedDbStorageForTests();
		}
	});
});
