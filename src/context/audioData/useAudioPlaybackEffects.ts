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

	const mediaSessionPauseRef = useRef<() => void>(() => {});
	const mediaSessionResumeRef = useRef<() => void>(() => {});
	const mediaSessionNextRef = useRef<() => void>(() => {});
	const mediaSessionPrevRef = useRef<() => void>(() => {});

	mediaSessionPauseRef.current = pauseCapture;
	mediaSessionResumeRef.current = resumeCapture;
	mediaSessionNextRef.current = () => {
		void playNextTrack();
	};
	mediaSessionPrevRef.current = () => {
		void playPrevTrack();
	};

	useEffect(() => {
		if (
			typeof window !== 'undefined' &&
			window.location.hash.includes('mini=1')
		) {
			return;
		}
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
					audioFileName || `track.${blob.type.split('/')[1] || 'mp3'}`,
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
					startPaused: true
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
				if (!cancelled) {
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
			!mediaSessionEnabled ||
			typeof navigator === 'undefined' ||
			!('mediaSession' in navigator)
		) {
			if (
				typeof navigator !== 'undefined' &&
				'mediaSession' in navigator
			) {
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
			}
			return;
		}

		const activeTrack = useWallpaperStore
			.getState()
			.audioTracks.find(t => t.id === activeAudioTrackId);

		navigator.mediaSession.metadata = activeTrack
			? new MediaMetadata({
					title: activeTrack.name.replace(/\.[^.]+$/, ''),
					artist: 'Anime Glitch',
					album: 'Live Wallpaper'
			  })
			: null;

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
	}, [activeAudioTrackId, mediaSessionEnabled]);

	useEffect(() => {
		if (audioCaptureState !== 'active' || captureMode !== 'file') return;

		let raf = 0;
		let alive = true;
		const healPlayback = () => {
			if (!alive) return;
			const now =
				typeof performance !== 'undefined' ? performance.now() : Date.now();
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
									analyzerRef.current instanceof FileAudioAnalyzer
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
