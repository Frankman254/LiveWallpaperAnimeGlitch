import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioData } from '@/hooks/useAudioData';
import { useT } from '@/lib/i18n';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import {
	getEditorRadiusVars,
	getScopedEditorThemeColorVars
} from '@/components/controls/editorTheme';

// Fixed panel dimensions
const PANEL_WIDTH = 808;
const PANEL_HEIGHT = 172;
const PANEL_MARGIN = 12;
const LAUNCHER_SIZE = 64;

/**
 * Convert normalized position (0–1) to a pixel offset.
 * 0 = left/top edge + margin, 1 = right/bottom edge − margin.
 */
function normalizedToPixel(
	norm: number,
	elementSize: number,
	viewportSize: number,
	margin: number
): number {
	const usable = Math.max(0, viewportSize - elementSize - margin * 2);
	return margin + Math.min(1, Math.max(0, norm)) * usable;
}

function formatClock(totalSeconds: number): string {
	if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '00:00';
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = Math.floor(totalSeconds % 60);
	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

type QuickActionButtonProps = {
	label: string;
	title: string;
	active?: boolean;
	emphasis?: boolean;
	disabled?: boolean;
	onClick: () => void;
};

function QuickActionButton({
	label,
	title,
	active = false,
	emphasis = false,
	disabled = false,
	onClick
}: QuickActionButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			aria-label={title}
			disabled={disabled}
			className="flex h-11 min-w-[54px] items-center justify-center border px-3 text-[11px] font-semibold uppercase tracking-[0.16em] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35"
			style={{
				borderRadius: 'var(--editor-radius-md)',
				borderColor: active
					? 'var(--editor-button-border)'
					: 'color-mix(in srgb, var(--editor-shell-border) 72%, transparent)',
				background: emphasis
					? 'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 92%, white 5%), color-mix(in srgb, var(--editor-shell-bg) 84%, transparent))'
					: active
						? 'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 84%, white 3%), color-mix(in srgb, var(--editor-shell-bg) 88%, transparent))'
						: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))',
				color: emphasis
					? 'var(--editor-active-fg)'
					: active
						? 'var(--editor-accent-soft)'
						: 'color-mix(in srgb, var(--editor-accent-soft) 82%, white)',
				boxShadow: emphasis
					? '0 10px 26px color-mix(in srgb, var(--editor-accent-color) 24%, transparent)'
					: 'none'
			}}
		>
			{label}
		</button>
	);
}

