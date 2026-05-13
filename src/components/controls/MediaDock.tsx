import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioContext } from '@/context/useAudioContext';
import MediaDockImageStrip from './mediaDock/MediaDockImageStrip';
import MediaDockSeekBar from './mediaDock/MediaDockSeekBar';
import MediaDockTransportRow from './mediaDock/MediaDockTransportRow';
import type { HoverPreview, ImageNavProps } from './mediaDock/types';

export type { ImageNavProps } from './mediaDock/types';

type MediaDockProps = {
	imageLabel?: string;
	isRainbow?: boolean;
	imageNav: ImageNavProps;
	hudSafeInset?: boolean;
};

export default function MediaDock({
	imageLabel,
	isRainbow = false,
	imageNav,
	hudSafeInset = false
}: MediaDockProps) {
	const { audioPaused, audioFileLoop } = useWallpaperStore(
		useShallow(s => ({
			audioPaused: s.audioPaused,
			audioFileLoop: s.audioFileLoop
		}))
	);
	const setAudioPaused = useWallpaperStore(s => s.setAudioPaused);
	const setAudioFileLoop = useWallpaperStore(s => s.setAudioFileLoop);
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
	const lastCommittedSeekRef = useRef<number | null>(null);
	const optimisticSeekRef = useRef<{ time: number; until: number } | null>(
		null
	);
	// Ref so pointer event handlers always read the live seeking state
	// without stale closure issues.
	const seekingRef = useRef(false);
	const didCommitSeekDuringGestureRef = useRef(false);

	const isFileMode = captureMode === 'file';
	const effectivelyPaused =
		captureMode === 'file' ? isPaused || audioPaused : audioPaused;

	const getCurrentTimeRef = useRef(getCurrentTime);
	const getDurationRef = useRef(getDuration);
	useEffect(() => {
		getCurrentTimeRef.current = getCurrentTime;
		getDurationRef.current = getDuration;
	}, [getCurrentTime, getDuration]);

	const syncTransportSnapshot = useCallback(() => {
		if (!isFileMode) {
			setCurrentTime(0);
			setDuration(0);
			setSeekValue(0);
			return;
		}

		const nextTime = Math.max(0, getCurrentTimeRef.current());
		const nextDuration = Math.max(0, getDurationRef.current());
		let clampedTime =
			nextDuration > 0 ? Math.min(nextTime, nextDuration) : nextTime;
		const optimisticSeek = optimisticSeekRef.current;
		if (optimisticSeek) {
			if (performance.now() <= optimisticSeek.until) {
				clampedTime =
					nextDuration > 0
						? Math.min(Math.max(0, optimisticSeek.time), nextDuration)
						: Math.max(0, optimisticSeek.time);
			} else {
				optimisticSeekRef.current = null;
			}
		}
		setDuration(nextDuration);
		if (!seekingRef.current) {
			setCurrentTime(clampedTime);
			setSeekValue(clampedTime);
		}
	}, [isFileMode]);

	useEffect(() => {
		seekingRef.current = false;
		didCommitSeekDuringGestureRef.current = false;
		lastCommittedSeekRef.current = null;
		optimisticSeekRef.current = null;
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

		// Force a snapshot resync whenever the viewport changes shape: a
		// fullscreen toggle re-layouts the HUD, and any in-flight seek state
		// would still reference the previous rail bounds. Dropping the seek
		// ref + pulling fresh transport values keeps the bar honest.
		const handleViewportChange = () => {
			seekingRef.current = false;
			didCommitSeekDuringGestureRef.current = false;
			lastCommittedSeekRef.current = null;
			optimisticSeekRef.current = null;
			setSeeking(false);
			setHoverPreview(null);
			syncTransportSnapshot();
		};
		window.addEventListener('resize', handleViewportChange);
		document.addEventListener('fullscreenchange', handleViewportChange);

		rafRef.current = requestAnimationFrame(tick);
		return () => {
			mounted = false;
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
			didCommitSeekDuringGestureRef.current = false;
			lastCommittedSeekRef.current = null;
			optimisticSeekRef.current = null;
			window.removeEventListener('resize', handleViewportChange);
			document.removeEventListener(
				'fullscreenchange',
				handleViewportChange
			);
		};
	}, [isFileMode, syncTransportSnapshot]);

	const togglePlay = useCallback(() => {
		const nextPaused = !effectivelyPaused;
		setAudioPaused(nextPaused);
		if (captureMode === 'file') {
			if (nextPaused) pauseFileForSystem();
			else resumeFileFromSystem();
		}
	}, [
		captureMode,
		effectivelyPaused,
		pauseFileForSystem,
		resumeFileFromSystem,
		setAudioPaused
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

	const applySeekPreview = useCallback(
		(nextTime: number, commitToAudio: boolean) => {
			const safeDuration = Math.max(0, duration);
			const clampedTime =
				safeDuration > 0
					? Math.min(Math.max(0, nextTime), safeDuration)
					: Math.max(0, nextTime);
			setCurrentTime(clampedTime);
			setSeekValue(clampedTime);

			if (!commitToAudio) return;

			const lastCommitted = lastCommittedSeekRef.current;
			if (
				lastCommitted !== null &&
				Math.abs(lastCommitted - clampedTime) < 0.05
			) {
				return;
			}

			lastCommittedSeekRef.current = clampedTime;
			optimisticSeekRef.current = {
				time: clampedTime,
				until: performance.now() + 900
			};
			didCommitSeekDuringGestureRef.current = true;
			seek(clampedTime);
		},
		[duration, seek]
	);

	const finishSeekInteraction = useCallback(
		(finalPreview: HoverPreview | null) => {
			seekingRef.current = false;
			didCommitSeekDuringGestureRef.current = false;
			lastCommittedSeekRef.current = null;
			setSeeking(false);
			setHoverPreview(finalPreview);
			if (finalPreview) {
				setCurrentTime(finalPreview.time);
				setSeekValue(finalPreview.time);
				optimisticSeekRef.current = {
					time: finalPreview.time,
					until: performance.now() + 900
				};
			}
			requestAnimationFrame(syncTransportSnapshot);
		},
		[syncTransportSnapshot]
	);

	const handleTrackPointerDown = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			e.currentTarget.setPointerCapture(e.pointerId);
			seekingRef.current = true;
			didCommitSeekDuringGestureRef.current = false;
			setSeeking(true);
			const preview = getHoverPreview(e.clientX);
			if (preview) {
				setHoverPreview(preview);
				applySeekPreview(preview.time, true);
			}
		},
		[applySeekPreview, getHoverPreview]
	);

	const handleTrackPointerMove = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			const preview = getHoverPreview(e.clientX);
			setHoverPreview(preview);
			if (seekingRef.current && preview) {
				applySeekPreview(preview.time, true);
			}
		},
		[applySeekPreview, getHoverPreview]
	);

	const handleTrackPointerUp = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (!seekingRef.current) return;
			e.currentTarget.releasePointerCapture(e.pointerId);
			finishSeekInteraction(getHoverPreview(e.clientX));
		},
		[finishSeekInteraction, getHoverPreview]
	);

	const handleTrackPointerLeave = useCallback(() => {
		if (!seekingRef.current) setHoverPreview(null);
	}, []);

	const handleTrackPointerCancel = useCallback(() => {
		finishSeekInteraction(null);
	}, [finishSeekInteraction]);

	const handleTrackLostPointerCapture = useCallback(
		(e: React.PointerEvent<HTMLDivElement>) => {
			if (seekingRef.current) {
				finishSeekInteraction(getHoverPreview(e.clientX));
			}
		},
		[finishSeekInteraction, getHoverPreview]
	);

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

	const displayTime = Math.max(
		0,
		duration > 0
			? Math.min(seeking ? seekValue : currentTime, duration)
			: seeking
				? seekValue
				: currentTime
	);
	const pct =
		duration > 0
			? Math.max(0, Math.min(100, (displayTime / duration) * 100))
			: 0;
	const progressRatio = pct / 100;

	// HUD icon button hover modifier — adds brightness lift on hover for the
	// translucent HUD surface (not needed in the solid ControlPanel).
	const hudIconBtn = 'hover:brightness-125 shrink-0 sm:h-8 sm:w-8';
	const primaryHudIconBtn =
		'hover:brightness-125 shrink-0 sm:h-10 sm:w-10';

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
		<div
			className="flex w-full flex-col gap-2 rounded border p-3"
			style={{
				borderRadius: 'var(--editor-radius-xl)',
				borderColor: 'var(--editor-shell-border)',
				background:
					'linear-gradient(180deg, color-mix(in srgb, var(--editor-shell-bg) 94%, transparent), color-mix(in srgb, #020617 72%, var(--editor-shell-bg) 28%))',
				boxShadow:
					'0 18px 40px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)'
			}}
		>
			<MediaDockImageStrip
				imageNav={imageNav}
				imgBadge={imgBadge}
				hudIconBtn={hudIconBtn}
				edgeInsetStyle={edgeInsetStyle}
			/>

			<MediaDockTransportRow
				isFileMode={isFileMode}
				effectivelyPaused={effectivelyPaused}
				audioFileLoop={audioFileLoop}
				trackName={trackName}
				hudIconBtn={hudIconBtn}
				primaryHudIconBtn={primaryHudIconBtn}
				edgeInsetStyle={edgeInsetStyle}
				onTogglePlay={togglePlay}
				onPrevTrack={() => void playPrevTrack()}
				onNextTrack={() => void playNextTrack()}
				onToggleLoop={() => setAudioFileLoop(!audioFileLoop)}
			/>

			{isFileMode ? (
				<MediaDockSeekBar
					trackRef={trackRef}
					seekRailRef={seekRailRef}
					hoverPreview={hoverPreview}
					progressRatio={progressRatio}
					isRainbow={isRainbow}
					seeking={seeking}
					displayTime={displayTime}
					duration={duration}
					edgeInsetStyle={edgeInsetStyle}
					footerInsetStyle={footerInsetStyle}
					onPointerDown={handleTrackPointerDown}
					onPointerMove={handleTrackPointerMove}
					onPointerUp={handleTrackPointerUp}
					onPointerCancel={handleTrackPointerCancel}
					onLostPointerCapture={handleTrackLostPointerCapture}
					onPointerLeave={handleTrackPointerLeave}
				/>
			) : null}
		</div>
	);
}
