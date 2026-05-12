import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	ChevronDown,
	ChevronUp,
	Clock,
	FileAudio,
	FolderPlus,
	ListMusic,
	Pause,
	Play,
	RefreshCw,
	RotateCcw,
	Settings,
	SkipBack,
	SkipForward,
	Trash2,
	Upload,
	Volume2,
	X
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { AUDIO_ROUTING_RANGES } from '@/config/ranges';
import { useAudioContext } from '@/context/useAudioContext';
import { getVirtualFileBlob } from '@/lib/db/localFoldersDb';
import { selectNextTrack } from '@/lib/audio/selectNextTrack';
import { useLocalFolders } from '@/hooks/useLocalFolders';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type {
	AudioMixMode,
	AudioPlaylistTrack,
	AudioTransitionStyle
} from '@/types/wallpaper';
import {
	Button,
	CollapsibleSection,
	IconButton,
	SectionCard,
	Select,
	Slider,
	ToggleSwitch,
	UI_COLORS,
	FONT,
	ICON_SIZE
} from '@/ui';
import { useDialog } from '../../ui/DialogProvider';

const FFT_SIZES = ['512', '1024', '2048', '4096'] as const;
const FFT_PRESETS = [
	{ id: 'fast', label: 'Fast', fftSize: 512 },
	{ id: 'balanced', label: 'Balanced', fftSize: 2048 },
	{ id: 'detailed', label: 'Detailed', fftSize: 4096 }
] as const;
const MIX_MODES = [
	{ id: 'sequential', icon: '->' },
	{ id: 'energy-match', icon: '~=' },
	{ id: 'contrast', icon: '<>' }
] as const satisfies ReadonlyArray<{ id: AudioMixMode; icon: string }>;
const TRANSITION_STYLES = [
	'linear',
	'smooth',
	'quick',
	'early-blend',
	'late-blend'
] as const satisfies ReadonlyArray<AudioTransitionStyle>;

function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
	const minutes = Math.floor(seconds / 60);
	const sec = Math.floor(seconds % 60);
	return `${minutes}:${sec.toString().padStart(2, '0')}`;
}

function cleanTrackName(name: string): string {
	return name.replace(/\.(mp3|wav|ogg|flac|m4a|aac|webm|opus)$/i, '');
}

function formatDecimal(value: number): string {
	return value.toFixed(2);
}

function formatInteger(value: number): string {
	return Math.round(value).toString();
}

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<span
			className="uppercase"
			style={{
				color: UI_COLORS.fgMute,
				fontFamily: FONT.mono,
				fontSize: 10,
				fontWeight: 650,
				letterSpacing: '0.1em'
			}}
		>
			{children}
		</span>
	);
}

function InfoText({ children }: { children: React.ReactNode }) {
	return (
		<span className="text-[11px] leading-snug" style={{ color: UI_COLORS.fgMute }}>
			{children}
		</span>
	);
}

function MetricBar({
	label,
	value
}: {
	label: string;
	value: number | undefined;
}) {
	const pct = Math.max(0, Math.min(100, Math.round((value ?? 0) * 100)));
	return (
		<div className="flex min-w-0 flex-1 flex-col gap-1">
			<div className="flex items-center justify-between gap-2">
				<span className="text-[10px]" style={{ color: UI_COLORS.fgMute }}>
					{label}
				</span>
				<span
					className="tabular-nums text-[10px]"
					style={{ color: UI_COLORS.fgFaint, fontFamily: FONT.mono }}
				>
					{pct}%
				</span>
			</div>
			<div
				className="h-1.5 overflow-hidden rounded-full"
				style={{ background: UI_COLORS.overlay }}
			>
				<div
					className="h-full rounded-full"
					style={{
						width: `${pct}%`,
						background: UI_COLORS.accent
					}}
				/>
			</div>
		</div>
	);
}

