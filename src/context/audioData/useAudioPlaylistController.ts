import {
	useCallback,
	useEffect,
	type Dispatch,
	type MutableRefObject,
	type SetStateAction
} from 'react';
import { AudioMixEngine } from '@/lib/audio/AudioMixEngine';
import { analyzeTrackContent } from '@/lib/audio/analyzeTrackContent';
import { analyzeTrackEnergy } from '@/lib/audio/analyzeTrackEnergy';
import { selectNextTrack } from '@/lib/audio/selectNextTrack';
import { loadImageBlob, saveImage } from '@/lib/db/imageDb';
import type { IAudioSourceAdapter } from '@/lib/audio/types';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { supportsDisplayMedia } from './audioDataShared';
import {
	HUGE_TRACK_ANALYSIS_THRESHOLD_BYTES,
	LARGE_TRACK_ANALYSIS_THRESHOLD_BYTES
} from './audioDataShared';

type UseAudioPlaylistControllerOptions = {
	analyzerRef: MutableRefObject<IAudioSourceAdapter | null>;
	engineRef: MutableRefObject<AudioMixEngine | null>;
	systemPausedFileRef: MutableRefObject<boolean>;
	restoredPlaylistTrackIdRef: MutableRefObject<string | null>;
	recentTrackIdsRef: MutableRefObject<string[]>;
	analysisQueueRef: MutableRefObject<Promise<void>>;
	resetAudioAnalysis: () => void;
	broadcastEmptyState: () => void;
	setCaptureMode: Dispatch<SetStateAction<'desktop' | 'microphone' | 'file'>>;
	setIsPaused: Dispatch<SetStateAction<boolean>>;
	setFileVolumeState: Dispatch<SetStateAction<number>>;
	setFileLoopState: Dispatch<SetStateAction<boolean>>;
	setAudioPaused: (value: boolean) => void;
	setOnTrackEnd: (handler: () => void) => void;
	setOnCrossfadeComplete: (handler: (id: string) => void) => void;
};

