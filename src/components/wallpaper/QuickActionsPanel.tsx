import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useAudioData } from '@/hooks/useAudioData';
import { useT } from '@/lib/i18n';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import { useWindowPresentationControls } from '@/hooks/useWindowPresentationControls';
import {
	EDITOR_THEME_CLASSES,
	getEditorRadiusVars,
	getScopedEditorThemeColorVars
} from '@/components/controls/editorTheme';

const PANEL_WIDTH = 808;
const PANEL_MIN_HEIGHT = 172;
const PANEL_MARGIN = 12;

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
	small?: boolean;
	onClick: () => void;
};

function QuickActionButton({
	label,
	title,
	active = false,
	emphasis = false,
	disabled = false,
	small = false,
	onClick
}: QuickActionButtonProps) {
	const editorTheme = useWallpaperStore(state => state.editorTheme);
	const isRainbow = editorTheme === 'rainbow';
	const rainbowLit = isRainbow && (active || emphasis);

	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			aria-label={title}
			disabled={disabled}
			className={`flex items-center justify-center border font-semibold uppercase tracking-[0.14em] transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 ${
				small
					? 'h-8 min-w-[52px] px-2 text-[10px]'
					: 'h-11 min-w-[60px] px-3 text-[11px]'
			} ${rainbowLit ? 'editor-rgb-theme-active' : ''}`}
			style={{
				borderRadius: 'var(--editor-radius-sm)',
				borderColor: active
					? 'var(--editor-button-border)'
					: 'color-mix(in srgb, var(--editor-shell-border) 72%, transparent)',
				background: rainbowLit
					? undefined
					: emphasis
						? 'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 92%, white 5%), color-mix(in srgb, var(--editor-shell-bg) 84%, transparent))'
						: active
							? 'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 84%, white 3%), color-mix(in srgb, var(--editor-shell-bg) 88%, transparent))'
							: 'linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))',
				color: rainbowLit
					? '#08080e'
					: emphasis
						? 'var(--editor-active-fg)'
						: active
							? 'var(--editor-accent-soft)'
							: 'color-mix(in srgb, var(--editor-accent-soft) 82%, white)',
				boxShadow: emphasis && !rainbowLit
					? '0 10px 26px color-mix(in srgb, var(--editor-accent-color) 24%, transparent)'
					: 'none'
			}}
		>
			{label}
		</button>
	);
}

const EDITOR_THEMES = [
	'cyber',
	'glass',
	'sunset',
	'terminal',
	'midnight',
	'carbon',
	'aurora',
	'rose',
	'ocean',
	'amber',
	'rainbow'
] as const;
type EditorThemeOption = (typeof EDITOR_THEMES)[number];

type ExpandPanel = 'layers' | 'shortcuts' | 'slots' | 'logo_slots' | 'themes' | null;

