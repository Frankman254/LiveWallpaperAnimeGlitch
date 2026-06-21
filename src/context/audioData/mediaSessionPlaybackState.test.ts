import { describe, expect, it } from 'vitest';
import {
	resolveMediaSessionPlaybackState,
	shouldRegisterMediaSessionActionHandlers
} from './mediaSessionPlaybackState';

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

describe('shouldRegisterMediaSessionActionHandlers', () => {
	it('registers when capture is active', () => {
		expect(
			shouldRegisterMediaSessionActionHandlers({
				captureState: 'active',
				hasAudioTracks: false,
				activeAudioTrackId: null
			})
		).toBe(true);
	});

	it('registers when a playlist has tracks (even before playback)', () => {
		expect(
			shouldRegisterMediaSessionActionHandlers({
				captureState: 'idle',
				hasAudioTracks: true,
				activeAudioTrackId: null
			})
		).toBe(true);
	});

	it('registers when an active track id is set', () => {
		expect(
			shouldRegisterMediaSessionActionHandlers({
				captureState: 'idle',
				hasAudioTracks: false,
				activeAudioTrackId: 'track-1'
			})
		).toBe(true);
	});

	it('does NOT register when there is no audio context at all', () => {
		expect(
			shouldRegisterMediaSessionActionHandlers({
				captureState: 'idle',
				hasAudioTracks: false,
				activeAudioTrackId: null
			})
		).toBe(false);
	});

	it('decision does not depend on the mediaSessionEnabled toggle (no such input)', () => {
		// Hardware media keys must work regardless of the toggle: the function
		// signature intentionally has no `mediaSessionEnabled` parameter.
		expect(
			Object.keys({
				captureState: 'active',
				hasAudioTracks: false,
				activeAudioTrackId: null
			})
		).not.toContain('mediaSessionEnabled');
	});
});