export function useAudioPlaylistController({
	analyzerRef,
	engineRef,
	systemPausedFileRef,
	restoredPlaylistTrackIdRef,
	recentTrackIdsRef,
	analysisQueueRef,
	resetAudioAnalysis,
	broadcastEmptyState,
	setCaptureMode,
	setIsPaused,
	setFileVolumeState,
	setFileLoopState,
	setAudioPaused,
	setOnTrackEnd,
	setOnCrossfadeComplete
}: UseAudioPlaylistControllerOptions) {
	const audioCrossfadeEnabled = useWallpaperStore(
		state => state.audioCrossfadeEnabled
	);
	const audioCrossfadeSeconds = useWallpaperStore(
		state => state.audioCrossfadeSeconds
	);
	const audioTransitionStyle = useWallpaperStore(
		state => state.audioTransitionStyle
	);
	const setAudioTransitionStyle = useWallpaperStore(
		state => state.setAudioTransitionStyle
	);
	const addAudioTrack = useWallpaperStore(state => state.addAudioTrack);
	const removeAudioTrackFromStore = useWallpaperStore(
		state => state.removeAudioTrack
	);
	const setActiveAudioTrackId = useWallpaperStore(
		state => state.setActiveAudioTrackId
	);
	const setQueuedAudioTrackId = useWallpaperStore(
		state => state.setQueuedAudioTrackId
	);
	const setAudioCaptureState = useWallpaperStore(
		state => state.setAudioCaptureState
	);
	const setAudioSourceMode = useWallpaperStore(
		state => state.setAudioSourceMode
	);

	const rememberPlayedTrackId = useCallback((id: string) => {
		recentTrackIdsRef.current = [
			...recentTrackIdsRef.current.filter(trackId => trackId !== id),
			id
		].slice(-4);
	}, [recentTrackIdsRef]);

	const getRecentTrackExcludes = useCallback(
		(currentId: string) => {
			const history = recentTrackIdsRef.current.filter(
				id => id !== currentId
			);
			return history.length > 0 ? history.slice(-2) : [];
		},
		[recentTrackIdsRef]
	);

	useEffect(() => {
		engineRef.current?.setCrossfadeConfig(
			audioCrossfadeEnabled,
			audioCrossfadeSeconds
		);
	}, [audioCrossfadeEnabled, audioCrossfadeSeconds, engineRef]);

	useEffect(() => {
		engineRef.current?.setTransitionStyle(audioTransitionStyle);
	}, [audioTransitionStyle, engineRef]);

	const loadFileForTrack = useCallback(async function loadFileForTrack(id: string) {
		const track = useWallpaperStore
			.getState()
			.audioTracks.find(t => t.id === id);
		if (!track) return null;
		const blob = await loadImageBlob(track.assetId);
		if (!blob) return null;
		return {
			track,
			file: new File(
				[blob],
				track.name || `track.${blob.type.split('/')[1] || 'mp3'}`,
				{ type: blob.type || track.mimeType || 'audio/mpeg' }
			)
		};
	}, []);

	const queueTrackAnalysis = useCallback(
		(
			id: string,
			file: File,
			options: { energy: boolean; content: boolean; crossfadeMs: number }
		) => {
			const isHugeFile = file.size >= HUGE_TRACK_ANALYSIS_THRESHOLD_BYTES;

			analysisQueueRef.current = analysisQueueRef.current
				.catch(() => undefined)
				.then(async () => {
					if (options.energy && !isHugeFile) {
						const metrics = await analyzeTrackEnergy(file);
						if (metrics) {
							useWallpaperStore.getState().updateAudioTrack(id, {
								energyScore: metrics.energyScore,
								bassScore: metrics.bassScore,
								densityScore: metrics.densityScore
							});
						}
					}

					if (!options.content || isHugeFile) {
						return;
					}

					if (file.size >= LARGE_TRACK_ANALYSIS_THRESHOLD_BYTES) {
						await new Promise(resolve =>
							window.setTimeout(resolve, 120)
						);
					}

					const contentMetrics = await analyzeTrackContent(
						file,
						options.crossfadeMs
					);
					if (!contentMetrics) return;
					useWallpaperStore.getState().updateAudioTrack(id, {
						contentStartMs: contentMetrics.contentStartMs,
						contentEndMs: contentMetrics.contentEndMs,
						introTrimMs: contentMetrics.introTrimMs,
						outroTrimMs: contentMetrics.outroTrimMs,
						mixOutStartMs: contentMetrics.mixOutStartMs,
						estimatedBpm: contentMetrics.estimatedBpm,
						beatStrength: contentMetrics.beatStrength,
						loudnessDb: contentMetrics.loudnessDb,
						durationMs: contentMetrics.durationMs
					});
				});
		},
		[analysisQueueRef]
	);

	const preloadNextFor = useCallback(
		async function preloadNextFor(afterId: string) {
			const state = useWallpaperStore.getState();
			if (!state.audioCrossfadeEnabled) return;
			if (state.audioTracks.filter(t => t.enabled).length < 2) return;
			const next = selectNextTrack(
				state.audioTracks,
				afterId,
				state.audioMixMode,
				{ excludeIds: getRecentTrackExcludes(afterId) }
			);
			if (!next || next.id === afterId) return;
			const loaded = await loadFileForTrack(next.id);
			if (!loaded) return;
			await engineRef.current?.preloadQueuedTrack(
				next.id,
				loaded.file,
				loaded.track.volume,
				loaded.track.loop,
				{
					contentStartMs: loaded.track.contentStartMs,
					contentEndMs: loaded.track.contentEndMs,
					mixOutStartMs: loaded.track.mixOutStartMs
				}
			);
			setQueuedAudioTrackId(next.id);
		},
		[engineRef, getRecentTrackExcludes, loadFileForTrack, setQueuedAudioTrackId]
	);

	const playTrackById = useCallback(
		async function playTrackById(id: string) {
			const loaded = await loadFileForTrack(id);
			if (!loaded) return;
			const { track, file } = loaded;

			const cfSec = useWallpaperStore.getState().audioCrossfadeSeconds;
			if (
				track.energyScore === undefined ||
				track.contentStartMs === undefined
			) {
				queueTrackAnalysis(id, file, {
					energy: track.energyScore === undefined,
					content: track.contentStartMs === undefined,
					crossfadeMs: cfSec * 1000
				});
			}

			if (analyzerRef.current) {
				analyzerRef.current.stop();
				analyzerRef.current = null;
			}
			systemPausedFileRef.current = false;
			resetAudioAnalysis();
			setAudioPaused(false);
			setAudioCaptureState('requesting');

			try {
				await engineRef.current!.loadActiveTrack(
					id,
					file,
					track.volume,
					track.loop,
					{
						contentStartMs: track.contentStartMs,
						contentEndMs: track.contentEndMs,
						mixOutStartMs: track.mixOutStartMs
					}
				);
				setCaptureMode('file');
				setIsPaused(false);
				setFileVolumeState(track.volume);
				setFileLoopState(track.loop);
				setAudioSourceMode('file');
				setAudioCaptureState('active');
				setActiveAudioTrackId(id);
				setQueuedAudioTrackId(null);
				rememberPlayedTrackId(id);
				restoredPlaylistTrackIdRef.current = id;
				void preloadNextFor(id);
			} catch {
				setAudioCaptureState('error');
			}
		},
		[
			analyzerRef,
			engineRef,
			loadFileForTrack,
			preloadNextFor,
			queueTrackAnalysis,
			rememberPlayedTrackId,
			resetAudioAnalysis,
			restoredPlaylistTrackIdRef,
			setActiveAudioTrackId,
			setAudioCaptureState,
			setAudioPaused,
			setAudioSourceMode,
			setCaptureMode,
			setFileLoopState,
			setFileVolumeState,
			setIsPaused,
			setQueuedAudioTrackId,
			systemPausedFileRef
		]
	);

	const addTrackToPlaylist = useCallback(
		async function addTrackToPlaylist(
			file: File,
			assetIdOverride?: string
		): Promise<'added' | 'duplicate'> {
			const fileKey = `${file.name}::${file.size}::${file.lastModified}`;
			const existing = useWallpaperStore.getState().audioTracks;
			if (existing.some(t => t.fileKey === fileKey)) {
				return 'duplicate';
			}

			const assetId = assetIdOverride ?? (await saveImage(file));
			const id = `track-${Math.random().toString(36).slice(2)}-${Date.now()}`;
			addAudioTrack({
				id,
				assetId,
				name: file.name,
				mimeType: file.type || 'audio/mpeg',
				volume: 1,
				loop: false,
				enabled: true,
				fileKey
			});
			const currentActive = useWallpaperStore.getState().activeAudioTrackId;
			if (!currentActive) {
				await playTrackById(id);
			}
			const cfMs =
				useWallpaperStore.getState().audioCrossfadeSeconds * 1000;
			queueTrackAnalysis(id, file, {
				energy: true,
				content: true,
				crossfadeMs: cfMs
			});
			return 'added';
		},
		[addAudioTrack, playTrackById, queueTrackAnalysis]
	);

	const removeTrackFromPlaylist = useCallback(
		function removeTrackFromPlaylist(id: string) {
			const state = useWallpaperStore.getState();
			const wasActive = state.activeAudioTrackId === id;
			const wasQueued = state.queuedAudioTrackId === id;
			removeAudioTrackFromStore(id);
			if (wasQueued) {
				engineRef.current?.stopQueued();
				setQueuedAudioTrackId(null);
			}
			if (wasActive) {
				engineRef.current?.stopAll();
				setActiveAudioTrackId(null);
				setQueuedAudioTrackId(null);
				recentTrackIdsRef.current =
					recentTrackIdsRef.current.filter(trackId => trackId !== id);
				setAudioCaptureState('idle');
				setAudioSourceMode('none');
				setCaptureMode(
					supportsDisplayMedia ? 'desktop' : 'microphone'
				);
				setIsPaused(false);
				resetAudioAnalysis();
				broadcastEmptyState();
			}
		},
		[
			broadcastEmptyState,
			engineRef,
			recentTrackIdsRef,
			removeAudioTrackFromStore,
			resetAudioAnalysis,
			setActiveAudioTrackId,
			setAudioCaptureState,
			setAudioSourceMode,
			setCaptureMode,
			setIsPaused,
			setQueuedAudioTrackId
		]
	);

	const clearPlaylist = useCallback(
		function clearPlaylist() {
			engineRef.current?.stopAll();
			setActiveAudioTrackId(null);
			setQueuedAudioTrackId(null);
			useWallpaperStore.getState().setAudioTracks([]);
			setAudioCaptureState('idle');
			setAudioSourceMode('none');
			setCaptureMode(supportsDisplayMedia ? 'desktop' : 'microphone');
			setIsPaused(false);
			recentTrackIdsRef.current = [];
			resetAudioAnalysis();
			broadcastEmptyState();
		},
		[
			broadcastEmptyState,
			engineRef,
			recentTrackIdsRef,
			resetAudioAnalysis,
			setActiveAudioTrackId,
			setAudioCaptureState,
			setAudioSourceMode,
			setCaptureMode,
			setIsPaused,
			setQueuedAudioTrackId
		]
	);

	const queueTrackById = useCallback(
		async function queueTrackById(id: string) {
			if (id === useWallpaperStore.getState().activeAudioTrackId) return;
			const loaded = await loadFileForTrack(id);
			if (!loaded) return;
			const { track, file } = loaded;
			await engineRef.current?.preloadQueuedTrack(
				id,
				file,
				track.volume,
				track.loop,
				{
					contentStartMs: track.mixInStartMs ?? track.contentStartMs,
					contentEndMs: track.contentEndMs,
					mixOutStartMs: track.mixOutStartMs
				}
			);
			setQueuedAudioTrackId(id);
		},
		[engineRef, loadFileForTrack, setQueuedAudioTrackId]
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
				idx > 0 ? tracks[idx - 1] : tracks[tracks.length - 1];
			if (prev) await playTrackById(prev.id);
		},
		[playTrackById]
	);

	const handleTrackEnd = useCallback(
		function handleTrackEnd() {
			const state = useWallpaperStore.getState();
			if (!state.audioAutoAdvance) return;
			const enabled = state.audioTracks.filter(t => t.enabled);
			if (enabled.length === 0) return;
			const idx = enabled.findIndex(t => t.id === state.activeAudioTrackId);
			const next = enabled[idx + 1] ?? enabled[0];
			if (next) void playTrackById(next.id);
		},
		[playTrackById]
	);

	const handleCrossfadeComplete = useCallback(
		function handleCrossfadeComplete(newActiveId: string) {
			setActiveAudioTrackId(newActiveId);
			setQueuedAudioTrackId(null);
			rememberPlayedTrackId(newActiveId);
			void preloadNextFor(newActiveId);
		},
		[
			preloadNextFor,
			rememberPlayedTrackId,
			setActiveAudioTrackId,
			setQueuedAudioTrackId
		]
	);

	useEffect(() => {
		setOnTrackEnd(handleTrackEnd);
	}, [handleTrackEnd, setOnTrackEnd]);

	useEffect(() => {
		setOnCrossfadeComplete(handleCrossfadeComplete);
	}, [handleCrossfadeComplete, setOnCrossfadeComplete]);

	return {
		playTrackById,
		addTrackToPlaylist,
		removeTrackFromPlaylist,
		clearPlaylist,
		queueTrackById,
		playNextTrack,
		playPrevTrack,
		audioTransitionStyle,
		setAudioTransitionStyle
	};
}
