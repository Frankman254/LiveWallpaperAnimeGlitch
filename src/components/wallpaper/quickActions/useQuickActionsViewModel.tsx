import { useCallback, useMemo } from 'react';
import {
	Maximize2,
	Minimize2,
	Layers,
	Palette,
	AudioWaveform,
	Circle,
	Sparkles,
	Music2,
	Type as TypeIcon,
	Image as ImageIcon,
	Cpu
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import type { QuickActionsState } from '@/components/wallpaper/quickActions/useQuickActionsState';
import type { ExpandPanel } from '@/components/wallpaper/quickActions/quickActionsShared';
import {
	buildLayerActions,
	buildLooksActions,
	buildSpectrumActions,
	buildMotionActions,
	buildAudioActions,
	buildLogoActions,
	buildTitleActions,
	buildSystemActions,
	buildThemeActions
} from '@/components/wallpaper/quickActions/quickActionConfigs';

type QuickActionsAudioControls = {
	captureMode: 'none' | 'desktop' | 'microphone' | 'file';
	isPaused: boolean;
	pauseCapture: () => void;
	resumeCapture: () => void;
	pauseFileForSystem: () => void;
	resumeFileFromSystem: () => void;
	playNextTrack: () => void | Promise<void>;
	playPrevTrack: () => void | Promise<void>;
	getFileName: () => string;
};

type UseQuickActionsViewModelOptions = {
	state: QuickActionsState;
	t: ReturnType<typeof useT>;
	audio: QuickActionsAudioControls;
	expandPanel: ExpandPanel;
	toggleExpand: (panel: Exclude<ExpandPanel, null>) => void;
	isFullscreen: boolean;
	fullscreenSupported: boolean;
	toggleFullscreen: () => void | Promise<void>;
};

export function useQuickActionsViewModel({
	state,
	t,
	audio,
	expandPanel,
	toggleExpand,
	isFullscreen,
	fullscreenSupported,
	toggleFullscreen
}: UseQuickActionsViewModelOptions) {
	const imageIndex = useMemo(
		() =>
			state.backgroundImages.findIndex(
				image => image.assetId === state.activeImageId
			),
		[state]
	);

	const activeTrack = useMemo(
		() =>
			state.audioTracks.find(
				track => track.id === state.activeAudioTrackId
			) ?? null,
		[state]
	);

	const enabledTracksCount = useMemo(
		() => state.audioTracks.filter(track => track.enabled).length,
		[state]
	);

	const isFileMode = audio.captureMode === 'file';
	const trackLabel = useMemo(() => {
		if (audio.captureMode === 'microphone') return 'MICROPHONE';
		if (audio.captureMode === 'desktop') return 'LIVE INPUT';
		const runtimeName = audio.getFileName().trim();
		const raw = runtimeName || activeTrack?.name?.trim() || '';
		if (!raw) return 'Live Wallpaper Mix';
		// Strip file extension (.mp3/.wav/.flac/…) for display only.
		return raw.replace(/\.[^/.]+$/, '');
	}, [activeTrack?.name, audio]);
	const statusLabel = audio.captureMode === 'file' ? 'FILE' : 'LIVE';
	const imageLabel =
		state.backgroundImages.length > 0
			? `${Math.max(1, imageIndex + 1)}/${state.backgroundImages.length}`
			: '0/0';

	const handleAudioToggle = useCallback(() => {
		if (audio.captureMode === 'file') {
			if (audio.isPaused) audio.resumeFileFromSystem();
			else audio.pauseFileForSystem();
			return;
		}
		if (audio.isPaused) audio.resumeCapture();
		else audio.pauseCapture();
	}, [audio]);

	const moveImage = useCallback(
		(direction: -1 | 1) => {
			if (!state.backgroundImages.length) return;
			const currentIndex = imageIndex >= 0 ? imageIndex : 0;
			const nextIndex =
				(currentIndex + direction + state.backgroundImages.length) %
				state.backgroundImages.length;
			state.setActiveImageId(
				state.backgroundImages[nextIndex]?.assetId ?? null
			);
		},
		[imageIndex, state]
	);

	const setParticleLayerEnabled = useCallback(
		(target: 'background' | 'foreground', enabled: boolean) => {
			if (target === 'background') {
				if (enabled) {
					state.setParticlesEnabled(true);
					if (state.particleLayerMode === 'foreground') {
						state.setParticleLayerMode('both');
					} else {
						state.setParticleLayerMode('background');
					}
					return;
				}
				if (!state.particlesEnabled) return;
				if (state.particleLayerMode === 'both') {
					state.setParticleLayerMode('foreground');
				} else if (state.particleLayerMode === 'background') {
					state.setParticlesEnabled(false);
				}
				return;
			}

			if (enabled) {
				state.setParticlesEnabled(true);
				if (state.particleLayerMode === 'background') {
					state.setParticleLayerMode('both');
				} else {
					state.setParticleLayerMode('foreground');
				}
				return;
			}
			if (!state.particlesEnabled) return;
			if (state.particleLayerMode === 'both') {
				state.setParticleLayerMode('background');
			} else if (state.particleLayerMode === 'foreground') {
				state.setParticlesEnabled(false);
			}
		},
		[state]
	);

	const particleBgEnabled =
		state.particlesEnabled &&
		(state.particleLayerMode === 'background' ||
			state.particleLayerMode === 'both');
	const particleFgEnabled =
		state.particlesEnabled &&
		(state.particleLayerMode === 'foreground' ||
			state.particleLayerMode === 'both');

	const overlayLayers = useMemo(
		() =>
			state.overlays.map(overlay => ({
				id: overlay.id,
				label: (overlay.name ?? 'OVERLAY').slice(0, 10).toUpperCase(),
				active: overlay.enabled,
				onClick: () =>
					state.updateOverlay(overlay.id, {
						enabled: !overlay.enabled
					})
			})),
		[state]
	);

	const layerActions = useMemo(
		() =>
			buildLayerActions({
				globalBackgroundEnabled: state.globalBackgroundEnabled,
				setGlobalBackgroundEnabled: state.setGlobalBackgroundEnabled,
				backgroundImageEnabled: state.backgroundImageEnabled,
				setBackgroundImageEnabled: state.setBackgroundImageEnabled,
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
				particleBgEnabled,
				setParticleBgEnabled: value =>
					setParticleLayerEnabled('background', value),
				particleFgEnabled,
				setParticleFgEnabled: value =>
					setParticleLayerEnabled('foreground', value),
				rainEnabled: state.rainEnabled,
				setRainEnabled: state.setRainEnabled,
				overlayLayers
			}),
		[
			overlayLayers,
			particleBgEnabled,
			particleFgEnabled,
			setParticleLayerEnabled,
			state
		]
	);

	const looksActions = useMemo(
		() =>
			buildLooksActions({
				imageBassReactive: state.imageBassReactive,
				setImageBassReactive: state.setImageBassReactive,
				imageMirror: state.imageMirror,
				setImageMirror: state.setImageMirror,
				imageOpacityReactive: state.imageOpacityReactive,
				setImageOpacityReactive: state.setImageOpacityReactive,
				imageAudioSmoothingEnabled: state.imageAudioSmoothingEnabled,
				setImageAudioSmoothingEnabled:
					state.setImageAudioSmoothingEnabled,
				rgbShiftAudioReactive: state.rgbShiftAudioReactive,
				setRgbShiftAudioReactive: state.setRgbShiftAudioReactive,
				rgbShiftAudioSmoothingEnabled:
					state.rgbShiftAudioSmoothingEnabled,
				setRgbShiftAudioSmoothingEnabled:
					state.setRgbShiftAudioSmoothingEnabled
			}),
		[state]
	);

	const spectrumActions = useMemo(
		() =>
			buildSpectrumActions({
				spectrumMirror: state.spectrumMirror,
				setSpectrumMirror: state.setSpectrumMirror,
				spectrumPeakHold: state.spectrumPeakHold,
				setSpectrumPeakHold: state.setSpectrumPeakHold,
				spectrumAudioSmoothingEnabled:
					state.spectrumAudioSmoothingEnabled,
				setSpectrumAudioSmoothingEnabled:
					state.setSpectrumAudioSmoothingEnabled,
				spectrumFollowLogo: state.spectrumFollowLogo,
				setSpectrumFollowLogo: state.setSpectrumFollowLogo,
				spectrumRadialFitLogo: state.spectrumRadialFitLogo,
				setSpectrumRadialFitLogo: state.setSpectrumRadialFitLogo,
				spectrumCircularClone: state.spectrumCircularClone,
				setSpectrumCircularClone: state.setSpectrumCircularClone,
				spectrumCloneMirror: state.spectrumCloneMirror,
				setSpectrumCloneMirror: state.setSpectrumCloneMirror,
				spectrumClonePeakHold: state.spectrumClonePeakHold,
				setSpectrumClonePeakHold: state.setSpectrumClonePeakHold,
				spectrumCloneAudioSmoothingEnabled:
					state.spectrumCloneAudioSmoothingEnabled,
				setSpectrumCloneAudioSmoothingEnabled:
					state.setSpectrumCloneAudioSmoothingEnabled,
				spectrumCloneFollowLogo: state.spectrumCloneFollowLogo,
				setSpectrumCloneFollowLogo: state.setSpectrumCloneFollowLogo,
				spectrumCloneRadialFitLogo: state.spectrumCloneRadialFitLogo,
				setSpectrumCloneRadialFitLogo:
					state.setSpectrumCloneRadialFitLogo
			}),
		[state]
	);

	const motionActions = useMemo(
		() =>
			buildMotionActions({
				motionPaused: state.motionPaused,
				setMotionPaused: state.setMotionPaused,
				particleAudioReactive: state.particleAudioReactive,
				setParticleAudioReactive: state.setParticleAudioReactive,
				particleGlow: state.particleGlow,
				setParticleGlow: state.setParticleGlow,
				particleFadeInOut: state.particleFadeInOut,
				setParticleFadeInOut: state.setParticleFadeInOut
			}),
		[state]
	);

	const audioActions = useMemo(
		() =>
			buildAudioActions({
				audioReactive: state.audioReactive,
				setAudioReactive: state.setAudioReactive,
				audioCrossfadeEnabled: state.audioCrossfadeEnabled,
				setAudioCrossfadeEnabled: state.setAudioCrossfadeEnabled,
				audioAutoAdvance: state.audioAutoAdvance,
				setAudioAutoAdvance: state.setAudioAutoAdvance,
				audioFileLoop: state.audioFileLoop,
				setAudioFileLoop: state.setAudioFileLoop,
				mediaSessionEnabled: state.mediaSessionEnabled,
				setMediaSessionEnabled: state.setMediaSessionEnabled,
				slideshowAudioCheckpointsEnabled:
					state.slideshowAudioCheckpointsEnabled,
				setSlideshowAudioCheckpointsEnabled:
					state.setSlideshowAudioCheckpointsEnabled,
				slideshowTrackChangeSyncEnabled:
					state.slideshowTrackChangeSyncEnabled,
				setSlideshowTrackChangeSyncEnabled:
					state.setSlideshowTrackChangeSyncEnabled,
				slideshowManualTimestampsEnabled:
					state.slideshowManualTimestampsEnabled,
				setSlideshowManualTimestampsEnabled:
					state.setSlideshowManualTimestampsEnabled,
				slideshowResetPosition: state.slideshowResetPosition,
				setSlideshowResetPosition: state.setSlideshowResetPosition
			}),
		[state]
	);

	const logoShortcutActions = useMemo(
		() =>
			buildLogoActions({
				logoAudioSmoothingEnabled: state.logoAudioSmoothingEnabled,
				setLogoAudioSmoothingEnabled:
					state.setLogoAudioSmoothingEnabled,
				logoShadowEnabled: state.logoShadowEnabled,
				setLogoShadowEnabled: state.setLogoShadowEnabled,
				logoBackdropEnabled: state.logoBackdropEnabled,
				setLogoBackdropEnabled: state.setLogoBackdropEnabled
			}),
		[state]
	);

	const titleActions = useMemo(
		() =>
			buildTitleActions({
				audioTrackTitleBackdropEnabled:
					state.audioTrackTitleBackdropEnabled,
				setAudioTrackTitleBackdropEnabled:
					state.setAudioTrackTitleBackdropEnabled,
				audioTrackTitleUppercase: state.audioTrackTitleUppercase,
				setAudioTrackTitleUppercase: state.setAudioTrackTitleUppercase
			}),
		[state]
	);

	const systemActions = useMemo(
		() =>
			buildSystemActions({
				showFps: state.showFps,
				setShowFps: state.setShowFps,
				sleepModeEnabled: state.sleepModeEnabled,
				setSleepModeEnabled: state.setSleepModeEnabled,
				isFullscreen,
				toggleFullscreen: () => void toggleFullscreen(),
				layoutResponsiveEnabled: state.layoutResponsiveEnabled,
				setLayoutResponsiveEnabled: state.setLayoutResponsiveEnabled,
				layoutBackgroundReframeEnabled:
					state.layoutBackgroundReframeEnabled,
				setLayoutBackgroundReframeEnabled:
					state.setLayoutBackgroundReframeEnabled,
				performanceSafeEnabled: state.performanceSafeEnabled,
				setPerformanceSafeEnabled: state.setPerformanceSafeEnabled,
				virtualFoldersEnabled: state.virtualFoldersEnabled,
				setVirtualFoldersEnabled: state.setVirtualFoldersEnabled,
				showBackgroundScaleMeter: state.showBackgroundScaleMeter,
				setShowBackgroundScaleMeter: state.setShowBackgroundScaleMeter,
				showSpectrumDiagnosticsHud: state.showSpectrumDiagnosticsHud,
				setShowSpectrumDiagnosticsHud:
					state.setShowSpectrumDiagnosticsHud,
				showLogoDiagnosticsHud: state.showLogoDiagnosticsHud,
				setShowLogoDiagnosticsHud: state.setShowLogoDiagnosticsHud
			}),
		[isFullscreen, state, toggleFullscreen]
	);

	const { themeActions, colorSourceActions } = useMemo(
		() =>
			buildThemeActions({
				editorTheme: state.editorTheme,
				setEditorTheme: state.setEditorTheme,
				colorSource: state.quickActionsColorSource,
				setColorSource: state.setQuickActionsColorSource
			}),
		[state]
	);

	// Header actions mirror the editor main-tabs. Each button opens a
	// sub-panel below with its own grid of toggles.
	const headerActions = useMemo(() => {
		const actions = [];
		if (fullscreenSupported) {
			actions.push({
				label: isFullscreen
					? t.label_quick_exit_fs
					: t.label_quick_full,
				title: isFullscreen
					? t.label_exit_fullscreen
					: t.label_enter_fullscreen,
				icon: isFullscreen ? (
					<Minimize2 size={11} strokeWidth={2.25} />
				) : (
					<Maximize2 size={11} strokeWidth={2.25} />
				),
				active: isFullscreen,
				onClick: () => void toggleFullscreen()
			});
		}
		actions.push(
			{
				label: t.tab_layers.toUpperCase(),
				title: 'Layer visibility toggles',
				icon: <Layers size={11} strokeWidth={2.25} />,
				active: expandPanel === 'layers',
				onClick: () => toggleExpand('layers')
			},
			{
				label: t.tab_looks.toUpperCase(),
				title: 'Looks / image shortcuts',
				icon: <ImageIcon size={11} strokeWidth={2.25} />,
				active: expandPanel === 'looks',
				onClick: () => toggleExpand('looks')
			},
			{
				label: t.tab_spectrum.toUpperCase(),
				title: 'Spectrum shortcuts',
				icon: <AudioWaveform size={11} strokeWidth={2.25} />,
				active: expandPanel === 'spectrum',
				onClick: () => toggleExpand('spectrum')
			},
			{
				label: t.tab_motion.toUpperCase(),
				title: 'Motion / particles shortcuts',
				icon: <Sparkles size={11} strokeWidth={2.25} />,
				active: expandPanel === 'motion',
				onClick: () => toggleExpand('motion')
			},
			{
				label: t.tab_audio.toUpperCase(),
				title: 'Audio & slideshow sync',
				icon: <Music2 size={11} strokeWidth={2.25} />,
				active: expandPanel === 'audio',
				onClick: () => toggleExpand('audio')
			},
			{
				label: t.tab_logo.toUpperCase(),
				title: 'Logo shortcuts',
				icon: <Circle size={11} strokeWidth={2.25} />,
				active: expandPanel === 'logo',
				onClick: () => toggleExpand('logo')
			},
			{
				label: t.tab_track.toUpperCase(),
				title: 'Track title shortcuts',
				icon: <TypeIcon size={11} strokeWidth={2.25} />,
				active: expandPanel === 'title',
				onClick: () => toggleExpand('title')
			},
			{
				label: 'SYS',
				title: 'System / diagnostics',
				icon: <Cpu size={11} strokeWidth={2.25} />,
				active: expandPanel === 'system',
				onClick: () => toggleExpand('system')
			},
			{
				label: t.tab_editor.toUpperCase(),
				title: 'Editor & HUD theme',
				icon: <Palette size={11} strokeWidth={2.25} />,
				active: expandPanel === 'themes',
				onClick: () => toggleExpand('themes')
			}
		);
		return actions;
	}, [
		expandPanel,
		fullscreenSupported,
		isFullscreen,
		t,
		toggleExpand,
		toggleFullscreen
	]);

	const imageNav = useMemo(
		() => ({
			hasBackgroundImages: state.backgroundImages.length > 0,
			slideshowEnabled: state.slideshowEnabled,
			onToggleSlideshow: () =>
				state.setSlideshowEnabled(!state.slideshowEnabled),
			motionPaused: state.motionPaused,
			onPrevImage: () => moveImage(-1),
			onNextImage: () => moveImage(1),
			onToggleFreeze: () => state.setMotionPaused(!state.motionPaused)
		}),
		[
			moveImage,
			state.backgroundImages.length,
			state.motionPaused,
			state.setMotionPaused,
			state.setSlideshowEnabled,
			state.slideshowEnabled
		]
	);

	const spectrumSlots = useMemo(
		() =>
			state.spectrumProfileSlots.map((slot, index) => ({
				key: `spectrum-${index}`,
				orderLabel: String(index + 1).padStart(2, '0'),
				name: slot.name,
				onClick: () => state.loadSpectrumProfileSlot(index)
			})),
		[state]
	);

	const logoSlots = useMemo(
		() =>
			state.logoProfileSlots.map((slot, index) => ({
				key: `logo-${index}`,
				orderLabel: String(index + 1).padStart(2, '0'),
				name: slot.name,
				onClick: () => state.loadLogoProfileSlot(index)
			})),
		[state]
	);

	return {
		enabledTracksCount,
		handleAudioToggle,
		headerActions,
		imageLabel,
		imageNav,
		isFileMode,
		layerActions,
		looksActions,
		spectrumActions,
		motionActions,
		audioActions,
		logoShortcutActions,
		titleActions,
		systemActions,
		logoSlots,
		spectrumSlots,
		statusLabel,
		themeActions,
		colorSourceActions,
		trackLabel
	};
}
