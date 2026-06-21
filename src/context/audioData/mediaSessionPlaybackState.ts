import type { AudioCaptureState } from '@/types/wallpaper';

/**
 * Resolves the value for `navigator.mediaSession.playbackState`.
 *
 * Maintaining this is what lets the OS/browser route hardware media keys to the
 * *correct* action handler. When it is left at the default `'none'`, Chrome has
 * to guess play-vs-pause from the underlying media element, which diverges from
 * the app's canonical `audioPaused` state. That divergence is the root cause of:
 *   - F8 "pause then immediately resume" (Chrome fires the wrong handler),
 *   - F7/F9 previous/next being inert (no active media session on macOS), and
 *   - audio resuming natively while the React paused flags stay stale, so the
 *     analyser snapshot returns empty and the canvas freezes.
 */
export function resolveMediaSessionPlaybackState(
	captureState: AudioCaptureState,
	audioPaused: boolean
): MediaSessionPlaybackState {
	if (captureState !== 'active') return 'none';
	return audioPaused ? 'paused' : 'playing';
}

/**
 * Whether the Media Session action handlers (play/pause/prev/next) should be
 * registered. True whenever there is any audio context at all — deliberately
 * NOT a function of the `mediaSessionEnabled` toggle, because hardware media
 * keys (especially macOS prev/next) must work without an obscure opt-in.
 */
export function shouldRegisterMediaSessionActionHandlers(input: {
	captureState: AudioCaptureState;
	hasAudioTracks: boolean;
	activeAudioTrackId: string | null;
}): boolean {
	return (
		input.captureState === 'active' ||
		input.hasAudioTracks ||
		input.activeAudioTrackId != null
	);
}
