import { describe, expect, it } from 'vitest';
import {
	isEditableEventTarget,
	resolveMediaTrackKeyCommand,
	shouldRunMediaTrackCommand
} from './mediaTrackKeys';

describe('resolveMediaTrackKeyCommand', () => {
	it('maps previous-track keys', () => {
		expect(resolveMediaTrackKeyCommand({ key: 'F7' })).toBe('previous');
		expect(resolveMediaTrackKeyCommand({ key: 'MediaTrackPrevious' })).toBe(
			'previous'
		);
	});

	it('maps next-track keys', () => {
		expect(resolveMediaTrackKeyCommand({ key: 'F9' })).toBe('next');
		expect(resolveMediaTrackKeyCommand({ key: 'MediaTrackNext' })).toBe(
			'next'
		);
	});

	it('ignores repeats (no auto-skip while held)', () => {
		expect(
			resolveMediaTrackKeyCommand({ key: 'F9', repeat: true })
		).toBeNull();
		expect(
			resolveMediaTrackKeyCommand({ key: 'MediaTrackNext', repeat: true })
		).toBeNull();
	});

	it('ignores unrelated keys, incl. F8 (play/pause must not regress)', () => {
		expect(resolveMediaTrackKeyCommand({ key: 'F8' })).toBeNull();
		expect(
			resolveMediaTrackKeyCommand({ key: 'MediaPlayPause' })
		).toBeNull();
		expect(resolveMediaTrackKeyCommand({ key: 'a' })).toBeNull();
		expect(resolveMediaTrackKeyCommand({ key: ' ' })).toBeNull();
	});
});

describe('isEditableEventTarget', () => {
	it('is true for form fields and contenteditable', () => {
		expect(isEditableEventTarget({ tagName: 'INPUT' } as never)).toBe(true);
		expect(isEditableEventTarget({ tagName: 'TEXTAREA' } as never)).toBe(
			true
		);
		expect(isEditableEventTarget({ tagName: 'SELECT' } as never)).toBe(
			true
		);
		expect(
			isEditableEventTarget({
				tagName: 'DIV',
				isContentEditable: true
			} as never)
		).toBe(true);
	});

	it('is false for non-editable targets', () => {
		expect(isEditableEventTarget({ tagName: 'DIV' } as never)).toBe(false);
		expect(isEditableEventTarget({ tagName: 'BUTTON' } as never)).toBe(
			false
		);
		expect(isEditableEventTarget(null)).toBe(false);
	});
});

describe('shouldRunMediaTrackCommand (dedupe)', () => {
	it('runs when there is no prior command', () => {
		expect(shouldRunMediaTrackCommand('next', 1000, null)).toBe(true);
	});

	it('suppresses the same direction within the window', () => {
		const last = { direction: 'next' as const, atMs: 1000 };
		expect(shouldRunMediaTrackCommand('next', 1010, last)).toBe(false);
	});

	it('allows the same direction after the window (intentional rapid skip)', () => {
		const last = { direction: 'next' as const, atMs: 1000 };
		expect(shouldRunMediaTrackCommand('next', 1100, last)).toBe(true);
	});

	it('always allows the opposite direction immediately', () => {
		const last = { direction: 'next' as const, atMs: 1000 };
		expect(shouldRunMediaTrackCommand('previous', 1005, last)).toBe(true);
	});
});
