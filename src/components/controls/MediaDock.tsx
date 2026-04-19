import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
	SkipBack,
	SkipForward,
	Play,
	Pause,
	Music2,
	Repeat,
	ChevronLeft,
	ChevronRight,
	Snowflake,
	Images
} from 'lucide-react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioContext } from '@/context/useAudioContext';

/**
 * Formats seconds for track UI: under 1h → `m:ss`; 1h+ → `h:mm:ss`
 * (avoids ambiguous values like `61:43` meaning 61 minutes).
 */
function formatTrackTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
	const t = Math.floor(seconds);
	const h = Math.floor(t / 3600);
	const m = Math.floor((t % 3600) / 60);
	const s = t % 60;
	if (h > 0) {
		return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}
	return `${m}:${String(s).padStart(2, '0')}`;
}

export type ImageNavProps = {
	hasBackgroundImages: boolean;
	slideshowEnabled: boolean;
	onToggleSlideshow: () => void;
	motionPaused: boolean;
	onPrevImage: () => void;
	onNextImage: () => void;
	onToggleFreeze: () => void;
};

type MediaDockProps = {
	imageLabel?: string;
	isRainbow?: boolean;
	imageNav: ImageNavProps;
};

type HoverPreview = {
	ratio: number;
	time: number;
};

