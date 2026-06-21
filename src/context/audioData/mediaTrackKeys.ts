export type MediaTrackDirection = 'previous' | 'next';

/**
 * Pure: map a keyboard event to a track-navigation command, or null when the
 * key is irrelevant. Repeats are ignored (holding the key must not auto-skip).
 *
 * Hardware media keys (best-effort — macOS often swallows these):
 * - F7 / MediaTrackPrevious → previous (matches HUD ⏮)
 * - F9 / MediaTrackNext     → next     (matches HUD ⏭)
 *
 * Guaranteed app fallback shortcuts (always reach the page):
 * - Option/Alt + ArrowLeft  → previous
 * - Option/Alt + ArrowRight → next
 */
export function resolveMediaTrackKeyCommand(event: {
	key: string;
	repeat?: boolean;
	altKey?: boolean;
	metaKey?: boolean;
	ctrlKey?: boolean;
}): MediaTrackDirection | null {
	if (event.repeat) return null;

	// App fallback: Option/Alt + Arrow. Require alt and forbid meta/ctrl so it
	// can't collide with OS/browser combos.
	if (event.altKey && !event.metaKey && !event.ctrlKey) {
		if (event.key === 'ArrowLeft') return 'previous';
		if (event.key === 'ArrowRight') return 'next';
	}

	switch (event.key) {
		case 'MediaTrackPrevious':
		case 'F7':
			return 'previous';
		case 'MediaTrackNext':
		case 'F9':
			return 'next';
		default:
			return null;
	}
}

/**
 * Pure: is this a key we want to record in the DEV diagnostics overlay (to prove
 * whether the OS even delivers it to the page)? Covers the hardware media keys
 * and the app fallback combos — including F8 / MediaPlayPause for completeness,
 * even though play/pause is handled elsewhere.
 */
export function isDiagnosticMediaKey(event: {
	key: string;
	altKey?: boolean;
}): boolean {
	switch (event.key) {
		case 'F7':
		case 'F8':
		case 'F9':
		case 'MediaTrackPrevious':
		case 'MediaTrackNext':
		case 'MediaPlayPause':
			return true;
		case 'ArrowLeft':
		case 'ArrowRight':
			return Boolean(event.altKey);
		default:
			return false;
	}
}

/**
 * Pure: should the key be ignored because the user is typing in a form field?
 * Avoids stealing F7/F9 from inputs/textareas/contenteditable.
 */
export function isEditableEventTarget(target: EventTarget | null): boolean {
	if (!target) return false;
	// Duck-typed (not `instanceof HTMLElement`) so it is safe in non-DOM envs.
	const el = target as { tagName?: unknown; isContentEditable?: unknown };
	const tag = typeof el.tagName === 'string' ? el.tagName : '';
	return (
		tag === 'INPUT' ||
		tag === 'TEXTAREA' ||
		tag === 'SELECT' ||
		el.isContentEditable === true
	);
}

/**
 * Pure dedupe: returns true if a command in `direction` at `nowMs` should run,
 * given the last command direction + timestamp. Identical directions fired
 * within `windowMs` are suppressed — this stops the Media Session and keyboard
 * paths from both firing for the SAME physical key press. The window is
 * deliberately short (same-tick duplicates only) so intentional rapid presses
 * still skip multiple tracks.
 */
export function shouldRunMediaTrackCommand(
	direction: MediaTrackDirection,
	nowMs: number,
	last: { direction: MediaTrackDirection; atMs: number } | null,
	windowMs = 50
): boolean {
	if (!last) return true;
	if (last.direction !== direction) return true;
	return nowMs - last.atMs >= windowMs;
}