function StatusPill({
	label,
	tone = 'default'
}: {
	label: string;
	tone?: 'default' | 'active' | 'warn' | 'danger';
}) {
	const color =
		tone === 'active'
			? UI_COLORS.ok
			: tone === 'warn'
				? UI_COLORS.warn
				: tone === 'danger'
					? UI_COLORS.danger
					: UI_COLORS.fgMute;
	return (
		<span
			className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
			style={{
				color,
				borderColor:
					tone === 'active'
						? UI_COLORS.accentBorder
						: tone === 'warn'
							? UI_COLORS.warnBorder
							: tone === 'danger'
								? UI_COLORS.dangerBorder
								: UI_COLORS.border,
				background:
					tone === 'active'
						? UI_COLORS.accentSoft
						: tone === 'warn'
							? UI_COLORS.warnSoft
							: tone === 'danger'
								? UI_COLORS.dangerSoft
								: UI_COLORS.overlay,
				fontFamily: FONT.mono
			}}
		>
			{label}
		</span>
	);
}

function ToggleRow({
	label,
	hint,
	checked,
	onChange
}: {
	label: string;
	hint?: string;
	checked: boolean;
	onChange: (value: boolean) => void;
}) {
	return (
		<div
			className="flex items-center justify-between gap-3 rounded-[var(--editor-radius-md)] border px-3 py-2"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.raised
			}}
		>
			<div className="min-w-0">
				<div className="text-[12px] font-medium" style={{ color: UI_COLORS.fg }}>
					{label}
				</div>
				{hint ? <InfoText>{hint}</InfoText> : null}
			</div>
			<ToggleSwitch
				checked={checked}
				onChange={onChange}
				size="sm"
				ariaLabel={label}
			/>
		</div>
	);
}

function TrackDetailPanel({
	track,
	onUpdate,
	onQueue,
	onRemove,
	onPlay,
	isQueued,
	isActive,
	labels
}: {
	track: AudioPlaylistTrack;
	onUpdate: (patch: Partial<AudioPlaylistTrack>) => void;
	onQueue: () => void;
	onRemove: () => void;
	onPlay: () => void;
	isQueued: boolean;
	isActive: boolean;
	labels: {
		format: string;
		loudness: string;
		duration: string;
		intro: string;
		mixOut: string;
		playToAnalyze: string;
		beat: string;
		energy: string;
		density: string;
		setAsNext: string;
		queuedAsNext: string;
		delete: string;
		reanalyze: string;
	};
}) {
	const durationSeconds = (track.durationMs ?? 0) / 1000;
	const contentStartSeconds = (track.contentStartMs ?? 0) / 1000;
	const mixOutSeconds = (track.mixOutStartMs ?? track.durationMs ?? 0) / 1000;
	return (
		<div
			className="mt-1 flex flex-col gap-3 rounded-[var(--editor-radius-md)] border p-2"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.panel
			}}
		>
			<div
				className="grid grid-cols-1 gap-1 border-b pb-2 text-[10px] sm:grid-cols-3"
				style={{
					borderColor: UI_COLORS.hairline,
					color: UI_COLORS.fgMute
				}}
			>
				<span>
					{labels.format}: {track.mimeType.split('/')[1] || 'audio'}
				</span>
				<span>
					{labels.loudness}:{' '}
					{track.loudnessDb !== undefined ? `${track.loudnessDb} dB` : '??'}
				</span>
				<span>
					{labels.duration}:{' '}
					{track.durationMs ? formatTime(durationSeconds) : '??'}
				</span>
			</div>
			{track.durationMs ? (
				<div className="flex flex-col gap-2">
					<Slider
						label={labels.intro}
						value={contentStartSeconds}
						min={0}
						max={durationSeconds * 0.4}
						step={0.1}
						onChange={value => onUpdate({ contentStartMs: value * 1000 })}
						variant="compact"
						formatValue={formatTime}
					/>
					<Slider
						label={labels.mixOut}
						value={mixOutSeconds}
						min={durationSeconds * 0.5}
						max={durationSeconds}
						step={0.1}
						onChange={value => onUpdate({ mixOutStartMs: value * 1000 })}
						variant="compact"
						formatValue={formatTime}
					/>
				</div>
			) : (
				<InfoText>{labels.playToAnalyze}</InfoText>
			)}
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
				{track.beatStrength !== undefined ? (
					<MetricBar label={labels.beat} value={track.beatStrength} />
				) : null}
				{track.energyScore !== undefined ? (
					<MetricBar label={labels.energy} value={track.energyScore} />
				) : null}
				{track.densityScore !== undefined ? (
					<MetricBar label={labels.density} value={track.densityScore} />
				) : null}
			</div>
			<div className="flex flex-wrap gap-1.5">
				{!isActive ? (
					<Button
						size="sm"
						density="compact"
						variant={isQueued ? 'primary' : 'secondary'}
						onClick={onQueue}
					>
						{isQueued ? labels.queuedAsNext : labels.setAsNext}
					</Button>
				) : null}
				<Button size="sm" density="compact" onClick={onPlay}>
					{labels.reanalyze}
				</Button>
				<Button
					size="sm"
					density="compact"
					variant="destructive"
					onClick={onRemove}
				>
					{labels.delete}
				</Button>
			</div>
		</div>
	);
}

