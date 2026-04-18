import { useCallback, useEffect, useRef, useState } from 'react';
import {
	SkipBack,
	SkipForward,
	Play,
	Pause,
	ChevronUp,
	ChevronDown,
	Music2
} from 'lucide-react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioContext } from '@/context/useAudioContext';
import { EDITOR_THEME_CLASSES, getScopedEditorThemeColorVars, getEditorRadiusVars } from './editorTheme';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';

/**
 * MediaDock — bottom media player bar
 * Collapsed: minimal (play/pause + track name)
 * Expanded: full controls with precise timeline
 */
export default function MediaDock() {
	const store = useWallpaperStore();
	const {
		captureMode,
		isPaused,
		pauseFileForSystem,
		resumeFileFromSystem,
		seek,
		getCurrentTime,
		getDuration,
		getFileName,
		playNextTrack,
		playPrevTrack
	} = useAudioContext();

	const [expanded, setExpanded] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [seeking, setSeeking] = useState(false);
	const [seekValue, setSeekValue] = useState(0);
	const rafRef = useRef<number | null>(null);

	const isFileMode = captureMode === 'file';
	const effectivelyPaused =
		captureMode === 'file' ? isPaused || store.audioPaused : store.audioPaused;

	// Poll current time from audio engine
	useEffect(() => {
		if (!isFileMode) return;

		function tick() {
			const t = getCurrentTime();
			const d = getDuration();
			if (!seeking) {
				setCurrentTime(t);
				setSeekValue(t);
			}
			setDuration(d);
			rafRef.current = requestAnimationFrame(tick);
		}

		rafRef.current = requestAnimationFrame(tick);
		return () => {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
		};
	}, [isFileMode, getCurrentTime, getDuration, seeking]);

	function togglePlay() {
		const nextPaused = !effectivelyPaused;
		store.setAudioPaused(nextPaused);
		if (captureMode === 'file') {
			if (nextPaused) pauseFileForSystem();
			else resumeFileFromSystem();
		}
	}

	function handleSeekStart() {
		setSeeking(true);
	}

	function handleSeekChange(e: React.ChangeEvent<HTMLInputElement>) {
		setSeekValue(parseFloat(e.target.value));
	}

	function handleSeekEnd() {
		seek(seekValue);
		setCurrentTime(seekValue);
		setSeeking(false);
	}

	function fmt(sec: number): string {
		if (!isFinite(sec) || sec < 0) return '0:00';
		const m = Math.floor(sec / 60);
		const s = Math.floor(sec % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	const theme = EDITOR_THEME_CLASSES[store.editorTheme];
	const backgroundPalette = useBackgroundPalette();
	const themeVars = getScopedEditorThemeColorVars(
		store.editorThemeColorSource,
		backgroundPalette,
		store.editorTheme,
		{
			accent: store.editorManualAccentColor,
			secondary: store.editorManualSecondaryColor,
			backdrop: store.editorManualBackdropColor,
			textPrimary: store.editorManualTextPrimaryColor,
			textSecondary: store.editorManualTextSecondaryColor
		},
		{
			backdropOpacity: store.editorManualBackdropOpacity,
			blurPx: store.editorManualBlurPx,
			surfaceOpacity: store.editorManualSurfaceOpacity,
			itemOpacity: store.editorManualItemOpacity
		}
	);
	const radiusVars = getEditorRadiusVars(store.editorCornerRadius);

	// Active track name
	const activeTrack = store.audioTracks.find(
		t => t.id === store.activeAudioTrackId
	);
	const trackName = isFileMode
		? (activeTrack?.name ?? getFileName?.() ?? 'No track')
		: captureMode === 'desktop'
		? 'Desktop audio'
		: captureMode === 'microphone'
		? 'Microphone'
		: 'No source';

	const pct = duration > 0 ? (seekValue / duration) * 100 : 0;

	const iconBtnCls =
		'flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10';

	return (
		<div
			className={`fixed bottom-3 left-1/2 z-40 -translate-x-1/2 flex flex-col items-center gap-0 overflow-hidden ${theme.panelShell}`}
			style={{
				borderRadius: expanded ? 'var(--editor-radius-lg)' : '9999px',
				minWidth: expanded ? 'min(22rem, calc(100vw - 2rem))' : 'auto',
				maxWidth: 'min(28rem, calc(100vw - 2rem))',
				backgroundColor: 'var(--editor-shell-bg)',
				borderColor: 'var(--editor-shell-border)',
				backdropFilter: 'blur(var(--editor-shell-blur)) saturate(150%)',
				WebkitBackdropFilter:
					'blur(var(--editor-shell-blur)) saturate(150%)',
				transition: 'border-radius 0.25s, min-width 0.25s',
				...themeVars,
				...radiusVars
			}}
		>
			{/* ── Collapsed / always-visible bar ── */}
			<div className="flex w-full items-center gap-2 px-3 py-1.5">
				{/* Prev */}
				{isFileMode ? (
					<button
						onClick={playPrevTrack}
						className={iconBtnCls}
						title="Previous"
						style={{ color: 'var(--editor-button-fg)' }}
					>
						<SkipBack size={13} />
					</button>
				) : (
					<Music2 size={13} style={{ color: 'var(--editor-accent-muted)' }} />
				)}

				{/* Play/Pause */}
				<button
					onClick={togglePlay}
					className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
					style={{
						background: 'var(--editor-active-bg)',
						borderColor: 'var(--editor-accent-color)',
						color: 'var(--editor-active-fg)',
						boxShadow: '0 0 8px var(--editor-accent-color)'
					}}
					title={effectivelyPaused ? 'Play' : 'Pause'}
				>
					{effectivelyPaused ? <Play size={14} /> : <Pause size={14} />}
				</button>

				{/* Next */}
				{isFileMode ? (
					<button
						onClick={playNextTrack}
						className={iconBtnCls}
						title="Next"
						style={{ color: 'var(--editor-button-fg)' }}
					>
						<SkipForward size={13} />
					</button>
				) : null}

				{/* Track name */}
				<span
					className="flex-1 truncate text-[11px] min-w-0"
					style={{ color: 'var(--editor-accent-soft)' }}
					title={trackName}
				>
					{trackName}
				</span>

				{/* Expand/collapse */}
				<button
					onClick={() => setExpanded(e => !e)}
					className={iconBtnCls}
					title={expanded ? 'Collapse' : 'Expand'}
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{expanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
				</button>
			</div>

			{/* ── Expanded: timeline ── */}
			{expanded && isFileMode && (
				<div className="w-full px-3 pb-2.5 flex flex-col gap-1">
					{/* Timeline slider */}
					<div className="relative flex items-center h-5 group/seek">
						{/* BG track */}
						<div
							className="absolute w-full h-[3px] rounded-full opacity-20 group-hover/seek:opacity-40 transition-opacity"
							style={{ background: 'var(--editor-accent-soft)' }}
						/>
						{/* Progress */}
						<div
							className="absolute h-[3px] rounded-full transition-[width] duration-75"
							style={{
								width: `${pct}%`,
								background: 'var(--editor-accent-color)',
								boxShadow: '0 0 6px var(--editor-accent-color)'
							}}
						/>
						{/* Thumb */}
						<div
							className="absolute w-3 h-3 rounded-full bg-white border-2 pointer-events-none z-10 shadow"
							style={{
								left: `calc(${pct}% - 6px)`,
								borderColor: 'var(--editor-accent-color)',
								transition: seeking ? 'none' : 'left 0.075s'
							}}
						/>
						<input
							type="range"
							min={0}
							max={duration || 1}
							step={0.5}
							value={seekValue}
							onMouseDown={handleSeekStart}
							onTouchStart={handleSeekStart}
							onChange={handleSeekChange}
							onMouseUp={handleSeekEnd}
							onTouchEnd={handleSeekEnd}
							className="absolute w-full h-5 opacity-0 cursor-pointer z-20"
						/>
					</div>

					{/* Time labels */}
					<div
						className="flex justify-between text-[10px] tabular-nums"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						<span>{fmt(currentTime)}</span>
						<span>-{fmt(Math.max(0, duration - currentTime))}</span>
					</div>
				</div>
			)}
		</div>
	);
}
