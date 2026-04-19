import type { QuickActionButtonProps } from '@/components/wallpaper/quickActions/QuickActionButton';
import {
	EDITOR_THEMES,
	type EditorThemeOption
} from '@/components/wallpaper/quickActions/quickActionsShared';
import {
	Image as ImageIcon,
	Images,
	AudioWaveform,
	Type,
	Clock,
	Sparkles,
	CloudRain,
	Layers,
	Globe,
	FlipHorizontal,
	Droplets,
	Waves,
	CircleDashed,
	TrendingUp,
	Wand2,
	Circle,
	Sun,
	Square,
	SlidersHorizontal,
	Moon,
	Zap,
	SkipForward,
	Activity,
	Gauge,
	Maximize2,
	Palette,
	Shuffle,
	Monitor,
	Repeat,
	MapPin,
	Crosshair,
	Target,
	Eye,
	EyeOff,
	Ruler,
	FolderTree,
	Cpu,
	Smartphone,
	Radio
} from 'lucide-react';

const ICON_SZ = 11;

function makeIcon(
	Component: React.ComponentType<{ size?: number; strokeWidth?: number }>
) {
	return <Component size={ICON_SZ} strokeWidth={2.25} />;
}

// ──────────────────────────────────────────────────────────────────────────
// CAPAS (visibility)
// ──────────────────────────────────────────────────────────────────────────

type BuildLayerActionsOptions = {
	globalBackgroundEnabled: boolean;
	setGlobalBackgroundEnabled: (value: boolean) => void;
	backgroundImageEnabled: boolean;
	setBackgroundImageEnabled: (value: boolean) => void;
	slideshowEnabled: boolean;
	setSlideshowEnabled: (value: boolean) => void;
	spectrumEnabled: boolean;
	setSpectrumEnabled: (value: boolean) => void;
	logoEnabled: boolean;
	setLogoEnabled: (value: boolean) => void;
	audioTrackTitleEnabled: boolean;
	setAudioTrackTitleEnabled: (value: boolean) => void;
	audioTrackTimeEnabled: boolean;
	setAudioTrackTimeEnabled: (value: boolean) => void;
	particleBgEnabled: boolean;
	setParticleBgEnabled: (value: boolean) => void;
	particleFgEnabled: boolean;
	setParticleFgEnabled: (value: boolean) => void;
	rainEnabled: boolean;
	setRainEnabled: (value: boolean) => void;
	overlayLayers: Array<{
		id: string;
		label: string;
		active: boolean;
		onClick: () => void;
	}>;
};

