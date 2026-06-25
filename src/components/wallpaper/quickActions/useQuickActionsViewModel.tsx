import { useCallback, useMemo, useRef } from 'react';
import {
	Maximize2,
	Minimize2,
	Monitor,
	Layers,
	Palette,
	AudioWaveform,
	Circle,
	Sparkles,
	Music2,
	Type as TypeIcon,
	Image as ImageIcon,
	Cpu,
	ImageDown,
	Grid3x3
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import {
	doProfileSettingsMatch,
	extractCameraFxProfileSettings,
	extractLightsProfileSettings,
	extractLooksProfileSettings,
	extractLogoProfileSettings,
	extractParticlesProfileSettings,
	extractRainProfileSettings,
	extractTrackTitleProfileSettings
} from '@/lib/featureProfiles';
import { selectSpectrumActiveProfileIndexForTarget } from '@/features/spectrum/spectrumTargetProfile';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { filterImageIdsBySetlist } from '@/store/slices/setlistsSlice';
import type { QuickActionsState } from '@/components/wallpaper/quickActions/useQuickActionsState';
import type { ExpandPanel } from '@/components/wallpaper/quickActions/quickActionsShared';
import { resolveSharedColorSource } from '@/components/controls/ui/colorSourceUtils';
import type { ColorSourceMode } from '@/types/wallpaper';
import {
	CUSTOM_FILTER_LOOK_ID,
	FILTER_LOOK_PRESETS,
	type FilterLookPreset
} from '@/features/filterLooks/filterLooks';
import type { SubsystemCarouselNav } from '@/components/controls/mediaDock/types';

export type QuickColorSourceShortcut = {
	value: ColorSourceMode | null;
	onChange: (value: ColorSourceMode) => void;
};
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
	goPresentation: () => void;
};