export default function ModernAudioTab({ onReset }: { onReset: () => void }) {
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
			setVirtualFoldersEnabled: s.setVirtualFoldersEnabled
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

	const audioTracks = store.audioTracks;
	const activeAudioTrackId = store.activeAudioTrackId;
	const queuedAudioTrackId = store.queuedAudioTrackId;
	const state = store.audioCaptureState;
	const isFile = captureMode === 'file' && state === 'active';
	const isCapturing = state === 'active';
	const effectiveAudioPaused =
		captureMode === 'file' ? isPaused || store.audioPaused : store.audioPaused;
	const activeTrack = audioTracks.find(track => track.id === activeAudioTrackId);
	const queuedTrack = audioTracks.find(track => track.id === queuedAudioTrackId);
	const hasPlaylist = audioTracks.length > 0;
	const enabledTracksCount = audioTracks.filter(track => track.enabled).length;
	const isAdvanced = store.uiMode === 'advanced';
	const activeFftPreset =
		FFT_PRESETS.find(preset => preset.fftSize === store.fftSize) ?? null;
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
	}, [getCurrentTime, getDuration, getIsCrossfading, getCrossfadeProgress, isFile]);

	const statusLabel: Record<string, string> = {
		idle: t.status_idle,
		requesting: t.status_requesting,
		active: captureMode === 'file' ? t.status_file : t.status_active,
		denied: t.status_denied,
		error: t.status_error,
		'no-audio-track': t.status_no_audio_track
	};
	const statusTone: Record<string, 'default' | 'active' | 'warn' | 'danger'> = {
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
				Extract<AudioMixMode, 'sequential' | 'energy-match' | 'contrast'>,
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
			}) satisfies Record<AudioTransitionStyle, { label: string; desc: string }>,
		[t]
	);
	const fftSizeOptions = useMemo(
		() =>
			FFT_SIZES.map(size => ({
				value: size,
				label: `${size} bins`
			})),
		[]
	);

	const handleUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(event.target.files ?? []);
			if (files.length === 0) return;
			const skipped: string[] = [];
			const adds = files.map(async file => {
				const result = await addTrackToPlaylist(file);
				if (result === 'duplicate') skipped.push(file.name);
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
				store.moveAudioTrack(dragIndex, index);
			}
			setDragIndex(null);
			setDragOverIndex(null);
		},
		[dragIndex, store]
	);

	const handleDragEnd = useCallback(() => {
		setDragIndex(null);
		setDragOverIndex(null);
	}, []);

	const moveTrackUp = useCallback(
		(index: number) => {
			if (index > 0) store.moveAudioTrack(index, index - 1);
		},
		[store]
	);

	const moveTrackDown = useCallback(
		(index: number) => {
			if (index < audioTracks.length - 1) {
				store.moveAudioTrack(index, index + 1);
			}
		},
		[audioTracks.length, store]
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
			message: t.confirm_clear_playlist,
			confirmLabel: t.label_clear_playlist,
			cancelLabel: t.label_cancel,
			tone: 'danger'
		});
		if (ok) clearPlaylist();
	}, [clearPlaylist, confirm, t]);

	const handleMixNow = useCallback(async () => {
		if (audioTracks.length < 2 || crossfadeState.isFading) return;
		if (queuedAudioTrackId) {
			triggerMixNow();
			return;
		}
		const fallbackCurrentId =
			activeAudioTrackId ?? audioTracks.find(track => track.enabled)?.id ?? null;
		if (!fallbackCurrentId) return;
		const next =
			selectNextTrack(audioTracks, fallbackCurrentId, store.audioMixMode) ??
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
		},
		[addTrackToPlaylist]
	);

	return (
		<div className="flex flex-col gap-2">
			<SectionCard
				title={t.section_audio_playlist}
				subtitle={t.hint_auto_mix}
				density="compact"
				action={
					hasPlaylist ? (
						<Button
							size="sm"
							density="compact"
							variant="destructive"
							onClick={() => void handleClearPlaylist()}
						>
							{t.label_clear_playlist}
						</Button>
					) : null
				}
			>
				<div className="flex flex-col gap-3">
					<input
						ref={uploadRef}
						type="file"
						accept="audio/*"
						multiple
						onChange={handleUpload}
						className="hidden"
					/>
					<Button
						size="lg"
						density="compact"
						full
						variant="secondary"
						icon={<Upload size={ICON_SIZE.sm} />}
						onClick={() => uploadRef.current?.click()}
					>
						<span className="flex min-w-0 flex-col items-center leading-tight">
							<span>
								{hasPlaylist
									? t.label_add_more_tracks
									: t.label_add_audio_files}
							</span>
							<span
								className="text-[9px] font-normal"
								style={{ color: UI_COLORS.fgMute }}
							>
								MP3 / WAV / FLAC / OGG
							</span>
						</span>
					</Button>
					<ToggleRow
						label={
							(t as Record<string, string>).label_enable_virtual_folders ??
							'Enable Virtual Folders'
						}
						hint={
							(t as Record<string, string>).hint_virtual_folders ??
							'Scan and show local folders when available.'
						}
						checked={store.virtualFoldersEnabled}
						onChange={store.setVirtualFoldersEnabled}
					/>
					{store.virtualFoldersEnabled &&
					localFolders.audioFolderLoaded &&
					localFolders.audioFiles.length > 0 ? (
						<div
							className="flex flex-col gap-2 rounded-[var(--editor-radius-md)] border p-2"
							style={{
								borderColor: UI_COLORS.border,
								background: UI_COLORS.raised
							}}
						>
							<div className="flex items-center justify-between gap-2">
								<SectionLabel>
									{(t as Record<string, string>).label_virtual_audio_folder ??
										'Virtual Folder'}{' '}
									({localFolders.audioFiles.length})
								</SectionLabel>
								<Button
									size="sm"
									density="compact"
									icon={<FolderPlus size={ICON_SIZE.xs} />}
									onClick={() => void addAllVirtualAudio()}
								>
									Add All
								</Button>
							</div>
							<div className="editor-scroll flex max-h-32 flex-col gap-1 overflow-y-auto pr-1">
								{localFolders.audioFiles.map(fileEntry => (
									<Button
										key={fileEntry.virtualId}
										size="sm"
										density="compact"
										variant="ghost"
										className="justify-between"
										onClick={() =>
											void addVirtualAudio(
												fileEntry.name,
												fileEntry.virtualId
											)
										}
									>
										<span className="truncate">{fileEntry.name}</span>
										<span style={{ color: UI_COLORS.accent }}>Add</span>
									</Button>
								))}
							</div>
						</div>
					) : null}
					{duplicateWarnings.length > 0 ? (
						<div
							className="rounded-[var(--editor-radius-md)] border px-3 py-2 text-[10px]"
							style={{
								borderColor: UI_COLORS.warnBorder,
								background: UI_COLORS.warnSoft,
								color: UI_COLORS.warn
							}}
						>
							<span className="font-semibold">
								{t.label_skipped_duplicates}
							</span>{' '}
							{duplicateWarnings.join(', ')}
						</div>
					) : null}
					{activeTrack ? (
						<div
							className="flex min-w-0 items-center gap-2 rounded-[var(--editor-radius-md)] border px-3 py-2"
							style={{
								borderColor: UI_COLORS.accentBorder,
								background: UI_COLORS.accentSoft
							}}
						>
							<Play size={ICON_SIZE.sm} style={{ color: UI_COLORS.accent }} />
							<div className="min-w-0 flex-1">
								<div
									className="truncate text-[12px] font-semibold"
									style={{ color: UI_COLORS.fg }}
								>
									{cleanTrackName(activeTrack.name)}
								</div>
								{activeTrack.energyScore !== undefined ? (
									<MetricBar
										label={t.label_energy}
										value={activeTrack.energyScore}
									/>
								) : null}
							</div>
							<StatusPill label={t.label_playing} tone="active" />
						</div>
					) : null}
					{queuedTrack ? (
						<div
							className="flex min-w-0 items-center gap-2 rounded-[var(--editor-radius-md)] border px-3 py-2"
							style={{
								borderColor: UI_COLORS.border,
								background: UI_COLORS.raised
							}}
						>
							<Clock size={ICON_SIZE.sm} style={{ color: UI_COLORS.fgMute }} />
							<span
								className="min-w-0 flex-1 truncate text-[12px]"
								style={{ color: UI_COLORS.fg }}
							>
								{cleanTrackName(queuedTrack.name)}
							</span>
							<StatusPill label={t.label_up_next} />
						</div>
					) : null}
					{hasPlaylist ? (
						<div
							className="editor-scroll flex max-h-[15rem] flex-col gap-1 overflow-y-auto rounded-[var(--editor-radius-md)] border p-1"
							style={{
								borderColor: UI_COLORS.border,
								background: UI_COLORS.overlay
							}}
						>
							{audioTracks.map((track, index) => {
								const isActive = track.id === activeAudioTrackId;
								const isQueued = track.id === queuedAudioTrackId;
								const isDragging = dragIndex === index;
								const isDragOver = dragOverIndex === index;
								const isExpanded = expandedTrackId === track.id;
								return (
									<div
										key={track.id}
										draggable={!isExpanded}
										onDragStart={() => handleDragStart(index)}
										onDragOver={event => handleDragOver(event, index)}
										onDrop={() => handleDrop(index)}
										onDragEnd={handleDragEnd}
										className="group flex flex-col gap-1.5 rounded-[var(--editor-radius-sm)] border px-2 py-1.5"
										style={{
											cursor: isExpanded ? 'default' : 'grab',
											opacity: isDragging ? 0.5 : 1,
											borderColor: isActive
												? UI_COLORS.accentBorder
												: isDragOver || isQueued
													? UI_COLORS.borderStrong
													: UI_COLORS.border,
											background: isActive
												? UI_COLORS.accentSoft
												: isQueued || isDragOver
													? UI_COLORS.raised
													: UI_COLORS.panel
										}}
									>
										<div className="flex min-w-0 items-center gap-1.5">
											<span
												className="flex w-5 shrink-0 justify-center text-[10px] tabular-nums"
												style={{
													color: isActive
														? UI_COLORS.accent
														: UI_COLORS.fgMute,
													fontFamily: FONT.mono
												}}
											>
												{isActive ? '▶' : isQueued ? '…' : index + 1}
											</span>
											<button
												type="button"
												onClick={() => void playTrackById(track.id)}
												className="min-w-0 flex-1 truncate bg-transparent p-0 text-left text-[12px] font-medium outline-none"
												style={{
													color: isActive
														? UI_COLORS.accent
														: UI_COLORS.fg
												}}
												title={`${t.label_play_track}: ${track.name}`}
											>
												{cleanTrackName(track.name)}
											</button>
											{track.estimatedBpm ? (
												<span
													className="rounded px-1.5 py-0.5 text-[9px]"
													style={{
														background: UI_COLORS.overlay,
														color: UI_COLORS.fgMute,
														fontFamily: FONT.mono
													}}
												>
													{Math.round(track.estimatedBpm)} BPM
												</span>
											) : null}
											<IconButton
												size="sm"
												density="compact"
												active={isExpanded}
												onClick={() =>
													setExpandedTrackId(
														isExpanded ? null : track.id
													)
												}
												title={t.label_track_settings}
											>
												<Settings size={ICON_SIZE.xs} />
											</IconButton>
											{!isExpanded ? (
												<>
													<IconButton
														size="sm"
														density="compact"
														disabled={index === 0}
														onClick={() => moveTrackUp(index)}
														title={t.label_move_up}
													>
														<ChevronUp size={ICON_SIZE.xs} />
													</IconButton>
													<IconButton
														size="sm"
														density="compact"
														disabled={index === audioTracks.length - 1}
														onClick={() => moveTrackDown(index)}
														title={t.label_move_down}
													>
														<ChevronDown size={ICON_SIZE.xs} />
													</IconButton>
													<IconButton
														size="sm"
														density="compact"
														variant="destructive"
														onClick={() =>
															removeTrackFromPlaylist(track.id)
														}
														title={t.label_remove_track}
													>
														<X size={ICON_SIZE.xs} />
													</IconButton>
												</>
											) : null}
										</div>
										{isExpanded ? (
											<TrackDetailPanel
												track={track}
												onUpdate={patch =>
													store.updateAudioTrack(track.id, patch)
												}
												onQueue={() => void queueTrackById(track.id)}
												onRemove={() =>
													removeTrackFromPlaylist(track.id)
												}
												onPlay={() => void playTrackById(track.id)}
												isQueued={isQueued}
												isActive={isActive}
												labels={{
													format: t.label_format,
													loudness: t.label_loudness,
													duration: t.label_duration,
													intro: t.label_intro_skip,
													mixOut: t.label_mix_out_point,
													playToAnalyze: t.hint_play_track_to_analyze,
													beat: t.label_beat,
													energy: t.label_energy,
													density: t.label_density,
													setAsNext: t.label_set_as_next,
													queuedAsNext: t.label_queued_as_next,
													delete: t.label_delete,
													reanalyze: t.label_reanalyze_track
												}}
											/>
										) : null}
									</div>
								);
							})}
						</div>
					) : null}
					{hasPlaylist ? (
						<div className="grid grid-cols-3 gap-1.5">
							<Button
								size="sm"
								density="compact"
								icon={<SkipBack size={ICON_SIZE.xs} />}
								onClick={() => void playPrevTrack()}
								disabled={enabledTracksCount < 2 || crossfadeState.isFading}
								full
							>
								{t.label_previous_track}
							</Button>
							<Button
								size="sm"
								density="compact"
								variant={effectiveAudioPaused ? 'secondary' : 'primary'}
								icon={
									effectiveAudioPaused ? (
										<Play size={ICON_SIZE.xs} />
									) : (
										<Pause size={ICON_SIZE.xs} />
									)
								}
								onClick={handlePlaybackToggle}
								disabled={!isCapturing}
								full
							>
								{effectiveAudioPaused ? t.resume : t.pause}
							</Button>
							<Button
								size="sm"
								density="compact"
								iconTrailing={<SkipForward size={ICON_SIZE.xs} />}
								onClick={() => void playNextTrack()}
								disabled={enabledTracksCount < 2 || crossfadeState.isFading}
								full
							>
								{t.label_next_track}
							</Button>
						</div>
					) : null}
					{audioTracks.length >= 2 ? (
						<Button
							size="md"
							density="compact"
							full
							variant="secondary"
							onClick={() => void handleMixNow()}
							disabled={!canMixNow}
						>
							{!activeAudioTrackId
								? t.label_start_track_before_mix
								: queuedAudioTrackId
									? t.label_mix_now
									: t.label_auto_mix_now}
						</Button>
					) : null}
					{crossfadeState.isFading ? (
						<div className="flex flex-col gap-1">
							<div className="flex justify-between text-[10px]">
								<span style={{ color: UI_COLORS.accent }}>
									{t.label_crossfading}
								</span>
								<span
									className="tabular-nums"
									style={{ color: UI_COLORS.fgMute, fontFamily: FONT.mono }}
								>
									{Math.round(crossfadeState.progress * 100)}%
								</span>
							</div>
							<div
								className="h-1.5 overflow-hidden rounded-full"
								style={{ background: UI_COLORS.overlay }}
							>
								<div
									className="h-full rounded-full"
									style={{
										width: `${crossfadeState.progress * 100}%`,
										background: UI_COLORS.accent
									}}
								/>
							</div>
						</div>
					) : null}
				</div>
			</SectionCard>

			{isAdvanced && hasPlaylist && audioTracks.length >= 2 ? (
				<SectionCard
					title={t.label_mix_mode}
					subtitle={t.hint_mix_mode}
					density="compact"
				>
					<div className="flex flex-col gap-3">
						<ToggleRow
							label={t.label_auto_mix}
							hint={t.hint_auto_mix}
							checked={store.audioAutoAdvance}
							onChange={store.setAudioAutoAdvance}
						/>
						<div className="grid grid-cols-3 gap-1.5">
							{MIX_MODES.map(mode => {
								const active = store.audioMixMode === mode.id;
								const meta = mixModeMeta[mode.id];
								return (
									<Button
										key={mode.id}
										size="sm"
										density="compact"
										variant={active ? 'primary' : 'secondary'}
										active={active}
										onClick={() => store.setAudioMixMode(mode.id)}
										title={meta.desc}
										full
									>
										<span style={{ fontFamily: FONT.mono }}>
											{mode.icon}
										</span>
										{meta.label}
									</Button>
								);
							})}
						</div>
						<CollapsibleSection
							title={t.label_crossfade_transitions}
							defaultOpen={store.audioCrossfadeEnabled}
							dense
						>
							<div className="flex flex-col gap-3">
								<ToggleRow
									label={t.label_enable_crossfade}
									checked={store.audioCrossfadeEnabled}
									onChange={store.setAudioCrossfadeEnabled}
								/>
								{store.audioCrossfadeEnabled ? (
									<>
										<div className="flex flex-col gap-1.5">
											<SectionLabel>{t.label_style}</SectionLabel>
											<div className="grid grid-cols-2 gap-1.5">
												{TRANSITION_STYLES.map(style => {
													const active = transitionStyle === style;
													const meta = transitionStyleMeta[style];
													return (
														<Button
															key={style}
															size="sm"
															density="compact"
															variant={
																active ? 'primary' : 'secondary'
															}
															active={active}
															onClick={() =>
																setTransitionStyle(style)
															}
															title={meta.desc}
															full
														>
															{meta.label}
														</Button>
													);
												})}
											</div>
											<InfoText>
												{transitionStyleMeta[transitionStyle].desc}
											</InfoText>
										</div>
										<Slider
											label={t.label_duration_seconds}
											value={store.audioCrossfadeSeconds}
											min={0.5}
											max={15}
											step={0.5}
											onChange={store.setAudioCrossfadeSeconds}
											variant="compact"
											formatValue={formatDecimal}
										/>
									</>
								) : null}
							</div>
						</CollapsibleSection>
					</div>
				</SectionCard>
			) : null}

			<SectionCard
				title={t.section_audio_capture}
				subtitle={
					captureMode === 'microphone'
						? t.hint_mobile_mode
						: t.hint_capture_window_audio
				}
				density="compact"
				action={
					<StatusPill
						label={statusLabel[state] ?? t.status_idle}
						tone={statusTone[state] ?? 'default'}
					/>
				}
			>
				<div className="flex flex-col gap-3">
					{state === 'no-audio-track' ? (
						<InfoText>{t.hint_share_tab}</InfoText>
					) : null}
					<div className="grid grid-cols-[1fr_auto] gap-1.5">
						<Button
							size="sm"
							density="compact"
							onClick={() => void startCapture()}
							disabled={isCapturing || state === 'requesting'}
							icon={<FileAudio size={ICON_SIZE.xs} />}
							full
						>
							{state === 'requesting'
								? t.requesting
								: captureMode === 'microphone'
									? t.capture_mic
									: t.capture_desktop}
						</Button>
						<Button
							size="sm"
							density="compact"
							variant="destructive"
							onClick={stopCapture}
							disabled={!isCapturing}
						>
							{t.stop}
						</Button>
					</div>
				</div>
			</SectionCard>

			<SectionCard
				title={t.section_audio_transport}
				subtitle={isFile ? getFileName() : statusLabel[state]}
				density="compact"
				action={
					<IconButton
						size="sm"
						density="compact"
						onClick={onReset}
						title={t.reset_tab}
					>
						<RotateCcw size={ICON_SIZE.xs} />
					</IconButton>
				}
			>
				<div className="flex flex-col gap-3">
					{isFile ? (
						<>
							<div className="flex flex-col gap-1">
								<input
									type="range"
									min={0}
									max={duration || 100}
									step={0.5}
									value={currentTime}
									onChange={event => seek(Number(event.target.value))}
									className="h-1 w-full cursor-pointer accent-[var(--lwag-accent)]"
								/>
								<div
									className="flex justify-between text-[11px] tabular-nums"
									style={{
										color: UI_COLORS.fgMute,
										fontFamily: FONT.mono
									}}
								>
									<span>{formatTime(currentTime)}</span>
									<span>{formatTime(duration)}</span>
								</div>
							</div>
							{!hasPlaylist ? (
								<Button
									size="sm"
									density="compact"
									variant={effectiveAudioPaused ? 'secondary' : 'primary'}
									icon={
										effectiveAudioPaused ? (
											<Play size={ICON_SIZE.xs} />
										) : (
											<Pause size={ICON_SIZE.xs} />
										)
									}
									onClick={handlePlaybackToggle}
									full
								>
									{effectiveAudioPaused ? t.resume : t.pause}
								</Button>
							) : null}
							<Slider
								label={t.label_volume}
								value={fileVolume}
								min={0}
								max={1}
								step={0.01}
								onChange={setFileVolume}
								variant="compact"
								formatValue={formatDecimal}
							/>
							<ToggleRow
								label={t.label_loop}
								checked={fileLoop}
								onChange={setFileLoop}
							/>
						</>
					) : null}
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						<div className="flex flex-col gap-1.5">
							<InfoText>{t.hint_pause_audio_only}</InfoText>
							<Button
								size="sm"
								density="compact"
								icon={<Volume2 size={ICON_SIZE.xs} />}
								onClick={toggleAudioOnlyPause}
							>
								{effectiveAudioPaused
									? t.resume_audio_only
									: t.pause_audio_only}
							</Button>
						</div>
						<div className="flex flex-col gap-1.5">
							<InfoText>{t.hint_pause_all}</InfoText>
							<Button
								size="sm"
								density="compact"
								variant="warning"
								onClick={togglePauseAll}
							>
								{store.motionPaused ? t.resume_all : t.pause_all}
							</Button>
						</div>
					</div>
					{isAdvanced ? (
						<ToggleRow
							label={t.label_media_session}
							hint={t.hint_media_session}
							checked={store.mediaSessionEnabled}
							onChange={store.setMediaSessionEnabled}
						/>
					) : null}
				</div>
			</SectionCard>

			{isAdvanced ? (
				<SectionCard
					title={t.section_audio_analysis}
					subtitle={t.hint_fft_size}
					density="compact"
				>
					<div className="flex flex-col gap-3">
						<div className="flex flex-col gap-1.5">
							<SectionLabel>{t.label_fft_presets}</SectionLabel>
							<div className="grid grid-cols-3 gap-1.5">
								{FFT_PRESETS.map(preset => (
									<Button
										key={preset.id}
										size="sm"
										density="compact"
										variant={
											activeFftPreset?.id === preset.id
												? 'primary'
												: 'secondary'
										}
										active={activeFftPreset?.id === preset.id}
										onClick={() => store.setFftSize(preset.fftSize)}
										full
									>
										{preset.label}
									</Button>
								))}
							</div>
							<InfoText>
								{activeFftPreset?.id === 'fast' && t.hint_fft_fast}
								{activeFftPreset?.id === 'balanced' &&
									t.hint_fft_balanced}
								{activeFftPreset?.id === 'detailed' &&
									t.hint_fft_detailed}
								{!activeFftPreset && t.hint_fft_custom}
							</InfoText>
						</div>
						<div className="flex flex-col gap-1.5">
							<SectionLabel>{t.label_fft_size}</SectionLabel>
							<Select
								value={String(store.fftSize)}
								onChange={value => store.setFftSize(Number(value))}
								options={fftSizeOptions}
								size="sm"
								density="compact"
								full
							/>
						</div>
						<CollapsibleSection
							title={t.section_audio_routing}
							defaultOpen={false}
							dense
						>
							<div className="flex flex-col gap-3">
								<InfoText>{t.hint_auto_channel_priority}</InfoText>
								<Slider
									label={t.label_auto_kick_threshold}
									value={store.audioAutoKickThreshold}
									{...AUDIO_ROUTING_RANGES.autoKickThreshold}
									onChange={store.setAudioAutoKickThreshold}
									variant="compact"
									formatValue={formatDecimal}
								/>
								<Slider
									label={t.label_auto_switch_hold}
									value={store.audioAutoSwitchHoldMs}
									{...AUDIO_ROUTING_RANGES.autoSwitchHoldMs}
									onChange={store.setAudioAutoSwitchHoldMs}
									unit="ms"
									variant="compact"
									formatValue={formatInteger}
								/>
							</div>
						</CollapsibleSection>
					</div>
				</SectionCard>
			) : null}

			<Button
				size="sm"
				density="compact"
				variant="secondary"
				icon={<RefreshCw size={ICON_SIZE.xs} />}
				onClick={onReset}
			>
				{t.reset_tab}
			</Button>
		</div>
	);
}
