import { useEffect } from 'react';
import { useAudioData } from '@/hooks/useAudioData';
import {
	isEditableEventTarget,
	resolveMediaTrackKeyCommand
} from './mediaTrackKeys';
import { runMediaTrackCommand } from './mediaTrackRuntime';

/**
 * Keyboard fallback for previous/next track keys (F7 / F9 and, where the browser
 * delivers them as key events, MediaTrackPrevious / MediaTrackNext). Routes
 * through the SAME `playPrevTrack` / `playNextTrack` commands the HUD buttons
 * use, via the shared runtime (so it dedupes against the Media Session path).
 *
 * Mount exactly once, above the routes, so it works in both Edit and
 * Presentation mode without registering duplicate listeners on route change.
 */
export function useMediaTrackKeys(): void {
	const { playPrevTrack, playNextTrack } = useAudioData();

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (isEditableEventTarget(event.target)) return;
			const direction = resolveMediaTrackKeyCommand(event);
			if (!direction) return;
			runMediaTrackCommand({
				direction,
				source: `keyboard:${event.key}`,
				keyLabel: event.key,
				run: () => {
					if (direction === 'previous') void playPrevTrack();
					else void playNextTrack();
				}
			});
		};

		window.addEventListener('keydown', onKeyDown);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [playPrevTrack, playNextTrack]);
}