export function buildLayerActions({
	globalBackgroundEnabled,
	setGlobalBackgroundEnabled,
	backgroundImageEnabled,
	setBackgroundImageEnabled,
	slideshowEnabled,
	setSlideshowEnabled,
	spectrumEnabled,
	setSpectrumEnabled,
	logoEnabled,
	setLogoEnabled,
	audioTrackTitleEnabled,
	setAudioTrackTitleEnabled,
	audioTrackTimeEnabled,
	setAudioTrackTimeEnabled,
	particleBgEnabled,
	setParticleBgEnabled,
	particleFgEnabled,
	setParticleFgEnabled,
	rainEnabled,
	setRainEnabled,
	overlayLayers
}: BuildLayerActionsOptions): QuickActionButtonProps[] {
	return [
		{
			label: 'GLOBAL BG',
			title: 'Global background',
			icon: makeIcon(Globe),
			active: globalBackgroundEnabled,
			small: true,
			onClick: () => setGlobalBackgroundEnabled(!globalBackgroundEnabled)
		},
		{
			label: 'BG IMAGE',
			title: 'Background image',
			icon: makeIcon(ImageIcon),
			active: backgroundImageEnabled,
			small: true,
			onClick: () => setBackgroundImageEnabled(!backgroundImageEnabled)
		},
		{
			label: 'SLIDESHOW',
			title: 'Auto-cycle images',
			icon: makeIcon(Images),
			active: slideshowEnabled,
			small: true,
			onClick: () => setSlideshowEnabled(!slideshowEnabled)
		},
		{
			label: 'SPECTRUM',
			title: 'Spectrum visualizer',
			icon: makeIcon(AudioWaveform),
			active: spectrumEnabled,
			small: true,
			onClick: () => setSpectrumEnabled(!spectrumEnabled)
		},
		{
			label: 'LOGO',
			title: 'Logo layer',
			icon: makeIcon(Circle),
			active: logoEnabled,
			small: true,
			onClick: () => setLogoEnabled(!logoEnabled)
		},
		{
			label: 'TITLE',
			title: 'Track title',
			icon: makeIcon(Type),
			active: audioTrackTitleEnabled,
			small: true,
			onClick: () => {
				const nextValue = !audioTrackTitleEnabled;
				setAudioTrackTitleEnabled(nextValue);
				if (!nextValue) setAudioTrackTimeEnabled(false);
			}
		},
		{
			label: 'TIME',
			title: 'Track time',
			icon: makeIcon(Clock),
			active: audioTrackTimeEnabled,
			small: true,
			onClick: () => setAudioTrackTimeEnabled(!audioTrackTimeEnabled)
		},
		{
			label: 'PART BG',
			title: 'Background particles',
			icon: makeIcon(Sparkles),
			active: particleBgEnabled,
			small: true,
			onClick: () => setParticleBgEnabled(!particleBgEnabled)
		},
		{
			label: 'PART FG',
			title: 'Foreground particles',
			icon: makeIcon(Sparkles),
			active: particleFgEnabled,
			small: true,
			onClick: () => setParticleFgEnabled(!particleFgEnabled)
		},
		{
			label: 'RAIN',
			title: 'Rain',
			icon: makeIcon(CloudRain),
			active: rainEnabled,
			small: true,
			onClick: () => setRainEnabled(!rainEnabled)
		},
		...overlayLayers.map(
			layer =>
				({
					label: layer.label,
					title: layer.label,
					icon: makeIcon(Layers),
					active: layer.active,
					small: true,
					onClick: layer.onClick
				}) satisfies QuickActionButtonProps
		)
	];
}

// ──────────────────────────────────────────────────────────────────────────
// LOOKS (image / filters)
// ──────────────────────────────────────────────────────────────────────────

type BuildLooksActionsOptions = {
	imageBassReactive: boolean;
	setImageBassReactive: (value: boolean) => void;
	imageMirror: boolean;
	setImageMirror: (value: boolean) => void;
	imageOpacityReactive: boolean;
	setImageOpacityReactive: (value: boolean) => void;
	imageAudioSmoothingEnabled: boolean;
	setImageAudioSmoothingEnabled: (value: boolean) => void;
	rgbShiftAudioReactive: boolean;
	setRgbShiftAudioReactive: (value: boolean) => void;
	rgbShiftAudioSmoothingEnabled: boolean;
	setRgbShiftAudioSmoothingEnabled: (value: boolean) => void;
};

export function buildLooksActions(
	o: BuildLooksActionsOptions
): QuickActionButtonProps[] {
	return [
		{
			label: 'BASS ZOOM',
			title: 'Image bass reactive zoom',
			icon: makeIcon(TrendingUp),
			active: o.imageBassReactive,
			small: true,
			onClick: () => o.setImageBassReactive(!o.imageBassReactive)
		},
		{
			label: 'MIRROR',
			title: 'Mirror background image',
			icon: makeIcon(FlipHorizontal),
			active: o.imageMirror,
			small: true,
			onClick: () => o.setImageMirror(!o.imageMirror)
		},
		{
			label: 'IMG OPAC',
			title: 'Image opacity audio reactive',
			icon: makeIcon(Droplets),
			active: o.imageOpacityReactive,
			small: true,
			onClick: () => o.setImageOpacityReactive(!o.imageOpacityReactive)
		},
		{
			label: 'IMG SMOOTH',
			title: 'Image audio smoothing',
			icon: makeIcon(Waves),
			active: o.imageAudioSmoothingEnabled,
			small: true,
			onClick: () =>
				o.setImageAudioSmoothingEnabled(
					!o.imageAudioSmoothingEnabled
				)
		},
		{
			label: 'RGB AUDIO',
			title: 'RGB shift audio reactive',
			icon: makeIcon(Zap),
			active: o.rgbShiftAudioReactive,
			small: true,
			onClick: () => o.setRgbShiftAudioReactive(!o.rgbShiftAudioReactive)
		},
		{
			label: 'RGB SMOOTH',
			title: 'RGB shift audio smoothing',
			icon: makeIcon(Waves),
			active: o.rgbShiftAudioSmoothingEnabled,
			small: true,
			onClick: () =>
				o.setRgbShiftAudioSmoothingEnabled(
					!o.rgbShiftAudioSmoothingEnabled
				)
		}
	];
}