export default function QuickActionsPanel() {
	const t = useT();
	// isOpen is local UI state — the panel mounts/unmounts on toggle, no translate hack
	const [isOpen, setIsOpen] = useState(true);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [viewportSize, setViewportSize] = useState(() => ({
		width: typeof window === 'undefined' ? 1280 : window.innerWidth,
		height: typeof window === 'undefined' ? 720 : window.innerHeight
	}));

	// Keep viewport size in sync with window resize
	useEffect(() => {
		const onResize = () =>
			setViewportSize({
				width: window.innerWidth,
				height: window.innerHeight
			});
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	const {
		quickActionsEnabled,
		quickActionsPositionX,
		quickActionsPositionY,
		quickActionsLauncherPositionX,
		quickActionsLauncherPositionY,
		quickActionsBackdropOpacity,
		quickActionsBlurPx,
		quickActionsColorSource,
		quickActionsManualAccentColor,
		quickActionsManualSecondaryColor,
		quickActionsManualBackdropColor,
		editorTheme,
		editorCornerRadius,
		logoUrl,
		backgroundImages,
		activeImageId,
		setActiveImageId,
		imageBassReactive,
		setImageBassReactive,
		spectrumEnabled,
		setSpectrumEnabled,
		logoEnabled,
		setLogoEnabled,
		particlesEnabled,
		setParticlesEnabled,
		rainEnabled,
		setRainEnabled,
		motionPaused,
		setMotionPaused,
		audioTracks,
		activeAudioTrackId
	} = useWallpaperStore(
		useShallow(state => ({
			quickActionsEnabled: state.quickActionsEnabled,
			quickActionsPositionX: state.quickActionsPositionX,
			quickActionsPositionY: state.quickActionsPositionY,
			quickActionsLauncherPositionX: state.quickActionsLauncherPositionX,
			quickActionsLauncherPositionY: state.quickActionsLauncherPositionY,
			quickActionsBackdropOpacity: state.quickActionsBackdropOpacity,
			quickActionsBlurPx: state.quickActionsBlurPx,
			quickActionsColorSource: state.quickActionsColorSource,
			quickActionsManualAccentColor: state.quickActionsManualAccentColor,
			quickActionsManualSecondaryColor: state.quickActionsManualSecondaryColor,
			quickActionsManualBackdropColor: state.quickActionsManualBackdropColor,
			editorTheme: state.editorTheme,
			editorCornerRadius: state.editorCornerRadius,
			logoUrl: state.logoUrl,
			backgroundImages: state.backgroundImages,
			activeImageId: state.activeImageId,
			setActiveImageId: state.setActiveImageId,
			imageBassReactive: state.imageBassReactive,
			setImageBassReactive: state.setImageBassReactive,
			spectrumEnabled: state.spectrumEnabled,
			setSpectrumEnabled: state.setSpectrumEnabled,
			logoEnabled: state.logoEnabled,
			setLogoEnabled: state.setLogoEnabled,
			particlesEnabled: state.particlesEnabled,
			setParticlesEnabled: state.setParticlesEnabled,
			rainEnabled: state.rainEnabled,
			setRainEnabled: state.setRainEnabled,
			motionPaused: state.motionPaused,
			setMotionPaused: state.setMotionPaused,
			audioTracks: state.audioTracks,
			activeAudioTrackId: state.activeAudioTrackId
		}))
	);

	const {
		captureMode,
		isPaused,
		pauseCapture,
		resumeCapture,
		pauseFileForSystem,
		resumeFileFromSystem,
		playNextTrack,
		playPrevTrack,
		getCurrentTime,
		getDuration,
		getFileName,
		seek
	} = useAudioData();

	const backgroundPalette = useBackgroundPalette();

	// Single consistent theme variable computation — matches the editor panel exactly
	const themeVars = getScopedEditorThemeColorVars(
		quickActionsColorSource,
		backgroundPalette,
		editorTheme,
		{
			accent: quickActionsManualAccentColor,
			secondary: quickActionsManualSecondaryColor,
			backdrop: quickActionsManualBackdropColor
		},
		{
			backdropOpacity: quickActionsBackdropOpacity,
			blurPx: quickActionsBlurPx
		}
	);
	const radiusVars = getEditorRadiusVars(editorCornerRadius);

	// Poll playback time — slower when panel is closed to reduce work
	useEffect(() => {
		if (!quickActionsEnabled) return undefined;
		const tick = () => {
			setCurrentTime(getCurrentTime());
			setDuration(getDuration());
		};
		tick();
		const interval = window.setInterval(tick, isOpen ? 250 : 500);
		return () => window.clearInterval(interval);
	}, [getCurrentTime, getDuration, isOpen, quickActionsEnabled]);

	const imageIndex = useMemo(
		() => backgroundImages.findIndex(image => image.assetId === activeImageId),
		[activeImageId, backgroundImages]
	);

	const activeTrack = useMemo(
		() => audioTracks.find(track => track.id === activeAudioTrackId) ?? null,
		[audioTracks, activeAudioTrackId]
	);

	const trackLabel = useMemo(() => {
		const runtimeName = getFileName().trim();
		if (runtimeName) return runtimeName;
		return activeTrack?.name?.trim() || 'Live Wallpaper Mix';
	}, [activeTrack?.name, getFileName]);

	if (!quickActionsEnabled) return null;

	// --- Pixel positions derived from normalized coords (0–1) ---
	const vw = viewportSize.width;
	const vh = viewportSize.height;
	const panelWidth = Math.min(vw - PANEL_MARGIN * 2, PANEL_WIDTH);

	const panelLeft = normalizedToPixel(
		quickActionsPositionX,
		panelWidth,
		vw,
		PANEL_MARGIN
	);
	const panelTop = normalizedToPixel(
		quickActionsPositionY,
		PANEL_HEIGHT,
		vh,
		PANEL_MARGIN
	);
	const launcherLeft = normalizedToPixel(
		quickActionsLauncherPositionX,
		LAUNCHER_SIZE,
		vw,
		PANEL_MARGIN
	);
	const launcherTop = normalizedToPixel(
		quickActionsLauncherPositionY,
		LAUNCHER_SIZE,
		vh,
		PANEL_MARGIN
	);

	// --- Audio controls ---
	const handleAudioToggle = () => {
		if (captureMode === 'file') {
			if (isPaused) resumeFileFromSystem();
			else pauseFileForSystem();
			return;
		}
		if (isPaused) resumeCapture();
		else pauseCapture();
	};

	const moveImage = (direction: -1 | 1) => {
		if (!backgroundImages.length) return;
		const currentIndex = imageIndex >= 0 ? imageIndex : 0;
		const nextIndex =
			(currentIndex + direction + backgroundImages.length) %
			backgroundImages.length;
		setActiveImageId(backgroundImages[nextIndex]?.assetId ?? null);
	};

	const progress =
		duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
	const statusLabel = captureMode === 'file' ? 'FILE' : 'LIVE';
	const imageLabel =
		backgroundImages.length > 0
			? `${Math.max(1, imageIndex + 1)}/${backgroundImages.length}`
			: '0/0';

	return (
		<div
			className="pointer-events-none fixed inset-0 z-[126]"
			style={{ ...themeVars, ...radiusVars }}
		>
			{/* ── Panel — conditionally mounted; no translate hack ── */}
			{isOpen && (
				<div
					className="pointer-events-auto absolute"
					style={{
						left: panelLeft,
						top: panelTop,
						height: PANEL_HEIGHT,
						width: panelWidth
					}}
				>
					<div
						className="relative flex h-full w-full flex-col border px-4 py-3 shadow-2xl"
						style={{
							borderRadius: 'var(--editor-radius-xl)',
							borderColor: 'var(--editor-shell-border)',
							background:
								'linear-gradient(180deg, color-mix(in srgb, var(--editor-hud-bg) 94%, transparent), color-mix(in srgb, var(--editor-shell-bg) 90%, transparent))',
							backdropFilter:
								'blur(var(--editor-shell-blur)) saturate(145%)',
							WebkitBackdropFilter:
								'blur(var(--editor-shell-blur)) saturate(145%)',
							boxShadow:
								'0 22px 48px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.07)'
						}}
					>
						{/* Top accent line */}
						<div
							className="pointer-events-none absolute inset-x-0 top-0 h-px"
							style={{
								borderRadius: 'var(--editor-radius-xl)',
								background:
									'linear-gradient(90deg, transparent, var(--editor-accent-color), transparent)',
								opacity: 0.5
							}}
						/>

						<div className="flex h-full flex-col gap-2.5">
							{/* Row 1: track info + feature toggles */}
							<div className="flex items-center gap-3">
								<div className="flex min-w-0 flex-1 items-center gap-2.5">
									<span
										className="shrink-0 inline-flex items-center border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.26em]"
										style={{
											borderRadius: 'var(--editor-radius-sm)',
											borderColor: 'var(--editor-tag-border)',
											background: 'var(--editor-tag-bg)',
											color: 'var(--editor-tag-fg)'
										}}
									>
										{statusLabel}
									</span>
									<div className="min-w-0 flex-1">
										<div
											className="truncate text-[12.5px] font-semibold leading-tight"
											style={{ color: 'var(--editor-accent-soft)' }}
											title={trackLabel}
										>
											{trackLabel}
										</div>
										<div
											className="text-[11px] tabular-nums"
											style={{ color: 'var(--editor-accent-muted)' }}
										>
											{formatClock(currentTime)}
											<span className="opacity-40"> / </span>
											{formatClock(duration)}
										</div>
									</div>
								</div>

								<div className="flex shrink-0 items-center gap-1">
									<QuickActionButton
										label="BASS"
										title={t.label_bass_zoom}
										active={imageBassReactive}
										onClick={() => setImageBassReactive(!imageBassReactive)}
									/>
									<QuickActionButton
										label="SPEC"
										title={t.tab_spectrum}
										active={spectrumEnabled}
										onClick={() => setSpectrumEnabled(!spectrumEnabled)}
									/>
									<QuickActionButton
										label="LOGO"
										title={t.tab_logo}
										active={logoEnabled}
										onClick={() => setLogoEnabled(!logoEnabled)}
									/>
									<QuickActionButton
										label="PART"
										title={t.tab_particles}
										active={particlesEnabled}
										onClick={() => setParticlesEnabled(!particlesEnabled)}
									/>
									<QuickActionButton
										label="RAIN"
										title={t.tab_rain}
										active={rainEnabled}
										onClick={() => setRainEnabled(!rainEnabled)}
									/>
								</div>
							</div>

							{/* Row 2: seek bar + image counter */}
							<div className="flex items-center gap-3">
								{/* Progress track + transparent range overlay */}
								<div className="relative min-w-0 flex-1">
									<div
										className="pointer-events-none h-1.5 overflow-hidden"
										style={{
											borderRadius: 'var(--editor-radius-sm)',
											background:
												'color-mix(in srgb, var(--editor-accent-border) 34%, transparent)'
										}}
									>
										<div
											className="h-full transition-[width] duration-150"
											style={{
												width: `${progress * 100}%`,
												borderRadius: 'var(--editor-radius-sm)',
												background:
													'linear-gradient(90deg, var(--editor-accent-color), color-mix(in srgb, var(--editor-accent-soft) 82%, var(--editor-accent-color)))',
												boxShadow:
													'0 0 12px color-mix(in srgb, var(--editor-accent-color) 30%, transparent)'
											}}
										/>
									</div>
									<input
										type="range"
										min={0}
										max={Math.max(duration, 0)}
										step={Math.max(duration / 1000, 0.05)}
										value={Math.min(currentTime, duration || 0)}
										onChange={event => seek(Number(event.target.value))}
										disabled={duration <= 0}
										className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-not-allowed"
										aria-label="Seek"
									/>
								</div>
								<div
									className="border px-2.5 py-1 text-[10px] font-medium tracking-[0.16em]"
									style={{
										borderRadius: 'var(--editor-radius-sm)',
										borderColor: 'var(--editor-tag-border)',
										background: 'var(--editor-tag-bg)',
										color: 'var(--editor-tag-fg)'
									}}
								>
									IMG {imageLabel}
								</div>
							</div>

							{/* Row 3: playback controls */}
							<div className="mt-auto flex flex-wrap items-center justify-between gap-2">
								<div className="flex flex-wrap items-center gap-1.5">
									<QuickActionButton
										label="IMG -"
										title={t.label_previous_image}
										disabled={!backgroundImages.length}
										onClick={() => moveImage(-1)}
									/>
									<QuickActionButton
										label="PREV"
										title={t.label_previous_track}
										onClick={() => void playPrevTrack()}
									/>
									<QuickActionButton
										label={isPaused ? 'PLAY' : 'PAUSE'}
										title={isPaused ? t.resume : t.pause}
										active={!isPaused}
										emphasis
										onClick={handleAudioToggle}
									/>
									<QuickActionButton
										label="NEXT"
										title={t.label_next_track}
										onClick={() => void playNextTrack()}
									/>
									<QuickActionButton
										label="IMG +"
										title={t.label_next_image}
										disabled={!backgroundImages.length}
										onClick={() => moveImage(1)}
									/>
								</div>
								<QuickActionButton
									label={motionPaused ? 'UNFREEZE' : 'FREEZE'}
									title={motionPaused ? t.resume_all : t.pause_all}
									active={!motionPaused}
									onClick={() => setMotionPaused(!motionPaused)}
								/>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ── Launcher — always rendered, independent position ── */}
			<button
				type="button"
				onClick={() => setIsOpen(prev => !prev)}
				title={t.label_quick_actions}
				aria-label={t.label_quick_actions}
				className="pointer-events-auto absolute z-10 flex items-center justify-center border shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
				style={{
					left: launcherLeft,
					top: launcherTop,
					height: LAUNCHER_SIZE,
					width: LAUNCHER_SIZE,
					borderRadius: '999px',
					borderColor: isOpen
						? 'var(--editor-button-border)'
						: 'var(--editor-shell-border)',
					background: isOpen
						? 'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 92%, transparent), color-mix(in srgb, var(--editor-shell-bg) 88%, transparent))'
						: 'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 82%, transparent), color-mix(in srgb, var(--editor-shell-bg) 86%, transparent))',
					color: 'var(--editor-accent-soft)',
					backdropFilter:
						'blur(var(--editor-shell-blur)) saturate(145%)',
					WebkitBackdropFilter:
						'blur(var(--editor-shell-blur)) saturate(145%)',
					boxShadow: isOpen
						? '0 18px 42px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)'
						: '0 18px 42px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)'
				}}
			>
				{logoUrl ? (
					<img
						src={logoUrl}
						alt=""
						className="h-10 w-10 rounded-full object-cover opacity-95 ring-1"
						style={{ borderColor: 'var(--editor-shell-border)' }}
					/>
				) : (
					<span className="text-lg font-semibold leading-none">
						{isOpen ? '×' : '◌'}
					</span>
				)}
			</button>
		</div>
	);
}
