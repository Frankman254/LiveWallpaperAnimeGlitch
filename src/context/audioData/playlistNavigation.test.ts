import { describe, expect, it } from 'vitest';
import { resolveNextTrackId, resolvePrevTrackId } from './playlistNavigation';

const list = ['a', 'b', 'c'];

describe('resolveNextTrackId', () => {
	it('advances to the following track', () => {
		expect(resolveNextTrackId(list, 'a')).toBe('b');
		expect(resolveNextTrackId(list, 'b')).toBe('c');
	});

	it('wraps from the last track to the first', () => {
		expect(resolveNextTrackId(list, 'c')).toBe('a');
	});

	it('starts at the top when the active id is unknown', () => {
		expect(resolveNextTrackId(list, 'zzz')).toBe('a');
		expect(resolveNextTrackId(list, null)).toBe('a');
	});

	it('no-ops safely on an empty playlist', () => {
		expect(resolveNextTrackId([], 'a')).toBeNull();
		expect(resolveNextTrackId([], null)).toBeNull();
	});

	it('stays on the only track in a single-item list', () => {
		expect(resolveNextTrackId(['solo'], 'solo')).toBe('solo');
	});
});

describe('resolvePrevTrackId', () => {
	it('steps back to the previous track', () => {
		expect(resolvePrevTrackId(list, 'c')).toBe('b');
		expect(resolvePrevTrackId(list, 'b')).toBe('a');
	});

	it('wraps from the first track to the last', () => {
		expect(resolvePrevTrackId(list, 'a')).toBe('c');
	});

	it('wraps to the last when the active id is unknown', () => {
		expect(resolvePrevTrackId(list, 'zzz')).toBe('c');
		expect(resolvePrevTrackId(list, null)).toBe('c');
	});

	it('no-ops safely on an empty playlist', () => {
		expect(resolvePrevTrackId([], 'a')).toBeNull();
	});

	it('stays on the only track in a single-item list', () => {
		expect(resolvePrevTrackId(['solo'], 'solo')).toBe('solo');
	});
});
