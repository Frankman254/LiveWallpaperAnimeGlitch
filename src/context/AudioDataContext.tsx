import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode
} from 'react';
import { DesktopAudioAnalyzer } from '@/lib/audio/DesktopAudioAnalyzer';
import { MicrophoneAnalyzer } from '@/lib/audio/MicrophoneAnalyzer';
import { FileAudioAnalyzer } from '@/lib/audio/FileAudioAnalyzer';
import { loadImageBlob, saveImage } from '@/lib/db/imageDb';
import {
	analyzeAudioChannels,
	createAudioAnalysisState,
	type AudioSnapshot
} from '@/lib/audio/audioChannels';
import type { IAudioSourceAdapter } from '@/lib/audio/types';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { AudioSourceMode } from '@/types/wallpaper';

const supportsDisplayMedia =
	typeof navigator !== 'undefined' &&
	typeof navigator.mediaDevices?.getDisplayMedia === 'function';
const AUDIO_SYNC_CHANNEL = 'lwag-audio-sync';
const AUDIO_SYNC_STALE_MS = 250;
const AUDIO_SYNC_INTERVAL_MS = 33;

type AudioSyncMessage = {
	sourceId: string;
	snapshot: AudioSnapshot;
	captureMode: 'desktop' | 'microphone' | 'file';
	isPaused: boolean;
	fileName: string;
	fileVolume: number;
	fileLoop: boolean;
};

interface AudioDataContextValue {
	getAudioSnapshot: () => AudioSnapshot;
	getAmplitude: () => number;
	getPeak: () => number;
	getBands: () => { bass: number; mid: number; treble: number };
	getFrequencyBins: () => Uint8Array;
	startCapture: () => Promise<void>;
	startFileCapture: (file: File) => Promise<void>;
	stopCapture: () => void;
	captureMode: 'desktop' | 'microphone' | 'file';
	isPaused: boolean;
	pauseCapture: () => void;
	resumeCapture: () => void;
	pauseFileForSystem: () => void;
	resumeFileFromSystem: () => void;
	// File player controls
	seek: (time: number) => void;
	getCurrentTime: () => number;
	getDuration: () => number;
	setFileVolume: (v: number) => void;
	setFileLoop: (v: boolean) => void;
	getFileName: () => string;
	fileVolume: number;
	fileLoop: boolean;
	// Playlist
	addTrackToPlaylist: (file: File) => Promise<void>;
	removeTrackFromPlaylist: (id: string) => void;
	playTrackById: (id: string) => Promise<void>;
	playNextTrack: () => Promise<void>;
	playPrevTrack: () => Promise<void>;
}

const AudioDataContext = createContext<AudioDataContextValue | null>(null);

const EMPTY_AUDIO_SNAPSHOT: AudioSnapshot = {
	bins: new Uint8Array(0),
	amplitude: 0,
	peak: 0,
	channels: {
		full: 0,
		kick: 0,
		instrumental: 0,
		bass: 0,
		hihat: 0,
		vocal: 0
	},
	timestampMs: 0
};

