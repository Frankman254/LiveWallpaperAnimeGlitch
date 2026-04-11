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

const PANEL_WIDTH = 808;
const PANEL_HEIGHT = 172;
const PANEL_MARGIN = 12;
const LAUNCHER_SIZE = 64;

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

type QuickActionButtonProps = {
	label: string;
	title: string;
	active?: boolean;
	emphasis?: boolean;
	disabled?: boolean;
	onClick: () => void;
};

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
	const [open, setOpen] = useState(true);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
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

	useEffect(() => {
		if (!quickActionsEnabled) return undefined;
		const tick = () => {
			setCurrentTime(getCurrentTime());
			setDuration(getDuration());
		};
		tick();
		const interval = window.setInterval(tick, open ? 250 : 500);
		return () => window.clearInterval(interval);
	}, [getCurrentTime, getDuration, open, quickActionsEnabled]);

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

	const viewportWidth =
		typeof window === 'undefined' ? 1280 : window.innerWidth;
	const viewportHeight =
		typeof window === 'undefined' ? 720 : window.innerHeight;
	const panelWidth = Math.min(viewportWidth - PANEL_MARGIN * 2, PANEL_WIDTH);
	const panelLeft = clamp(
		viewportWidth - panelWidth - 20 + quickActionsPositionX,
		PANEL_MARGIN,
		viewportWidth - panelWidth - PANEL_MARGIN
	);
	const panelTop = clamp(
		viewportHeight - PANEL_HEIGHT - 20 + quickActionsPositionY,
		PANEL_MARGIN,
		viewportHeight - PANEL_HEIGHT - PANEL_MARGIN
	);
	const launcherLeft = clamp(
		viewportWidth - LAUNCHER_SIZE - 20 + quickActionsLauncherPositionX,
		PANEL_MARGIN,
		viewportWidth - LAUNCHER_SIZE - PANEL_MARGIN
	);
	const launcherTop = clamp(
		viewportHeight - LAUNCHER_SIZE - 20 + quickActionsLauncherPositionY,
		PANEL_MARGIN,
		viewportHeight - LAUNCHER_SIZE - PANEL_MARGIN
	);

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
			style={{
				...themeVars,
				...radiusVars
			}}
		>
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
					className="absolute inset-y-0 left-0 transition-transform duration-300 ease-out"
					style={{ transform: open ? 'translateX(0)' : 'translateX(108%)' }}
				>
					<div
						className="flex h-full w-full flex-col border px-4 py-3 shadow-2xl"
						style={{
							borderRadius: 'var(--editor-radius-xl)',
							borderColor: 'var(--editor-shell-border)',
							background:
								'linear-gradient(180deg, color-mix(in srgb, var(--editor-hud-bg) 92%, transparent), color-mix(in srgb, var(--editor-shell-bg) 88%, transparent))',
							backdropFilter:
								'blur(var(--editor-shell-blur)) saturate(145%)',
							WebkitBackdropFilter:
								'blur(var(--editor-shell-blur)) saturate(145%)',
							boxShadow:
								'0 22px 48px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.06)'
						}}
					>
						<div className="flex h-full flex-col gap-3">
							<div className="flex items-start justify-between gap-3">
								<div className="flex min-w-0 flex-1 items-start gap-3">
									<span
										className="inline-flex items-center border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.26em]"
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
											className="truncate text-[13px] font-semibold"
											style={{ color: 'var(--editor-accent-soft)' }}
											title={trackLabel}
										>
											{trackLabel}
										</div>
										<div
											className="mt-0.5 text-[12px]"
											style={{ color: 'var(--editor-accent-muted)' }}
										>
											{formatClock(currentTime)} / {formatClock(duration)}
										</div>
									</div>
								</div>

								<div className="flex flex-wrap items-center justify-end gap-1.5">
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

							<div className="flex items-center gap-3">
								<input
									type="range"
									min={0}
									max={Math.max(duration, 0)}
									step={Math.max(duration / 500, 0.1)}
									value={Math.min(currentTime, duration || 0)}
									onChange={event => seek(Number(event.target.value))}
									disabled={duration <= 0}
									className="h-2 min-w-0 flex-1 cursor-pointer appearance-none bg-transparent"
									style={{
										accentColor: 'var(--editor-accent-color)'
									}}
								/>
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

							<div
								className="h-1.5 overflow-hidden"
								style={{
									borderRadius: 'var(--editor-radius-sm)',
									background:
										'color-mix(in srgb, var(--editor-accent-border) 34%, transparent)'
								}}
							>
								<div
									className="h-full transition-[width] duration-200"
									style={{
										width: `${progress * 100}%`,
										borderRadius: 'var(--editor-radius-sm)',
										background:
											'linear-gradient(90deg, var(--editor-accent-color), color-mix(in srgb, var(--editor-accent-soft) 82%, var(--editor-accent-color)))',
										boxShadow:
											'0 0 18px color-mix(in srgb, var(--editor-accent-color) 34%, transparent)'
									}}
								/>
							</div>

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
			</div>

			<button
				type="button"
				onClick={() => setOpen(current => !current)}
				title={t.label_quick_actions}
				aria-label={t.label_quick_actions}
				className="pointer-events-auto absolute z-10 flex items-center justify-center border shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
				style={{
					left: launcherLeft,
					top: launcherTop,
					height: LAUNCHER_SIZE,
					width: LAUNCHER_SIZE,
					borderRadius: '999px',
					borderColor: 'var(--editor-shell-border)',
					background:
						'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 82%, transparent), color-mix(in srgb, var(--editor-shell-bg) 86%, transparent))',
					color: 'var(--editor-accent-soft)',
					backdropFilter:
						'blur(var(--editor-shell-blur)) saturate(145%)',
					WebkitBackdropFilter:
						'blur(var(--editor-shell-blur)) saturate(145%)',
					boxShadow:
						'0 18px 42px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)'
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
						{open ? '×' : '◌'}
					</span>
				)}
			</button>
		</div>
	);
}
