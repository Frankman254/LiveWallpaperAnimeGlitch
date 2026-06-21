import { describe, expect, it, beforeEach } from 'vitest';
import {
	getMediaTrackDiagnostics,
	recordMediaKeyboardEvent,
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

	it('records command source / resolved command / media-session action', () => {
		runMediaTrackCommand({
			direction: 'next',
			source: 'mediaSession',
			run: () => {}
		});
		const diag = getMediaTrackDiagnostics();
		expect(diag.lastMediaSessionAction).toBe('nexttrack');
		expect(diag.lastTrackCommandSource).toBe('mediaSession');
		expect(diag.lastResolvedCommand).toBe('next');
		expect(diag.lastSuppressedByDedupe).toBe(false);
	});

	it('records raw keyboard events even when nothing resolves (delivery proof)', () => {
		recordMediaKeyboardEvent({
			key: 'F9',
			code: 'F9',
			altKey: false,
			metaKey: false,
			shiftKey: false,
			ctrlKey: false
		});
		const diag = getMediaTrackDiagnostics();
		expect(diag.lastKeyboardEventKey).toBe('F9');
		expect(diag.lastKeyboardEventCode).toBe('F9');
		expect(diag.lastKeyboardModifiers).toBe('none');
		expect(diag.lastKeyboardEventTime).not.toBeNull();
	});

	it('records modifier combos for app fallback shortcuts', () => {
		recordMediaKeyboardEvent({
			key: 'ArrowRight',
			code: 'ArrowRight',
			altKey: true
		});
		expect(getMediaTrackDiagnostics().lastKeyboardModifiers).toBe('alt');
	});

	it('flags a dedupe-suppressed command in diagnostics', () => {
		runMediaTrackCommand({
			direction: 'next',
			source: 'hud',
			run: () => {}
		});
		runMediaTrackCommand({
			direction: 'next',
			source: 'keyboard:F9',
			run: () => {}
		});
		expect(getMediaTrackDiagnostics().lastSuppressedByDedupe).toBe(true);
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
