import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAudioContext } from '@/context/useAudioContext';
import { getVirtualFileBlob } from '@/lib/db/localFoldersDb';
import { selectNextTrack } from '@/lib/audio/selectNextTrack';
import { useLocalFolders } from '@/hooks/useLocalFolders';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import {
	filterTrackIdsBySetlist,
	getActiveSetlist
} from '@/store/slices/setlistsSlice';
import type { AudioMixMode, AudioTransitionStyle } from '@/types/wallpaper';
import {
	Button,
	EditorTabFooter,
	EditorTabHeader,
	EditorTabLayout,
	ICON_SIZE
} from '@/ui';
import { useDialog } from '../../ui/DialogProvider';
import AudioPlaylistSection from './audio/AudioPlaylistSection';
import AudioAnalysisSection from './audio/AudioAnalysisSection';
import AudioCaptureSection from './audio/AudioCaptureSection';
import AudioMixSection from './audio/AudioMixSection';
import AudioRoutingSection from './audio/AudioRoutingSection';
import AudioTransportSection from './audio/AudioTransportSection';
import ProjectScopeStrip from './ProjectScopeStrip';

function moveIdToIndex(
	ids: string[],
	id: string,
	targetIndex: number
): string[] {
	const sourceIndex = ids.indexOf(id);
	if (sourceIndex < 0) return ids;
	const next = ids.filter(candidate => candidate !== id);
	const clamped = Math.max(0, Math.min(next.length, targetIndex));
	next.splice(clamped, 0, id);
	return next;
}

