import {
	useCallback,
	useEffect,
	useRef,
	useState
} from 'react';
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
import IconButton from './ui/IconButton';
import { ICON_SIZE, ICON_STROKE } from './ui/designTokens';

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
	hudSafeInset?: boolean;
};

type HoverPreview = {
	ratio: number;
	time: number;
};

export default function MediaDock({
	imageLabel,
	isRainbow = false,
	imageNav,
	hudSafeInset = false
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
	const seekRailRef = useRef<HTMLDivElement | null>(null);
	// Ref so pointer event handlers always read the live seeking state
	// without stale closure issues.
	const seekingRef = useRef(false);

	const isFileMode = captureMode === 'file';
	const effectivelyPaused =
		captureMode === 'file'
			? isPaused || store.audioPaused
			: store.audioPaused;

	const syncTransportSnapshot = useCallback(() => {
		if (!isFileMode) {
			setCurrentTime(0);
			setDuration(0);
			setSeekValue(0);
			return;
		}

		const nextTime = Math.max(0, getCurrentTime());
		const nextDuration = Math.max(0, getDuration());
		setDuration(nextDuration);
		if (!seekingRef.current) {
			setCurrentTime(nextTime);
			setSeekValue(nextTime);
		}
	}, [getCurrentTime, getDuration, isFileMode]);

	useEffect(() => {
		seekingRef.current = false;
		setSeeking(false);
		setHoverPreview(null);
		syncTransportSnapshot();

		if (!isFileMode) {
			return undefined;
		}

		let mounted = true;
		function tick() {
			if (!mounted) return;
			syncTransportSnapshot();
			rafRef.current = requestAnimationFrame(tick);
		}

		rafRef.current = requestAnimationFrame(tick);
		return () => {
			mounted = false;
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		};
	}, [isFileMode, syncTransportSnapshot]);

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

	// Calculates seek position from pointer's clientX using the visual rail bounds.
	// This is the single source of truth for both hover preview and actual seek.
	const getHoverPreview = useCallback(
		(clientX: number) => {
			const rect = seekRailRef.current?.getBoundingClientRect();
			if (!rect || rect.width <= 0 || duration <= 0) return null;
			const ratio = Math.max(
				0,
				Math.min(1, (clientX - rect.left) / rect.width)
			);
			return { ratio, time: ratio * duration };
		},
		[duration]
	);

	const handleTrackPointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			e.currentTarget.setPointerCapture(e.pointerId);
			seekingRef.current = true;
			setSeeking(true);
			const preview = getHoverPreview(e.clientX);
			if (preview) {
				setSeekValue(preview.time);
				setHoverPreview(preview);
			}
		},
		[getHoverPreview]
	);

	const handleTrackPointerMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			const preview = getHoverPreview(e.clientX);
			setHoverPreview(preview);
			if (seekingRef.current && preview) setSeekValue(preview.time);
		},
		[getHoverPreview]
	);

	const handleTrackPointerUp = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!seekingRef.current) return;
			e.currentTarget.releasePointerCapture(e.pointerId);
			seekingRef.current = false;
			setSeeking(false);
			// Re-calculate from final pointer position for maximum precision.
			const preview = getHoverPreview(e.clientX);
			if (preview) {
				seek(preview.time);
				setCurrentTime(preview.time);
				setSeekValue(preview.time);
			}
		},
		[getHoverPreview, seek]
	);

	const handleTrackPointerLeave = useCallback(() => {
		if (!seekingRef.current) setHoverPreview(null);
	}, []);

	const rawTrackName = isFileMode
		? (getFileName?.() ?? 'No track')
		: captureMode === 'desktop'
			? 'Desktop audio'
			: captureMode === 'microphone'
				? 'Microphone'
				: 'No source';
	const trackName = isFileMode
		? rawTrackName.replace(/\.[^/.]+$/, '')
		: rawTrackName;

	const pct = duration > 0 ? (seekValue / duration) * 100 : 0;

	// HUD icon button hover modifier — adds brightness lift on hover for the
	// translucent HUD surface (not needed in the solid ControlPanel).
	const hudIconBtn = 'hover:brightness-125 shrink-0';

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
	const edgeInsetStyle = hudSafeInset
		? ({
				paddingInline:
					'max(8px, calc(var(--editor-radius-xl) * 0.22))'
			} as const)
		: undefined;
	const footerInsetStyle = hudSafeInset
		? ({
				paddingInline:
					'max(8px, calc(var(--editor-radius-xl) * 0.22))',
				paddingBottom:
					'max(4px, calc(var(--editor-radius-xl) * 0.12))'
			} as const)
		: undefined;

	return (
		<div className="flex w-full flex-col gap-1 pb-0">
			{/* Image strip: prev | FREEZE (always start) | next + auto-cycle + IMG n/m */}
			{imageNav.hasBackgroundImages ? (
				<div
					className="flex min-h-[28px] w-full items-center justify-start gap-x-1"
					style={edgeInsetStyle}
				>
					<div className="flex justify-center gap-1">
						{!imageNav.slideshowEnabled ? (
							<IconButton
								onClick={imageNav.onPrevImage}
								title="Previous background image"
								className={hudIconBtn}
							>
								<ChevronLeft size={ICON_SIZE.md} strokeWidth={ICON_STROKE.bold} />
							</IconButton>
						) : null}
					</div>
					<div className="flex justify-center px-0.5">
						<IconButton
						active={imageNav.motionPaused}
						onClick={imageNav.onToggleFreeze}
						title={imageNav.motionPaused ? 'Resume motion' : 'Freeze motion'}
						className={hudIconBtn}
					>
						<Snowflake size={ICON_SIZE.md} strokeWidth={ICON_STROKE.bold} />
					</IconButton>
					</div>
					<div className="flex min-w-0 flex-wrap items-center justify-start gap-1.5">
						{!imageNav.slideshowEnabled ? (
							<IconButton
								onClick={imageNav.onNextImage}
								title="Next background image"
								className={hudIconBtn}
							>
								<ChevronRight size={ICON_SIZE.md} strokeWidth={ICON_STROKE.bold} />
							</IconButton>
						) : null}
						<IconButton
							active={imageNav.slideshowEnabled}
							onClick={imageNav.onToggleSlideshow}
							title={
								imageNav.slideshowEnabled
									? 'Auto-cycle images (on) — click to use manual images'
									: 'Auto-cycle images (off) — click to rotate images automatically'
							}
							className={hudIconBtn}
						>
							<Images size={ICON_SIZE.md} strokeWidth={ICON_STROKE.bold} />
						</IconButton>
						{imgBadge}
					</div>
				</div>
			) : null}

			{/* Original transport row: audio controls | track title (same line as before) */}
			<div
				className="flex w-full items-center gap-2"
				style={edgeInsetStyle}
			>
				<div className="flex shrink-0 items-center gap-1">
					{isFileMode ? (
						<IconButton
							onClick={() => void playPrevTrack()}
							title="Previous track"
							className={hudIconBtn}
						>
							<SkipBack size={ICON_SIZE.sm} />
						</IconButton>
					) : (
						<span
							className="flex h-7 w-7 shrink-0 items-center justify-center border"
							aria-hidden
							style={{
								borderRadius: 'var(--editor-radius-md)',
								background: 'color-mix(in srgb, var(--editor-button-bg) 55%, transparent)',
								borderColor: 'color-mix(in srgb, var(--editor-button-border) 70%, transparent)',
								color: 'var(--editor-accent-muted)',
								backdropFilter: 'blur(6px)',
								WebkitBackdropFilter: 'blur(6px)'
							}}
						>
							<Music2 size={ICON_SIZE.sm} />
						</span>
					)}

					<IconButton
					active
					onClick={togglePlay}
					title={effectivelyPaused ? 'Play' : 'Pause'}
					className={`${hudIconBtn} shrink-0`}
					style={{ boxShadow: '0 0 6px color-mix(in srgb, var(--editor-accent-color) 60%, transparent)' } as React.CSSProperties}
				>
						{effectivelyPaused ? (
							<Play size={ICON_SIZE.sm} className="ml-0.5" />
						) : (
							<Pause size={ICON_SIZE.sm} />
						)}
					</IconButton>

					{isFileMode ? (
						<IconButton
							onClick={() => void playNextTrack()}
							title="Next track"
							className={hudIconBtn}
						>
							<SkipForward size={ICON_SIZE.sm} />
						</IconButton>
					) : null}
					{isFileMode ? (
						<IconButton
							active={store.audioFileLoop}
							onClick={() => store.setAudioFileLoop(!store.audioFileLoop)}
							title="Repeat track"
							className={hudIconBtn}
						>
							<Repeat size={ICON_SIZE.sm} />
						</IconButton>
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
						className="group/seek relative mt-0.5 flex h-5 cursor-pointer select-none items-center"
						style={edgeInsetStyle}
						onPointerDown={handleTrackPointerDown}
						onPointerMove={handleTrackPointerMove}
						onPointerUp={handleTrackPointerUp}
						onPointerLeave={handleTrackPointerLeave}
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
										boxShadow: '0 8px 24px rgba(0,0,0,0.22)'
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
							ref={seekRailRef}
							className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full"
						>
							<div
								className="h-full w-full rounded-full opacity-20 transition-opacity group-hover/seek:opacity-40"
								style={{
									background: 'var(--editor-accent-soft)'
								}}
							/>
							<div
								className={`absolute inset-y-0 left-0 overflow-hidden rounded-full transition-[width] duration-75 ${
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
						</div>
						<div
							className="pointer-events-none absolute z-10 h-3 w-3 rounded-full border-2 bg-white shadow"
							style={{
								left: `calc(${pct}% - 6px)`,
								borderColor: 'var(--editor-accent-color)',
								background: 'var(--editor-active-fg)',
								boxShadow:
									'0 0 8px color-mix(in srgb, var(--editor-accent-color) 38%, transparent)',
								transition: seeking ? 'none' : 'left 0.075s'
							}}
						/>
					</div>

					<div
						className="flex justify-between pt-0.5 text-[10px] tabular-nums leading-none"
						style={{
							color: 'var(--editor-accent-muted)',
							...footerInsetStyle
						}}
					>
						<span>{formatTrackTime(currentTime)}</span>
						<span>
							-
							{formatTrackTime(
								Math.max(0, duration - currentTime)
							)}
						</span>
					</div>
				</div>
			) : null}
		</div>
	);
}
