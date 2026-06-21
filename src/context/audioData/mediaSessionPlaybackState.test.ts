import { describe, expect, it } from 'vitest';
import { resolveMediaSessionPlaybackState } from './mediaSessionPlaybackState';

describe('resolveMediaSessionPlaybackState', () => {
	it('reports "playing" when capture is active and not paused', () => {
		expect(resolveMediaSessionPlaybackState('active', false)).toBe(
			'playing'
		);
	});

	it('reports "paused" when capture is active but paused', () => {
		expect(resolveMediaSessionPlaybackState('active', true)).toBe('paused');
	});

	it('reports "none" whenever capture is not active', () => {
		expect(resolveMediaSessionPlaybackState('idle', false)).toBe('none');
		expect(resolveMediaSessionPlaybackState('idle', true)).toBe('none');
		expect(resolveMediaSessionPlaybackState('error', false)).toBe('none');
		expect(resolveMediaSessionPlaybackState('requesting', false)).toBe(
			'none'
		);
	});

	it('never returns a value the Media Session API rejects', () => {
		const allowed = new Set(['none', 'paused', 'playing']);
		for (const state of [
			'idle',
			'active',
			'error',
			'requesting'
		] as const) {
			for (const paused of [true, false]) {
				expect(
					allowed.has(resolveMediaSessionPlaybackState(state, paused))
				).toBe(true);
			}
		}
	});
});