// ──────────────────────────────────────────────────────────────────────────
// SPECTRUM
// ──────────────────────────────────────────────────────────────────────────

type BuildSpectrumActionsOptions = {
	spectrumMirror: boolean;
	setSpectrumMirror: (value: boolean) => void;
	spectrumPeakHold: boolean;
	setSpectrumPeakHold: (value: boolean) => void;
	spectrumAudioSmoothingEnabled: boolean;
	setSpectrumAudioSmoothingEnabled: (value: boolean) => void;
	spectrumFollowLogo: boolean;
	setSpectrumFollowLogo: (value: boolean) => void;
	spectrumRadialFitLogo: boolean;
	setSpectrumRadialFitLogo: (value: boolean) => void;
	spectrumCircularClone: boolean;
	setSpectrumCircularClone: (value: boolean) => void;
	spectrumCloneMirror: boolean;
	setSpectrumCloneMirror: (value: boolean) => void;
	spectrumClonePeakHold: boolean;
	setSpectrumClonePeakHold: (value: boolean) => void;
	spectrumCloneAudioSmoothingEnabled: boolean;
	setSpectrumCloneAudioSmoothingEnabled: (value: boolean) => void;
	spectrumCloneFollowLogo: boolean;
	setSpectrumCloneFollowLogo: (value: boolean) => void;
	spectrumCloneRadialFitLogo: boolean;
	setSpectrumCloneRadialFitLogo: (value: boolean) => void;
};

export function buildSpectrumActions(
	o: BuildSpectrumActionsOptions
): QuickActionButtonProps[] {
	return [
		{
			label: 'MIRROR',
			title: 'Spectrum mirror',
			icon: makeIcon(FlipHorizontal),
			active: o.spectrumMirror,
			small: true,
			onClick: () => o.setSpectrumMirror(!o.spectrumMirror)
		},
		{
			label: 'PEAK',
			title: 'Spectrum peak hold',
			icon: makeIcon(TrendingUp),
			active: o.spectrumPeakHold,
			small: true,
			onClick: () => o.setSpectrumPeakHold(!o.spectrumPeakHold)
		},
		{
			label: 'SMOOTH',
			title: 'Spectrum audio smoothing',
			icon: makeIcon(Waves),
			active: o.spectrumAudioSmoothingEnabled,
			small: true,
			onClick: () =>
				o.setSpectrumAudioSmoothingEnabled(
					!o.spectrumAudioSmoothingEnabled
				)
		},
		{
			label: 'FOLLOW LOGO',
			title: 'Spectrum follows logo position',
			icon: makeIcon(Target),
			active: o.spectrumFollowLogo,
			small: true,
			onClick: () => o.setSpectrumFollowLogo(!o.spectrumFollowLogo)
		},
		{
			label: 'FIT LOGO',
			title: 'Spectrum radial fits logo size',
			icon: makeIcon(Crosshair),
			active: o.spectrumRadialFitLogo,
			small: true,
			onClick: () => o.setSpectrumRadialFitLogo(!o.spectrumRadialFitLogo)
		},
		{
			label: 'CLONE',
			title: 'Spectrum circular clone',
			icon: makeIcon(CircleDashed),
			active: o.spectrumCircularClone,
			small: true,
			onClick: () =>
				o.setSpectrumCircularClone(!o.spectrumCircularClone)
		},
		{
			label: 'CLN MIRROR',
			title: 'Clone: mirror',
			icon: makeIcon(FlipHorizontal),
			active: o.spectrumCloneMirror,
			small: true,
			disabled: !o.spectrumCircularClone,
			onClick: () => o.setSpectrumCloneMirror(!o.spectrumCloneMirror)
		},
		{
			label: 'CLN PEAK',
			title: 'Clone: peak hold',
			icon: makeIcon(TrendingUp),
			active: o.spectrumClonePeakHold,
			small: true,
			disabled: !o.spectrumCircularClone,
			onClick: () => o.setSpectrumClonePeakHold(!o.spectrumClonePeakHold)
		},
		{
			label: 'CLN SMOOTH',
			title: 'Clone: audio smoothing',
			icon: makeIcon(Waves),
			active: o.spectrumCloneAudioSmoothingEnabled,
			small: true,
			disabled: !o.spectrumCircularClone,
			onClick: () =>
				o.setSpectrumCloneAudioSmoothingEnabled(
					!o.spectrumCloneAudioSmoothingEnabled
				)
		},
		{
			label: 'CLN FOLLOW',
			title: 'Clone: follow logo',
			icon: makeIcon(Target),
			active: o.spectrumCloneFollowLogo,
			small: true,
			disabled: !o.spectrumCircularClone,
			onClick: () =>
				o.setSpectrumCloneFollowLogo(!o.spectrumCloneFollowLogo)
		},
		{
			label: 'CLN FIT',
			title: 'Clone: radial fits logo',
			icon: makeIcon(Crosshair),
			active: o.spectrumCloneRadialFitLogo,
			small: true,
			disabled: !o.spectrumCircularClone,
			onClick: () =>
				o.setSpectrumCloneRadialFitLogo(
					!o.spectrumCloneRadialFitLogo
				)
		}
	];
}

