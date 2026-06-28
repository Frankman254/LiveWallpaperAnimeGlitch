import { useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioContext } from '@/context/useAudioContext';
import {
	filterImageIdsBySetlist,
	getActiveSetlist
} from '@/store/slices/setlistsSlice';
import { PLAYBACK_ZERO_EPSILON } from '@/lib/slideshowPlayback';

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
	// Track the last assetId the auto-sync committed so manual changes between
	// checkpoint boundaries are preserved (we only override when the computed
	// target itself changes, not just when it differs from activeImageId).
	const lastCheckpointIdRef = useRef<string | null>(null);
	const lastTimestampAssetIdRef = useRef<string | null>(null);
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

	// ── Zero-position reset ────────────────────────────────────────────────
	// On mount and whenever slideshow is toggled on or the image pool changes:
	// if playback is at position 0 (or not started), snap to image 1/N so the
	// persisted activeImageId from a previous session doesn't linger.
	// This covers the page-reload case in every slideshow mode (timer,
	// checkpoint, track-sync).
	//
	// getCurrentTime is a stable ref-backed function — intentionally excluded
	// from deps so this fires on structural changes only, not every poll tick.
	useEffect(() => {
		if (!slideshowEnabled || slideshowIds.length < 1) return;
		if (getCurrentTime() > PLAYBACK_ZERO_EPSILON) return;
		const firstId = slideshowIds[0];
		if (!firstId) return;
		const wallpaperState = useWallpaperStore.getState();
		if (wallpaperState.activeImageId !== firstId) {
			wallpaperState.setActiveImageId(firstId);
		}
		// Prime checkpoint refs so the polling effects don't fight this reset.
		lastCheckpointIdRef.current = firstId;
		lastTimestampAssetIdRef.current = firstId;
	}, [slideshowEnabled, slideshowIds]); // eslint-disable-line react-hooks/exhaustive-deps

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
			if (duration > 0) {
				const currentTime = Math.max(0, getCurrentTime());
				const progress = Math.min(
					0.999999,
					currentTime / duration
				);
				const nextIndex = Math.min(
					slideshowIds.length - 1,
					Math.floor(progress * slideshowIds.length)
				);
				const nextId = slideshowIds[nextIndex];
				// Only override activeImageId when the auto-computed target
				// itself changes — preserves manual selections within a checkpoint.
				if (nextId && nextId !== lastCheckpointIdRef.current) {
					lastCheckpointIdRef.current = nextId;
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
			// Duration not yet loaded. If playback is at position 0, resolve
			// to the first image without waiting — handles post-reload state.
			const t = getCurrentTime();
			if (t <= PLAYBACK_ZERO_EPSILON) {
				const firstId = slideshowIds[0];
				if (firstId && firstId !== lastCheckpointIdRef.current) {
					lastCheckpointIdRef.current = firstId;
					useWallpaperStore.getState().setActiveImageId(firstId);
				}
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
			// Only override activeImageId when the auto-computed target image
			// itself changes — preserves manual selections within a timestamp range.
			if (
				targetImg &&
				targetImg.assetId !== lastTimestampAssetIdRef.current
			) {
				lastTimestampAssetIdRef.current = targetImg.assetId;
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
