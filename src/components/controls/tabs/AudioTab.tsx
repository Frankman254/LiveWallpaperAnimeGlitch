import { useCallback, useEffect, useRef, useState } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioContext } from '@/context/AudioDataContext';
import { useT } from '@/lib/i18n';
import { AUDIO_ROUTING_RANGES } from '@/config/ranges';
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme';
import SliderControl from '../SliderControl';
import SectionDivider from '../ui/SectionDivider';
import ResetButton from '../ui/ResetButton';
import EnumButtons from '../ui/EnumButtons';
import CollapsibleSection from '../ui/CollapsibleSection';

const FFT_SIZES = ['512', '1024', '2048', '4096'];
const FFT_PRESETS = [
	{ id: 'fast', label: 'Fast', fftSize: 512 },
	{ id: 'balanced', label: 'Balanced', fftSize: 2048 },
	{ id: 'detailed', label: 'Detailed', fftSize: 4096 }
] as const;

const MIX_MODES = [
	{
		id: 'sequential' as const,
		label: 'Sequential',
		icon: '→',
		desc: 'Play tracks in order'
	},
	{
		id: 'energy-match' as const,
		label: 'Match',
		icon: '≈',
		desc: 'Pick tracks with similar energy'
	},
	{
		id: 'contrast' as const,
		label: 'Contrast',
		icon: '⇌',
		desc: 'Pick tracks with different energy'
	}
];

const TRANSITION_STYLES = [
	{ id: 'linear' as const, label: 'Linear', desc: 'Equal power crossfade' },
	{ id: 'smooth' as const, label: 'Smooth', desc: 'S-curve for smoother drops' },
	{ id: 'quick' as const, label: 'Quick', desc: 'Fast attack, slow release' }
];

function formatTime(s: number): string {
	if (!isFinite(s) || s < 0) return '0:00';
	const m = Math.floor(s / 60);
	const sec = Math.floor(s % 60);
	return `${m}:${sec.toString().padStart(2, '0')}`;
}

/** Strip common audio file extensions for cleaner display */
function cleanTrackName(name: string): string {
	return name.replace(/\.(mp3|wav|ogg|flac|m4a|aac|webm|opus)$/i, '');
}