// ──────────────────────────────────────────────────────────────────────────
// MOTION (particles + rain)
// ──────────────────────────────────────────────────────────────────────────

type BuildMotionActionsOptions = {
	motionPaused: boolean;
	setMotionPaused: (value: boolean) => void;
	particleAudioReactive: boolean;
	setParticleAudioReactive: (value: boolean) => void;
	particleGlow: boolean;
	setParticleGlow: (value: boolean) => void;
	particleFadeInOut: boolean;
	setParticleFadeInOut: (value: boolean) => void;
};

export function buildMotionActions(
	o: BuildMotionActionsOptions
): QuickActionButtonProps[] {
	return [
		{
			label: o.motionPaused ? 'UNFREEZE' : 'FREEZE',
			title: o.motionPaused ? 'Resume motion' : 'Freeze motion',
			icon: makeIcon(o.motionPaused ? Sun : Moon),
			active: o.motionPaused,
			small: true,
			onClick: () => o.setMotionPaused(!o.motionPaused)
		},
		{
			label: 'PART AUDIO',
			title: 'Particles audio reactive',
			icon: makeIcon(Activity),
			active: o.particleAudioReactive,
			small: true,
			onClick: () =>
				o.setParticleAudioReactive(!o.particleAudioReactive)
		},
		{
			label: 'PART GLOW',
			title: 'Particle glow',
			icon: makeIcon(Sun),
			active: o.particleGlow,
			small: true,
			onClick: () => o.setParticleGlow(!o.particleGlow)
		},
		{
			label: 'PART FADE',
			title: 'Particle fade in/out',
			icon: makeIcon(Wand2),
			active: o.particleFadeInOut,
			small: true,
			onClick: () => o.setParticleFadeInOut(!o.particleFadeInOut)
		}
	];
}

// ──────────────────────────────────────────────────────────────────────────
// AUDIO
// ──────────────────────────────────────────────────────────────────────────

