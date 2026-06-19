import { useEffect, useRef } from 'react';
import { useAudioData } from '@/hooks/useAudioData';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { isOutputModeRoute } from './isOutputModeRoute';

const AUTOSTART_DELAY_MS = 600;

/**
 * Presentation/recording remounts the audio provider. Restore paths default to
 * paused — this hook resumes playback once capture is ready.
 */
export function useOutputModeAudioAutostart(): void {
	const { resumeCapture, startCapture } = useAudioData();
	const attemptedRef = useRef(false);

	useEffect(() => {
		if (!isOutputModeRoute()) return undefined;
		if (attemptedRef.current) return undefined;

		let cancelled = false;
		const timer = window.setTimeout(() => {
			if (cancelled || attemptedRef.current) return;
			attemptedRef.current = true;

			const state = useWallpaperStore.getState();
			const hasFile =
				state.audioSourceMode === 'file' &&
				Boolean(state.audioFileAssetId);
			const hasPlaylist = Boolean(state.activeAudioTrackId);
			const hasLiveCapture =
				state.audioSourceMode === 'desktop' ||
				state.audioSourceMode === 'microphone';

			if (!hasFile && !hasPlaylist && !hasLiveCapture) return;

			if (hasLiveCapture) {
				void startCapture().catch(() => {
					// User may deny capture — presentation still renders.
				});
				return;
			}

			resumeCapture();
			useWallpaperStore.getState().setAudioPaused(false);
		}, AUTOSTART_DELAY_MS);

		return () => {
			cancelled = true;
			window.clearTimeout(timer);
		};
	}, [resumeCapture, startCapture]);
}