export default function AudioTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const store = useWallpaperStore();
	const {
		startCapture,
		startFileCapture,
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
		playTrackById,
		playNextTrack,
		playPrevTrack,
		triggerMixNow,
		getIsCrossfading,
		getCrossfadeProgress,
		transitionStyle,
		setTransitionStyle
	} = useAudioContext();

	const uploadRef = useRef<HTMLInputElement>(null);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [crossfadeState, setCrossfadeState] = useState({ isFading: false, progress: 0 });
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);

	const audioTracks = store.audioTracks;
	const activeAudioTrackId = store.activeAudioTrackId;
	const queuedAudioTrackId = store.queuedAudioTrackId;

	const state = store.audioCaptureState;
	const theme = EDITOR_THEME_CLASSES[store.editorTheme];
	const isFile = captureMode === 'file' && state === 'active';
	const isCapturing = state === 'active';
	const audioPaused = store.audioPaused;
	const motionPaused = store.motionPaused;
	const activeFftPreset =
		FFT_PRESETS.find(preset => preset.fftSize === store.fftSize) ?? null;

	useEffect(() => {
		if (!isFile) return;
		const id = setInterval(() => {
			setCurrentTime(getCurrentTime());
			setDuration(getDuration());
			setCrossfadeState({
				isFading: getIsCrossfading(),
				progress: getCrossfadeProgress()
			});
		}, 100);
		return () => clearInterval(id);
	}, [getCurrentTime, getDuration, getIsCrossfading, getCrossfadeProgress, isFile]);

	// ── Upload handler: processes ALL selected files ──────────────────────
	const handleUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(event.target.files ?? []);
			if (files.length === 0) return;
			for (const file of files) {
				void addTrackToPlaylist(file);
			}
			event.target.value = '';
		},
		[addTrackToPlaylist]
	);

	// ── Drag-to-reorder handlers ─────────────────────────────────────────
	const handleDragStart = useCallback((index: number) => {
		setDragIndex(index);
	}, []);

	const handleDragOver = useCallback(
		(e: React.DragEvent, index: number) => {
			e.preventDefault();
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

	// ── Move track with buttons (fallback for non-drag) ──────────────────
	const moveTrackUp = useCallback(
		(index: number) => {
			if (index > 0) store.moveAudioTrack(index, index - 1);
		},
		[store]
	);

	const moveTrackDown = useCallback(
		(index: number) => {
			if (index < audioTracks.length - 1)
				store.moveAudioTrack(index, index + 1);
		},
		[store, audioTracks.length]
	);

	function toggleAudioOnlyPause() {
		const nextPaused = !audioPaused;
		store.setAudioPaused(nextPaused);
		if (isFile) {
			if (nextPaused) pauseFileForSystem();
			else resumeFileFromSystem();
		}
	}

	function togglePauseAll() {
		store.setMotionPaused(!motionPaused);
	}

	// ── Single-file legacy capture (for desktop/mic modes) ───────────────
	function handleLegacySingleFile(
		event: React.ChangeEvent<HTMLInputElement>
	) {
		const file = event.target.files?.[0];
		if (!file) return;
		void startFileCapture(file);
		event.target.value = '';
	}

	const statusLabel: Record<string, string> = {
		idle: t.status_idle,
		requesting: t.status_requesting,
		active: captureMode === 'file' ? t.status_file : t.status_active,
		denied: t.status_denied,
		error: t.status_error,
		'no-audio-track': t.status_no_audio_track
	};
	const statusColor: Record<string, string> = {
		idle: 'text-gray-500',
		requesting: 'text-yellow-400',
		active: 'text-green-400',
		denied: 'text-red-400',
		error: 'text-red-400',
		'no-audio-track': 'text-orange-400'
	};

	const activeTrack = audioTracks.find(t => t.id === activeAudioTrackId);
	const queuedTrack = audioTracks.find(t => t.id === queuedAudioTrackId);
	const hasPlaylist = audioTracks.length > 0;

	return (
		<>
			{/* ═══ CAPTURE SOURCE ═══ */}
			<SectionDivider label={t.section_audio_capture} />
			<div className="flex flex-col gap-1">
				<span
					className={`text-xs ${statusColor[state] ?? 'text-gray-500'}`}
				>
					{statusLabel[state] ?? t.status_idle}
				</span>
				{captureMode !== 'microphone' && (
					<span className="text-xs text-gray-500">
						{t.hint_capture_window_audio}
					</span>
				)}
				{state === 'no-audio-track' && (
					<span className="text-xs text-gray-500">
						{t.hint_share_tab}
					</span>
				)}
				{captureMode === 'microphone' && (
					<span className="text-xs text-purple-400">
						{t.hint_mobile_mode}
					</span>
				)}
			</div>

			<div className="flex gap-2">
				<button
					onClick={startCapture}
					disabled={isCapturing || state === 'requesting'}
					className="flex-1 rounded border border-cyan-700 px-3 py-1.5 text-xs text-cyan-400 transition-colors hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
				>
					{state === 'requesting'
						? t.requesting
						: captureMode === 'microphone'
							? t.capture_mic
							: t.capture_desktop}
				</button>
				<button
					onClick={stopCapture}
					disabled={!isCapturing}
					className="rounded border border-red-800 px-3 py-1.5 text-xs text-red-400 transition-colors hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-40"
				>
					{t.stop}
				</button>
			</div>

			{/* ═══ MULTI-TRACK PLAYLIST ═══ */}
			<SectionDivider label="Playlist" />

			{/* Upload button — always visible */}
			<button
				onClick={() => uploadRef.current?.click()}
				className="w-full rounded-lg border-2 border-dashed border-purple-600/50 px-3 py-2.5 text-xs text-purple-300 transition-all hover:border-purple-400 hover:bg-purple-500/5 hover:text-purple-200 active:scale-[0.98]"
			>
				<span className="flex items-center justify-center gap-2">
					<span className="text-base leading-none">+</span>
					<span>
						{hasPlaylist
							? 'Add more tracks'
							: 'Add audio files to playlist'}
					</span>
				</span>
				<span className="mt-0.5 block text-[10px] text-gray-500">
					Select one or multiple MP3s / audio files
				</span>
			</button>
			<input
				ref={uploadRef}
				type="file"
				accept="audio/*"
				multiple
				onChange={handleUpload}
				className="hidden"
			/>

			{hasPlaylist && (
				<>
					{/* ── Now Playing strip ──────────────────────────── */}
					{activeTrack && (
						<div className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-3 py-2">
							<span className="text-sm leading-none text-cyan-400">
								▶
							</span>
							<div className="min-w-0 flex-1">
								<div className="truncate text-xs font-medium text-cyan-200">
									{cleanTrackName(activeTrack.name)}
								</div>
								{activeTrack.energyScore !== undefined && (
									<div className="mt-0.5 flex items-center gap-1">
										<span className="text-[10px] text-gray-500">
											Energy
										</span>
										<div className="h-1 w-16 overflow-hidden rounded-full bg-gray-700">
											<div
												className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
												style={{
													width: `${Math.round((activeTrack.energyScore ?? 0) * 100)}%`
												}}
											/>
										</div>
									</div>
								)}
							</div>
							<span className="text-[10px] uppercase tracking-wider text-cyan-600">
								Playing
							</span>
						</div>
					)}

					{/* ── Queued track strip ──────────────────────────── */}
					{queuedTrack && (
						<div className="flex items-center gap-2 rounded-lg border border-purple-500/25 bg-purple-500/5 px-3 py-1.5">
							<span className="text-xs leading-none text-purple-400">
								⏳
							</span>
							<div className="min-w-0 flex-1 truncate text-xs text-purple-300">
								{cleanTrackName(queuedTrack.name)}
							</div>
							<span className="text-[10px] uppercase tracking-wider text-purple-600">
								Up Next
							</span>
						</div>
					)}

					{/* ── Track list ──────────────────────────────────── */}
					<div className="flex flex-col gap-0.5 max-h-[22rem] overflow-y-auto rounded-lg border border-gray-700/50 bg-black/20 p-1">
						{audioTracks.map((track, i) => {
							const isActive = track.id === activeAudioTrackId;
							const isQueued = track.id === queuedAudioTrackId;
							const isDragging = dragIndex === i;
							const isDragOver = dragOverIndex === i;
							const isExpanded = expandedTrackId === track.id;

							return (
								<div
									key={track.id}
									draggable={!isExpanded}
									onDragStart={() => handleDragStart(i)}
									onDragOver={e => handleDragOver(e, i)}
									onDrop={() => handleDrop(i)}
									onDragEnd={handleDragEnd}
									className={`group flex flex-col gap-2 rounded-md border px-2 py-1.5 transition-all ${
										isExpanded ? 'cursor-default border-purple-500/40 bg-purple-500/10' :
										isDragging
											? 'cursor-grab border-purple-400/40 bg-purple-500/10 opacity-50'
											: isDragOver
												? 'cursor-grab border-purple-400/60 bg-purple-500/10'
												: isActive
													? 'cursor-grab border-cyan-500/40 bg-cyan-500/8 text-cyan-200'
													: isQueued
														? 'cursor-grab border-purple-500/30 bg-purple-500/5 text-purple-200'
														: 'cursor-grab border-transparent text-gray-300 hover:border-gray-600 hover:bg-white/[0.02]'
									}`}
								>
									<div className="flex items-center gap-1.5">
										{/* Drag handle + number */}
										<span className="flex w-5 shrink-0 items-center justify-center text-gray-600 group-hover:text-gray-400 select-none">
											{isActive ? (
												<span className="text-cyan-400 text-[10px]">▶</span>
											) : isQueued ? (
												<span className="text-purple-400 text-[10px]">⏳</span>
											) : (
												<span className="text-[10px]">{i + 1}</span>
											)}
										</span>

										{/* Track name — click to play */}
										<button
											onClick={() => void playTrackById(track.id)}
											className="min-w-0 flex-1 truncate text-left transition-colors hover:text-white text-xs"
											title={`Play: ${track.name}`}
										>
											{cleanTrackName(track.name)}
										</button>
										
										{/* BPM Badge (if available) */}
										{track.estimatedBpm && (
											<span className="text-[10px] text-gray-500 opacity-60 bg-black/40 px-1 rounded">
												{Math.round(track.estimatedBpm)} BPM
											</span>
										)}

										{/* Edit/Settings Button */}
										<button
											onClick={() => setExpandedTrackId(isExpanded ? null : track.id)}
											className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] transition-all ${
												isExpanded ? 'bg-purple-500/20 text-purple-300' : 'text-gray-500 hover:bg-gray-700/50 hover:text-white'
											}`}
											title="Track Settings & Trim"
										>
											⚙️
										</button>

										{/* Reorder arrows */}
										{!isExpanded && (
											<div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
												<button
													onClick={() => moveTrackUp(i)}
													disabled={i === 0}
													className="rounded px-1 text-[10px] text-gray-500 hover:text-white disabled:opacity-20"
													title="Move up"
												>↑</button>
												<button
													onClick={() => moveTrackDown(i)}
													disabled={i === audioTracks.length - 1}
													className="rounded px-1 text-[10px] text-gray-500 hover:text-white disabled:opacity-20"
													title="Move down"
												>↓</button>
											</div>
										)}

										{/* Remove */}
										{!isExpanded && (
											<button
												onClick={() => removeTrackFromPlaylist(track.id)}
												className="shrink-0 rounded px-1 text-red-500/60 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
												title="Remove track"
											>✕</button>
										)}
									</div>
									
									{/* ── Per-track Editor ── */}
									{isExpanded && (
										<div className="flex flex-col gap-2 rounded bg-black/40 p-2 mt-1 border border-purple-500/20 text-[10px]">
											<div className="flex justify-between text-gray-400 border-b border-gray-700/50 pb-1 mb-1">
												<span>Format: {track.mimeType.split('/')[1] || 'audio'}</span>
												<span>Loudness: {track.loudnessDb !== undefined ? `${track.loudnessDb} dB` : '??'}</span>
												<span>Duration: {track.durationMs ? formatTime(track.durationMs / 1000) : '??'}</span>
											</div>
											
											{/* Content Bounds Sliders */}
											{track.durationMs ? (
												<>
													<div className="flex flex-col gap-0.5">
														<div className="flex justify-between text-gray-400">
															<span>Intro Skip (Starts at content)</span>
															<span>{formatTime((track.contentStartMs ?? 0) / 1000)}</span>
														</div>
														<input
															type="range"
															min={0}
															max={(track.durationMs / 1000) * 0.4}
															step={0.1}
															value={(track.contentStartMs ?? 0) / 1000}
															onChange={e => store.updateAudioTrack(track.id, { contentStartMs: Number(e.target.value) * 1000 })}
															className="h-1 w-full accent-cyan-500 bg-gray-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
														/>
													</div>
													
													<div className="flex flex-col gap-0.5 mt-1">
														<div className="flex justify-between text-gray-400">
															<span>Mix Out Point (Crossfade starts here)</span>
															<span className={((track.mixOutStartMs ?? 0) <= 0) ? 'text-red-400' : ''}>
																{formatTime((track.mixOutStartMs ?? 0) / 1000)}
															</span>
														</div>
														<input
															type="range"
															min={(track.durationMs / 1000) * 0.5}
															max={track.durationMs / 1000}
															step={0.1}
															value={(track.mixOutStartMs ?? track.durationMs) / 1000}
															onChange={e => store.updateAudioTrack(track.id, { mixOutStartMs: Number(e.target.value) * 1000 })}
															className="h-1 w-full accent-purple-500 bg-gray-700 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
														/>
													</div>
												</>
											) : (
												<div className="text-gray-500 italic">Play track once to analyze duration and bounds.</div>
											)}
											
											{/* Indicators */}
											<div className="flex items-center gap-4 mt-1 border-t border-gray-700/50 pt-2">
												{track.beatStrength !== undefined && (
													<div className="flex flex-col gap-1 flex-1">
														<span className="text-gray-500">Beat</span>
														<div className="h-1 w-full overflow-hidden rounded-full bg-gray-700">
															<div className="h-full bg-purple-400" style={{ width: `${Math.min(100, (track.beatStrength ?? 0) * 100)}%` }} />
														</div>
													</div>
												)}
												{track.energyScore !== undefined && (
													<div className="flex flex-col gap-1 flex-1">
														<span className="text-gray-500">Energy</span>
														<div className="h-1 w-full overflow-hidden rounded-full bg-gray-700">
															<div className="h-full bg-cyan-400" style={{ width: `${Math.min(100, (track.energyScore ?? 0) * 100)}%` }} />
														</div>
													</div>
												)}
												{track.densityScore !== undefined && (
													<div className="flex flex-col gap-1 flex-1">
														<span className="text-gray-500">Density</span>
														<div className="h-1 w-full overflow-hidden rounded-full bg-gray-700">
															<div className="h-full bg-blue-400" style={{ width: `${Math.min(100, (track.densityScore ?? 0) * 100)}%` }} />
														</div>
													</div>
												)}
											</div>
											
											<div className="flex justify-between mt-1 items-end">
												<button
													onClick={() => removeTrackFromPlaylist(track.id)}
													className="rounded border border-red-900/50 bg-red-900/20 px-2 py-1 text-[10px] text-red-400 transition-colors hover:bg-red-800/40"
												>
													Delete Track
												</button>
												<button
													onClick={() => {
														// Re-analysis currently happens implicitly via IndexedDB + context
														// For now, this is a placeholder or could just play it to force rebuild
														void playTrackById(track.id);
													}}
													className="rounded border border-gray-700 px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700"
												>
													Re-analyze / Reset
												</button>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</div>

					{/* ── Playlist controls row ───────────────────────── */}
					<div className="flex gap-1">
						<button
							onClick={() => void playPrevTrack()}
							disabled={audioTracks.length < 2 || crossfadeState.isFading}
							className="flex-1 rounded-md border border-cyan-800/60 px-2 py-1.5 text-xs text-cyan-400 transition-colors hover:border-cyan-500 hover:bg-cyan-500/5 disabled:opacity-30"
						>
							⏮ Prev
						</button>
						<button
							onClick={isPaused ? resumeCapture : pauseCapture}
							disabled={!isCapturing}
							className={`flex-[1.5] rounded-md border px-2 py-1.5 text-xs transition-colors ${
								isPaused
									? 'border-green-700 text-green-400 hover:border-green-500 hover:bg-green-500/5'
									: 'border-yellow-700/60 text-yellow-400 hover:border-yellow-500 hover:bg-yellow-500/5'
							} disabled:opacity-30`}
						>
							{isPaused ? '▶ Play' : '⏸ Pause'}
						</button>
						{queuedAudioTrackId && !crossfadeState.isFading ? (
							<button
								onClick={triggerMixNow}
								className="flex-[1.5] rounded-md border border-purple-500/60 px-2 py-1.5 text-xs font-medium text-purple-300 transition-colors hover:border-purple-400 hover:bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.15)] animate-pulse"
							>
								⚡ Mix Now
							</button>
						) : (
							<button
								onClick={() => void playNextTrack()}
								disabled={audioTracks.length < 2 || crossfadeState.isFading}
								className="flex-1 rounded-md border border-cyan-800/60 px-2 py-1.5 text-xs text-cyan-400 transition-colors hover:border-cyan-500 hover:bg-cyan-500/5 disabled:opacity-30"
							>
								Next ⏭
							</button>
						)}
					</div>

					{/* ── Crossfade Progress Indicator ──────────────────── */}
					{crossfadeState.isFading && (
						<div className="flex flex-col gap-1 px-1">
							<div className="flex justify-between text-[10px] text-purple-400 font-medium">
								<span>Crossfading...</span>
								<span>{Math.round(crossfadeState.progress * 100)}%</span>
							</div>
							<div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800 border border-gray-700">
								<div
									className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
									style={{ width: `${crossfadeState.progress * 100}%` }}
								/>
							</div>
						</div>
					)}

					{/* ── Auto-advance toggle ─────────────────────────── */}
					<label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
						<input
							type="checkbox"
							checked={store.audioAutoAdvance}
							onChange={e =>
								store.setAudioAutoAdvance(e.target.checked)
							}
							className="accent-cyan-500"
						/>
						Auto-advance to next track
					</label>
				</>
			)}

			{/* ═══ MIX MODE ═══ */}
			{hasPlaylist && audioTracks.length >= 2 && (
				<>
					<SectionDivider label="Mix Mode" />
					<div className="flex flex-col gap-2">
						<span className="text-[10px] text-gray-500">
							How the next track is selected when auto-advancing
						</span>
						<div className="grid grid-cols-3 gap-1">
							{MIX_MODES.map(mode => {
								const isActiveMode =
									store.audioMixMode === mode.id;
								return (
									<button
										key={mode.id}
										onClick={() =>
											store.setAudioMixMode(mode.id)
										}
										className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-xs transition-all ${
											isActiveMode
												? 'border-cyan-500/60 bg-cyan-500/12 text-cyan-300 shadow-sm shadow-cyan-500/10'
												: 'border-gray-700/60 text-gray-400 hover:border-gray-500 hover:bg-white/[0.02]'
										}`}
										title={mode.desc}
									>
										<span
											className={`text-base leading-none ${isActiveMode ? 'text-cyan-400' : 'text-gray-500'}`}
										>
											{mode.icon}
										</span>
										<span className="font-medium">
											{mode.label}
										</span>
									</button>
								);
							})}
						</div>

						{/* Crossfade settings */}
						<CollapsibleSection
							label="Crossfade Transitions"
							defaultOpen={store.audioCrossfadeEnabled}
						>
							<div className="flex flex-col gap-3 pt-1">
								<label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
									<input
										type="checkbox"
										checked={store.audioCrossfadeEnabled}
										onChange={e =>
											store.setAudioCrossfadeEnabled(
												e.target.checked
											)
										}
										className="accent-purple-500"
									/>
									Enable crossfade between tracks
								</label>

								{store.audioCrossfadeEnabled && (
									<>
										<div className="flex flex-col gap-1">
											<span className="text-[10px] text-purple-400 uppercase tracking-wider font-medium">Style</span>
											<div className="flex gap-1">
												{TRANSITION_STYLES.map(style => {
													const isActive = transitionStyle === style.id;
													return (
														<button
															key={style.id}
															onClick={() => setTransitionStyle(style.id)}
															className={`flex-1 rounded border px-1 py-1.5 text-[10px] transition-all ${
																isActive
																	? 'border-purple-500/80 bg-purple-500/15 text-purple-200 shadow-sm shadow-purple-500/20'
																	: 'border-gray-700/80 text-gray-400 hover:border-gray-500 hover:bg-white/[0.03]'
															}`}
															title={style.desc}
														>
															{style.label}
														</button>
													);
												})}
											</div>
											<span className="text-[9px] text-gray-500 mt-0.5">
												{TRANSITION_STYLES.find(s => s.id === transitionStyle)?.desc}
											</span>
										</div>

										<SliderControl
											label="Duration (s)"
											value={store.audioCrossfadeSeconds}
											min={0.5}
											max={15}
											step={0.5}
											onChange={store.setAudioCrossfadeSeconds}
										/>
									</>
								)}
							</div>
						</CollapsibleSection>
					</div>
				</>
			)}

			{/* ═══ TRANSPORT ═══ */}
			{isFile && (
				<>
					<SectionDivider label={t.section_audio_transport} />
					<div className="text-xs text-cyan-500 truncate">
						{getFileName()}
					</div>

					<div className="flex flex-col gap-1">
						<input
							type="range"
							min={0}
							max={duration || 100}
							step={0.5}
							value={currentTime}
							onChange={event =>
								seek(Number(event.target.value))
							}
							className={`h-1 w-full cursor-pointer ${theme.controlAccent}`}
						/>
						<div className="flex justify-between text-xs text-gray-500">
							<span>{formatTime(currentTime)}</span>
							<span>{formatTime(duration)}</span>
						</div>
					</div>

					{/* Only show dedicated pause if no playlist (playlist has its own) */}
					{!hasPlaylist && (
						<button
							onClick={
								isPaused ? resumeCapture : pauseCapture
							}
							className="rounded border border-cyan-700 px-3 py-1.5 text-xs text-cyan-400 transition-colors hover:border-cyan-400"
						>
							{isPaused ? t.resume : t.pause}
						</button>
					)}

					<SliderControl
						label={t.label_volume}
						value={fileVolume}
						min={0}
						max={1}
						step={0.01}
						onChange={setFileVolume}
					/>
					<div className="flex flex-col gap-1">
						<span className="text-xs text-cyan-400">
							{t.label_loop}
						</span>
						<button
							onClick={() => setFileLoop(!fileLoop)}
							className={`rounded border px-3 py-1.5 text-xs transition-colors ${
								fileLoop
									? 'border-cyan-500 text-cyan-300'
									: 'border-cyan-800 text-cyan-400 hover:border-cyan-500'
							}`}
						>
							{fileLoop ? t.label_enabled : t.label_loop}
						</button>
					</div>
				</>
			)}

			{/* ═══ MOTION CONTROLS ═══ */}
			<SectionDivider label={t.section_audio_motion} />
			<div className="flex flex-col gap-1">
				<span className="text-xs text-gray-500">
					{t.hint_pause_audio_only}
				</span>
				<button
					onClick={toggleAudioOnlyPause}
					className="rounded border border-cyan-700 px-3 py-1.5 text-xs text-cyan-400 transition-colors hover:border-cyan-400"
				>
					{audioPaused ? t.resume_audio_only : t.pause_audio_only}
				</button>
			</div>
			<div className="flex flex-col gap-1">
				<span className="text-xs text-gray-500">
					{t.hint_pause_all}
				</span>
				<button
					onClick={togglePauseAll}
					className="rounded border border-amber-700 px-3 py-1.5 text-xs text-amber-300 transition-colors hover:border-amber-400"
				>
					{motionPaused ? t.resume_all : t.pause_all}
				</button>
			</div>

			{/* ═══ ANALYSIS ═══ */}
			<SectionDivider label={t.section_audio_analysis} />
			<div className="flex flex-col gap-1">
				<span className="text-xs text-cyan-400">
					{t.label_fft_presets}
				</span>
				<div className="flex flex-wrap gap-1">
					{FFT_PRESETS.map(preset => (
						<button
							key={preset.id}
							onClick={() => store.setFftSize(preset.fftSize)}
							className={`rounded border px-2 py-0.5 text-xs transition-colors ${
								activeFftPreset?.id === preset.id
									? 'border-cyan-500 bg-cyan-500 text-black'
									: 'border-cyan-800 bg-transparent text-cyan-400 hover:border-cyan-500'
							}`}
						>
							{preset.label}
						</button>
					))}
				</div>
				<span className="text-xs text-gray-500">
					{activeFftPreset?.id === 'fast' && t.hint_fft_fast}
					{activeFftPreset?.id === 'balanced' &&
						t.hint_fft_balanced}
					{activeFftPreset?.id === 'detailed' &&
						t.hint_fft_detailed}
					{!activeFftPreset && t.hint_fft_custom}
				</span>
			</div>

			<div className="flex flex-col gap-1">
				<span className="text-xs text-cyan-400">
					{t.label_fft_size}
				</span>
				<EnumButtons<string>
					options={FFT_SIZES}
					value={String(store.fftSize)}
					onChange={value => store.setFftSize(Number(value))}
				/>
				<span className="text-xs text-gray-500">
					{t.hint_fft_size}
				</span>
			</div>
			<CollapsibleSection
				label={t.section_audio_routing}
				defaultOpen={false}
			>
				<span className="text-xs text-gray-500">
					{t.hint_auto_channel_priority}
				</span>
				<SliderControl
					label={t.label_auto_kick_threshold}
					value={store.audioAutoKickThreshold}
					{...AUDIO_ROUTING_RANGES.autoKickThreshold}
					onChange={store.setAudioAutoKickThreshold}
				/>
				<SliderControl
					label={t.label_auto_switch_hold}
					value={store.audioAutoSwitchHoldMs}
					{...AUDIO_ROUTING_RANGES.autoSwitchHoldMs}
					onChange={store.setAudioAutoSwitchHoldMs}
					unit="ms"
				/>
			</CollapsibleSection>

			<SectionDivider />
			<ResetButton label={t.reset_tab} onClick={onReset} />
		</>
	);
}