export default function AudioTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const { confirm } = useDialog();
	const uploadRef = useRef<HTMLInputElement>(null);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [crossfadeState, setCrossfadeState] = useState({
		isFading: false,
		progress: 0
	});
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
	const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([]);
	const store = useWallpaperStore(
		useShallow(s => ({
			audioTracks: s.audioTracks,
			setlists: s.setlists,
			activeSetlistId: s.activeSetlistId,
			activeAudioTrackId: s.activeAudioTrackId,
			queuedAudioTrackId: s.queuedAudioTrackId,
			audioCaptureState: s.audioCaptureState,
			audioPaused: s.audioPaused,
			motionPaused: s.motionPaused,
			fftSize: s.fftSize,
			audioMixMode: s.audioMixMode,
			audioAutoAdvance: s.audioAutoAdvance,
			audioCrossfadeEnabled: s.audioCrossfadeEnabled,
			audioCrossfadeSeconds: s.audioCrossfadeSeconds,
			audioAutoKickThreshold: s.audioAutoKickThreshold,
			audioAutoSwitchHoldMs: s.audioAutoSwitchHoldMs,
			mediaSessionEnabled: s.mediaSessionEnabled,
			virtualFoldersEnabled: s.virtualFoldersEnabled,
			uiMode: s.uiMode,
			moveAudioTrack: s.moveAudioTrack,
			updateAudioTrack: s.updateAudioTrack,
			setAudioPaused: s.setAudioPaused,
			setMotionPaused: s.setMotionPaused,
			setFftSize: s.setFftSize,
			setAudioMixMode: s.setAudioMixMode,
			setAudioAutoAdvance: s.setAudioAutoAdvance,
			setAudioCrossfadeEnabled: s.setAudioCrossfadeEnabled,
			setAudioCrossfadeSeconds: s.setAudioCrossfadeSeconds,
			setAudioAutoKickThreshold: s.setAudioAutoKickThreshold,
			setAudioAutoSwitchHoldMs: s.setAudioAutoSwitchHoldMs,
			setMediaSessionEnabled: s.setMediaSessionEnabled,
			setVirtualFoldersEnabled: s.setVirtualFoldersEnabled,
			setSetlistTracks: s.setSetlistTracks,
			setActiveSetlistId: s.setActiveSetlistId
		}))
	);
	const {
		startCapture,
		stopCapture,
		pauseCapture,
		resumeCapture,
		pauseFileForSystem,
		resumeFileFromSystem,
		captureMode,
		isPaused,
		seek,
		getCurrentTime,
		getDuration,
		setFileVolume,
		setFileLoop,
		fileVolume,
		fileLoop,
		getFileName,
		addTrackToPlaylist,
		removeTrackFromPlaylist,
		clearPlaylist,
		playTrackById,
		playNextTrack,
		playPrevTrack,
		queueTrackById,
		triggerMixNow,
		getIsCrossfading,
		getCrossfadeProgress,
		transitionStyle,
		setTransitionStyle
	} = useAudioContext();
	const localFolders = useLocalFolders();

	// Setlist filter: when active, the playlist view shows ONLY the curated
	// tracks. Same strict-filter rule as the image pool.
	const audioTracks = filterTrackIdsBySetlist(
		store.audioTracks,
		store.setlists,
		store.activeSetlistId
	);
	const visibleTrackIds = audioTracks.map(track => track.id);
	const activeSetlist = getActiveSetlist(
		store.setlists,
		store.activeSetlistId
	);
	const activeAudioTrackId = store.activeAudioTrackId;
	const queuedAudioTrackId = store.queuedAudioTrackId;
	const state = store.audioCaptureState;
	const isFile = captureMode === 'file' && state === 'active';
	const isCapturing = state === 'active';
	const effectiveAudioPaused =
		captureMode === 'file'
			? isPaused || store.audioPaused
			: store.audioPaused;
	const activeTrack = audioTracks.find(
		track => track.id === activeAudioTrackId
	);
	const queuedTrack = audioTracks.find(
		track => track.id === queuedAudioTrackId
	);
	const hasPlaylist = audioTracks.length > 0;
	const enabledTracksCount = audioTracks.filter(
		track => track.enabled
	).length;
	const isAdvanced = store.uiMode === 'advanced';
	const canMixNow =
		audioTracks.length >= 2 &&
		!crossfadeState.isFading &&
		Boolean(activeAudioTrackId);

	useEffect(() => {
		if (!isFile) return;
		const id = window.setInterval(() => {
			setCurrentTime(getCurrentTime());
			setDuration(getDuration());
			setCrossfadeState({
				isFading: getIsCrossfading(),
				progress: getCrossfadeProgress()
			});
		}, 100);
		return () => window.clearInterval(id);
	}, [
		getCurrentTime,
		getDuration,
		getIsCrossfading,
		getCrossfadeProgress,
		isFile
	]);

	const statusLabel: Record<string, string> = {
		idle: t.status_idle,
		requesting: t.status_requesting,
		active: captureMode === 'file' ? t.status_file : t.status_active,
		denied: t.status_denied,
		error: t.status_error,
		'no-audio-track': t.status_no_audio_track
	};
	const statusTone: Record<string, 'default' | 'active' | 'warn' | 'danger'> =
		{
			idle: 'default',
			requesting: 'warn',
			active: 'active',
			denied: 'danger',
			error: 'danger',
			'no-audio-track': 'warn'
		};
	const mixModeMeta = useMemo(
		() =>
			({
				sequential: {
					label: t.label_mix_mode_sequential,
					desc: t.hint_mix_mode_sequential
				},
				'energy-match': {
					label: t.label_mix_mode_match,
					desc: t.hint_mix_mode_match
				},
				contrast: {
					label: t.label_mix_mode_contrast,
					desc: t.hint_mix_mode_contrast
				}
			}) satisfies Record<
				Extract<
					AudioMixMode,
					'sequential' | 'energy-match' | 'contrast'
				>,
				{ label: string; desc: string }
			>,
		[t]
	);
	const transitionStyleMeta = useMemo(
		() =>
			({
				linear: {
					label: t.label_transition_style_linear,
					desc: t.hint_transition_style_linear
				},
				smooth: {
					label: t.label_transition_style_smooth,
					desc: t.hint_transition_style_smooth
				},
				quick: {
					label: t.label_transition_style_quick,
					desc: t.hint_transition_style_quick
				},
				'early-blend': {
					label: t.label_transition_style_early,
					desc: t.hint_transition_style_early
				},
				'late-blend': {
					label: t.label_transition_style_late,
					desc: t.hint_transition_style_late
				}
			}) satisfies Record<
				AudioTransitionStyle,
				{ label: string; desc: string }
			>,
		[t]
	);

	function addFileTrackToCurrentSetlist(file: File): boolean {
		const fileKey = `${file.name}::${file.size}::${file.lastModified}`;
		const state = useWallpaperStore.getState();
		const track = state.audioTracks.find(t => t.fileKey === fileKey);
		const currentSetlist = getActiveSetlist(
			state.setlists,
			state.activeSetlistId
		);
		if (!track || !currentSetlist) return false;
		if (currentSetlist.trackIds.includes(track.id)) return false;
		state.setSetlistTracks(currentSetlist.id, [
			...currentSetlist.trackIds,
			track.id
		]);
		return true;
	}

	const handleUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(event.target.files ?? []);
			if (files.length === 0) return;
			const skipped: string[] = [];
			const adds = files.map(async file => {
				const result = await addTrackToPlaylist(file);
				const addedToSetlist = addFileTrackToCurrentSetlist(file);
				if (result === 'duplicate' && !addedToSetlist)
					skipped.push(file.name);
			});
			void Promise.all(adds).then(() => {
				if (skipped.length > 0) {
					setDuplicateWarnings(skipped);
					window.setTimeout(() => setDuplicateWarnings([]), 5000);
				}
			});
			event.target.value = '';
		},
		[addTrackToPlaylist]
	);

	const setActiveSetlistTrackOrder = useCallback(
		(nextVisibleIds: string[]) => {
			if (!activeSetlist) return;
			const visible = new Set(visibleTrackIds);
			const hiddenOrDanglingIds = activeSetlist.trackIds.filter(
				trackId => !visible.has(trackId)
			);
			store.setSetlistTracks(activeSetlist.id, [
				...nextVisibleIds,
				...hiddenOrDanglingIds
			]);
		},
		[activeSetlist, store, visibleTrackIds]
	);

	const moveVisibleTrackToIndex = useCallback(
		(trackId: string, targetIndex: number) => {
			if (activeSetlist) {
				setActiveSetlistTrackOrder(
					moveIdToIndex(visibleTrackIds, trackId, targetIndex)
				);
				return;
			}
			const sourceIndex = store.audioTracks.findIndex(
				track => track.id === trackId
			);
			if (sourceIndex < 0) return;
			store.moveAudioTrack(sourceIndex, targetIndex);
		},
		[activeSetlist, setActiveSetlistTrackOrder, store, visibleTrackIds]
	);

	function removeVisibleTrack(trackId: string) {
		if (activeSetlist) {
			store.setSetlistTracks(
				activeSetlist.id,
				activeSetlist.trackIds.filter(id => id !== trackId)
			);
			if (store.activeAudioTrackId === trackId) {
				store.setActiveSetlistId(activeSetlist.id);
			}
			return;
		}
		removeTrackFromPlaylist(trackId);
	}

	const handleDragStart = useCallback((index: number) => {
		setDragIndex(index);
	}, []);

	const handleDragOver = useCallback(
		(event: React.DragEvent, index: number) => {
			event.preventDefault();
			if (dragIndex !== null && dragIndex !== index) {
				setDragOverIndex(index);
			}
		},
		[dragIndex]
	);

	const handleDrop = useCallback(
		(index: number) => {
			if (dragIndex !== null && dragIndex !== index) {
				const sourceTrack = audioTracks[dragIndex];
				if (sourceTrack) moveVisibleTrackToIndex(sourceTrack.id, index);
			}
			setDragIndex(null);
			setDragOverIndex(null);
		},
		[audioTracks, dragIndex, moveVisibleTrackToIndex]
	);

	const handleDragEnd = useCallback(() => {
		setDragIndex(null);
		setDragOverIndex(null);
	}, []);

	const moveTrackUp = useCallback(
		(index: number) => {
			const track = audioTracks[index];
			if (track && index > 0)
				moveVisibleTrackToIndex(track.id, index - 1);
		},
		[audioTracks, moveVisibleTrackToIndex]
	);

	const moveTrackDown = useCallback(
		(index: number) => {
			const track = audioTracks[index];
			if (track && index < audioTracks.length - 1) {
				moveVisibleTrackToIndex(track.id, index + 1);
			}
		},
		[audioTracks, moveVisibleTrackToIndex]
	);

	const handlePlaybackToggle = useCallback(() => {
		if (effectiveAudioPaused) {
			store.setAudioPaused(false);
			if (isFile) resumeFileFromSystem();
			else resumeCapture();
			return;
		}
		store.setAudioPaused(true);
		if (isFile) pauseFileForSystem();
		else pauseCapture();
	}, [
		effectiveAudioPaused,
		isFile,
		pauseCapture,
		pauseFileForSystem,
		resumeCapture,
		resumeFileFromSystem,
		store
	]);

	function toggleAudioOnlyPause() {
		const nextPaused = !effectiveAudioPaused;
		store.setAudioPaused(nextPaused);
		if (isFile) {
			if (nextPaused) pauseFileForSystem();
			else resumeFileFromSystem();
		}
	}

	function togglePauseAll() {
		store.setMotionPaused(!store.motionPaused);
	}

	const handleClearPlaylist = useCallback(async () => {
		const ok = await confirm({
			title: t.label_clear_playlist,
			message: activeSetlist
				? `Remove all tracks from "${activeSetlist.name}" only. The global playlist stays intact.`
				: t.confirm_clear_playlist,
			confirmLabel: t.label_clear_playlist,
			cancelLabel: t.label_cancel,
			tone: 'danger'
		});
		if (!ok) return;
		if (activeSetlist) {
			store.setSetlistTracks(activeSetlist.id, []);
			store.setActiveSetlistId(activeSetlist.id);
			return;
		}
		clearPlaylist();
	}, [activeSetlist, clearPlaylist, confirm, store, t]);

	const handleMixNow = useCallback(async () => {
		if (audioTracks.length < 2 || crossfadeState.isFading) return;
		if (queuedAudioTrackId) {
			triggerMixNow();
			return;
		}
		const fallbackCurrentId =
			activeAudioTrackId ??
			audioTracks.find(track => track.enabled)?.id ??
			null;
		if (!fallbackCurrentId) return;
		const next =
			selectNextTrack(
				audioTracks,
				fallbackCurrentId,
				store.audioMixMode
			) ??
			audioTracks.find(
				track => track.enabled && track.id !== fallbackCurrentId
			) ??
			null;
		if (!next) return;
		await queueTrackById(next.id);
		triggerMixNow();
	}, [
		activeAudioTrackId,
		audioTracks,
		crossfadeState.isFading,
		queuedAudioTrackId,
		queueTrackById,
		store.audioMixMode,
		triggerMixNow
	]);

	const addAllVirtualAudio = useCallback(async () => {
		for (const fileEntry of localFolders.audioFiles) {
			const blob = await getVirtualFileBlob('audio', fileEntry.name);
			if (!blob) continue;
			const fakeFile = new File([blob], fileEntry.name, {
				type: blob.type || 'audio/mpeg'
			});
			await addTrackToPlaylist(fakeFile, fileEntry.virtualId);
			addFileTrackToCurrentSetlist(fakeFile);
		}
	}, [addTrackToPlaylist, localFolders.audioFiles]);

	const addVirtualAudio = useCallback(
		async (name: string, virtualId: string) => {
			const blob = await getVirtualFileBlob('audio', name);
			if (!blob) return;
			const fakeFile = new File([blob], name, {
				type: blob.type || 'audio/mpeg'
			});
			await addTrackToPlaylist(fakeFile, virtualId);
			addFileTrackToCurrentSetlist(fakeFile);
		},
		[addTrackToPlaylist]
	);

	return (
		<EditorTabLayout
			header={<EditorTabHeader title={t.tab_audio} />}
			footer={
				<EditorTabFooter title={t.label_reset}>
					<Button
						type="button"
						size="sm"
						density="compact"
						variant="secondary"
						icon={<RefreshCw size={ICON_SIZE.xs} />}
						onClick={onReset}
					>
						{t.reset_tab}
					</Button>
				</EditorTabFooter>
			}
		>
			<ProjectScopeStrip />
			<AudioPlaylistSection
				uploadRef={uploadRef}
				hasPlaylist={hasPlaylist}
				audioTracks={audioTracks}
				activeTrack={activeTrack}
				queuedTrack={queuedTrack}
				activeAudioTrackId={activeAudioTrackId}
				queuedAudioTrackId={queuedAudioTrackId}
				virtualFoldersEnabled={store.virtualFoldersEnabled}
				setVirtualFoldersEnabled={store.setVirtualFoldersEnabled}
				audioFolderLoaded={localFolders.audioFolderLoaded}
				audioFiles={localFolders.audioFiles}
				duplicateWarnings={duplicateWarnings}
				dragIndex={dragIndex}
				dragOverIndex={dragOverIndex}
				expandedTrackId={expandedTrackId}
				setExpandedTrackId={setExpandedTrackId}
				enabledTracksCount={enabledTracksCount}
				crossfadeState={crossfadeState}
				effectiveAudioPaused={effectiveAudioPaused}
				isCapturing={isCapturing}
				canMixNow={canMixNow}
				onUpload={handleUpload}
				onClearPlaylist={() => void handleClearPlaylist()}
				onAddAllVirtualAudio={() => void addAllVirtualAudio()}
				onAddVirtualAudio={(name, virtualId) =>
					void addVirtualAudio(name, virtualId)
				}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				onDragEnd={handleDragEnd}
				onMoveTrackUp={moveTrackUp}
				onMoveTrackDown={moveTrackDown}
				onUpdateTrack={store.updateAudioTrack}
				onRemoveTrack={removeVisibleTrack}
				onPlayTrack={id => void playTrackById(id)}
				onQueueTrack={id => void queueTrackById(id)}
				onPlayPrevTrack={() => void playPrevTrack()}
				onPlayNextTrack={() => void playNextTrack()}
				onPlaybackToggle={handlePlaybackToggle}
				onMixNow={() => void handleMixNow()}
			/>

			{isAdvanced && hasPlaylist && audioTracks.length >= 2 ? (
				<AudioMixSection
					audioAutoAdvance={store.audioAutoAdvance}
					setAudioAutoAdvance={store.setAudioAutoAdvance}
					audioMixMode={store.audioMixMode}
					setAudioMixMode={store.setAudioMixMode}
					mixModeMeta={mixModeMeta}
					audioCrossfadeEnabled={store.audioCrossfadeEnabled}
					setAudioCrossfadeEnabled={store.setAudioCrossfadeEnabled}
					transitionStyle={transitionStyle}
					setTransitionStyle={setTransitionStyle}
					transitionStyleMeta={transitionStyleMeta}
					audioCrossfadeSeconds={store.audioCrossfadeSeconds}
					setAudioCrossfadeSeconds={store.setAudioCrossfadeSeconds}
				/>
			) : null}

			<AudioCaptureSection
				captureMode={captureMode}
				state={state}
				isCapturing={isCapturing}
				statusLabel={statusLabel}
				statusTone={statusTone}
				onStartCapture={() => void startCapture()}
				onStopCapture={stopCapture}
			/>

			<AudioTransportSection
				isFile={isFile}
				fileName={getFileName()}
				subtitle={statusLabel[state]}
				currentTime={currentTime}
				duration={duration}
				seek={seek}
				hasPlaylist={hasPlaylist}
				effectiveAudioPaused={effectiveAudioPaused}
				onPlaybackToggle={handlePlaybackToggle}
				fileVolume={fileVolume}
				setFileVolume={setFileVolume}
				fileLoop={fileLoop}
				setFileLoop={setFileLoop}
				onToggleAudioOnlyPause={toggleAudioOnlyPause}
				onTogglePauseAll={togglePauseAll}
				motionPaused={store.motionPaused}
				isAdvanced={isAdvanced}
				mediaSessionEnabled={store.mediaSessionEnabled}
				setMediaSessionEnabled={store.setMediaSessionEnabled}
			/>

			{isAdvanced ? (
				<AudioAnalysisSection
					fftSize={store.fftSize}
					setFftSize={store.setFftSize}
					audioAutoKickThreshold={store.audioAutoKickThreshold}
					setAudioAutoKickThreshold={store.setAudioAutoKickThreshold}
					audioAutoSwitchHoldMs={store.audioAutoSwitchHoldMs}
					setAudioAutoSwitchHoldMs={store.setAudioAutoSwitchHoldMs}
				/>
			) : null}

			{isAdvanced ? <AudioRoutingSection /> : null}
		</EditorTabLayout>
	);
}