export default function MediaDock({
	imageLabel,
	isRainbow = false,
	imageNav
}: MediaDockProps) {
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
	const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);
	const rafRef = useRef<number | null>(null);
	const trackRef = useRef<HTMLDivElement | null>(null);

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

	const getHoverPreview = useCallback(
		(clientX: number) => {
			const rect = trackRef.current?.getBoundingClientRect();
			if (!rect || rect.width <= 0 || duration <= 0) return null;
			const ratio = Math.max(
				0,
				Math.min(1, (clientX - rect.left) / rect.width)
			);
			return { ratio, time: ratio * duration };
		},
		[duration]
	);

	const handleSeekHover = useCallback(
		(clientX: number) => {
			setHoverPreview(getHoverPreview(clientX));
		},
		[getHoverPreview]
	);

	const activeTrack = store.audioTracks.find(
		t => t.id === store.activeAudioTrackId
	);
	const rawTrackName = isFileMode
		? (activeTrack?.name ?? getFileName?.() ?? 'No track')
		: captureMode === 'desktop'
			? 'Desktop audio'
			: captureMode === 'microphone'
				? 'Microphone'
				: 'No source';
	const trackName = isFileMode
		? rawTrackName.replace(/\.[^/.]+$/, '')
		: rawTrackName;

	const pct = duration > 0 ? (seekValue / duration) * 100 : 0;

	const iconBtnCls =
		'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40';

	const imgBadge =
		imageLabel && imageNav.hasBackgroundImages ? (
			<span
				className="shrink-0 border px-2 py-0.5 text-[10px] font-medium tracking-[0.14em]"
				style={{
					borderRadius: 'var(--editor-radius-sm)',
					borderColor: 'var(--editor-tag-border)',
					background: 'var(--editor-tag-bg)',
					color: 'var(--editor-tag-fg)'
				}}
			>
				IMG {imageLabel}
			</span>
		) : null;

	return (
		<div className="flex w-full flex-col gap-1 pb-0">
			{/* Image strip: prev | FREEZE (always centered) | next + auto-cycle + IMG n/m */}
			{imageNav.hasBackgroundImages ? (
				<div className="grid min-h-[28px] w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-1">
					<div className="flex justify-end">
						{!imageNav.slideshowEnabled ? (
							<button
								type="button"
								onClick={imageNav.onPrevImage}
								className={iconBtnCls}
								title="Previous background image"
								style={{ color: 'var(--editor-button-fg)' }}
							>
								<ChevronLeft size={16} strokeWidth={2.25} />
							</button>
						) : null}
					</div>
					<div className="flex justify-center px-0.5">
						<button
							type="button"
							onClick={imageNav.onToggleFreeze}
							className={iconBtnCls}
							title={
								imageNav.motionPaused
									? 'Resume motion'
									: 'Freeze motion'
							}
							style={{
								color: imageNav.motionPaused
									? 'var(--editor-accent-muted)'
									: 'var(--editor-accent-color)',
								background: imageNav.motionPaused
									? 'color-mix(in srgb, var(--editor-accent-border) 22%, transparent)'
									: 'color-mix(in srgb, var(--editor-accent-color) 14%, transparent)'
							}}
						>
							<Snowflake size={15} strokeWidth={2.25} />
						</button>
					</div>
					<div className="flex min-w-0 flex-wrap items-center justify-start gap-1.5">
						{!imageNav.slideshowEnabled ? (
							<button
								type="button"
								onClick={imageNav.onNextImage}
								className={iconBtnCls}
								title="Next background image"
								style={{ color: 'var(--editor-button-fg)' }}
							>
								<ChevronRight size={16} strokeWidth={2.25} />
							</button>
						) : null}
						<button
							type="button"
							onClick={imageNav.onToggleSlideshow}
							className={iconBtnCls}
							title={
								imageNav.slideshowEnabled
									? 'Auto-cycle images (on) — click to use manual images'
									: 'Auto-cycle images (off) — click to rotate images automatically'
							}
							style={{
								color: imageNav.slideshowEnabled
									? 'var(--editor-accent-color)'
									: 'var(--editor-button-fg)',
								background: imageNav.slideshowEnabled
									? 'color-mix(in srgb, var(--editor-accent-color) 18%, transparent)'
									: undefined
							}}
						>
							<Images size={15} strokeWidth={2.25} />
						</button>
						{imgBadge}
					</div>
				</div>
			) : null}

			{/* Original transport row: audio controls | track title (same line as before) */}
			<div className="flex w-full items-center gap-2">
				<div className="flex shrink-0 items-center gap-1.5">
					{isFileMode ? (
						<button
							type="button"
							onClick={() => void playPrevTrack()}
							className={iconBtnCls}
							title="Previous track"
							style={{ color: 'var(--editor-button-fg)' }}
						>
							<SkipBack size={14} />
						</button>
					) : (
						<span className={iconBtnCls} aria-hidden>
							<Music2
								size={14}
								style={{ color: 'var(--editor-accent-muted)' }}
							/>
						</span>
					)}

					<button
						type="button"
						onClick={togglePlay}
						className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors"
						style={{
							background: 'var(--editor-active-bg)',
							borderColor: 'var(--editor-accent-color)',
							color: 'var(--editor-active-fg)',
							boxShadow: '0 0 8px var(--editor-accent-color)'
						}}
						title={effectivelyPaused ? 'Play' : 'Pause'}
					>
						{effectivelyPaused ? (
							<Play size={15} className="ml-0.5" />
						) : (
							<Pause size={15} />
						)}
					</button>

					{isFileMode ? (
						<button
							type="button"
							onClick={() => void playNextTrack()}
							className={iconBtnCls}
							title="Next track"
							style={{ color: 'var(--editor-button-fg)' }}
						>
							<SkipForward size={14} />
						</button>
					) : null}
					{isFileMode ? (
						<button
							type="button"
							onClick={() =>
								store.setAudioFileLoop(!store.audioFileLoop)
							}
							className={iconBtnCls}
							title="Repeat track"
							style={{
								color: store.audioFileLoop
									? 'var(--editor-accent-color)'
									: 'var(--editor-button-fg)',
								background: store.audioFileLoop
									? 'color-mix(in srgb, var(--editor-accent-color) 18%, transparent)'
									: undefined
							}}
						>
							<Repeat size={14} />
						</button>
					) : null}
				</div>

				<span
					className="min-w-0 flex-1 truncate text-[11px] leading-snug"
					style={{ color: 'var(--editor-accent-soft)' }}
					title={trackName}
				>
					{trackName}
				</span>
			</div>

			{isFileMode ? (
				<div className="flex w-full flex-col gap-0">
					<div
						ref={trackRef}
						className="group/seek relative mt-0.5 flex h-5 items-center"
						onMouseMove={event => handleSeekHover(event.clientX)}
						onMouseLeave={() => setHoverPreview(null)}
					>
						{hoverPreview ? (
							<>
								<div
									className="pointer-events-none absolute bottom-full z-10 mb-1 border px-1.5 py-0.5 text-[10px] tabular-nums"
									style={{
										left: `${hoverPreview.ratio * 100}%`,
										transform: 'translateX(-50%)',
										borderRadius: 'var(--editor-radius-sm)',
										borderColor: 'var(--editor-tag-border)',
										background: 'var(--editor-shell-bg)',
										color: 'var(--editor-active-fg)',
										boxShadow:
											'0 8px 24px rgba(0,0,0,0.22)'
									}}
								>
									{formatTrackTime(hoverPreview.time)}
								</div>
								<div
									className="pointer-events-none absolute top-1/2 h-4 w-px -translate-y-1/2"
									style={{
										left: `${hoverPreview.ratio * 100}%`,
										background:
											'color-mix(in srgb, var(--editor-accent-soft) 72%, transparent)'
									}}
								/>
							</>
						) : null}
						<div
							className="absolute h-[3px] w-full rounded-full opacity-20 transition-opacity group-hover/seek:opacity-40"
							style={{
								background: 'var(--editor-accent-soft)'
							}}
						/>
						<div
							className={`absolute h-[3px] overflow-hidden rounded-full transition-[width] duration-75 ${
								isRainbow ? 'editor-rgb-theme-active' : ''
							}`}
							style={{
								width: `${pct}%`,
								background: isRainbow
									? undefined
									: 'var(--editor-accent-color)',
								boxShadow: isRainbow
									? '0 0 10px color-mix(in srgb, var(--editor-accent-soft) 46%, transparent)'
									: '0 0 6px var(--editor-accent-color)'
							}}
						>
							<div
								className="media-progress-shimmer h-full w-full"
								style={{
									opacity: isRainbow ? 0.4 : 0.55
								}}
							/>
						</div>
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
						className="flex justify-between pt-0.5 text-[10px] tabular-nums leading-none"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						<span>{formatTrackTime(currentTime)}</span>
						<span>
							-{formatTrackTime(Math.max(0, duration - currentTime))}
						</span>
					</div>
				</div>
			) : null}
		</div>
	);
}