export default function QuickActionsPanel() {
	const t = useT();
	const [isOpen, setIsOpen] = useState(true);
	const [expandPanel, setExpandPanel] = useState<ExpandPanel>(null);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const panelRef = useRef<HTMLDivElement | null>(null);
	const launcherRef = useRef<HTMLButtonElement | null>(null);
	const [panelMeasuredHeight, setPanelMeasuredHeight] = useState(PANEL_MIN_HEIGHT);
	const [launcherMeasuredSize, setLauncherMeasuredSize] = useState(64);
	const [viewportSize, setViewportSize] = useState(() => ({
		width: typeof window === 'undefined' ? 1280 : window.innerWidth,
		height: typeof window === 'undefined' ? 720 : window.innerHeight
	}));

	useEffect(() => {
		const onResize = () =>
			setViewportSize({ width: window.innerWidth, height: window.innerHeight });
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	const s = useWallpaperStore(
		useShallow(state => ({
			// HUD theme/position
			quickActionsEnabled: state.quickActionsEnabled,
			quickActionsPositionX: state.quickActionsPositionX,
			quickActionsPositionY: state.quickActionsPositionY,
			quickActionsLauncherPositionX: state.quickActionsLauncherPositionX,
			quickActionsLauncherPositionY: state.quickActionsLauncherPositionY,
			quickActionsBackdropOpacity: state.quickActionsBackdropOpacity,
			quickActionsBlurPx: state.quickActionsBlurPx,
			quickActionsScale: state.quickActionsScale,
			quickActionsLauncherSize: state.quickActionsLauncherSize,
			quickActionsColorSource: state.quickActionsColorSource,
			setQuickActionsColorSource: state.setQuickActionsColorSource,
			quickActionsManualAccentColor: state.quickActionsManualAccentColor,
			quickActionsManualSecondaryColor: state.quickActionsManualSecondaryColor,
			quickActionsManualBackdropColor: state.quickActionsManualBackdropColor,
			quickActionsManualTextPrimaryColor: state.quickActionsManualTextPrimaryColor,
			quickActionsManualTextSecondaryColor: state.quickActionsManualTextSecondaryColor,
			quickActionsManualSurfaceOpacity: state.quickActionsManualSurfaceOpacity,
			editorTheme: state.editorTheme,
			editorCornerRadius: state.editorCornerRadius,
			logoUrl: state.logoUrl,
			// Image navigation
			backgroundImages: state.backgroundImages,
			activeImageId: state.activeImageId,
			setActiveImageId: state.setActiveImageId,
			// Audio tracks
			audioTracks: state.audioTracks,
			activeAudioTrackId: state.activeAudioTrackId,
			// Spectrum slots
			spectrumProfileSlots: state.spectrumProfileSlots,
			loadSpectrumProfileSlot: state.loadSpectrumProfileSlot,
			// Logo slots
			logoProfileSlots: state.logoProfileSlots,
			loadLogoProfileSlot: state.loadLogoProfileSlot,
			// ── LAYERS ──────────────────────────────────────────────
			backgroundImageEnabled: state.backgroundImageEnabled,
			setBackgroundImageEnabled: state.setBackgroundImageEnabled,
			globalBackgroundEnabled: state.globalBackgroundEnabled,
			setGlobalBackgroundEnabled: state.setGlobalBackgroundEnabled,
			slideshowEnabled: state.slideshowEnabled,
			setSlideshowEnabled: state.setSlideshowEnabled,
			spectrumEnabled: state.spectrumEnabled,
			setSpectrumEnabled: state.setSpectrumEnabled,
			logoEnabled: state.logoEnabled,
			setLogoEnabled: state.setLogoEnabled,
			audioTrackTitleEnabled: state.audioTrackTitleEnabled,
			setAudioTrackTitleEnabled: state.setAudioTrackTitleEnabled,
			audioTrackTimeEnabled: state.audioTrackTimeEnabled,
			setAudioTrackTimeEnabled: state.setAudioTrackTimeEnabled,
			particlesEnabled: state.particlesEnabled,
			setParticlesEnabled: state.setParticlesEnabled,
			particleLayerMode: state.particleLayerMode,
			setParticleLayerMode: state.setParticleLayerMode,
			rainEnabled: state.rainEnabled,
			setRainEnabled: state.setRainEnabled,
			overlays: state.overlays,
			updateOverlay: state.updateOverlay,
			// ── SHORTCUTS ────────────────────────────────────────────
			motionPaused: state.motionPaused,
			setMotionPaused: state.setMotionPaused,
			imageBassReactive: state.imageBassReactive,
			setImageBassReactive: state.setImageBassReactive,
			imageMirror: state.imageMirror,
			setImageMirror: state.setImageMirror,
			imageOpacityReactive: state.imageOpacityReactive,
			setImageOpacityReactive: state.setImageOpacityReactive,
			imageAudioSmoothingEnabled: state.imageAudioSmoothingEnabled,
			setImageAudioSmoothingEnabled: state.setImageAudioSmoothingEnabled,
			particleAudioReactive: state.particleAudioReactive,
			setParticleAudioReactive: state.setParticleAudioReactive,
			particleGlow: state.particleGlow,
			setParticleGlow: state.setParticleGlow,
			particleFadeInOut: state.particleFadeInOut,
			setParticleFadeInOut: state.setParticleFadeInOut,
			spectrumAudioSmoothingEnabled: state.spectrumAudioSmoothingEnabled,
			setSpectrumAudioSmoothingEnabled: state.setSpectrumAudioSmoothingEnabled,
			spectrumMirror: state.spectrumMirror,
			setSpectrumMirror: state.setSpectrumMirror,
			spectrumPeakHold: state.spectrumPeakHold,
			setSpectrumPeakHold: state.setSpectrumPeakHold,
			spectrumCircularClone: state.spectrumCircularClone,
			setSpectrumCircularClone: state.setSpectrumCircularClone,
			logoAudioSmoothingEnabled: state.logoAudioSmoothingEnabled,
			setLogoAudioSmoothingEnabled: state.setLogoAudioSmoothingEnabled,
			logoShadowEnabled: state.logoShadowEnabled,
			setLogoShadowEnabled: state.setLogoShadowEnabled,
			logoBackdropEnabled: state.logoBackdropEnabled,
			setLogoBackdropEnabled: state.setLogoBackdropEnabled,
			audioTrackTitleBackdropEnabled: state.audioTrackTitleBackdropEnabled,
			setAudioTrackTitleBackdropEnabled: state.setAudioTrackTitleBackdropEnabled,
			rgbShiftAudioReactive: state.rgbShiftAudioReactive,
			setRgbShiftAudioReactive: state.setRgbShiftAudioReactive,
			audioCrossfadeEnabled: state.audioCrossfadeEnabled,
			setAudioCrossfadeEnabled: state.setAudioCrossfadeEnabled,
			audioAutoAdvance: state.audioAutoAdvance,
			setAudioAutoAdvance: state.setAudioAutoAdvance,
			slideshowAudioCheckpointsEnabled: state.slideshowAudioCheckpointsEnabled,
			setSlideshowAudioCheckpointsEnabled: state.setSlideshowAudioCheckpointsEnabled,
			slideshowTrackChangeSyncEnabled: state.slideshowTrackChangeSyncEnabled,
			setSlideshowTrackChangeSyncEnabled: state.setSlideshowTrackChangeSyncEnabled,
			showFps: state.showFps,
			setShowFps: state.setShowFps,
			sleepModeEnabled: state.sleepModeEnabled,
			setSleepModeEnabled: state.setSleepModeEnabled,
			// Themes
			setEditorTheme: state.setEditorTheme
		}))
	);

	useEffect(() => {
		if (!panelRef.current) return undefined;
		const target = panelRef.current;
		const sync = () =>
			setPanelMeasuredHeight(
				Math.max(PANEL_MIN_HEIGHT, target.getBoundingClientRect().height)
			);
		sync();
		const observer = new ResizeObserver(sync);
		observer.observe(target);
		return () => observer.disconnect();
	}, [expandPanel, isOpen, s.quickActionsScale]);

	useEffect(() => {
		if (!launcherRef.current) return undefined;
		const target = launcherRef.current;
		const sync = () =>
			setLauncherMeasuredSize(
				Math.max(32, target.getBoundingClientRect().width)
			);
		sync();
		const observer = new ResizeObserver(sync);
		observer.observe(target);
		return () => observer.disconnect();
	}, [isOpen, s.quickActionsLauncherSize]);

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
	const { isFullscreen, fullscreenSupported, toggleFullscreen } =
		useWindowPresentationControls();

	const themeVars = getScopedEditorThemeColorVars(
		s.quickActionsColorSource,
		backgroundPalette,
		s.editorTheme,
		{
			accent: s.quickActionsManualAccentColor,
			secondary: s.quickActionsManualSecondaryColor,
			backdrop: s.quickActionsManualBackdropColor,
			textPrimary: s.quickActionsManualTextPrimaryColor,
			textSecondary: s.quickActionsManualTextSecondaryColor
		},
		{
			backdropOpacity: s.quickActionsBackdropOpacity,
			blurPx: s.quickActionsBlurPx,
			surfaceOpacity: s.quickActionsManualSurfaceOpacity
		}
	);
	const radiusVars = getEditorRadiusVars(s.editorCornerRadius);
	const theme = EDITOR_THEME_CLASSES[s.editorTheme];

	useEffect(() => {
		if (!s.quickActionsEnabled) return undefined;
		const tick = () => {
			setCurrentTime(getCurrentTime());
			setDuration(getDuration());
		};
		tick();
		const interval = window.setInterval(tick, isOpen ? 250 : 500);
		return () => window.clearInterval(interval);
	}, [getCurrentTime, getDuration, isOpen, s.quickActionsEnabled]);

	const imageIndex = useMemo(
		() => s.backgroundImages.findIndex(img => img.assetId === s.activeImageId),
		[s.activeImageId, s.backgroundImages]
	);

	const activeTrack = useMemo(
		() => s.audioTracks.find(track => track.id === s.activeAudioTrackId) ?? null,
		[s.audioTracks, s.activeAudioTrackId]
	);

	const enabledTracksCount = useMemo(
		() => s.audioTracks.filter(t => t.enabled).length,
		[s.audioTracks]
	);

	const isFileMode = captureMode === 'file';

	const trackLabel = useMemo(() => {
		if (captureMode === 'microphone') return 'MICROPHONE';
		if (captureMode === 'desktop') return 'LIVE INPUT';
		const runtimeName = getFileName().trim();
		if (runtimeName) return runtimeName;
		return activeTrack?.name?.trim() || 'Live Wallpaper Mix';
	}, [captureMode, activeTrack?.name, getFileName]);

	if (!s.quickActionsEnabled) return null;

	const vw = viewportSize.width;
	const vh = viewportSize.height;
	const panelWidth = Math.min(vw - PANEL_MARGIN * 2, PANEL_WIDTH);
	const scaledPanelWidth = panelWidth * s.quickActionsScale;
	const scaledPanelHeight = panelMeasuredHeight * s.quickActionsScale;
	const panelLeft = normalizedToPixel(
		s.quickActionsPositionX,
		scaledPanelWidth,
		vw,
		PANEL_MARGIN
	);
	const panelTop = normalizedToPixel(
		s.quickActionsPositionY,
		scaledPanelHeight,
		vh,
		PANEL_MARGIN
	);
	const launcherSizePx = Math.min(96, Math.max(32, s.quickActionsLauncherSize));
	const launcherIconPx = Math.round(launcherSizePx * 0.625);
	const launcherLeft = normalizedToPixel(
		s.quickActionsLauncherPositionX,
		launcherMeasuredSize,
		vw,
		PANEL_MARGIN
	);
	const launcherTop = normalizedToPixel(
		s.quickActionsLauncherPositionY,
		launcherMeasuredSize,
		vh,
		PANEL_MARGIN
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

	const moveImage = (dir: -1 | 1) => {
		if (!s.backgroundImages.length) return;
		const cur = imageIndex >= 0 ? imageIndex : 0;
		const next = (cur + dir + s.backgroundImages.length) % s.backgroundImages.length;
		s.setActiveImageId(s.backgroundImages[next]?.assetId ?? null);
	};

	// Particle layer helpers — same logic as LayersTab
	function setParticleLayerEnabled(target: 'background' | 'foreground', enabled: boolean) {
		if (target === 'background') {
			if (enabled) {
				s.setParticlesEnabled(true);
				if (s.particleLayerMode === 'foreground') s.setParticleLayerMode('both');
				else s.setParticleLayerMode('background');
			} else {
				if (!s.particlesEnabled) return;
				if (s.particleLayerMode === 'both') s.setParticleLayerMode('foreground');
				else if (s.particleLayerMode === 'background') s.setParticlesEnabled(false);
			}
		} else {
			if (enabled) {
				s.setParticlesEnabled(true);
				if (s.particleLayerMode === 'background') s.setParticleLayerMode('both');
				else s.setParticleLayerMode('foreground');
			} else {
				if (!s.particlesEnabled) return;
				if (s.particleLayerMode === 'both') s.setParticleLayerMode('background');
				else if (s.particleLayerMode === 'foreground') s.setParticlesEnabled(false);
			}
		}
	}

	const particleBgEnabled =
		s.particlesEnabled && (s.particleLayerMode === 'background' || s.particleLayerMode === 'both');
	const particleFgEnabled =
		s.particlesEnabled && (s.particleLayerMode === 'foreground' || s.particleLayerMode === 'both');

	// ── LAYERS list — mirrors LayersTab built-in layers ──────────────────────
	const builtinLayers = [
		{
			id: 'global-bg',
			label: 'GLOBAL BG',
			active: s.globalBackgroundEnabled,
			toggle: () => s.setGlobalBackgroundEnabled(!s.globalBackgroundEnabled)
		},
		{
			id: 'bg-image',
			label: 'BG IMAGE',
			active: s.backgroundImageEnabled,
			toggle: () => s.setBackgroundImageEnabled(!s.backgroundImageEnabled)
		},
		{
			id: 'slideshow',
			label: 'SLIDESHOW',
			active: s.slideshowEnabled,
			toggle: () => s.setSlideshowEnabled(!s.slideshowEnabled)
		},
		{
			id: 'spectrum',
			label: 'SPECTRUM',
			active: s.spectrumEnabled,
			toggle: () => s.setSpectrumEnabled(!s.spectrumEnabled)
		},
		{
			id: 'logo',
			label: 'LOGO',
			active: s.logoEnabled,
			toggle: () => s.setLogoEnabled(!s.logoEnabled)
		},
		{
			id: 'track-title',
			label: 'TITLE',
			active: s.audioTrackTitleEnabled,
			toggle: () => {
				const next = !s.audioTrackTitleEnabled;
				s.setAudioTrackTitleEnabled(next);
				if (!next) s.setAudioTrackTimeEnabled(false);
			}
		},
		{
			id: 'track-time',
			label: 'TIME',
			active: s.audioTrackTimeEnabled,
			toggle: () => s.setAudioTrackTimeEnabled(!s.audioTrackTimeEnabled)
		},
		{
			id: 'part-bg',
			label: 'PART BG',
			active: particleBgEnabled,
			toggle: () => setParticleLayerEnabled('background', !particleBgEnabled)
		},
		{
			id: 'part-fg',
			label: 'PART FG',
			active: particleFgEnabled,
			toggle: () => setParticleLayerEnabled('foreground', !particleFgEnabled)
		},
		{
			id: 'rain',
			label: 'RAIN',
			active: s.rainEnabled,
			toggle: () => s.setRainEnabled(!s.rainEnabled)
		}
	];

	const overlayLayers = s.overlays.map(ov => ({
		id: ov.id,
		label: (ov.name ?? 'OVERLAY').slice(0, 10).toUpperCase(),
		active: ov.enabled,
		toggle: () => s.updateOverlay(ov.id, { enabled: !ov.enabled })
	}));

	// ── SHORTCUTS — 24 useful toggles ───────────────────────────────────────
	const shortcuts = [
		{ label: 'BASS ZOOM',   title: 'Image Bass Reactive Zoom',   active: s.imageBassReactive,                 toggle: () => s.setImageBassReactive(!s.imageBassReactive) },
		{ label: 'FREEZE',      title: 'Freeze / Resume motion',      active: !s.motionPaused,                    toggle: () => s.setMotionPaused(!s.motionPaused) },
		{ label: 'MIRROR',      title: 'Mirror background image',     active: s.imageMirror,                      toggle: () => s.setImageMirror(!s.imageMirror) },
		{ label: 'IMG OPAC',    title: 'Image opacity audio reactive',active: s.imageOpacityReactive,             toggle: () => s.setImageOpacityReactive(!s.imageOpacityReactive) },
		{ label: 'IMG SMOOTH',  title: 'Image audio smoothing',       active: s.imageAudioSmoothingEnabled,       toggle: () => s.setImageAudioSmoothingEnabled(!s.imageAudioSmoothingEnabled) },
		{ label: 'PART AUDIO',  title: 'Particles audio reactive',    active: s.particleAudioReactive,            toggle: () => s.setParticleAudioReactive(!s.particleAudioReactive) },
		{ label: 'PART GLOW',   title: 'Particle glow',               active: s.particleGlow,                     toggle: () => s.setParticleGlow(!s.particleGlow) },
		{ label: 'PART FADE',   title: 'Particle fade in/out',        active: s.particleFadeInOut,                toggle: () => s.setParticleFadeInOut(!s.particleFadeInOut) },
		{ label: 'SPEC MIRROR', title: 'Spectrum mirror',             active: s.spectrumMirror,                   toggle: () => s.setSpectrumMirror(!s.spectrumMirror) },
		{ label: 'SPEC PEAK',   title: 'Spectrum peak hold',          active: s.spectrumPeakHold,                 toggle: () => s.setSpectrumPeakHold(!s.spectrumPeakHold) },
		{ label: 'SPEC SMOOTH', title: 'Spectrum audio smoothing',    active: s.spectrumAudioSmoothingEnabled,    toggle: () => s.setSpectrumAudioSmoothingEnabled(!s.spectrumAudioSmoothingEnabled) },
		{ label: 'SPEC CLONE',  title: 'Spectrum circular clone',     active: s.spectrumCircularClone,            toggle: () => s.setSpectrumCircularClone(!s.spectrumCircularClone) },
		{ label: 'LOGO SMOOTH', title: 'Logo audio smoothing',        active: s.logoAudioSmoothingEnabled,        toggle: () => s.setLogoAudioSmoothingEnabled(!s.logoAudioSmoothingEnabled) },
		{ label: 'LOGO SHADOW', title: 'Logo shadow',                 active: s.logoShadowEnabled,                toggle: () => s.setLogoShadowEnabled(!s.logoShadowEnabled) },
		{ label: 'LOGO BACK',   title: 'Logo backdrop',               active: s.logoBackdropEnabled,              toggle: () => s.setLogoBackdropEnabled(!s.logoBackdropEnabled) },
		{ label: 'TITLE BACK',  title: 'Track title backdrop',        active: s.audioTrackTitleBackdropEnabled,   toggle: () => s.setAudioTrackTitleBackdropEnabled(!s.audioTrackTitleBackdropEnabled) },
		{ label: 'RGB AUDIO',   title: 'RGB shift audio reactive',    active: s.rgbShiftAudioReactive,            toggle: () => s.setRgbShiftAudioReactive(!s.rgbShiftAudioReactive) },
		{ label: 'CROSSFADE',   title: 'Audio crossfade',             active: s.audioCrossfadeEnabled,            toggle: () => s.setAudioCrossfadeEnabled(!s.audioCrossfadeEnabled) },
		{ label: 'AUTO NEXT',   title: 'Auto-advance to next track',  active: s.audioAutoAdvance,                 toggle: () => s.setAudioAutoAdvance(!s.audioAutoAdvance) },
		{ label: 'SLIDE AUDIO', title: 'Slideshow audio checkpoints', active: s.slideshowAudioCheckpointsEnabled, toggle: () => s.setSlideshowAudioCheckpointsEnabled(!s.slideshowAudioCheckpointsEnabled) },
		{ label: 'TRACK SYNC',  title: 'Slideshow track change sync', active: s.slideshowTrackChangeSyncEnabled,  toggle: () => s.setSlideshowTrackChangeSyncEnabled(!s.slideshowTrackChangeSyncEnabled) },
		{ label: 'FPS',         title: 'Show FPS counter',            active: s.showFps,                          toggle: () => s.setShowFps(!s.showFps) },
		{ label: 'SLEEP',       title: 'Sleep mode',                  active: s.sleepModeEnabled,                 toggle: () => s.setSleepModeEnabled(!s.sleepModeEnabled) },
		{ label: 'FULLSCREEN',  title: 'Toggle fullscreen',           active: isFullscreen,                       toggle: () => void toggleFullscreen() }
	];

	const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
	const statusLabel = captureMode === 'file' ? 'FILE' : 'LIVE';
	const imageLabel =
		s.backgroundImages.length > 0
			? `${Math.max(1, imageIndex + 1)}/${s.backgroundImages.length}`
			: '0/0';

	const toggleExpand = (panel: Exclude<ExpandPanel, null>) => {
		setExpandPanel(prev => (prev === panel ? null : panel));
	};

	return (
		<div
			className="pointer-events-none fixed inset-0 z-[126]"
			style={{ ...themeVars, ...radiusVars }}
		>
			{isOpen && (
				<div
					className="pointer-events-auto absolute"
					ref={panelRef}
					style={{
						left: panelLeft,
						top: panelTop,
						minHeight: PANEL_MIN_HEIGHT,
						width: panelWidth,
						transformOrigin: 'top left',
						transform: s.quickActionsScale !== 1 ? `scale(${s.quickActionsScale})` : undefined
					}}
				>
					<div
						className={`relative flex w-full flex-col border px-4 py-3 shadow-2xl ${s.editorTheme === 'rainbow' ? theme.panelShell : ''}`}
						style={{
							borderRadius: 'var(--editor-radius-xl)',
							borderColor: 'var(--editor-shell-border)',
							background: s.editorTheme === 'rainbow'
								? undefined
								: 'linear-gradient(180deg, color-mix(in srgb, var(--editor-hud-bg) 94%, transparent), color-mix(in srgb, var(--editor-shell-bg) 90%, transparent))',
							backdropFilter: 'blur(var(--editor-shell-blur)) saturate(145%)',
							WebkitBackdropFilter: 'blur(var(--editor-shell-blur)) saturate(145%)',
							boxShadow: '0 22px 48px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.07)'
						}}
					>

						<div className="flex flex-col gap-2.5">
							{/* ── Row 1: track info + panel toggle buttons ── */}
							<div className="flex items-center gap-3">
								<div className="flex min-w-0 flex-1 items-center gap-2.5">
									<span
										className={`shrink-0 inline-flex items-center border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.26em] ${s.editorTheme === 'rainbow' ? 'editor-rgb-theme-active border-transparent' : ''}`}
										style={{
											borderRadius: 'var(--editor-radius-sm)',
											borderColor: s.editorTheme !== 'rainbow' ? 'var(--editor-tag-border)' : undefined,
											background: s.editorTheme !== 'rainbow' ? 'var(--editor-tag-bg)' : undefined,
											color: s.editorTheme === 'rainbow' ? '#08080e' : 'var(--editor-tag-fg)'
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
										{isFileMode && (
											<div
												className="text-[11px] tabular-nums"
												style={{ color: 'var(--editor-accent-muted)' }}
											>
												{formatClock(currentTime)}
												<span className="opacity-40"> / </span>
												{formatClock(duration)}
											</div>
										)}
									</div>
								</div>

								<div className="flex shrink-0 items-center gap-1">
									{fullscreenSupported && (
										<QuickActionButton
											label={isFullscreen ? 'EXIT FS' : 'FULL'}
											title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
											active={isFullscreen}
											onClick={() => void toggleFullscreen()}
										/>
									)}
									<QuickActionButton
										label="LAYERS"
										title="Toggle layer visibility"
										active={expandPanel === 'layers'}
										onClick={() => toggleExpand('layers')}
									/>
									<QuickActionButton
										label="ATAJOS"
										title="Frequent shortcuts"
										active={expandPanel === 'shortcuts'}
										onClick={() => toggleExpand('shortcuts')}
									/>
									<QuickActionButton
										label="THEME"
										title="Editor & HUD theme"
										active={expandPanel === 'themes'}
										onClick={() => toggleExpand('themes')}
									/>
									<QuickActionButton
										label="SPECTRUM"
										title="Spectrum preset slots"
										active={expandPanel === 'slots'}
										disabled={s.spectrumProfileSlots.length === 0}
										onClick={() => toggleExpand('slots')}
									/>
									<QuickActionButton
										label="LOGO"
										title="Logo preset slots"
										active={expandPanel === 'logo_slots'}
										disabled={s.logoProfileSlots.length === 0}
										onClick={() => toggleExpand('logo_slots')}
									/>
								</div>
							</div>

							{/* ── LAYERS panel ── */}
							{expandPanel === 'layers' && (
								<div className="flex flex-wrap items-center gap-1">
									{[...builtinLayers, ...overlayLayers].map(layer => (
										<QuickActionButton
											key={layer.id}
											label={layer.label}
											title={layer.label}
											active={layer.active}
											small
											onClick={layer.toggle}
										/>
									))}
								</div>
							)}

							{/* ── ATAJOS panel ── */}
							{expandPanel === 'shortcuts' && (
								<div className="flex flex-wrap items-center gap-1">
									{shortcuts.map(sc => (
										<QuickActionButton
											key={sc.label}
											label={sc.label}
											title={sc.title}
											active={sc.active}
											small
											onClick={sc.toggle}
										/>
									))}
								</div>
							)}

							{/* ── SPECTRUM SLOTS panel ── */}
							{expandPanel === 'slots' && s.spectrumProfileSlots.length > 0 && (
								<div className="flex flex-wrap items-center gap-1.5">
									{s.spectrumProfileSlots.map((slot, index) => (
										<button
											key={index}
											type="button"
											onClick={() => s.loadSpectrumProfileSlot(index)}
											className="flex items-center gap-1.5 border px-2.5 py-1 text-[10.5px] font-medium transition-all duration-150 hover:-translate-y-0.5"
											style={{
												borderRadius: 'var(--editor-radius-md)',
												borderColor: 'var(--editor-accent-border)',
												background:
													'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 72%, transparent), color-mix(in srgb, var(--editor-shell-bg) 82%, transparent))',
												color: 'var(--editor-accent-soft)'
											}}
											title={`Load: ${slot.name}`}
										>
											<span style={{ color: 'var(--editor-accent-muted)' }}>
												{String(index + 1).padStart(2, '0')}
											</span>
											<span className="max-w-[140px] truncate">{slot.name}</span>
											<span
												className="text-[9px] font-bold uppercase tracking-wider"
												style={{ color: 'var(--editor-accent-color)' }}
											>
												LOAD
											</span>
										</button>
									))}
								</div>
							)}

							{/* ── LOGO SLOTS panel ── */}
							{expandPanel === 'logo_slots' && s.logoProfileSlots.length > 0 && (
								<div className="flex flex-wrap items-center gap-1.5">
									{s.logoProfileSlots.map((slot, index) => (
										<button
											key={index}
											type="button"
											onClick={() => s.loadLogoProfileSlot(index)}
											className="flex items-center gap-1.5 border px-2.5 py-1 text-[10.5px] font-medium transition-all duration-150 hover:-translate-y-0.5"
											style={{
												borderRadius: 'var(--editor-radius-md)',
												borderColor: 'var(--editor-accent-border)',
												background:
													'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 72%, transparent), color-mix(in srgb, var(--editor-shell-bg) 82%, transparent))',
												color: 'var(--editor-accent-soft)'
											}}
											title={`Load: ${slot.name}`}
										>
											<span style={{ color: 'var(--editor-accent-muted)' }}>
												{String(index + 1).padStart(2, '0')}
											</span>
											<span className="max-w-[140px] truncate">{slot.name}</span>
											<span
												className="text-[9px] font-bold uppercase tracking-wider"
												style={{ color: 'var(--editor-accent-color)' }}
											>
												LOAD
											</span>
										</button>
									))}
								</div>
							)}

							{/* ── THEMES panel ── */}
							{expandPanel === 'themes' && (
								<div className="flex flex-col gap-1.5">
									<div className="flex flex-wrap items-center gap-1">
										{EDITOR_THEMES.map(theme => (
											<QuickActionButton
												key={theme}
												label={theme.toUpperCase()}
												title={`Theme: ${theme}`}
												active={s.editorTheme === theme}
												small
												onClick={() => s.setEditorTheme(theme as EditorThemeOption)}
											/>
										))}
									</div>
									<div className="flex items-center gap-1">
										{(['manual', 'theme', 'background'] as const).map(src => (
											<QuickActionButton
												key={src}
												label={src === 'manual' ? 'MANUAL' : src === 'theme' ? 'THEME' : 'BG IMG'}
												title={`Color source: ${src}`}
												active={s.quickActionsColorSource === src}
												small
												onClick={() => s.setQuickActionsColorSource(src)}
											/>
										))}
									</div>
								</div>
							)}

							{/* ── Row 2: seek bar (file only) + image counter ── */}
							<div className="flex items-center gap-3">
								{isFileMode ? (
									<div className="relative min-w-0 flex-1">
										<div
											className="pointer-events-none h-1.5 overflow-hidden"
											style={{
												borderRadius: 'var(--editor-radius-sm)',
												background: 'color-mix(in srgb, var(--editor-accent-border) 34%, transparent)'
											}}
										>
											<div
												className={`h-full transition-[width] duration-150 ${s.editorTheme === 'rainbow' ? 'editor-rgb-theme-active' : ''}`}
												style={{
													width: `${progress * 100}%`,
													borderRadius: 'var(--editor-radius-sm)',
													background: s.editorTheme !== 'rainbow'
														? 'linear-gradient(90deg, var(--editor-accent-color), color-mix(in srgb, var(--editor-accent-soft) 82%, var(--editor-accent-color)))'
														: undefined,
													boxShadow: s.editorTheme !== 'rainbow'
														? '0 0 12px color-mix(in srgb, var(--editor-accent-color) 30%, transparent)'
														: undefined
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
								) : (
									<div className="min-w-0 flex-1" />
								)}
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

							{/* ── Row 3: playback controls ── */}
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div className="flex flex-wrap items-center gap-1.5">
									<QuickActionButton
										label="IMG -"
										title={t.label_previous_image}
										disabled={!s.backgroundImages.length}
										onClick={() => moveImage(-1)}
									/>
									<QuickActionButton
										label="PREV"
										title={t.label_previous_track}
										disabled={!isFileMode || enabledTracksCount <= 1}
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
										disabled={!isFileMode || enabledTracksCount <= 1}
										onClick={() => void playNextTrack()}
									/>
									<QuickActionButton
										label="IMG +"
										title={t.label_next_image}
										disabled={!s.backgroundImages.length}
										onClick={() => moveImage(1)}
									/>
								</div>
								<QuickActionButton
									label={s.motionPaused ? 'UNFREEZE' : 'FREEZE'}
									title={s.motionPaused ? t.resume_all : t.pause_all}
									active={!s.motionPaused}
									onClick={() => s.setMotionPaused(!s.motionPaused)}
								/>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ── Launcher ── */}
			<button
				ref={launcherRef}
				type="button"
				onClick={() => setIsOpen(prev => !prev)}
				title={t.label_quick_actions}
				aria-label={t.label_quick_actions}
				className={`pointer-events-auto absolute z-10 flex items-center justify-center border shadow-2xl transition-all duration-300 hover:-translate-y-0.5 ${s.editorTheme === 'rainbow' ? theme.launcher : ''}`}
				style={{
					left: launcherLeft,
					top: launcherTop,
					height: launcherSizePx,
					width: launcherSizePx,
					borderRadius: '999px',
					borderColor: isOpen ? 'var(--editor-button-border)' : 'var(--editor-shell-border)',
					background: s.editorTheme !== 'rainbow'
						? isOpen
							? 'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 92%, transparent), color-mix(in srgb, var(--editor-shell-bg) 88%, transparent))'
							: 'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 82%, transparent), color-mix(in srgb, var(--editor-shell-bg) 86%, transparent))'
						: undefined,
					color: 'var(--editor-accent-soft)',
					backdropFilter: 'blur(var(--editor-shell-blur)) saturate(145%)',
					WebkitBackdropFilter: 'blur(var(--editor-shell-blur)) saturate(145%)',
					boxShadow: isOpen
						? '0 18px 42px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)'
						: '0 18px 42px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)'
				}}
			>
				{s.logoUrl ? (
					<img
						src={s.logoUrl}
						alt=""
						className="rounded-full object-cover opacity-95 ring-1"
						style={{ width: launcherIconPx, height: launcherIconPx, borderColor: 'var(--editor-shell-border)' }}
					/>
				) : (
					<span
						className="font-semibold leading-none"
						style={{ fontSize: Math.round(launcherSizePx * 0.28) }}
					>
						{isOpen ? '×' : '◌'}
					</span>
				)}
			</button>
		</div>
	);
}