type BuildAudioActionsOptions = {
	audioReactive: boolean;
	setAudioReactive: (value: boolean) => void;
	audioCrossfadeEnabled: boolean;
	setAudioCrossfadeEnabled: (value: boolean) => void;
	audioAutoAdvance: boolean;
	setAudioAutoAdvance: (value: boolean) => void;
	audioFileLoop: boolean;
	setAudioFileLoop: (value: boolean) => void;
	mediaSessionEnabled: boolean;
	setMediaSessionEnabled: (value: boolean) => void;
	slideshowAudioCheckpointsEnabled: boolean;
	setSlideshowAudioCheckpointsEnabled: (value: boolean) => void;
	slideshowTrackChangeSyncEnabled: boolean;
	setSlideshowTrackChangeSyncEnabled: (value: boolean) => void;
	slideshowManualTimestampsEnabled: boolean;
	setSlideshowManualTimestampsEnabled: (value: boolean) => void;
	slideshowResetPosition: boolean;
	setSlideshowResetPosition: (value: boolean) => void;
};

export function buildAudioActions(
	o: BuildAudioActionsOptions
): QuickActionButtonProps[] {
	return [
		{
			label: 'REACTIVE',
			title: 'Audio reactive',
			icon: makeIcon(Activity),
			active: o.audioReactive,
			small: true,
			onClick: () => o.setAudioReactive(!o.audioReactive)
		},
		{
			label: 'CROSSFADE',
			title: 'Audio crossfade',
			icon: makeIcon(Shuffle),
			active: o.audioCrossfadeEnabled,
			small: true,
			onClick: () =>
				o.setAudioCrossfadeEnabled(!o.audioCrossfadeEnabled)
		},
		{
			label: 'AUTO NEXT',
			title: 'Auto-advance to next track',
			icon: makeIcon(SkipForward),
			active: o.audioAutoAdvance,
			small: true,
			onClick: () => o.setAudioAutoAdvance(!o.audioAutoAdvance)
		},
		{
			label: 'LOOP',
			title: 'Repeat current track',
			icon: makeIcon(Repeat),
			active: o.audioFileLoop,
			small: true,
			onClick: () => o.setAudioFileLoop(!o.audioFileLoop)
		},
		{
			label: 'MEDIA KEYS',
			title: 'OS media keys (Media Session)',
			icon: makeIcon(Radio),
			active: o.mediaSessionEnabled,
			small: true,
			onClick: () => o.setMediaSessionEnabled(!o.mediaSessionEnabled)
		},
		{
			label: 'SLIDE AUDIO',
			title: 'Slideshow audio checkpoints',
			icon: makeIcon(Images),
			active: o.slideshowAudioCheckpointsEnabled,
			small: true,
			onClick: () =>
				o.setSlideshowAudioCheckpointsEnabled(
					!o.slideshowAudioCheckpointsEnabled
				)
		},
		{
			label: 'TRACK SYNC',
			title: 'Slideshow track change sync',
			icon: makeIcon(Shuffle),
			active: o.slideshowTrackChangeSyncEnabled,
			small: true,
			onClick: () =>
				o.setSlideshowTrackChangeSyncEnabled(
					!o.slideshowTrackChangeSyncEnabled
				)
		},
		{
			label: 'MANUAL TS',
			title: 'Slideshow manual timestamps',
			icon: makeIcon(MapPin),
			active: o.slideshowManualTimestampsEnabled,
			small: true,
			onClick: () =>
				o.setSlideshowManualTimestampsEnabled(
					!o.slideshowManualTimestampsEnabled
				)
		},
		{
			label: 'RESET POS',
			title: 'Slideshow reset track position',
			icon: makeIcon(SkipForward),
			active: o.slideshowResetPosition,
			small: true,
			onClick: () =>
				o.setSlideshowResetPosition(!o.slideshowResetPosition)
		}
	];
}

// ──────────────────────────────────────────────────────────────────────────
// LOGO
// ──────────────────────────────────────────────────────────────────────────

type BuildLogoActionsOptions = {
	logoAudioSmoothingEnabled: boolean;
	setLogoAudioSmoothingEnabled: (value: boolean) => void;
	logoShadowEnabled: boolean;
	setLogoShadowEnabled: (value: boolean) => void;
	logoBackdropEnabled: boolean;
	setLogoBackdropEnabled: (value: boolean) => void;
};

