export type MediaTrackDirection = 'previous' | 'next';

/**
 * Pure: map a keyboard event to a track-navigation command, or null when the
 * key is irrelevant. Repeats are ignored (holding the key must not auto-skip).
 *
 * - F7 / MediaTrackPrevious → previous (matches HUD ⏮)
 * - F9 / MediaTrackNext     → next     (matches HUD ⏭)
 */
export function resolveMediaTrackKeyCommand(event: {
	key: string;
	repeat?: boolean;
}): MediaTrackDirection | null {
	if (event.repeat) return null;
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
