import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
	SkipBack,
	SkipForward,
	Play,
	Pause,
	Music2
} from 'lucide-react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioContext } from '@/context/useAudioContext';

/**
 * MediaDock — inline precision media player meant to be embedded inside the
 * HUD (QuickActionsPanel). It replaces the old floating dock to avoid a
 * duplicate mini player on screen. Inherits theme variables from its parent
 * container, so it stays in sync with the HUD's palette.
 *
 * Layout:
 *   [prev] [play/pause] [next]  Track name (flex-1)  IMG n/m
 *   <--------- precise timeline (file mode only) ----------->
 *   00:12                                                -04:10
 */
type MediaDockProps = {
	imageLabel?: string;
};

export default function MediaDock({ imageLabel }: MediaDockProps) {
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

	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [seeking, setSeeking] = useState(false);
	const [seekValue, setSeekValue] = useState(0);
	const rafRef = useRef<number | null>(null);

	const isFileMode = captureMode === 'file';
	const effectivelyPaused =
		captureMode === 'file'
			? isPaused || store.audioPaused
			: store.audioPaused;

	useEffect(() => {
		if (!isFileMode) {
			setCurrentTime(0);
			setDuration(0);
			setSeekValue(0);
			return;
		}

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

	const togglePlay = useCallback(() => {
		const nextPaused = !effectivelyPaused;
		store.setAudioPaused(nextPaused);
		if (captureMode === 'file') {
			if (nextPaused) pauseFileForSystem();
			else resumeFileFromSystem();
		}
	}, [
		captureMode,
		effectivelyPaused,
		pauseFileForSystem,
		resumeFileFromSystem,
		store
	]);

	const handleSeekStart = useCallback(() => {
		setSeeking(true);
	}, []);

	const handleSeekChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			setSeekValue(parseFloat(e.target.value));
		},
		[]
	);

	const handleSeekEnd = useCallback(() => {
		seek(seekValue);
		setCurrentTime(seekValue);
		setSeeking(false);
	}, [seek, seekValue]);

	function fmt(sec: number): string {
		if (!isFinite(sec) || sec < 0) return '0:00';
		const m = Math.floor(sec / 60);
		const s = Math.floor(sec % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

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
		'flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40';

	return (
		<div className="flex w-full flex-col gap-1.5">
			{/* Row 1 — transport buttons + track name + IMG tag */}
			<div className="flex w-full items-center gap-2">
				{isFileMode ? (
					<button
						type="button"
						onClick={() => void playPrevTrack()}
						className={iconBtnCls}
						title="Previous track"
						style={{ color: 'var(--editor-button-fg)' }}
					>
						<SkipBack size={13} />
					</button>
				) : (
					<span className={iconBtnCls} aria-hidden>
						<Music2
							size={13}
							style={{ color: 'var(--editor-accent-muted)' }}
						/>
					</span>
				)}

				<button
					type="button"
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

				{isFileMode ? (
					<button
						type="button"
						onClick={() => void playNextTrack()}
						className={iconBtnCls}
						title="Next track"
						style={{ color: 'var(--editor-button-fg)' }}
					>
						<SkipForward size={13} />
					</button>
				) : null}

				<span
					className="min-w-0 flex-1 truncate text-[11px]"
					style={{ color: 'var(--editor-accent-soft)' }}
					title={trackName}
				>
					{trackName}
				</span>

				{imageLabel ? (
					<span
						className="shrink-0 border px-2.5 py-1 text-[10px] font-medium tracking-[0.16em]"
						style={{
							borderRadius: 'var(--editor-radius-sm)',
							borderColor: 'var(--editor-tag-border)',
							background: 'var(--editor-tag-bg)',
							color: 'var(--editor-tag-fg)'
						}}
					>
						IMG {imageLabel}
					</span>
				) : null}
			</div>

			{/* Row 2 — precise timeline + time labels (file mode only) */}
			{isFileMode ? (
				<div className="flex w-full flex-col gap-0.5">
					<div className="group/seek relative flex h-5 items-center">
						<div
							className="absolute h-[3px] w-full rounded-full opacity-20 transition-opacity group-hover/seek:opacity-40"
							style={{
								background: 'var(--editor-accent-soft)'
							}}
						/>
						<div
							className="absolute h-[3px] rounded-full transition-[width] duration-75"
							style={{
								width: `${pct}%`,
								background: 'var(--editor-accent-color)',
								boxShadow: '0 0 6px var(--editor-accent-color)'
							}}
						/>
						<div
							className="pointer-events-none absolute z-10 h-3 w-3 rounded-full border-2 bg-white shadow"
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
							step={0.01}
							value={seekValue}
							onMouseDown={handleSeekStart}
							onTouchStart={handleSeekStart}
							onChange={handleSeekChange}
							onMouseUp={handleSeekEnd}
							onTouchEnd={handleSeekEnd}
							aria-label="Seek"
							className="absolute z-20 h-5 w-full cursor-pointer opacity-0"
						/>
					</div>

					<div
						className="flex justify-between text-[10px] tabular-nums"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						<span>{fmt(currentTime)}</span>
						<span>-{fmt(Math.max(0, duration - currentTime))}</span>
					</div>
				</div>
			) : null}
		</div>
	);
}