export function useQuickActionsViewModel({
	state,
	t,
	audio,
	expandPanel,
	toggleExpand,
	isFullscreen,
	fullscreenSupported,
	toggleFullscreen,
	goPresentation
}: UseQuickActionsViewModelOptions) {
	const fullStore = useWallpaperStore();
	// Visible pool — respects the active setlist. The label / index shown
	// in the quick actions HUD reflects the curated set when one is active.
	const visibleImages = useMemo(
		() =>
			filterImageIdsBySetlist(
				state.backgroundImages,
				state.setlists,
				state.activeSetlistId
			),
		[state.backgroundImages, state.setlists, state.activeSetlistId]
	);
	const imageIndex = useMemo(
		() =>
			visibleImages.findIndex(
				image => image.assetId === state.activeImageId
			),
		[visibleImages, state.activeImageId]
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
		visibleImages.length > 0
			? `${Math.max(1, imageIndex + 1)}/${visibleImages.length}`
			: '0/0';
	const isPanelExpanded = useCallback(
		(...panels: Exclude<ExpandPanel, null>[]) =>
			expandPanel !== null && panels.includes(expandPanel),
		[expandPanel]
	);
	const activeLooksSlotIndex = useMemo(() => {
		const current = extractLooksProfileSettings(fullStore);
		return fullStore.looksProfileSlots.findIndex(slot =>
			doProfileSettingsMatch(current, slot.values)
		);
	}, [fullStore]);
	const activeSpectrumSlotIndex = useMemo(
		() =>
			selectSpectrumActiveProfileIndexForTarget(
				fullStore,
				fullStore.activeSpectrumTarget
			),
		[fullStore]
	);
	const activeParticlesSlotIndex = useMemo(() => {
		const current = extractParticlesProfileSettings(fullStore);
		return fullStore.particlesProfileSlots.findIndex(slot =>
			doProfileSettingsMatch(current, slot.values)
		);
	}, [fullStore]);
	const activeRainSlotIndex = useMemo(() => {
		const current = extractRainProfileSettings(fullStore);
		return fullStore.rainProfileSlots.findIndex(slot =>
			doProfileSettingsMatch(current, slot.values)
		);
	}, [fullStore]);
	const activeLightsSlotIndex = useMemo(() => {
		const current = extractLightsProfileSettings(fullStore);
		return fullStore.lightsProfileSlots.findIndex(slot =>
			doProfileSettingsMatch(current, slot.values)
		);
	}, [fullStore]);
	const activeCameraSlotIndex = useMemo(() => {
		const current = extractCameraFxProfileSettings(fullStore);
		return fullStore.cameraFxProfileSlots.findIndex(slot =>
			doProfileSettingsMatch(current, slot.values)
		);
	}, [fullStore]);
	const activeLogoSlotIndex = useMemo(() => {
		const current = extractLogoProfileSettings(fullStore);
		return fullStore.logoProfileSlots.findIndex(slot =>
			doProfileSettingsMatch(current, slot.values)
		);
	}, [fullStore]);
	const activeTitleSlotIndex = useMemo(() => {
		const current = extractTrackTitleProfileSettings(fullStore);
		return fullStore.trackTitleProfileSlots.findIndex(slot =>
			doProfileSettingsMatch(current, slot.values)
		);
	}, [fullStore]);

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
			// Same setlist-respect rule as the editor's prev/next buttons —
			// quick-action navigation must walk the filtered subset, not
			// the global pool.
			const visible = filterImageIdsBySetlist(
				state.backgroundImages,
				state.setlists,
				state.activeSetlistId
			);
			if (!visible.length) return;
			const currentIndex = Math.max(
				0,
				visible.findIndex(img => img.assetId === state.activeImageId)
			);
			const nextIndex =
				(currentIndex + direction + visible.length) % visible.length;
			state.setActiveImageId(visible[nextIndex]?.assetId ?? null);
		},
		[state]
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
				t,
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
			state,
			t
		]
	);

	const looksActions = useMemo(() => {
		const actions = buildLooksActions({
			t,
			imageBassReactive: state.imageBassReactive,
			setImageBassReactive: state.setImageBassReactive,
			imageMirror: state.imageMirror,
			setImageMirror: state.setImageMirror,
			imageCoverageLockEnabled: state.imageCoverageLockEnabled,
			setImageCoverageLockEnabled: state.setImageCoverageLockEnabled,
			imageMirrorFill: state.imageMirrorFill,
			setImageMirrorFill: state.setImageMirrorFill,
			imageOpacityReactive: state.imageOpacityReactive,
			setImageOpacityReactive: state.setImageOpacityReactive,
			rgbShiftAudioReactive: state.rgbShiftAudioReactive,
			setRgbShiftAudioReactive: state.setRgbShiftAudioReactive
		});
		if (state.looksProfileSlots.length > 0) {
			actions.push({
				label: t.qa_slots,
				title: t.qa_slots_looks_t,
				icon: <Layers size={11} strokeWidth={2.25} />,
				active: expandPanel === 'looks_slots',
				small: true,
				onClick: () => toggleExpand('looks_slots')
			});
		}
		return actions;
	}, [expandPanel, state, toggleExpand, t]);

	const spectrumActions = useMemo(() => {
		const activeTarget = state.activeSpectrumTarget;
		const isMain = activeTarget === 'main';
		const instance = state.spectrumInstances[0];
		const targetVisible = isMain
			? state.spectrumMainVisible
			: (instance?.enabled ?? false);
		const actions = buildSpectrumActions({
			t,
			activeTarget,
			setActiveTarget: state.setActiveSpectrumTarget,
			hasSecondSpectrum: Boolean(instance),
			targetVisible,
			toggleTargetVisible: () => {
				if (isMain) {
					state.setSpectrumMainVisible(!state.spectrumMainVisible);
				} else if (instance) {
					state.setSpectrumInstanceEnabled(
						instance.id,
						!instance.enabled
					);
				}
			},
			targetMirror: isMain
				? state.spectrumMirror
				: (instance?.spectrumMirror ?? false),
			targetPeakHold: isMain
				? state.spectrumPeakHold
				: (instance?.spectrumPeakHold ?? false),
			targetFollowLogo: isMain
				? state.spectrumFollowLogo
				: (instance?.spectrumFollowLogo ?? false),
			targetRadialFitLogo: isMain
				? state.spectrumRadialFitLogo
				: (instance?.spectrumRadialFitLogo ?? false),
			targetPixelate: isMain
				? state.spectrumPixelate
				: (instance?.spectrumPixelate ?? false),
			updateTarget: patch => {
				if (isMain) {
					state.patchSpectrumMain(patch);
				} else if (instance) {
					state.updateSpectrumInstance(instance.id, patch);
				}
			}
		});
		if (state.spectrumProfileSlots.length > 0) {
			actions.push({
				label: t.qa_slots,
				title: t.qa_slots_spectrum_t,
				icon: <Layers size={11} strokeWidth={2.25} />,
				active: expandPanel === 'spectrum_slots',
				small: true,
				onClick: () => toggleExpand('spectrum_slots')
			});
		}
		return actions;
	}, [expandPanel, state, toggleExpand, t]);

	const motionActions = useMemo(() => {
		const groups = buildMotionActions({
			t,
			motionPaused: state.motionPaused,
			setMotionPaused: state.setMotionPaused,
			stageLightsEnabled: state.stageLightsEnabled,
			setStageLightsEnabled: state.setStageLightsEnabled,
			flashLightEnabled: state.flashLightEnabled,
			setFlashLightEnabled: state.setFlashLightEnabled,
			cameraMotionEnabled: state.cameraMotionEnabled,
			setCameraMotionEnabled: state.setCameraMotionEnabled,
			cameraShakeEnabled: state.cameraShakeEnabled,
			setCameraShakeEnabled: state.setCameraShakeEnabled,
			particleAudioReactive: state.particleAudioReactive,
			setParticleAudioReactive: state.setParticleAudioReactive,
			particleGlow: state.particleGlow,
			setParticleGlow: state.setParticleGlow,
			particleFadeInOut: state.particleFadeInOut,
			setParticleFadeInOut: state.setParticleFadeInOut,
			particleAudioDriftEnabled: state.particleAudioDriftEnabled,
			setParticleAudioDriftEnabled: state.setParticleAudioDriftEnabled,
			particleDepthFlowEnabled: state.particleDepthFlowEnabled,
			setParticleDepthFlowEnabled: state.setParticleDepthFlowEnabled
		});
		// Saved-profile loaders live in their own subsection so the toggles
		// above stay focused on real on/off feature controls. Mirrors the
		// Motion editor sub-tabs: particles · rain · lights · camera.
		const slotActions = [];
		if (state.particlesProfileSlots.length > 0) {
			slotActions.push({
				label: t.qa_slots_particles,
				title: t.qa_slots_particles_t,
				icon: <Layers size={11} strokeWidth={2.25} />,
				active: expandPanel === 'particles_slots',
				small: true,
				onClick: () => toggleExpand('particles_slots')
			});
		}
		if (state.rainProfileSlots.length > 0) {
			slotActions.push({
				label: t.qa_slots_rain,
				title: t.qa_slots_rain_t,
				icon: <Layers size={11} strokeWidth={2.25} />,
				active: expandPanel === 'rain_slots',
				small: true,
				onClick: () => toggleExpand('rain_slots')
			});
		}
		if (state.lightsProfileSlots.length > 0) {
			slotActions.push({
				label: t.qa_slots_lights,
				title: t.qa_slots_lights_t,
				icon: <Layers size={11} strokeWidth={2.25} />,
				active: expandPanel === 'lights_slots',
				small: true,
				onClick: () => toggleExpand('lights_slots')
			});
		}
		if (state.cameraFxProfileSlots.length > 0) {
			slotActions.push({
				label: t.qa_slots_camera,
				title: t.qa_slots_camera_t,
				icon: <Layers size={11} strokeWidth={2.25} />,
				active: expandPanel === 'camera_slots',
				small: true,
				onClick: () => toggleExpand('camera_slots')
			});
		}
		if (slotActions.length > 0) {
			groups.push({ label: t.qa_grp_sub_slots, actions: slotActions });
		}
		return groups;
	}, [expandPanel, state, toggleExpand, t]);

	const audioActions = useMemo(
		() =>
			buildAudioActions({
				t,
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
		[state, t]
	);

	const logoShortcutActions = useMemo(() => {
		const actions = buildLogoActions({
			t,
			logoShadowEnabled: state.logoShadowEnabled,
			setLogoShadowEnabled: state.setLogoShadowEnabled,
			logoBackdropEnabled: state.logoBackdropEnabled,
			setLogoBackdropEnabled: state.setLogoBackdropEnabled
		});
		// Quick position picker — one tap snaps the logo to a grid cell (same
		// logoPositionX/Y state as the Logo tab; reactivity/presets untouched).
		actions.push({
			label: t.qa_logo_position,
			title: t.qa_logo_position_t,
			icon: <Grid3x3 size={11} strokeWidth={2.25} />,
			active: expandPanel === 'logo_position',
			small: true,
			onClick: () => toggleExpand('logo_position')
		});
		if (state.logoProfileSlots.length > 0) {
			actions.push({
				label: t.qa_slots,
				title: t.qa_slots_logo_t,
				icon: <Layers size={11} strokeWidth={2.25} />,
				active: expandPanel === 'logo_slots',
				small: true,
				onClick: () => toggleExpand('logo_slots')
			});
		}
		return actions;
	}, [expandPanel, state, toggleExpand, t]);

	const titleActions = useMemo(() => {
		const actions = buildTitleActions({
			t,
			audioTrackTitleBackdropEnabled:
				state.audioTrackTitleBackdropEnabled,
			setAudioTrackTitleBackdropEnabled:
				state.setAudioTrackTitleBackdropEnabled,
			audioTrackTitleUppercase: state.audioTrackTitleUppercase,
			setAudioTrackTitleUppercase: state.setAudioTrackTitleUppercase
		});
		if (state.trackTitleProfileSlots.length > 0) {
			actions.push({
				label: t.qa_slots,
				title: t.qa_slots_title_t,
				icon: <Layers size={11} strokeWidth={2.25} />,
				active: expandPanel === 'title_slots',
				small: true,
				onClick: () => toggleExpand('title_slots')
			});
		}
		return actions;
	}, [expandPanel, state, toggleExpand, t]);

	const systemActions = useMemo(
		() =>
			buildSystemActions({
				t,
				showFps: state.showFps,
				setShowFps: state.setShowFps,
				sleepModeEnabled: state.sleepModeEnabled,
				setSleepModeEnabled: state.setSleepModeEnabled,
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
				setShowLogoDiagnosticsHud: state.setShowLogoDiagnosticsHud,
				enableDragMode: state.enableDragMode,
				setEnableDragMode: state.setEnableDragMode,
				showSetlistHud: state.showSetlistHud,
				setShowSetlistHud: state.setShowSetlistHud
			}),
		[state, t]
	);

	const { themeActions, colorSourceActions } = useMemo(
		() =>
			buildThemeActions({
				t,
				editorTheme: state.editorTheme,
				setEditorTheme: state.setEditorTheme,
				colorSource: state.quickActionsColorSource,
				setColorSource: state.setQuickActionsColorSource
			}),
		[state, t]
	);

	// Per-feature color source shortcuts. Each one resolves to `null` when
	// the underlying sub-sources diverge (rendered as "Mixed"), and pulling
	// any button overwrites all of them via the corresponding bulk setter.
	const spectrumColorSourceShortcut = useMemo<QuickColorSourceShortcut>(
		() => ({
			value: resolveSharedColorSource([
				state.spectrumColorSource,
				...state.spectrumInstances.map(
					instance => instance.spectrumColorSource
				)
			]),
			onChange: state.setSpectrumColorSources
		}),
		[
			state.spectrumColorSource,
			state.spectrumInstances,
			state.setSpectrumColorSources
		]
	);
	const logoColorSourceShortcut = useMemo<QuickColorSourceShortcut>(
		() => ({
			value: resolveSharedColorSource([
				state.logoGlowColorSource,
				state.logoShadowColorSource,
				state.logoBackdropColorSource
			]),
			onChange: state.setLogoColorSources
		}),
		[
			state.logoGlowColorSource,
			state.logoShadowColorSource,
			state.logoBackdropColorSource,
			state.setLogoColorSources
		]
	);
	const motionColorSourceShortcut = useMemo<QuickColorSourceShortcut>(
		() => ({
			value: resolveSharedColorSource([
				state.particleColorSource,
				state.rainColorSource
			]),
			onChange: state.setMotionColorSources
		}),
		[
			state.particleColorSource,
			state.rainColorSource,
			state.setMotionColorSources
		]
	);
	const titleColorSourceShortcut = useMemo<QuickColorSourceShortcut>(
		() => ({
			value: resolveSharedColorSource([
				state.audioTrackTitleTextColorSource,
				state.audioTrackTitleStrokeColorSource,
				state.audioTrackTitleGlowColorSource,
				state.audioTrackTitleBackdropColorSource,
				state.audioTrackTimeTextColorSource,
				state.audioTrackTimeStrokeColorSource,
				state.audioTrackTimeGlowColorSource
			]),
			onChange: state.setTrackTitleColorSources
		}),
		[
			state.audioTrackTitleTextColorSource,
			state.audioTrackTitleStrokeColorSource,
			state.audioTrackTitleGlowColorSource,
			state.audioTrackTitleBackdropColorSource,
			state.audioTrackTimeTextColorSource,
			state.audioTrackTimeStrokeColorSource,
			state.audioTrackTimeGlowColorSource,
			state.setTrackTitleColorSources
		]
	);
	const editorShellColorSourceShortcut = useMemo<QuickColorSourceShortcut>(
		() => ({
			value: resolveSharedColorSource([
				state.editorThemeColorSource,
				state.quickActionsColorSource
			]),
			onChange: state.setEditorShellColorSource
		}),
		[
			state.editorThemeColorSource,
			state.quickActionsColorSource,
			state.setEditorShellColorSource
		]
	);
	const globalColorSourceShortcut = useMemo<QuickColorSourceShortcut>(
		() => ({
			value: resolveSharedColorSource([
				state.editorThemeColorSource,
				state.quickActionsColorSource,
				state.spectrumColorSource,
				...state.spectrumInstances.map(
					instance => instance.spectrumColorSource
				),
				state.logoGlowColorSource,
				state.logoShadowColorSource,
				state.logoBackdropColorSource,
				state.particleColorSource,
				state.rainColorSource,
				state.audioTrackTitleTextColorSource,
				state.audioTrackTitleStrokeColorSource,
				state.audioTrackTitleGlowColorSource,
				state.audioTrackTitleBackdropColorSource,
				state.audioTrackTimeTextColorSource,
				state.audioTrackTimeStrokeColorSource,
				state.audioTrackTimeGlowColorSource
			]),
			onChange: state.syncAllColorSources
		}),
		[
			state.editorThemeColorSource,
			state.quickActionsColorSource,
			state.spectrumColorSource,
			state.spectrumInstances,
			state.logoGlowColorSource,
			state.logoShadowColorSource,
			state.logoBackdropColorSource,
			state.particleColorSource,
			state.rainColorSource,
			state.audioTrackTitleTextColorSource,
			state.audioTrackTitleStrokeColorSource,
			state.audioTrackTitleGlowColorSource,
			state.audioTrackTitleBackdropColorSource,
			state.audioTrackTimeTextColorSource,
			state.audioTrackTimeStrokeColorSource,
			state.audioTrackTimeGlowColorSource,
			state.syncAllColorSources
		]
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
		actions.push({
			label: t.qa_presentation_short,
			title: t.hint_presentation_mode,
			icon: <Monitor size={11} strokeWidth={2.25} />,
			active: false,
			onClick: goPresentation
		});
		actions.push(
			{
				label: t.tab_layers.toUpperCase(),
				title: t.qa_grp_layers_t,
				icon: <Layers size={11} strokeWidth={2.25} />,
				active: isPanelExpanded('layers'),
				onClick: () => toggleExpand('layers')
			},
			{
				label: t.tab_looks.toUpperCase(),
				title: t.qa_grp_looks_t,
				icon: <ImageIcon size={11} strokeWidth={2.25} />,
				active: isPanelExpanded('looks', 'looks_slots'),
				onClick: () => toggleExpand('looks')
			},
			{
				label: t.tab_spectrum.toUpperCase(),
				title: t.qa_grp_spectrum_t,
				icon: <AudioWaveform size={11} strokeWidth={2.25} />,
				active: isPanelExpanded('spectrum', 'spectrum_slots'),
				onClick: () => toggleExpand('spectrum')
			},
			{
				label: t.tab_motion.toUpperCase(),
				title: t.qa_grp_motion_t,
				icon: <Sparkles size={11} strokeWidth={2.25} />,
				active: isPanelExpanded(
					'motion',
					'particles_slots',
					'rain_slots',
					'lights_slots',
					'camera_slots'
				),
				onClick: () => toggleExpand('motion')
			},
			{
				label: t.tab_audio.toUpperCase(),
				title: t.qa_grp_audio_t,
				icon: <Music2 size={11} strokeWidth={2.25} />,
				active: expandPanel === 'audio',
				onClick: () => toggleExpand('audio')
			},
			{
				label: t.tab_logo.toUpperCase(),
				title: t.qa_grp_logo_t,
				icon: <Circle size={11} strokeWidth={2.25} />,
				active: isPanelExpanded('logo', 'logo_slots', 'logo_position'),
				onClick: () => toggleExpand('logo')
			},
			{
				label: t.tab_track.toUpperCase(),
				title: t.qa_grp_title_t,
				icon: <TypeIcon size={11} strokeWidth={2.25} />,
				active: isPanelExpanded('title', 'title_slots'),
				onClick: () => toggleExpand('title')
			},
			{
				// Per-image override snapshots (logo/spectrum/particles/rain/looks).
				// Lives inside the HUD instead of as a floating window so the
				// user controls position/design through the same HUD frame.
				label: t.qa_per_img,
				title: t.qa_per_img_t,
				icon: <ImageDown size={11} strokeWidth={2.25} />,
				active: isPanelExpanded('quickEdit'),
				onClick: () => toggleExpand('quickEdit')
			},
			{
				label: t.qa_sys,
				title: t.qa_grp_system_t,
				icon: <Cpu size={11} strokeWidth={2.25} />,
				active: isPanelExpanded('system'),
				onClick: () => toggleExpand('system')
			},
			{
				label: t.tab_editor.toUpperCase(),
				title: t.qa_grp_themes_t,
				icon: <Palette size={11} strokeWidth={2.25} />,
				active: isPanelExpanded('themes'),
				onClick: () => toggleExpand('themes')
			}
		);
		return actions;
	}, [
		expandPanel,
		fullscreenSupported,
		isFullscreen,
		t,
		isPanelExpanded,
		toggleExpand,
		toggleFullscreen,
		goPresentation
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

	// ── Spectrum carousel ─────────────────────────────────────────────────
	// Only populated slots — empty slot entries are skipped completely so
	// the user only cycles between meaningful entries. A local cursor
	// (`lastSpectrumNavSlotRef`) remembers the last slot the HUD loaded so
	// the carousel never loses track if `doProfileSettingsMatch` drifts.
	const lastSpectrumNavSlotRef = useRef<number | null>(null);
	const spectrumNav: SubsystemCarouselNav | undefined = useMemo(() => {
		const populated = fullStore.spectrumProfileSlots
			.map((slot, index) => ({ slot, index }))
			.filter(({ slot }) => slot.values !== null);
		if (populated.length === 0) {
			lastSpectrumNavSlotRef.current = null;
			return undefined;
		}
		// Prefer the diff-detected active slot. Fall back to the cursor the
		// HUD itself last navigated to. If both are absent the user simply
		// hasn't picked anything yet — handled separately in `stepBy`.
		const detectedIndex =
			activeSpectrumSlotIndex >= 0 ? activeSpectrumSlotIndex : null;
		const cursorIndex =
			lastSpectrumNavSlotRef.current != null &&
			populated.some(
				({ index }) => index === lastSpectrumNavSlotRef.current
			)
				? lastSpectrumNavSlotRef.current
				: null;
		const effectiveIndex = detectedIndex ?? cursorIndex;
		const currentPos =
			effectiveIndex != null
				? populated.findIndex(({ index }) => index === effectiveIndex)
				: -1;
		const currentEntry = currentPos >= 0 ? populated[currentPos] : null;
		const totalLabel = String(populated.length).padStart(2, '0');
		const indexLabel =
			currentPos >= 0 ? String(currentPos + 1).padStart(2, '0') : '--';
		const stepBy = (delta: number) => {
			if (populated.length === 0) return;
			let nextPos: number;
			if (currentPos < 0) {
				// No active slot: forward = first populated, back = last
				// populated. Previously this collapsed to `(0 + delta) % N`
				// which silently skipped the first slot on the first ▶ click.
				nextPos = delta > 0 ? 0 : populated.length - 1;
			} else {
				nextPos =
					(currentPos + delta + populated.length) % populated.length;
			}
			const target = populated[nextPos];
			if (!target) return;
			lastSpectrumNavSlotRef.current = target.index;
			fullStore.loadSpectrumProfileSlot(
				target.index,
				fullStore.activeSpectrumTarget
			);
		};
		return {
			hasItems: true,
			label: `SPEC ${indexLabel}/${totalLabel}`,
			tooltip: currentEntry
				? `Spectrum slot: ${currentEntry.slot.name}`
				: 'Spectrum slot — none active yet',
			onPrev: () => stepBy(-1),
			onNext: () => stepBy(1)
		};
	}, [fullStore, activeSpectrumSlotIndex]);

	// ── Looks carousel: virtual unified list of presets + custom + slots ──
	// Order: factory presets first (curated baseline), legacy custom preset
	// if it exists, then user-saved profile slots. Each entry remembers its
	// origin so applying it uses the right action. Mirrors the spectrum
	// carousel: empty slots are filtered out and a local cursor compensates
	// when `activeFilterLookId` / `activeLooksSlotIndex` can't tell us where
	// we are.
	type LooksCarouselEntry =
		| { source: 'preset'; preset: FilterLookPreset }
		| { source: 'custom'; preset: FilterLookPreset }
		| { source: 'slot'; index: number; name: string };
	const lastLooksNavKeyRef = useRef<string | null>(null);
	const looksNav: SubsystemCarouselNav | undefined = useMemo(() => {
		const entries: LooksCarouselEntry[] = [];
		for (const preset of FILTER_LOOK_PRESETS) {
			entries.push({ source: 'preset', preset });
		}
		if (fullStore.customFilterLookSettings) {
			entries.push({
				source: 'custom',
				preset: {
					id: CUSTOM_FILTER_LOOK_ID,
					name: 'Custom',
					description: 'Legacy custom look',
					tags: [],
					settings: fullStore.customFilterLookSettings
				}
			});
		}
		fullStore.looksProfileSlots.forEach((slot, index) => {
			if (slot.values === null) return;
			entries.push({ source: 'slot', index, name: slot.name });
		});
		if (entries.length === 0) {
			lastLooksNavKeyRef.current = null;
			return undefined;
		}
		const keyOf = (e: LooksCarouselEntry) =>
			e.source === 'slot'
				? `slot:${e.index}`
				: `${e.source}:${e.preset.id}`;
		// Detection: prefer the explicit activeFilterLookId / slot diff. If
		// neither resolves, fall back to the cursor key the HUD last used.
		const detectedPos = (() => {
			if (fullStore.activeFilterLookId === CUSTOM_FILTER_LOOK_ID) {
				return entries.findIndex(e => e.source === 'custom');
			}
			if (fullStore.activeFilterLookId) {
				const id = fullStore.activeFilterLookId;
				return entries.findIndex(
					e => e.source === 'preset' && e.preset.id === id
				);
			}
			if (activeLooksSlotIndex >= 0) {
				return entries.findIndex(
					e => e.source === 'slot' && e.index === activeLooksSlotIndex
				);
			}
			return -1;
		})();
		const cursorPos =
			lastLooksNavKeyRef.current != null
				? entries.findIndex(
						e => keyOf(e) === lastLooksNavKeyRef.current
					)
				: -1;
		const currentPos = detectedPos >= 0 ? detectedPos : cursorPos;
		const currentEntry = currentPos >= 0 ? entries[currentPos] : null;
		const totalLabel = String(entries.length).padStart(2, '0');
		const indexLabel =
			currentPos >= 0 ? String(currentPos + 1).padStart(2, '0') : '--';
		const apply = (entry: LooksCarouselEntry) => {
			lastLooksNavKeyRef.current = keyOf(entry);
			if (entry.source === 'slot') {
				fullStore.loadLooksProfileSlot(entry.index);
				return;
			}
			fullStore.applyFilterLook(entry.preset);
		};
		const stepBy = (delta: number) => {
			if (entries.length === 0) return;
			let nextPos: number;
			if (currentPos < 0) {
				nextPos = delta > 0 ? 0 : entries.length - 1;
			} else {
				nextPos =
					(currentPos + delta + entries.length) % entries.length;
			}
			const target = entries[nextPos];
			if (target) apply(target);
		};
		const currentName = currentEntry
			? currentEntry.source === 'slot'
				? currentEntry.name
				: currentEntry.preset.name
			: '—';
		const originBadge = currentEntry
			? currentEntry.source === 'slot'
				? 'slot'
				: currentEntry.source === 'custom'
					? 'custom'
					: 'preset'
			: '';
		return {
			hasItems: true,
			label: `LOOK ${indexLabel}/${totalLabel}`,
			tooltip: currentEntry
				? `Looks ${originBadge}: ${currentName}`
				: 'Looks — none active yet',
			onPrev: () => stepBy(-1),
			onNext: () => stepBy(1)
		};
	}, [fullStore, activeLooksSlotIndex]);

	const spectrumSlots = useMemo(
		() =>
			state.spectrumProfileSlots.map((slot, index) => ({
				key: `spectrum-${index}`,
				orderLabel: String(index + 1).padStart(2, '0'),
				name: slot.name,
				active: activeSpectrumSlotIndex === index,
				onClick: () =>
					state.loadSpectrumProfileSlot(
						index,
						state.activeSpectrumTarget
					)
			})),
		[activeSpectrumSlotIndex, state]
	);

	const looksSlots = useMemo(
		() =>
			state.looksProfileSlots.map((slot, index) => ({
				key: `looks-${index}`,
				orderLabel: String(index + 1).padStart(2, '0'),
				name: slot.name,
				active: activeLooksSlotIndex === index,
				onClick: () => state.loadLooksProfileSlot(index)
			})),
		[activeLooksSlotIndex, state]
	);

	const particlesSlots = useMemo(
		() =>
			state.particlesProfileSlots.map((slot, index) => ({
				key: `particles-${index}`,
				orderLabel: String(index + 1).padStart(2, '0'),
				name: slot.name,
				active: activeParticlesSlotIndex === index,
				onClick: () => state.loadParticlesProfileSlot(index)
			})),
		[activeParticlesSlotIndex, state]
	);

	const rainSlots = useMemo(
		() =>
			state.rainProfileSlots.map((slot, index) => ({
				key: `rain-${index}`,
				orderLabel: String(index + 1).padStart(2, '0'),
				name: slot.name,
				active: activeRainSlotIndex === index,
				onClick: () => state.loadRainProfileSlot(index)
			})),
		[activeRainSlotIndex, state]
	);

	const lightsSlots = useMemo(
		() =>
			state.lightsProfileSlots.map((slot, index) => ({
				key: `lights-${index}`,
				orderLabel: String(index + 1).padStart(2, '0'),
				name: slot.name,
				active: activeLightsSlotIndex === index,
				onClick: () => state.loadLightsProfileSlot(index)
			})),
		[activeLightsSlotIndex, state]
	);

	const cameraSlots = useMemo(
		() =>
			state.cameraFxProfileSlots.map((slot, index) => ({
				key: `camera-${index}`,
				orderLabel: String(index + 1).padStart(2, '0'),
				name: slot.name,
				active: activeCameraSlotIndex === index,
				onClick: () => state.loadCameraFxProfileSlot(index)
			})),
		[activeCameraSlotIndex, state]
	);

	const logoSlots = useMemo(
		() =>
			state.logoProfileSlots.map((slot, index) => ({
				key: `logo-${index}`,
				orderLabel: String(index + 1).padStart(2, '0'),
				name: slot.name,
				active: activeLogoSlotIndex === index,
				onClick: () => state.loadLogoProfileSlot(index)
			})),
		[activeLogoSlotIndex, state]
	);

	const titleSlots = useMemo(
		() =>
			state.trackTitleProfileSlots.map((slot, index) => ({
				key: `track-title-${index}`,
				orderLabel: String(index + 1).padStart(2, '0'),
				name: slot.name,
				active: activeTitleSlotIndex === index,
				onClick: () => state.loadTrackTitleProfileSlot(index)
			})),
		[activeTitleSlotIndex, state]
	);

	return {
		enabledTracksCount,
		handleAudioToggle,
		headerActions,
		imageLabel,
		imageNav,
		spectrumNav,
		looksNav,
		isFileMode,
		layerActions,
		looksActions,
		spectrumActions,
		motionActions,
		audioActions,
		logoShortcutActions,
		titleActions,
		systemActions,
		looksSlots,
		particlesSlots,
		rainSlots,
		lightsSlots,
		cameraSlots,
		logoSlots,
		spectrumSlots,
		statusLabel,
		themeActions,
		colorSourceActions,
		titleSlots,
		trackLabel,
		spectrumColorSourceShortcut,
		logoColorSourceShortcut,
		motionColorSourceShortcut,
		titleColorSourceShortcut,
		editorShellColorSourceShortcut,
		globalColorSourceShortcut
	};
}