export function AudioDataProvider({ children }: { children: ReactNode }) {
	const analyzerRef = useRef<IAudioSourceAdapter | null>(null);
	const analysisStateRef = useRef(createAudioAnalysisState());
	const peakRef = useRef(0);
	const snapshotRef = useRef<AudioSnapshot>(EMPTY_AUDIO_SNAPSHOT);
	const remoteSnapshotRef = useRef<AudioSnapshot>(EMPTY_AUDIO_SNAPSHOT);
	const remoteMetaRef = useRef<{
		captureMode: 'desktop' | 'microphone' | 'file';
		isPaused: boolean;
		fileName: string;
		fileVolume: number;
		fileLoop: boolean;
	}>({
		captureMode: supportsDisplayMedia ? 'desktop' : 'microphone',
		isPaused: false,
		fileName: '',
		fileVolume: 1,
		fileLoop: true
	});
	const channelRef = useRef<BroadcastChannel | null>(null);
	const sourceIdRef = useRef(
		`audio-${Math.random().toString(36).slice(2)}-${Date.now()}`
	);
	const lastBroadcastMsRef = useRef(0);
	const systemPausedFileRef = useRef(false);
	const restoredAudioAssetIdRef = useRef<string | null>(null);
	const restoringAudioAssetRef = useRef(false);
	const [captureMode, setCaptureMode] = useState<
		'desktop' | 'microphone' | 'file'
	>(supportsDisplayMedia ? 'desktop' : 'microphone');
	const [isPaused, setIsPaused] = useState(false);
	const [fileVolume, setFileVolumeState] = useState(1.0);
	const [fileLoop, setFileLoopState] = useState(true);
	const audioCaptureState = useWallpaperStore(
		state => state.audioCaptureState
	);
	const setAudioCaptureState = useWallpaperStore(
		state => state.setAudioCaptureState
	);
	const audioSourceMode = useWallpaperStore(state => state.audioSourceMode);
	const audioFileAssetId = useWallpaperStore(state => state.audioFileAssetId);
	const audioFileName = useWallpaperStore(state => state.audioFileName);
	const persistedAudioFileVolume = useWallpaperStore(
		state => state.audioFileVolume
	);
	const persistedAudioFileLoop = useWallpaperStore(
		state => state.audioFileLoop
	);
	const setAudioSourceMode = useWallpaperStore(
		state => state.setAudioSourceMode
	);
	const setAudioFileAssetId = useWallpaperStore(
		state => state.setAudioFileAssetId
	);
	const setAudioFileName = useWallpaperStore(state => state.setAudioFileName);
	const setPersistedAudioFileVolume = useWallpaperStore(
		state => state.setAudioFileVolume
	);
	const setPersistedAudioFileLoop = useWallpaperStore(
		state => state.setAudioFileLoop
	);
	const setAudioPaused = useWallpaperStore(state => state.setAudioPaused);
	const fftSize = useWallpaperStore(state => state.fftSize);
	const audioSmoothing = useWallpaperStore(state => state.audioSmoothing);
	const activeAudioTrackId = useWallpaperStore(
		state => state.activeAudioTrackId
	);
	const addAudioTrack = useWallpaperStore(state => state.addAudioTrack);
	const removeAudioTrackFromStore = useWallpaperStore(
		state => state.removeAudioTrack
	);
	const setActiveAudioTrackId = useWallpaperStore(
		state => state.setActiveAudioTrackId
	);
	const restoredPlaylistTrackIdRef = useRef<string | null>(null);
	const restoringPlaylistTrackRef = useRef(false);

	const resetAudioAnalysis = useCallback(function resetAudioAnalysis() {
		analysisStateRef.current = createAudioAnalysisState();
		peakRef.current = 0;
		snapshotRef.current = {
			...EMPTY_AUDIO_SNAPSHOT,
			bins: new Uint8Array(0),
			channels: { ...EMPTY_AUDIO_SNAPSHOT.channels }
		};
	}, []);

	const broadcastSnapshot = useCallback(
		(snapshot: AudioSnapshot) => {
			const channel = channelRef.current;
			if (!channel) return;
			const now =
				typeof performance !== 'undefined'
					? performance.now()
					: Date.now();
			if (now - lastBroadcastMsRef.current < AUDIO_SYNC_INTERVAL_MS)
				return;
			lastBroadcastMsRef.current = now;

			channel.postMessage({
				sourceId: sourceIdRef.current,
				snapshot: {
					...snapshot,
					bins: new Uint8Array(snapshot.bins),
					channels: { ...snapshot.channels }
				},
				captureMode,
				isPaused,
				fileName: analyzerRef.current?.getFileName?.() ?? '',
				fileVolume,
				fileLoop
			} satisfies AudioSyncMessage);
		},
		[captureMode, fileLoop, fileVolume, isPaused]
	);

	const broadcastEmptyState = useCallback(() => {
		const channel = channelRef.current;
		if (!channel) return;

		channel.postMessage({
			sourceId: sourceIdRef.current,
			snapshot: {
				...EMPTY_AUDIO_SNAPSHOT,
				bins: new Uint8Array(0),
				channels: { ...EMPTY_AUDIO_SNAPSHOT.channels },
				timestampMs:
					typeof performance !== 'undefined'
						? performance.now()
						: Date.now()
			},
			captureMode,
			isPaused: true,
			fileName: '',
			fileVolume,
			fileLoop
		} satisfies AudioSyncMessage);
	}, [captureMode, fileLoop, fileVolume]);

	useEffect(() => {
		if (typeof BroadcastChannel === 'undefined') return undefined;

		const channel = new BroadcastChannel(AUDIO_SYNC_CHANNEL);
		channelRef.current = channel;

		const handleMessage = (event: MessageEvent<AudioSyncMessage>) => {
			const payload = event.data;
			if (!payload || payload.sourceId === sourceIdRef.current) return;
			if (analyzerRef.current) return;

			remoteSnapshotRef.current = {
				...payload.snapshot,
				bins: new Uint8Array(payload.snapshot.bins),
				channels: { ...payload.snapshot.channels }
			};
			remoteMetaRef.current = {
				captureMode: payload.captureMode,
				isPaused: payload.isPaused,
				fileName: payload.fileName,
				fileVolume: payload.fileVolume,
				fileLoop: payload.fileLoop
			};
		};

		channel.addEventListener('message', handleMessage);

		return () => {
			channel.removeEventListener('message', handleMessage);
			channel.close();
			channelRef.current = null;
		};
	}, []);

	useEffect(() => {
		if (audioCaptureState === 'idle' && analyzerRef.current) {
			analyzerRef.current.stop();
			analyzerRef.current = null;
			resetAudioAnalysis();
			broadcastEmptyState();
		}
	}, [audioCaptureState, broadcastEmptyState, resetAudioAnalysis]);

	useEffect(() => {
		return () => {
			analyzerRef.current?.stop();
			resetAudioAnalysis();
		};
	}, [resetAudioAnalysis]);

	useEffect(() => {
		analyzerRef.current?.setAnalysisConfig?.(fftSize, audioSmoothing);
	}, [fftSize, audioSmoothing]);

	const activateFileCapture = useCallback(
		async function activateFileCapture(
			file: File,
			options?: {
				assetId?: string | null;
				persistAsset?: boolean;
				volume?: number;
				loop?: boolean;
				sourceMode?: AudioSourceMode;
				startPaused?: boolean;
			}
		) {
			systemPausedFileRef.current = false;
			resetAudioAnalysis();
			setAudioPaused(false);
			if (analyzerRef.current) {
				analyzerRef.current.stop();
				analyzerRef.current = null;
			}
			setAudioCaptureState('requesting');

			const nextVolume = options?.volume ?? 1;
			const nextLoop = options?.loop ?? true;

			try {
				const assetId =
					options?.persistAsset === false
						? (options.assetId ?? null)
						: ((options?.assetId ?? (await saveImage(file))) as
								| string
								| null);
				const analyzer = new FileAudioAnalyzer(
					file,
					fftSize,
					audioSmoothing
				);
				await analyzer.start();
				analyzer.setVolume(nextVolume);
				analyzer.setLoop(nextLoop);
				if (options?.startPaused) {
					analyzer.pause();
					systemPausedFileRef.current = true;
				}
				analyzerRef.current = analyzer;
				setCaptureMode('file');
				setIsPaused(Boolean(options?.startPaused));
				setFileVolumeState(nextVolume);
				setFileLoopState(nextLoop);
				setAudioSourceMode(options?.sourceMode ?? 'file');
				setAudioFileAssetId(assetId);
				setAudioFileName(file.name);
				setPersistedAudioFileVolume(nextVolume);
				setPersistedAudioFileLoop(nextLoop);
				if (assetId) {
					restoredAudioAssetIdRef.current = assetId;
				}
				setAudioCaptureState('active');
			} catch {
				analyzerRef.current = null;
				setAudioCaptureState('error');
			}
		},
		[
			audioSmoothing,
			fftSize,
			resetAudioAnalysis,
			setAudioCaptureState,
			setAudioFileAssetId,
			setAudioFileName,
			setAudioPaused,
			setAudioSourceMode,
			setPersistedAudioFileLoop,
			setPersistedAudioFileVolume
		]
	);

	const startCapture = useCallback(
		async function startCapture() {
			systemPausedFileRef.current = false;
			resetAudioAnalysis();
			setAudioPaused(false);
			if (analyzerRef.current) {
				analyzerRef.current.stop();
				analyzerRef.current = null;
			}
			setAudioCaptureState('requesting');
			try {
				const analyzer = supportsDisplayMedia
					? new DesktopAudioAnalyzer(fftSize, audioSmoothing)
					: new MicrophoneAnalyzer(fftSize, audioSmoothing);
				await analyzer.start();
				analyzerRef.current = analyzer;
				const nextMode = supportsDisplayMedia
					? 'desktop'
					: 'microphone';
				setCaptureMode(nextMode);
				setAudioSourceMode(nextMode);
				setAudioCaptureState('active');
			} catch (err) {
				analyzerRef.current = null;
				if (err instanceof Error) {
					if (err.message === 'no-audio-track')
						setAudioCaptureState('no-audio-track');
					else if (err.name === 'NotAllowedError')
						setAudioCaptureState('denied');
					else setAudioCaptureState('error');
				} else {
					setAudioCaptureState('error');
				}
			}
		},
		[
			audioSmoothing,
			fftSize,
			resetAudioAnalysis,
			setAudioCaptureState,
			setAudioPaused,
			setAudioSourceMode
		]
	);

	const startFileCapture = useCallback(
		async function startFileCapture(file: File) {
			await activateFileCapture(file, {
				persistAsset: true,
				volume: 1,
				loop: true,
				sourceMode: 'file'
			});
		},
		[activateFileCapture]
	);

	const stopCapture = useCallback(
		function stopCapture() {
			analyzerRef.current?.stop();
			analyzerRef.current = null;
			systemPausedFileRef.current = false;
			setAudioPaused(false);
			setAudioSourceMode('none');
			setCaptureMode(supportsDisplayMedia ? 'desktop' : 'microphone');
			setAudioCaptureState('idle');
			setIsPaused(false);
			resetAudioAnalysis();
			broadcastEmptyState();
		},
		[
			broadcastEmptyState,
			resetAudioAnalysis,
			setAudioCaptureState,
			setAudioPaused,
			setAudioSourceMode
		]
	);

	// ── Playlist helpers ──────────────────────────────────────────────────────

	const playTrackById = useCallback(
		async function playTrackById(id: string) {
			const tracks = useWallpaperStore.getState().audioTracks;
			const track = tracks.find(t => t.id === id);
			if (!track) return;

			const blob = await loadImageBlob(track.assetId);
			if (!blob) return;

			const file = new File(
				[blob],
				track.name || `track.${blob.type.split('/')[1] || 'mp3'}`,
				{ type: blob.type || track.mimeType || 'audio/mpeg' }
			);

			const handleEnded = () => {
				if (!useWallpaperStore.getState().audioAutoAdvance) return;
				const currentTracks = useWallpaperStore.getState().audioTracks;
				const idx = currentTracks.findIndex(t => t.id === id);
				const next = currentTracks[idx + 1] ?? currentTracks[0];
				if (next && next.id !== id) {
					void playTrackById(next.id);
					useWallpaperStore.getState().setActiveAudioTrackId(next.id);
				}
			};

			systemPausedFileRef.current = false;
			resetAudioAnalysis();
			setAudioPaused(false);
			if (analyzerRef.current) {
				analyzerRef.current.stop();
				analyzerRef.current = null;
			}
			setAudioCaptureState('requesting');

			try {
				const analyzer = new FileAudioAnalyzer(
					file,
					fftSize,
					audioSmoothing,
					handleEnded
				);
				analyzer.setLoop(track.loop);
				await analyzer.start();
				analyzer.setVolume(track.volume);
				analyzerRef.current = analyzer;
				setCaptureMode('file');
				setIsPaused(false);
				setFileVolumeState(track.volume);
				setFileLoopState(track.loop);
				setAudioSourceMode('file');
				setAudioCaptureState('active');
				setActiveAudioTrackId(id);
				restoredPlaylistTrackIdRef.current = id;
			} catch {
				analyzerRef.current = null;
				setAudioCaptureState('error');
			}
		},
		[
			audioSmoothing,
			fftSize,
			resetAudioAnalysis,
			setActiveAudioTrackId,
			setAudioCaptureState,
			setAudioPaused,
			setAudioSourceMode
		]
	);

	const addTrackToPlaylist = useCallback(
		async function addTrackToPlaylist(file: File) {
			const assetId = await saveImage(file);
			const id = `track-${Math.random().toString(36).slice(2)}-${Date.now()}`;
			const track = {
				id,
				assetId,
				name: file.name,
				mimeType: file.type || 'audio/mpeg',
				volume: 1,
				loop: false,
				enabled: true
			};
			addAudioTrack(track);
			// Auto-play if this is the first track or nothing is active
			const currentActive = useWallpaperStore.getState().activeAudioTrackId;
			if (!currentActive) {
				await playTrackById(id);
			}
		},
		[addAudioTrack, playTrackById]
	);

	const removeTrackFromPlaylist = useCallback(
		function removeTrackFromPlaylist(id: string) {
			const state = useWallpaperStore.getState();
			const wasActive = state.activeAudioTrackId === id;
			removeAudioTrackFromStore(id);
			if (wasActive) {
				analyzerRef.current?.stop();
				analyzerRef.current = null;
				resetAudioAnalysis();
				setAudioCaptureState('idle');
				setAudioSourceMode('none');
				setCaptureMode(supportsDisplayMedia ? 'desktop' : 'microphone');
				setIsPaused(false);
				broadcastEmptyState();
			}
		},
		[
			broadcastEmptyState,
			removeAudioTrackFromStore,
			resetAudioAnalysis,
			setAudioCaptureState,
			setAudioSourceMode
		]
	);

	const playNextTrack = useCallback(
		async function playNextTrack() {
			const state = useWallpaperStore.getState();
			const tracks = state.audioTracks.filter(t => t.enabled);
			if (tracks.length === 0) return;
			const idx = tracks.findIndex(t => t.id === state.activeAudioTrackId);
			const next = tracks[idx + 1] ?? tracks[0];
			if (next) await playTrackById(next.id);
		},
		[playTrackById]
	);

	const playPrevTrack = useCallback(
		async function playPrevTrack() {
			const state = useWallpaperStore.getState();
			const tracks = state.audioTracks.filter(t => t.enabled);
			if (tracks.length === 0) return;
			const idx = tracks.findIndex(t => t.id === state.activeAudioTrackId);
			const prev =
				idx > 0
					? tracks[idx - 1]
					: tracks[tracks.length - 1];
			if (prev) await playTrackById(prev.id);
		},
		[playTrackById]
	);

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
					volume: persistedAudioFileVolume,
					loop: persistedAudioFileLoop,
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
		audioFileAssetId,
		audioFileName,
		audioSourceMode,
		persistedAudioFileLoop,
		persistedAudioFileVolume
	]);

	// Restore active playlist track on mount
	useEffect(() => {
		if (
			typeof window !== 'undefined' &&
			window.location.hash.includes('mini=1')
		) {
			return;
		}
		if (!activeAudioTrackId) return;
		if (
			analyzerRef.current ||
			restoringPlaylistTrackRef.current ||
			restoringAudioAssetRef.current
		)
			return;
		if (restoredPlaylistTrackIdRef.current === activeAudioTrackId) return;

		let cancelled = false;
		restoringPlaylistTrackRef.current = true;

		void playTrackById(activeAudioTrackId)
			.then(() => {
				if (!cancelled) {
					// pause immediately so user can choose when to play
					analyzerRef.current?.pause?.();
					setIsPaused(true);
				}
			})
			.finally(() => {
				restoringPlaylistTrackRef.current = false;
			});

		return () => {
			cancelled = true;
		};
	}, [activeAudioTrackId, playTrackById]);

	const pauseCapture = useCallback(function pauseCapture() {
		systemPausedFileRef.current = false;
		analyzerRef.current?.pause?.();
		setIsPaused(true);
	}, []);

	const resumeCapture = useCallback(function resumeCapture() {
		systemPausedFileRef.current = false;
		analyzerRef.current?.resume?.();
		setIsPaused(false);
	}, []);

	const pauseFileForSystem = useCallback(
		function pauseFileForSystem() {
			if (captureMode !== 'file') return;
			analyzerRef.current?.pause?.();
			setIsPaused(true);
			systemPausedFileRef.current = true;
		},
		[captureMode]
	);

	const resumeFileFromSystem = useCallback(
		function resumeFileFromSystem() {
			if (captureMode !== 'file') return;
			analyzerRef.current?.resume?.();
			setIsPaused(false);
			systemPausedFileRef.current = false;
		},
		[captureMode]
	);

	const seek = useCallback(function seek(time: number) {
		analyzerRef.current?.seek?.(time);
	}, []);

	const getCurrentTime = useCallback(function getCurrentTime() {
		return analyzerRef.current?.getCurrentTime?.() ?? 0;
	}, []);

	const getDuration = useCallback(function getDuration() {
		return analyzerRef.current?.getDuration?.() ?? 0;
	}, []);

	const setFileVolume = useCallback(function setFileVolume(v: number) {
		setFileVolumeState(v);
		setPersistedAudioFileVolume(v);
		analyzerRef.current?.setVolume?.(v);
	}, [setPersistedAudioFileVolume]);

	const setFileLoop = useCallback(function setFileLoop(v: boolean) {
		setFileLoopState(v);
		setPersistedAudioFileLoop(v);
		analyzerRef.current?.setLoop?.(v);
	}, [setPersistedAudioFileLoop]);

	const getFileName = useCallback(function getFileName() {
		return (
			analyzerRef.current?.getFileName?.() ??
			audioFileName ??
			remoteMetaRef.current.fileName ??
			''
		);
	}, [audioFileName]);

	const getAudioSnapshot = useCallback(() => {
		if (useWallpaperStore.getState().audioPaused) {
			return {
				...EMPTY_AUDIO_SNAPSHOT,
				bins: new Uint8Array(0),
				channels: { ...EMPTY_AUDIO_SNAPSHOT.channels },
				timestampMs:
					typeof performance !== 'undefined' ? performance.now() : 0
			};
		}

		const timestampMs =
			typeof performance !== 'undefined' ? performance.now() : Date.now();
		if (!analyzerRef.current) {
			if (
				remoteSnapshotRef.current.timestampMs > 0 &&
				timestampMs - remoteSnapshotRef.current.timestampMs <
					AUDIO_SYNC_STALE_MS
			) {
				return remoteSnapshotRef.current;
			}

			return {
				...EMPTY_AUDIO_SNAPSHOT,
				bins: new Uint8Array(0),
				channels: { ...EMPTY_AUDIO_SNAPSHOT.channels },
				timestampMs
			};
		}

		if (
			snapshotRef.current.timestampMs > 0 &&
			timestampMs - snapshotRef.current.timestampMs < 8
		) {
			return snapshotRef.current;
		}

		const bins =
			analyzerRef.current?.getFrequencyBins() ?? new Uint8Array(0);
		let amplitude = 0;
		if (bins.length > 0) {
			let sum = 0;
			for (let index = 0; index < bins.length; index += 1) {
				sum += bins[index] ?? 0;
			}
			amplitude = sum / bins.length / 255;
		}

		peakRef.current = Math.max(peakRef.current * 0.98, amplitude);
		const channels = analyzeAudioChannels(
			bins,
			analysisStateRef.current,
			0,
			timestampMs
		);

		snapshotRef.current = {
			bins,
			amplitude,
			peak: peakRef.current,
			channels: { ...channels },
			timestampMs
		};
		broadcastSnapshot(snapshotRef.current);

		return snapshotRef.current;
	}, [broadcastSnapshot]);

	const getAmplitude = useCallback(
		() => getAudioSnapshot().amplitude,
		[getAudioSnapshot]
	);
	const getPeak = useCallback(
		() => getAudioSnapshot().peak,
		[getAudioSnapshot]
	);
	const getBands = useCallback(() => {
		const snapshot = getAudioSnapshot();
		return {
			bass: snapshot.channels.bass,
			mid: snapshot.channels.instrumental,
			treble: snapshot.channels.hihat
		};
	}, [getAudioSnapshot]);
	const getFrequencyBins = useCallback(
		() => getAudioSnapshot().bins,
		[getAudioSnapshot]
	);

	useEffect(() => {
		if (audioCaptureState !== 'active') return undefined;

		let raf = 0;
		const tick = () => {
			if (analyzerRef.current) {
				getAudioSnapshot();
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(raf);
	}, [audioCaptureState, getAudioSnapshot]);

	const value: AudioDataContextValue = useMemo(
		() => ({
			getAudioSnapshot,
			getAmplitude,
			getPeak,
			getBands,
			getFrequencyBins,
			startCapture,
			startFileCapture,
			stopCapture,
			captureMode,
			isPaused,
			pauseCapture,
			pauseFileForSystem,
			resumeCapture,
			resumeFileFromSystem,
			seek,
			getCurrentTime,
			getDuration,
			setFileVolume,
			setFileLoop,
			getFileName,
			fileVolume,
			fileLoop,
			addTrackToPlaylist,
			removeTrackFromPlaylist,
			playTrackById,
			playNextTrack,
			playPrevTrack
		}),
		[
			captureMode,
			fileLoop,
			fileVolume,
			getAudioSnapshot,
			getAmplitude,
			getBands,
			getCurrentTime,
			getDuration,
			getFileName,
			getFrequencyBins,
			getPeak,
			isPaused,
			pauseCapture,
			pauseFileForSystem,
			resumeCapture,
			resumeFileFromSystem,
			seek,
			setFileLoop,
			setFileVolume,
			startCapture,
			startFileCapture,
			stopCapture,
			addTrackToPlaylist,
			removeTrackFromPlaylist,
			playTrackById,
			playNextTrack,
			playPrevTrack
		]
	);

	return (
		<AudioDataContext.Provider value={value}>
			{children}
		</AudioDataContext.Provider>
	);
}

export function useAudioContext(): AudioDataContextValue {
	const ctx = useContext(AudioDataContext);
	if (!ctx)
		throw new Error(
			'useAudioContext must be used inside AudioDataProvider'
		);
	return ctx;
}