export function buildLogoActions(
	o: BuildLogoActionsOptions
): QuickActionButtonProps[] {
	return [
		{
			label: 'SMOOTH',
			title: 'Logo audio smoothing',
			icon: makeIcon(Waves),
			active: o.logoAudioSmoothingEnabled,
			small: true,
			onClick: () =>
				o.setLogoAudioSmoothingEnabled(!o.logoAudioSmoothingEnabled)
		},
		{
			label: 'SHADOW',
			title: 'Logo shadow',
			icon: makeIcon(Moon),
			active: o.logoShadowEnabled,
			small: true,
			onClick: () => o.setLogoShadowEnabled(!o.logoShadowEnabled)
		},
		{
			label: 'BACKDROP',
			title: 'Logo backdrop',
			icon: makeIcon(Square),
			active: o.logoBackdropEnabled,
			small: true,
			onClick: () => o.setLogoBackdropEnabled(!o.logoBackdropEnabled)
		}
	];
}

// ──────────────────────────────────────────────────────────────────────────
// TRACK TITLE
// ──────────────────────────────────────────────────────────────────────────

type BuildTitleActionsOptions = {
	audioTrackTitleBackdropEnabled: boolean;
	setAudioTrackTitleBackdropEnabled: (value: boolean) => void;
	audioTrackTitleUppercase: boolean;
	setAudioTrackTitleUppercase: (value: boolean) => void;
};

export function buildTitleActions(
	o: BuildTitleActionsOptions
): QuickActionButtonProps[] {
	return [
		{
			label: 'BACKDROP',
			title: 'Track title backdrop',
			icon: makeIcon(Square),
			active: o.audioTrackTitleBackdropEnabled,
			small: true,
			onClick: () =>
				o.setAudioTrackTitleBackdropEnabled(
					!o.audioTrackTitleBackdropEnabled
				)
		},
		{
			label: 'UPPERCASE',
			title: 'Track title uppercase',
			icon: makeIcon(Type),
			active: o.audioTrackTitleUppercase,
			small: true,
			onClick: () =>
				o.setAudioTrackTitleUppercase(!o.audioTrackTitleUppercase)
		}
	];
}

// ──────────────────────────────────────────────────────────────────────────
// SYSTEM
// ──────────────────────────────────────────────────────────────────────────

type BuildSystemActionsOptions = {
	showFps: boolean;
	setShowFps: (value: boolean) => void;
	sleepModeEnabled: boolean;
	setSleepModeEnabled: (value: boolean) => void;
	isFullscreen: boolean;
	toggleFullscreen: () => void;
	layoutResponsiveEnabled: boolean;
	setLayoutResponsiveEnabled: (value: boolean) => void;
	layoutBackgroundReframeEnabled: boolean;
	setLayoutBackgroundReframeEnabled: (value: boolean) => void;
	performanceSafeEnabled: boolean;
	setPerformanceSafeEnabled: (value: boolean) => void;
	virtualFoldersEnabled: boolean;
	setVirtualFoldersEnabled: (value: boolean) => void;
	showBackgroundScaleMeter: boolean;
	setShowBackgroundScaleMeter: (value: boolean) => void;
	showSpectrumDiagnosticsHud: boolean;
	setShowSpectrumDiagnosticsHud: (value: boolean) => void;
	showLogoDiagnosticsHud: boolean;
	setShowLogoDiagnosticsHud: (value: boolean) => void;
};

