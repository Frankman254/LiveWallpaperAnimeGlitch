import { useEffect, useMemo, useRef } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioContext } from '@/context/AudioDataContext';

/** Cycles through background images using the active image item. Renders nothing. */
export default function SlideshowManager() {
	const {
		backgroundImages,
		activeImageId,
		slideshowEnabled,
		slideshowInterval,
		slideshowAudioCheckpointsEnabled,
		slideshowTrackChangeSyncEnabled,
		audioTracks,
		activeAudioTrackId,
		motionPaused,
		sleepModeActive
	} = useWallpaperStore();
	const { captureMode, getCurrentTime, getDuration } = useAudioContext();
	const lastTrackSyncIdRef = useRef<string | null>(null);
	const slideshowIds = useMemo(
		() =>
			backgroundImages
				.filter(image => image.url)
				.map(image => image.assetId),
		[backgroundImages]
	);
	const enabledTrackIds = useMemo(
		() => audioTracks.filter(track => track.enabled).map(track => track.id),
		[audioTracks]
	);
	const useAudioCheckpointSync =
		slideshowEnabled &&
		slideshowAudioCheckpointsEnabled &&
		captureMode === 'file' &&
		slideshowIds.length >= 2;

	useEffect(() => {
		if (
			!slideshowEnabled ||
			useAudioCheckpointSync ||
			slideshowTrackChangeSyncEnabled ||
			motionPaused ||
			sleepModeActive ||
			slideshowIds.length < 2
		)
			return;

		const timeoutId = window.setTimeout(
			() => {
				const state = useWallpaperStore.getState();
				const items = state.backgroundImages.filter(image => image.url);
				if (items.length < 2) return;
				const currentIndex = Math.max(
					0,
					items.findIndex(
						image => image.assetId === state.activeImageId
					)
				);
				const nextItem = items[(currentIndex + 1) % items.length];
				state.setActiveImageId(nextItem.assetId);
			},
			Math.max(1, slideshowInterval) * 1000
		);

		return () => clearTimeout(timeoutId);
	}, [
		activeImageId,
		motionPaused,
		sleepModeActive,
		slideshowEnabled,
		slideshowTrackChangeSyncEnabled,
		slideshowIds,
		slideshowInterval,
		useAudioCheckpointSync
	]);

	useEffect(() => {
		if (
			!useAudioCheckpointSync ||
			motionPaused ||
			sleepModeActive ||
			slideshowIds.length < 2
		)
			return;

		let timeoutId = 0;
		const tick = () => {
			const duration = getDuration();
			if (duration >= 8 * 60) {
				const currentTime = Math.max(0, getCurrentTime());
				const progress = Math.min(
					0.999999,
					duration > 0 ? currentTime / duration : 0
				);
				const nextIndex = Math.min(
					slideshowIds.length - 1,
					Math.floor(progress * slideshowIds.length)
				);
				const nextId = slideshowIds[nextIndex];
				if (nextId && useWallpaperStore.getState().activeImageId !== nextId) {
					useWallpaperStore.getState().setActiveImageId(nextId);
				}

				const checkpointDuration = duration / Math.max(slideshowIds.length, 1);
				const timeIntoCheckpoint =
					checkpointDuration > 0 ? currentTime % checkpointDuration : 0;
				const timeToNextCheckpoint = checkpointDuration - timeIntoCheckpoint;
				const nextDelayMs =
					timeToNextCheckpoint < 0.35
						? 80
						: timeToNextCheckpoint < 1.5
							? 160
							: 320;
				timeoutId = window.setTimeout(tick, nextDelayMs);
				return;
			}
			timeoutId = window.setTimeout(tick, 500);
		};

		timeoutId = window.setTimeout(tick, 180);
		return () => window.clearTimeout(timeoutId);
	}, [
		getCurrentTime,
		getDuration,
		motionPaused,
		sleepModeActive,
		slideshowIds,
		useAudioCheckpointSync
	]);

	useEffect(() => {
		if (
			!slideshowEnabled ||
			!slideshowTrackChangeSyncEnabled ||
			motionPaused ||
			sleepModeActive ||
			slideshowIds.length < 2 ||
			enabledTrackIds.length < 2 ||
			!activeAudioTrackId
		) {
			lastTrackSyncIdRef.current = activeAudioTrackId ?? null;
			return;
		}
		if (lastTrackSyncIdRef.current === activeAudioTrackId) return;
		lastTrackSyncIdRef.current = activeAudioTrackId;

		const trackIndex = enabledTrackIds.findIndex(id => id === activeAudioTrackId);
		if (trackIndex < 0) return;
		const nextId = slideshowIds[trackIndex % slideshowIds.length];
		if (nextId && nextId !== useWallpaperStore.getState().activeImageId) {
			useWallpaperStore.getState().setActiveImageId(nextId);
		}
	}, [
		activeAudioTrackId,
		enabledTrackIds,
		motionPaused,
		sleepModeActive,
		slideshowEnabled,
		slideshowIds,
		slideshowTrackChangeSyncEnabled
	]);

	return null;
}
