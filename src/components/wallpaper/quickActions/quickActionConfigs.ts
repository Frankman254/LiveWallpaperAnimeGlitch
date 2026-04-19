import type { QuickActionButtonProps } from '@/components/wallpaper/quickActions/QuickActionButton';
import {
	EDITOR_THEMES,
	type EditorThemeOption
} from '@/components/wallpaper/quickActions/quickActionsShared';

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

type BuildShortcutActionsOptions = {
	imageBassReactive: boolean;
	setImageBassReactive: (value: boolean) => void;
	motionPaused: boolean;
	setMotionPaused: (value: boolean) => void;
	imageMirror: boolean;
	setImageMirror: (value: boolean) => void;
	imageOpacityReactive: boolean;
	setImageOpacityReactive: (value: boolean) => void;
	imageAudioSmoothingEnabled: boolean;
	setImageAudioSmoothingEnabled: (value: boolean) => void;
	particleAudioReactive: boolean;
	setParticleAudioReactive: (value: boolean) => void;
	particleGlow: boolean;
	setParticleGlow: (value: boolean) => void;
	particleFadeInOut: boolean;
	setParticleFadeInOut: (value: boolean) => void;
	spectrumMirror: boolean;
	setSpectrumMirror: (value: boolean) => void;
	spectrumPeakHold: boolean;
	setSpectrumPeakHold: (value: boolean) => void;
	spectrumAudioSmoothingEnabled: boolean;
	setSpectrumAudioSmoothingEnabled: (value: boolean) => void;
	spectrumCircularClone: boolean;
	setSpectrumCircularClone: (value: boolean) => void;
	logoAudioSmoothingEnabled: boolean;
	setLogoAudioSmoothingEnabled: (value: boolean) => void;
	logoShadowEnabled: boolean;
	setLogoShadowEnabled: (value: boolean) => void;
	logoBackdropEnabled: boolean;
	setLogoBackdropEnabled: (value: boolean) => void;
	audioTrackTitleBackdropEnabled: boolean;
	setAudioTrackTitleBackdropEnabled: (value: boolean) => void;
	rgbShiftAudioReactive: boolean;
	setRgbShiftAudioReactive: (value: boolean) => void;
	audioCrossfadeEnabled: boolean;
	setAudioCrossfadeEnabled: (value: boolean) => void;
	audioAutoAdvance: boolean;
	setAudioAutoAdvance: (value: boolean) => void;
	slideshowAudioCheckpointsEnabled: boolean;
	setSlideshowAudioCheckpointsEnabled: (value: boolean) => void;
	slideshowTrackChangeSyncEnabled: boolean;
	setSlideshowTrackChangeSyncEnabled: (value: boolean) => void;
	showFps: boolean;
	setShowFps: (value: boolean) => void;
	sleepModeEnabled: boolean;
	setSleepModeEnabled: (value: boolean) => void;
	isFullscreen: boolean;
	toggleFullscreen: () => void;
};

type BuildThemeActionsOptions = {
	editorTheme: EditorThemeOption;
	setEditorTheme: (value: EditorThemeOption) => void;
	// Uses the global color source (same one as the editor) so the HUD and
	// editor always stay in the same color mode.
	editorThemeColorSource: 'manual' | 'theme' | 'image';
	syncAllColorSources: (value: 'manual' | 'theme' | 'image') => void;
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
			title: 'GLOBAL BG',
			active: globalBackgroundEnabled,
			small: true,
			onClick: () => setGlobalBackgroundEnabled(!globalBackgroundEnabled)
		},
		{
			label: 'BG IMAGE',
			title: 'BG IMAGE',
			active: backgroundImageEnabled,
			small: true,
			onClick: () => setBackgroundImageEnabled(!backgroundImageEnabled)
		},
		{
			label: 'SLIDESHOW',
			title: 'SLIDESHOW',
			active: slideshowEnabled,
			small: true,
			onClick: () => setSlideshowEnabled(!slideshowEnabled)
		},
		{
			label: 'SPECTRUM',
			title: 'SPECTRUM',
			active: spectrumEnabled,
			small: true,
			onClick: () => setSpectrumEnabled(!spectrumEnabled)
		},
		{
			label: 'LOGO',
			title: 'LOGO',
			active: logoEnabled,
			small: true,
			onClick: () => setLogoEnabled(!logoEnabled)
		},
		{
			label: 'TITLE',
			title: 'TITLE',
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
			title: 'TIME',
			active: audioTrackTimeEnabled,
			small: true,
			onClick: () => setAudioTrackTimeEnabled(!audioTrackTimeEnabled)
		},
		{
			label: 'PART BG',
			title: 'PART BG',
			active: particleBgEnabled,
			small: true,
			onClick: () => setParticleBgEnabled(!particleBgEnabled)
		},
		{
			label: 'PART FG',
			title: 'PART FG',
			active: particleFgEnabled,
			small: true,
			onClick: () => setParticleFgEnabled(!particleFgEnabled)
		},
		{
			label: 'RAIN',
			title: 'RAIN',
			active: rainEnabled,
			small: true,
			onClick: () => setRainEnabled(!rainEnabled)
		},
		...overlayLayers.map(layer => ({
			label: layer.label,
			title: layer.label,
			active: layer.active,
			small: true,
			onClick: layer.onClick
		}))
	];
}

