import {
	useEffect,
	useRef,
	type Dispatch,
	type MutableRefObject,
	type SetStateAction
} from 'react';
import { FileAudioAnalyzer } from '@/lib/audio/FileAudioAnalyzer';
import { loadImageBlob } from '@/lib/db/imageDb';
import type { IAudioSourceAdapter } from '@/lib/audio/types';
import { AudioMixEngine } from '@/lib/audio/AudioMixEngine';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { AudioCaptureState } from '@/types/wallpaper';
import { AUDIO_TRANSPORT_GRACE_MS } from './audioDataShared';
import { isOutputModeRoute } from '@/runtime/isOutputModeRoute';
import {
	resolveMediaSessionPlaybackState,
	shouldRegisterMediaSessionActionHandlers
} from './mediaSessionPlaybackState';
import { runMediaTrackCommand } from './mediaTrackRuntime';

type UseAudioPlaybackEffectsOptions = {
	analyzerRef: MutableRefObject<IAudioSourceAdapter | null>;
	engineRef: MutableRefObject<AudioMixEngine | null>;
	systemPausedFileRef: MutableRefObject<boolean>;
	autoRecoveringAudioRef: MutableRefObject<boolean>;
	lastRecoveryAttemptRef: MutableRefObject<number>;
	lastTransportInteractionRef: MutableRefObject<number>;
	restoredAudioAssetIdRef: MutableRefObject<string | null>;
	restoringAudioAssetRef: MutableRefObject<boolean>;
	restoredPlaylistTrackIdRef: MutableRefObject<string | null>;
	restoringPlaylistTrackRef: MutableRefObject<boolean>;
	audioCaptureState: AudioCaptureState;
	captureMode: 'desktop' | 'microphone' | 'file';
	setIsPaused: Dispatch<SetStateAction<boolean>>;
	setAudioPaused: (value: boolean) => void;
	playTrackById: (id: string) => Promise<void>;
	activateFileCapture: (
		file: File,
		options?: {
			assetId?: string | null;
			persistAsset?: boolean;
			volume?: number;
			loop?: boolean;
			sourceMode?: 'none' | 'desktop' | 'microphone' | 'file';
			startPaused?: boolean;
		}
	) => Promise<void>;
	pauseCapture: () => void;
	resumeCapture: () => void;
	playNextTrack: () => Promise<void>;
	playPrevTrack: () => Promise<void>;
};

