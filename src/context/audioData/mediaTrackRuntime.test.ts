import { describe, expect, it, beforeEach } from 'vitest';
import {
	getMediaTrackDiagnostics,
	resetMediaTrackRuntime,
	runMediaTrackCommand
} from './mediaTrackRuntime';

describe('runMediaTrackCommand (shared command path)', () => {
	beforeEach(() => {
		resetMediaTrackRuntime();
	});

	it('invokes the supplied next/previous command directly (never a toggle)', () => {
		const calls: string[] = [];
		runMediaTrackCommand({
			direction: 'next',
			source: 'mediaSession',
			run: () => calls.push('next')
		});
		runMediaTrackCommand({
			direction: 'previous',
			source: 'hud',
			run: () => calls.push('previous')
		});
		expect(calls).toEqual(['next', 'previous']);
	});

	it('records media-session vs keyboard diagnostics', () => {
		runMediaTrackCommand({
			direction: 'next',
			source: 'mediaSession',
			run: () => {}
		});
		expect(getMediaTrackDiagnostics().lastMediaSessionAction).toBe(
			'nexttrack'
		);

		runMediaTrackCommand({
			direction: 'previous',
			source: 'keyboard:F7',
			keyLabel: 'F7',
			run: () => {}
		});
		const diag = getMediaTrackDiagnostics();
		expect(diag.lastKeyboardMediaKey).toBe('F7');
		expect(diag.lastPlaybackCommand).toContain('previous');
	});

	it('dedupes the same physical press arriving via two paths', () => {
		let runs = 0;
		// Media Session fires...
		const a = runMediaTrackCommand({
			direction: 'next',
			source: 'mediaSession',
			run: () => (runs += 1)
		});
		// ...and the keyboard event for the SAME press fires ~immediately.
		const b = runMediaTrackCommand({
			direction: 'next',
			source: 'keyboard:MediaTrackNext',
			run: () => (runs += 1)
		});
		expect(a).toBe(true);
		expect(b).toBe(false);
		expect(runs).toBe(1);
	});
});
