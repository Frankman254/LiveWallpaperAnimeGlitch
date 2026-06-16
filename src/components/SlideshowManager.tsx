import { useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioContext } from '@/context/useAudioContext';
import {
	filterImageIdsBySetlist,
	getActiveSetlist
} from '@/store/slices/setlistsSlice';

/** Cycles through background images using the active image item. Renders nothing. */
export default function SlideshowManager() {
	const {
		backgroundImages,
		activeImageId,
		slideshowEnabled,
		slideshowInterval,
		slideshowAudioCheckpointsEnabled,
		slideshowTrackChangeSyncEnabled,
		slideshowManualTimestampsEnabled,
		audioTracks,
		activeAudioTrackId,
		motionPaused,
		sleepModeActive,
		setlists,
		activeSetlistId
	} = useWallpaperStore(
		useShallow(s => ({
			backgroundImages: s.backgroundImages,
			activeImageId: s.activeImageId,
			slideshowEnabled: s.slideshowEnabled,
			slideshowInterval: s.slideshowInterval,
			slideshowAudioCheckpointsEnabled:
				s.slideshowAudioCheckpointsEnabled,
			slideshowTrackChangeSyncEnabled: s.slideshowTrackChangeSyncEnabled,
			slideshowManualTimestampsEnabled:
				s.slideshowManualTimestampsEnabled,
			audioTracks: s.audioTracks,
			activeAudioTrackId: s.activeAudioTrackId,
			motionPaused: s.motionPaused,
			sleepModeActive: s.sleepModeActive,
			setlists: s.setlists,
			activeSetlistId: s.activeSetlistId
		}))
	);
	const { captureMode, getCurrentTime, getDuration } = useAudioContext();
	const lastTrackSyncIdRef = useRef<string | null>(null);
	// When a setlist is active, both the slideshow image cycle and the audio
	// playlist auto-advance must filter to setlist members ONLY. The user
	// expects strict isolation — non-members shouldn't even show up.
	const slideshowIds = useMemo(() => {
		const enabled = backgroundImages.filter(
			image => image.url && image.enabled
		);
		const filtered = filterImageIdsBySetlist(
			enabled,
			setlists,
			activeSetlistId
		);
		return filtered.map(image => image.assetId);
	}, [backgroundImages, setlists, activeSetlistId]);
	const enabledTrackIds = useMemo(() => {
		const enabled = audioTracks.filter(track => track.enabled);
		const active = getActiveSetlist(setlists, activeSetlistId);
		if (!active) return enabled.map(track => track.id);
		const allowed = new Set(active.trackIds);
		return enabled
			.filter(track => allowed.has(track.id))
			.map(track => track.id);
	}, [audioTracks, setlists, activeSetlistId]);

	const useAudioCheckpointSync =
		slideshowEnabled &&
		slideshowAudioCheckpointsEnabled &&
		captureMode === 'file' &&
		slideshowIds.length >= 2 &&
		!slideshowManualTimestampsEnabled;

	const useManualTimestamps =
		slideshowEnabled &&
		slideshowManualTimestampsEnabled &&
		captureMode === 'file' &&
		slideshowIds.length >= 1;

	// ── Timer-based interval mode ──────────────────────────────────────────
	useEffect(() => {
		if (
			!slideshowEnabled ||
			useAudioCheckpointSync ||
			useManualTimestamps ||
			slideshowTrackChangeSyncEnabled ||
			motionPaused ||
			sleepModeActive ||
			slideshowIds.length < 2
		)
			return;

		const timeoutId = window.setTimeout(
			() => {
				const state = useWallpaperStore.getState();
				const items = filterImageIdsBySetlist(
					state.backgroundImages.filter(
						image => image.url && image.enabled
					),
					state.setlists,
					state.activeSetlistId
				);
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
		useAudioCheckpointSync,
		useManualTimestamps
	]);

	// ── Audio checkpoint mode (proportional to track duration) ────────────
	useEffect(() => {
		if (
			!useAudioCheckpointSync ||
			motionPaused ||
			sleepModeActive ||
			slideshowIds.length < 2
		)
			return;

		let cancelled = false;
		let timeoutId = 0;
		const tick = () => {
			if (cancelled) return;
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
				if (
					nextId &&
					useWallpaperStore.getState().activeImageId !== nextId
				) {
					useWallpaperStore.getState().setActiveImageId(nextId);
				}

				const checkpointDuration =
					duration / Math.max(slideshowIds.length, 1);
				const timeIntoCheckpoint =
					checkpointDuration > 0
						? currentTime % checkpointDuration
						: 0;
				const timeToNextCheckpoint =
					checkpointDuration - timeIntoCheckpoint;
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
		return () => {
			cancelled = true;
			window.clearTimeout(timeoutId);
		};
	}, [
		getCurrentTime,
		getDuration,
		motionPaused,
		sleepModeActive,
		slideshowIds,
		useAudioCheckpointSync
	]);

	// ── Manual timestamps mode ─────────────────────────────────────────────
	useEffect(() => {
		if (!useManualTimestamps || motionPaused || sleepModeActive) return;

		let cancelled = false;
		let timeoutId = 0;
		const tick = () => {
			if (cancelled) return;
			const currentTime = Math.max(0, getCurrentTime());
			const duration = Math.max(0.1, getDuration());

			// Build effective list of timestamps combining manual and calculated.
			// Disabled images are excluded so they never become active and don't
			// shift the calculated checkpoint cadence. Setlist filter applies
			// here too — a non-member image won't appear in the schedule at all.
			const effectiveImages = filterImageIdsBySetlist(
				backgroundImages.filter(img => img.url && img.enabled),
				setlists,
				activeSetlistId
			)
				.map((img, index, arr) => {
					const calculated =
						(duration / Math.max(arr.length, 1)) * index;
					return {
						assetId: img.assetId,
						switchAt:
							img.playbackSwitchAt != null
								? img.playbackSwitchAt
								: calculated
					};
				})
				.sort((a, b) => a.switchAt - b.switchAt);

			// Find the last image whose switchAt <= currentTime
			let targetImg = effectiveImages[0];
			for (const img of effectiveImages) {
				if (img.switchAt <= currentTime) {
					targetImg = img;
				} else {
					break;
				}
			}
			if (targetImg) {
				const state = useWallpaperStore.getState();
				if (state.activeImageId !== targetImg.assetId) {
					state.setActiveImageId(targetImg.assetId);
				}
			}

			// Schedule next tick: find time to next switch point
			const nextSwitch = effectiveImages.find(
				img => img.switchAt > currentTime
			);
			const timeToNext = nextSwitch
				? nextSwitch.switchAt - currentTime
				: 2;
			const delayMs =
				timeToNext < 0.35 ? 80 : timeToNext < 1.5 ? 160 : 400;
			timeoutId = window.setTimeout(tick, delayMs);
		};

		timeoutId = window.setTimeout(tick, 100);
		return () => {
			cancelled = true;
			window.clearTimeout(timeoutId);
		};
	}, [
		getCurrentTime,
		getDuration,
		motionPaused,
		sleepModeActive,
		backgroundImages,
		setlists,
		activeSetlistId,
		useManualTimestamps
	]);

	// ── Track change sync mode ─────────────────────────────────────────────
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

		const trackIndex = enabledTrackIds.findIndex(
			id => id === activeAudioTrackId
		);
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