export function useAudioPlaybackEffects({
	analyzerRef,
	engineRef,
	systemPausedFileRef,
	autoRecoveringAudioRef,
	lastRecoveryAttemptRef,
	lastTransportInteractionRef,
	restoredAudioAssetIdRef,
	restoringAudioAssetRef,
	restoredPlaylistTrackIdRef,
	restoringPlaylistTrackRef,
	audioCaptureState,
	captureMode,
	setIsPaused,
	setAudioPaused,
	playTrackById,
	activateFileCapture,
	pauseCapture,
	resumeCapture,
	playNextTrack,
	playPrevTrack
}: UseAudioPlaybackEffectsOptions) {
	const audioSourceMode = useWallpaperStore(state => state.audioSourceMode);
	const audioFileAssetId = useWallpaperStore(state => state.audioFileAssetId);
	const audioFileName = useWallpaperStore(state => state.audioFileName);
	const audioFileVolume = useWallpaperStore(state => state.audioFileVolume);
	const audioFileLoop = useWallpaperStore(state => state.audioFileLoop);
	const activeAudioTrackId = useWallpaperStore(
		state => state.activeAudioTrackId
	);
	const mediaSessionEnabled = useWallpaperStore(
		state => state.mediaSessionEnabled
	);
	const audioPaused = useWallpaperStore(state => state.audioPaused);
	const hasAudioTracks = useWallpaperStore(
		state => state.audioTracks.length > 0
	);
	// Hardware media keys must work without an obscure opt-in. We register the
	// Media Session action handlers whenever there is any audio context at all;
	// the `mediaSessionEnabled` toggle now only controls rich now-playing
	// metadata, NOT whether the keys reach the app.
	const hasAudioContext = shouldRegisterMediaSessionActionHandlers({
		captureState: audioCaptureState,
		hasAudioTracks,
		activeAudioTrackId: activeAudioTrackId ?? null
	});

	const mediaSessionPauseRef = useRef<() => void>(() => {});
	const mediaSessionResumeRef = useRef<() => void>(() => {});
	const mediaSessionNextRef = useRef<() => void>(() => {});
	const mediaSessionPrevRef = useRef<() => void>(() => {});

	mediaSessionPauseRef.current = pauseCapture;
	mediaSessionResumeRef.current = resumeCapture;
	// Route prev/next through the shared runtime so the Media Session path uses
	// the exact same command (and dedupe window) as the HUD and keyboard.
	mediaSessionNextRef.current = () => {
		runMediaTrackCommand({
			direction: 'next',
			source: 'mediaSession',
			run: () => void playNextTrack()
		});
	};
	mediaSessionPrevRef.current = () => {
		runMediaTrackCommand({
			direction: 'previous',
			source: 'mediaSession',
			run: () => void playPrevTrack()
		});
	};

	useEffect(() => {
		if (
			typeof window !== 'undefined' &&
			window.location.hash.includes('mini=1')
		) {
			return;
		}
		// When a playlist track is selected, playlist restore owns playback.
		// Do not restore a standalone file source on top of it.
		if (activeAudioTrackId) return;
		if (audioSourceMode !== 'file' || !audioFileAssetId) return;
		if (analyzerRef.current || restoringAudioAssetRef.current) return;
		if (restoredAudioAssetIdRef.current === audioFileAssetId) return;

		let cancelled = false;
		restoringAudioAssetRef.current = true;

		void loadImageBlob(audioFileAssetId)
			.then(async blob => {
				if (!blob || cancelled) return;
				const restoredFile = new File(
					[blob],
					audioFileName ||
						`track.${blob.type.split('/')[1] || 'mp3'}`,
					{
						type: blob.type || 'audio/mpeg'
					}
				);
				await activateFileCapture(restoredFile, {
					assetId: audioFileAssetId,
					persistAsset: false,
					volume: audioFileVolume,
					loop: audioFileLoop,
					sourceMode: 'file',
					startPaused: !isOutputModeRoute()
				});
			})
			.finally(() => {
				restoringAudioAssetRef.current = false;
			});

		return () => {
			cancelled = true;
		};
	}, [
		activateFileCapture,
		analyzerRef,
		audioFileAssetId,
		audioFileLoop,
		audioFileName,
		audioFileVolume,
		activeAudioTrackId,
		audioSourceMode,
		restoredAudioAssetIdRef,
		restoringAudioAssetRef
	]);

	useEffect(() => {
		if (
			typeof window !== 'undefined' &&
			window.location.hash.includes('mini=1')
		) {
			return;
		}
		if (!activeAudioTrackId) return;
		if (
			engineRef.current?.hasActive() ||
			restoringPlaylistTrackRef.current ||
			restoringAudioAssetRef.current
		) {
			return;
		}
		if (restoredPlaylistTrackIdRef.current === activeAudioTrackId) return;

		let cancelled = false;
		restoringPlaylistTrackRef.current = true;

		void playTrackById(activeAudioTrackId)
			.then(() => {
				if (!cancelled && !isOutputModeRoute()) {
					engineRef.current?.pause();
					setIsPaused(true);
					setAudioPaused(true);
				}
			})
			.finally(() => {
				restoringPlaylistTrackRef.current = false;
			});

		return () => {
			cancelled = true;
		};
	}, [
		activeAudioTrackId,
		engineRef,
		playTrackById,
		restoredPlaylistTrackIdRef,
		restoringAudioAssetRef,
		restoringPlaylistTrackRef,
		setAudioPaused,
		setIsPaused
	]);

	useEffect(() => {
		if (
			typeof navigator === 'undefined' ||
			!('mediaSession' in navigator)
		) {
			return;
		}

		// No audio context → release everything so we don't hold media keys.
		if (!hasAudioContext) {
			navigator.mediaSession.metadata = null;
			for (const action of [
				'play',
				'pause',
				'nexttrack',
				'previoustrack'
			] as const) {
				try {
					navigator.mediaSession.setActionHandler(action, null);
				} catch {
					/* unsupported */
				}
			}
			return;
		}

		// Register handlers regardless of the toggle — this is the primary (and
		// on macOS, often only) path for hardware previous/next/play/pause.
		try {
			navigator.mediaSession.setActionHandler('play', () =>
				mediaSessionResumeRef.current()
			);
			navigator.mediaSession.setActionHandler('pause', () =>
				mediaSessionPauseRef.current()
			);
			navigator.mediaSession.setActionHandler('nexttrack', () =>
				mediaSessionNextRef.current()
			);
			navigator.mediaSession.setActionHandler('previoustrack', () =>
				mediaSessionPrevRef.current()
			);
		} catch {
			/* unsupported */
		}

		// Metadata is set whenever there is an active track (it helps the OS treat
		// us as the active media session and route keys). The toggle only
		// upgrades it to a rich now-playing card (artist/album).
		const activeTrack = useWallpaperStore
			.getState()
			.audioTracks.find(t => t.id === activeAudioTrackId);
		navigator.mediaSession.metadata = activeTrack
			? new MediaMetadata(
					mediaSessionEnabled
						? {
								title: activeTrack.name.replace(/\.[^.]+$/, ''),
								artist: 'Anime Glitch',
								album: 'Live Wallpaper'
							}
						: {
								title: activeTrack.name.replace(/\.[^.]+$/, '')
							}
				)
			: null;
	}, [activeAudioTrackId, mediaSessionEnabled, hasAudioContext]);

	// Keep `navigator.mediaSession.playbackState` synced to the canonical
	// playback state. Without this the browser guesses play-vs-pause from the
	// raw media element, which is what makes hardware media keys (F8 toggle,
	// F7/F9 prev/next) misfire and lets audio resume natively while the React
	// paused flags stay stale (audible audio, frozen canvas). See
	// resolveMediaSessionPlaybackState for the full rationale.
	useEffect(() => {
		if (
			typeof navigator === 'undefined' ||
			!('mediaSession' in navigator)
		) {
			return;
		}
		// Independent of the toggle — the OS needs an accurate playbackState to
		// route the play/pause key to the correct handler.
		navigator.mediaSession.playbackState = resolveMediaSessionPlaybackState(
			audioCaptureState,
			audioPaused
		);
	}, [audioCaptureState, audioPaused]);

	useEffect(() => {
		if (audioCaptureState !== 'active' || captureMode !== 'file') return;

		let raf = 0;
		let alive = true;
		const healPlayback = () => {
			if (!alive) return;
			const now =
				typeof performance !== 'undefined'
					? performance.now()
					: Date.now();
			const state = useWallpaperStore.getState();
			const activeId = state.activeAudioTrackId;
			const recoveryCoolingDown =
				now - lastRecoveryAttemptRef.current < 2500;
			const transportInteractionCoolingDown =
				now - lastTransportInteractionRef.current <
				AUDIO_TRANSPORT_GRACE_MS;
			const recoveryBlocked =
				state.audioPaused ||
				systemPausedFileRef.current ||
				autoRecoveringAudioRef.current ||
				recoveryCoolingDown ||
				transportInteractionCoolingDown;

			if (!recoveryBlocked) {
				const engineHasActive = engineRef.current?.hasActive() ?? false;

				if (engineHasActive) {
					void (async () => {
						autoRecoveringAudioRef.current = true;
						lastRecoveryAttemptRef.current = now;
						try {
							const recovered =
								(await engineRef.current?.ensurePlaybackActive()) ??
								false;
							if (recovered) {
								setIsPaused(false);
								setAudioPaused(false);
							} else if (activeId) {
								await playTrackById(activeId);
								setIsPaused(false);
								setAudioPaused(false);
							}
						} finally {
							autoRecoveringAudioRef.current = false;
						}
					})();
				} else if (analyzerRef.current) {
					const playbackState =
						analyzerRef.current instanceof FileAudioAnalyzer
							? analyzerRef.current.getPlaybackState()
							: null;
					const looksStalled = playbackState
						? (playbackState.contextState === 'suspended' &&
								!playbackState.elementPaused) ||
							(playbackState.elementPaused &&
								playbackState.duration > 0 &&
								playbackState.currentTime <
									Math.max(0, playbackState.duration - 0.25))
						: false;

					if (looksStalled) {
						void (async () => {
							autoRecoveringAudioRef.current = true;
							lastRecoveryAttemptRef.current = now;
							try {
								const recovered =
									analyzerRef.current instanceof
									FileAudioAnalyzer
										? await analyzerRef.current.ensurePlaybackActive()
										: false;
								if (recovered) {
									setIsPaused(false);
									setAudioPaused(false);
								} else if (activeId) {
									await playTrackById(activeId);
									setIsPaused(false);
									setAudioPaused(false);
								}
							} finally {
								autoRecoveringAudioRef.current = false;
							}
						})();
					}
				} else if (activeId) {
					void (async () => {
						autoRecoveringAudioRef.current = true;
						lastRecoveryAttemptRef.current = now;
						try {
							await playTrackById(activeId);
							setIsPaused(false);
							setAudioPaused(false);
						} finally {
							autoRecoveringAudioRef.current = false;
						}
					})();
				}
			}

			raf = requestAnimationFrame(healPlayback);
		};

		raf = requestAnimationFrame(healPlayback);
		return () => {
			alive = false;
			cancelAnimationFrame(raf);
		};
	}, [
		analyzerRef,
		audioCaptureState,
		autoRecoveringAudioRef,
		captureMode,
		engineRef,
		lastRecoveryAttemptRef,
		lastTransportInteractionRef,
		playTrackById,
		setAudioPaused,
		setIsPaused,
		systemPausedFileRef
	]);
}