export function buildSystemActions(
	o: BuildSystemActionsOptions
): QuickActionButtonProps[] {
	return [
		{
			label: 'FULLSCREEN',
			title: 'Toggle fullscreen',
			icon: makeIcon(Maximize2),
			active: o.isFullscreen,
			small: true,
			onClick: o.toggleFullscreen
		},
		{
			label: 'FPS',
			title: 'Show FPS counter',
			icon: makeIcon(Gauge),
			active: o.showFps,
			small: true,
			onClick: () => o.setShowFps(!o.showFps)
		},
		{
			label: 'SLEEP',
			title: 'Sleep mode',
			icon: makeIcon(Moon),
			active: o.sleepModeEnabled,
			small: true,
			onClick: () => o.setSleepModeEnabled(!o.sleepModeEnabled)
		},
		{
			label: 'PERF SAFE',
			title: 'Performance safe mode',
			icon: makeIcon(Cpu),
			active: o.performanceSafeEnabled,
			small: true,
			onClick: () =>
				o.setPerformanceSafeEnabled(!o.performanceSafeEnabled)
		},
		{
			label: 'RESPONSIVE',
			title: 'Responsive layout',
			icon: makeIcon(Smartphone),
			active: o.layoutResponsiveEnabled,
			small: true,
			onClick: () =>
				o.setLayoutResponsiveEnabled(!o.layoutResponsiveEnabled)
		},
		{
			label: 'BG REFRAME',
			title: 'Background reframe on resize',
			icon: makeIcon(Ruler),
			active: o.layoutBackgroundReframeEnabled,
			small: true,
			onClick: () =>
				o.setLayoutBackgroundReframeEnabled(
					!o.layoutBackgroundReframeEnabled
				)
		},
		{
			label: 'FOLDERS',
			title: 'Virtual folders for library',
			icon: makeIcon(FolderTree),
			active: o.virtualFoldersEnabled,
			small: true,
			onClick: () =>
				o.setVirtualFoldersEnabled(!o.virtualFoldersEnabled)
		},
		{
			label: 'BG METER',
			title: 'Show background scale meter',
			icon: makeIcon(Ruler),
			active: o.showBackgroundScaleMeter,
			small: true,
			onClick: () =>
				o.setShowBackgroundScaleMeter(!o.showBackgroundScaleMeter)
		},
		{
			label: 'SPEC DIAG',
			title: 'Spectrum diagnostics HUD',
			icon: makeIcon(o.showSpectrumDiagnosticsHud ? Eye : EyeOff),
			active: o.showSpectrumDiagnosticsHud,
			small: true,
			onClick: () =>
				o.setShowSpectrumDiagnosticsHud(
					!o.showSpectrumDiagnosticsHud
				)
		},
		{
			label: 'LOGO DIAG',
			title: 'Logo diagnostics HUD',
			icon: makeIcon(o.showLogoDiagnosticsHud ? Eye : EyeOff),
			active: o.showLogoDiagnosticsHud,
			small: true,
			onClick: () =>
				o.setShowLogoDiagnosticsHud(!o.showLogoDiagnosticsHud)
		}
	];
}

// ──────────────────────────────────────────────────────────────────────────
// THEMES
// ──────────────────────────────────────────────────────────────────────────

type BuildThemeActionsOptions = {
	editorTheme: EditorThemeOption;
	setEditorTheme: (value: EditorThemeOption) => void;
	editorThemeColorSource: 'manual' | 'theme' | 'image';
	syncAllColorSources: (value: 'manual' | 'theme' | 'image') => void;
};

const THEME_ICONS: Record<
	string,
	React.ComponentType<{ size?: number; strokeWidth?: number }>
> = {
	cyber: Zap,
	glass: Square,
	sunset: Sun,
	terminal: Monitor,
	midnight: Moon,
	carbon: Square,
	aurora: Palette,
	rose: Palette,
	ocean: Waves,
	amber: Sun,
	rainbow: Palette
};

export function buildThemeActions({
	editorTheme,
	setEditorTheme,
	editorThemeColorSource,
	syncAllColorSources
}: BuildThemeActionsOptions) {
	return {
		themeActions: EDITOR_THEMES.map(
			theme =>
				({
					label: theme.toUpperCase(),
					title: `Theme: ${theme}`,
					icon: makeIcon(THEME_ICONS[theme] ?? Palette),
					active: editorTheme === theme,
					small: true,
					onClick: () => setEditorTheme(theme as EditorThemeOption)
				}) satisfies QuickActionButtonProps
		),
		colorSourceActions: (['manual', 'theme', 'image'] as const).map(
			source => ({
				label:
					source === 'manual'
						? 'MANUAL'
						: source === 'theme'
							? 'THEME'
							: 'BG IMG',
				title: `Color source: ${source}`,
				icon: makeIcon(
					source === 'manual'
						? SlidersHorizontal
						: source === 'theme'
							? Palette
							: ImageIcon
				),
				active: editorThemeColorSource === source,
				small: true,
				onClick: () => syncAllColorSources(source)
			})
		)
	};
}