export function buildShortcutActions({
	imageBassReactive,
	setImageBassReactive,
	motionPaused,
	setMotionPaused,
	imageMirror,
	setImageMirror,
	imageOpacityReactive,
	setImageOpacityReactive,
	imageAudioSmoothingEnabled,
	setImageAudioSmoothingEnabled,
	particleAudioReactive,
	setParticleAudioReactive,
	particleGlow,
	setParticleGlow,
	particleFadeInOut,
	setParticleFadeInOut,
	spectrumMirror,
	setSpectrumMirror,
	spectrumPeakHold,
	setSpectrumPeakHold,
	spectrumAudioSmoothingEnabled,
	setSpectrumAudioSmoothingEnabled,
	spectrumCircularClone,
	setSpectrumCircularClone,
	logoAudioSmoothingEnabled,
	setLogoAudioSmoothingEnabled,
	logoShadowEnabled,
	setLogoShadowEnabled,
	logoBackdropEnabled,
	setLogoBackdropEnabled,
	audioTrackTitleBackdropEnabled,
	setAudioTrackTitleBackdropEnabled,
	rgbShiftAudioReactive,
	setRgbShiftAudioReactive,
	audioCrossfadeEnabled,
	setAudioCrossfadeEnabled,
	audioAutoAdvance,
	setAudioAutoAdvance,
	slideshowAudioCheckpointsEnabled,
	setSlideshowAudioCheckpointsEnabled,
	slideshowTrackChangeSyncEnabled,
	setSlideshowTrackChangeSyncEnabled,
	showFps,
	setShowFps,
	sleepModeEnabled,
	setSleepModeEnabled,
	isFullscreen,
	toggleFullscreen
}: BuildShortcutActionsOptions): QuickActionButtonProps[] {
	return [
		{
			label: 'BASS ZOOM',
			title: 'Image Bass Reactive Zoom',
			active: imageBassReactive,
			small: true,
			onClick: () => setImageBassReactive(!imageBassReactive)
		},
		{
			label: 'FREEZE',
			title: 'Freeze / Resume motion',
			active: !motionPaused,
			small: true,
			onClick: () => setMotionPaused(!motionPaused)
		},
		{
			label: 'MIRROR',
			title: 'Mirror background image',
			active: imageMirror,
			small: true,
			onClick: () => setImageMirror(!imageMirror)
		},
		{
			label: 'IMG OPAC',
			title: 'Image opacity audio reactive',
			active: imageOpacityReactive,
			small: true,
			onClick: () => setImageOpacityReactive(!imageOpacityReactive)
		},
		{
			label: 'IMG SMOOTH',
			title: 'Image audio smoothing',
			active: imageAudioSmoothingEnabled,
			small: true,
			onClick: () =>
				setImageAudioSmoothingEnabled(!imageAudioSmoothingEnabled)
		},
		{
			label: 'PART AUDIO',
			title: 'Particles audio reactive',
			active: particleAudioReactive,
			small: true,
			onClick: () => setParticleAudioReactive(!particleAudioReactive)
		},
		{
			label: 'PART GLOW',
			title: 'Particle glow',
			active: particleGlow,
			small: true,
			onClick: () => setParticleGlow(!particleGlow)
		},
		{
			label: 'PART FADE',
			title: 'Particle fade in/out',
			active: particleFadeInOut,
			small: true,
			onClick: () => setParticleFadeInOut(!particleFadeInOut)
		},
		{
			label: 'SPEC MIRROR',
			title: 'Spectrum mirror',
			active: spectrumMirror,
			small: true,
			onClick: () => setSpectrumMirror(!spectrumMirror)
		},
		{
			label: 'SPEC PEAK',
			title: 'Spectrum peak hold',
			active: spectrumPeakHold,
			small: true,
			onClick: () => setSpectrumPeakHold(!spectrumPeakHold)
		},
		{
			label: 'SPEC SMOOTH',
			title: 'Spectrum audio smoothing',
			active: spectrumAudioSmoothingEnabled,
			small: true,
			onClick: () =>
				setSpectrumAudioSmoothingEnabled(!spectrumAudioSmoothingEnabled)
		},
		{
			label: 'SPEC CLONE',
			title: 'Spectrum circular clone',
			active: spectrumCircularClone,
			small: true,
			onClick: () => setSpectrumCircularClone(!spectrumCircularClone)
		},
		{
			label: 'LOGO SMOOTH',
			title: 'Logo audio smoothing',
			active: logoAudioSmoothingEnabled,
			small: true,
			onClick: () =>
				setLogoAudioSmoothingEnabled(!logoAudioSmoothingEnabled)
		},
		{
			label: 'LOGO SHADOW',
			title: 'Logo shadow',
			active: logoShadowEnabled,
			small: true,
			onClick: () => setLogoShadowEnabled(!logoShadowEnabled)
		},
		{
			label: 'LOGO BACK',
			title: 'Logo backdrop',
			active: logoBackdropEnabled,
			small: true,
			onClick: () => setLogoBackdropEnabled(!logoBackdropEnabled)
		},
		{
			label: 'TITLE BACK',
			title: 'Track title backdrop',
			active: audioTrackTitleBackdropEnabled,
			small: true,
			onClick: () =>
				setAudioTrackTitleBackdropEnabled(
					!audioTrackTitleBackdropEnabled
				)
		},
		{
			label: 'RGB AUDIO',
			title: 'RGB shift audio reactive',
			active: rgbShiftAudioReactive,
			small: true,
			onClick: () => setRgbShiftAudioReactive(!rgbShiftAudioReactive)
		},
		{
			label: 'CROSSFADE',
			title: 'Audio crossfade',
			active: audioCrossfadeEnabled,
			small: true,
			onClick: () => setAudioCrossfadeEnabled(!audioCrossfadeEnabled)
		},
		{
			label: 'AUTO NEXT',
			title: 'Auto-advance to next track',
			active: audioAutoAdvance,
			small: true,
			onClick: () => setAudioAutoAdvance(!audioAutoAdvance)
		},
		{
			label: 'SLIDE AUDIO',
			title: 'Slideshow audio checkpoints',
			active: slideshowAudioCheckpointsEnabled,
			small: true,
			onClick: () =>
				setSlideshowAudioCheckpointsEnabled(
					!slideshowAudioCheckpointsEnabled
				)
		},
		{
			label: 'TRACK SYNC',
			title: 'Slideshow track change sync',
			active: slideshowTrackChangeSyncEnabled,
			small: true,
			onClick: () =>
				setSlideshowTrackChangeSyncEnabled(
					!slideshowTrackChangeSyncEnabled
				)
		},
		{
			label: 'FPS',
			title: 'Show FPS counter',
			active: showFps,
			small: true,
			onClick: () => setShowFps(!showFps)
		},
		{
			label: 'SLEEP',
			title: 'Sleep mode',
			active: sleepModeEnabled,
			small: true,
			onClick: () => setSleepModeEnabled(!sleepModeEnabled)
		},
		{
			label: 'FULLSCREEN',
			title: 'Toggle fullscreen',
			active: isFullscreen,
			small: true,
			onClick: toggleFullscreen
		}
	];
}

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
				active: editorThemeColorSource === source,
				small: true,
				onClick: () => syncAllColorSources(source)
			})
		)
	};
}
