import { useEffect, useState } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import type { WallpaperState } from '@/types/wallpaper';
import EditorOverlay from './EditorOverlay';
import { DEFAULT_STATE } from '@/lib/constants';
import type { ControlPanelAnchor } from '@/types/wallpaper';
import {
	EDITOR_THEME_CLASSES,
	getEditorRadiusVars,
	getScopedEditorThemeColorVars
} from './editorTheme';
import { useWindowPresentationControls } from '@/hooks/useWindowPresentationControls';
import { useAudioContext } from '@/context/AudioDataContext';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import {
	AudioTab,
	BgTab,
	ControlTabSuspense,
	DiagnosticsTab,
	ExportTab,
	FiltersTab,
	LayersTab,
	LogoTab,
	MotionTab,
	OverlaysTab,
	PerfTab,
	EditorTab,
	SceneTab,
	SpectrumTab,
	TrackTitleTab
} from './controlTabsLazy';

type MainTabId =
	| 'scene'
	| 'spectrum'
	| 'looks'
	| 'layers'
	| 'motion'
	| 'audio'
	| 'advanced';

type AdvancedSubTab =
	| 'track'
	| 'logo'
	| 'diagnostics'
	| 'editor'
	| 'export'
	| 'perf';

const LEGACY_TAB_KEYS: Record<string, (keyof WallpaperState)[]> = {
	layers: ['layerZIndices'],
	presets: [
		'imageScale',
		'imagePositionX',
		'imagePositionY',
		'imageBassReactive',
		'backgroundImageEnabled',
		'imageOpacity',
		'imageAudioSmoothingEnabled',
		'imageAudioSmoothing',
		'imageOpacityReactive',
		'imageOpacityReactiveAmount',
		'imageBassScaleIntensity',
		'imageAudioReactiveDecay',
		'imageBassAttack',
		'imageBassRelease',
		'imageBassReactivitySpeed',
		'imageBassPeakWindow',
		'imageBassPeakFloor',
		'imageBassPunch',
		'imageBassReactiveScaleIntensity',
		'imageAudioChannel',
		'imageFitMode',
		'imageMirror',
		'parallaxStrength',
		'globalBackgroundEnabled',
		'globalBackgroundScale',
		'globalBackgroundPositionX',
		'globalBackgroundPositionY',
		'globalBackgroundFitMode',
		'globalBackgroundOpacity',
		'globalBackgroundBrightness',
		'globalBackgroundContrast',
		'globalBackgroundSaturation',
		'globalBackgroundBlur',
		'globalBackgroundHueRotate',
		'slideshowEnabled',
		'slideshowInterval',
		'slideshowTransitionDuration',
		'slideshowTransitionType',
		'slideshowTransitionIntensity',
		'slideshowTransitionAudioDrive',
		'slideshowTransitionAudioChannel',
		'slideshowAudioCheckpointsEnabled',
		'slideshowTrackChangeSyncEnabled'
	],
	filters: [
		'filterTargets',
		'filterOpacity',
		'filterBrightness',
		'filterContrast',
		'filterSaturation',
		'filterBlur',
		'filterHueRotate',
		'filterVignette',
		'filterBloom',
		'filterLumaThreshold',
		'filterLensWarp',
		'filterHeatDistortion',
		'activeFilterLookId',
		'scanlineIntensity',
		'scanlineMode',
		'scanlineSpacing',
		'scanlineThickness',
		'rgbShift',
		'noiseIntensity',
		'rgbShiftAudioReactive',
		'rgbShiftAudioSensitivity',
		'rgbShiftAudioChannel',
		'rgbShiftAudioSmoothingEnabled',
		'rgbShiftAudioSmoothing'
	],
	audio: [
		'audioPaused',
		'motionPaused',
		'fftSize',
		'audioAutoKickThreshold',
		'audioAutoSwitchHoldMs'
	],
	track: [
		'audioTrackTitleLayoutMode',
		'audioTrackTitleFontStyle',
		'audioTrackTitleUppercase',
		'audioTrackTitleEnabled',
		'audioTrackTitlePositionX',
		'audioTrackTitlePositionY',
		'audioTrackTitleFontSize',
		'audioTrackTitleLetterSpacing',
		'audioTrackTitleWidth',
		'audioTrackTitleOpacity',
		'audioTrackTitleScrollSpeed',
		'audioTrackTitleRgbShift',
		'audioTrackTitleTextColorSource',
		'audioTrackTitleTextColor',
		'audioTrackTitleStrokeColorSource',
		'audioTrackTitleStrokeColor',
		'audioTrackTitleStrokeWidth',
		'audioTrackTitleGlowColorSource',
		'audioTrackTitleGlowColor',
		'audioTrackTitleGlowBlur',
		'audioTrackTitleBackdropEnabled',
		'audioTrackTitleBackdropColorSource',
		'audioTrackTitleBackdropColor',
		'audioTrackTitleBackdropOpacity',
		'audioTrackTitleBackdropPadding',
		'audioTrackTitleFilterBrightness',
		'audioTrackTitleFilterContrast',
		'audioTrackTitleFilterSaturation',
		'audioTrackTitleFilterBlur',
		'audioTrackTitleFilterHueRotate',
		'audioTrackTimeEnabled',
		'audioTrackTimePositionX',
		'audioTrackTimePositionY',
		'audioTrackTimeFontStyle',
		'audioTrackTimeFontSize',
		'audioTrackTimeLetterSpacing',
		'audioTrackTimeOpacity',
		'audioTrackTimeRgbShift',
		'audioTrackTimeTextColorSource',
		'audioTrackTimeTextColor',
		'audioTrackTimeStrokeColorSource',
		'audioTrackTimeStrokeColor',
		'audioTrackTimeStrokeWidth',
		'audioTrackTimeGlowColorSource',
		'audioTrackTimeGlowColor',
		'audioTrackTimeGlowBlur',
		'audioTrackTimeFilterBrightness',
		'audioTrackTimeFilterContrast',
		'audioTrackTimeFilterSaturation',
		'audioTrackTimeFilterBlur',
		'audioTrackTimeFilterHueRotate'
	],
	spectrum: [
		'spectrumEnabled',
		'spectrumMode',
		'spectrumLinearOrientation',
		'spectrumLinearDirection',
		'spectrumRadialShape',
		'spectrumRadialAngle',
		'spectrumRadialFitLogo',
		'spectrumFollowLogo',
		'spectrumLogoGap',
		'spectrumCircularClone',
		'spectrumColorSource',
		'spectrumShape',
		'spectrumSpan',
		'spectrumCloneOpacity',
		'spectrumCloneScale',
		'spectrumCloneGap',
		'spectrumCloneStyle',
		'spectrumCloneRadialShape',
		'spectrumCloneRadialAngle',
		'spectrumCloneBarCount',
		'spectrumCloneBarWidth',
		'spectrumCloneMinHeight',
		'spectrumCloneMaxHeight',
		'spectrumCloneSmoothing',
		'spectrumCloneGlowIntensity',
		'spectrumCloneShadowBlur',
		'spectrumCloneColorSource',
		'spectrumClonePrimaryColor',
		'spectrumCloneSecondaryColor',
		'spectrumCloneColorMode',
		'spectrumCloneBandMode',
		'spectrumCloneAudioSmoothingEnabled',
		'spectrumCloneAudioSmoothing',
		'spectrumCloneRotationSpeed',
		'spectrumCloneMirror',
		'spectrumClonePeakHold',
		'spectrumClonePeakDecay',
		'spectrumCloneWaveFillOpacity',
		'spectrumBarCount',
		'spectrumBarWidth',
		'spectrumMinHeight',
		'spectrumMaxHeight',
		'spectrumSmoothing',
		'spectrumAudioSmoothingEnabled',
		'spectrumAudioSmoothing',
		'spectrumOpacity',
		'spectrumGlowIntensity',
		'spectrumShadowBlur',
		'spectrumPrimaryColor',
		'spectrumSecondaryColor',
		'spectrumColorMode',
		'spectrumBandMode',
		'spectrumWaveFillOpacity',
		'spectrumMirror',
		'spectrumPeakHold',
		'spectrumPeakDecay',
		'spectrumRotationSpeed',
		'spectrumInnerRadius',
		'spectrumPositionX',
		'spectrumPositionY'
	],
	logo: [
		'logoEnabled',
		'logoBaseSize',
		'logoPositionX',
		'logoPositionY',
		'logoAudioSmoothingEnabled',
		'logoAudioSmoothing',
		'logoAudioSensitivity',
		'logoReactiveScaleIntensity',
		'logoBandMode',
		'logoReactivitySpeed',
		'logoAttack',
		'logoRelease',
		'logoMinScale',
		'logoMaxScale',
		'logoPunch',
		'logoPeakWindow',
		'logoPeakFloor',
		'logoGlowColorSource',
		'logoGlowColor',
		'logoGlowBlur',
		'logoShadowEnabled',
		'logoShadowColorSource',
		'logoShadowColor',
		'logoShadowBlur',
		'logoBackdropEnabled',
		'logoBackdropColorSource',
		'logoBackdropColor',
		'logoBackdropOpacity',
		'logoBackdropPadding'
	],
	diagnostics: [
		'showBackgroundScaleMeter',
		'showSpectrumDiagnosticsHud',
		'showLogoDiagnosticsHud'
	],
	particles: [
		'particlesEnabled',
		'particleLayerMode',
		'particleCount',
		'particleSpeed',
		'particleShape',
		'particleColorSource',
		'particleColorMode',
		'particleColor1',
		'particleColor2',
		'particleOpacity',
		'particleFilterBrightness',
		'particleFilterContrast',
		'particleFilterSaturation',
		'particleFilterBlur',
		'particleFilterHueRotate',
		'particleScanlineIntensity',
		'particleScanlineSpacing',
		'particleScanlineThickness',
		'particleRotationIntensity',
		'particleRotationDirection',
		'particleSizeMin',
		'particleSizeMax',
		'particleGlow',
		'particleGlowStrength',
		'particleFadeInOut',
		'particleAudioReactive',
		'particleAudioChannel',
		'particleAudioSizeBoost',
		'particleAudioOpacityBoost'
	],
	rain: [
		'rainEnabled',
		'rainIntensity',
		'rainDropCount',
		'rainAngle',
		'rainMeshRotationZ',
		'rainColorSource',
		'rainColor',
		'rainColorMode',
		'rainParticleType',
		'rainLength',
		'rainWidth',
		'rainBlur',
		'rainSpeed',
		'rainVariation'
	],
	editor: [
		'showFps',
		'controlPanelAnchor',
		'fpsOverlayAnchor',
		'editorTheme',
		'editorThemeColorSource',
		'editorCornerRadius',
		'editorManualAccentColor',
		'editorManualSecondaryColor',
		'editorManualBackdropColor',
		'editorManualTextPrimaryColor',
		'editorManualTextSecondaryColor',
		'editorManualBackdropOpacity',
		'editorManualBlurPx',
		'editorManualSurfaceOpacity',
		'quickActionsEnabled',
		'quickActionsPositionX',
		'quickActionsPositionY',
		'quickActionsLauncherPositionX',
		'quickActionsLauncherPositionY',
		'quickActionsBackdropOpacity',
		'quickActionsBlurPx',
		'quickActionsScale',
		'quickActionsLauncherSize',
		'quickActionsColorSource',
		'quickActionsManualAccentColor',
		'quickActionsManualSecondaryColor',
		'quickActionsManualBackdropColor',
		'quickActionsManualTextPrimaryColor',
		'quickActionsManualTextSecondaryColor',
		'quickActionsManualSurfaceOpacity'
	],
	overlays: [],
	export: [],
	perf: ['performanceMode']
};

function resolveCanvasInteractionTab(
	main: MainTabId,
	advanced: AdvancedSubTab
): string | null {
	switch (main) {
		case 'scene':
			return 'presets';
		case 'spectrum':
			return 'spectrum';
		case 'looks':
			return 'filters';
		case 'layers':
			return 'layers';
		case 'motion':
			return 'particles';
		case 'audio':
			return 'audio';
		case 'advanced':
			return advanced;
		default:
			return null;
	}
}

const MAIN_TAB_RESET_KEYS: Record<MainTabId, (keyof WallpaperState)[]> = {
	scene: [],
	spectrum: LEGACY_TAB_KEYS.spectrum ?? [],
	looks: LEGACY_TAB_KEYS.filters ?? [],
	layers: [
		...(LEGACY_TAB_KEYS.presets ?? []),
		...(LEGACY_TAB_KEYS.layers ?? [])
	],
	motion: [
		...(LEGACY_TAB_KEYS.particles ?? []),
		...(LEGACY_TAB_KEYS.rain ?? [])
	],
	audio: LEGACY_TAB_KEYS.audio ?? [],
	advanced: []
};

const ADVANCED_RESET_KEYS: Record<
	AdvancedSubTab,
	(keyof WallpaperState)[]
> = {
	track: LEGACY_TAB_KEYS.track ?? [],
	logo: LEGACY_TAB_KEYS.logo ?? [],
	diagnostics: LEGACY_TAB_KEYS.diagnostics ?? [],
	editor: LEGACY_TAB_KEYS.editor ?? [],
	export: LEGACY_TAB_KEYS.export ?? [],
	perf: LEGACY_TAB_KEYS.perf ?? []
};

const PANEL_ANCHOR_WRAPPER_CLASS: Record<ControlPanelAnchor, string> = {
	'top-left': 'top-12 left-8',
	'top-right': 'top-12 right-8',
	'bottom-left': 'bottom-8 left-8',
	'bottom-right': 'bottom-8 right-8'
};

const PANEL_ANCHOR_OVERLAY_CLASS: Record<ControlPanelAnchor, string> = {
	'top-left': 'top-12 left-0',
	'top-right': 'top-12 right-0',
	'bottom-left': 'bottom-12 left-0',
	'bottom-right': 'bottom-12 right-0'
};

interface ControlPanelProps {
	open: boolean;
	maximized: boolean;
	forceMaximized?: boolean;
	onOpenChange: (value: boolean) => void;
	onMaximizedChange: (value: boolean) => void;
	onForceClose?: () => void;
}

export default function ControlPanel({
	open,
	maximized,
	forceMaximized = false,
	onOpenChange,
	onMaximizedChange,
	onForceClose
}: ControlPanelProps) {
	const [tab, setTab] = useState<MainTabId>('scene');
	const [advancedSub, setAdvancedSub] = useState<AdvancedSubTab>('track');
	const setControlPanelActiveTab = useWallpaperStore(
		s => s.setControlPanelActiveTab
	);
	useEffect(() => {
		setControlPanelActiveTab(resolveCanvasInteractionTab(tab, advancedSub));
		return () => setControlPanelActiveTab(null);
	}, [tab, advancedSub, setControlPanelActiveTab]);
	const t = useT();
	const {
		resetSection,
		resetSceneBindings,
		language,
		setLanguage,
		selectedOverlayId,
		overlays,
		updateOverlay,
		setSelectedOverlayId,
		controlPanelAnchor,
		editorTheme,
		editorThemeColorSource,
		editorCornerRadius,
		editorManualAccentColor,
		editorManualSecondaryColor,
		editorManualBackdropColor,
		editorManualTextPrimaryColor,
		editorManualTextSecondaryColor,
		editorManualBackdropOpacity,
		editorManualBlurPx,
		editorManualSurfaceOpacity,
		editorManualItemOpacity,
		logoUrl,
		audioPaused,
		motionPaused,
		setAudioPaused,
		setMotionPaused
	} = useWallpaperStore();
	const { isFullscreen, fullscreenSupported, toggleFullscreen } =
		useWindowPresentationControls();
	const {
		captureMode,
		isPaused,
		pauseFileForSystem,
		resumeFileFromSystem
	} =
		useAudioContext();
	const theme = EDITOR_THEME_CLASSES[editorTheme];
	const backgroundPalette = useBackgroundPalette();
	const themeVars = getScopedEditorThemeColorVars(
		editorThemeColorSource,
		backgroundPalette,
		editorTheme,
		{
			accent: editorManualAccentColor,
			secondary: editorManualSecondaryColor,
			backdrop: editorManualBackdropColor,
			textPrimary: editorManualTextPrimaryColor,
			textSecondary: editorManualTextSecondaryColor
		},
		{
			backdropOpacity: editorManualBackdropOpacity,
			blurPx: editorManualBlurPx,
			surfaceOpacity: editorManualSurfaceOpacity,
			itemOpacity: editorManualItemOpacity
		}
	);
	const radiusVars = getEditorRadiusVars(editorCornerRadius);
	const effectiveAudioPaused =
		captureMode === 'file' ? isPaused || audioPaused : audioPaused;

	useEffect(() => {
		if (!open && !maximized) {
			setSelectedOverlayId(null);
		}
	}, [maximized, open, setSelectedOverlayId]);

	function toggleHeaderAudioPause() {
		const nextPaused = !effectiveAudioPaused;
		setAudioPaused(nextPaused);
		if (captureMode === 'file') {
			if (nextPaused) pauseFileForSystem();
			else resumeFileFromSystem();
		}
	}

	function toggleHeaderPauseAll() {
		const shouldResumeAll = effectiveAudioPaused || motionPaused;
		const nextPaused = !shouldResumeAll;
		setAudioPaused(nextPaused);
		setMotionPaused(nextPaused);
		if (captureMode === 'file') {
			if (shouldResumeAll) resumeFileFromSystem();
			else pauseFileForSystem();
		}
	}

	const MAIN_TABS: { id: MainTabId; label: string }[] = [
		{ id: 'scene', label: t.tab_scene },
		{ id: 'spectrum', label: t.tab_spectrum },
		{ id: 'looks', label: t.tab_looks },
		{ id: 'layers', label: t.tab_layers },
		{ id: 'motion', label: t.tab_motion },
		{ id: 'audio', label: t.tab_audio },
		{ id: 'advanced', label: t.tab_advanced }
	];

	const ADVANCED_TABS: { id: AdvancedSubTab; label: string }[] = [
		{ id: 'track', label: t.tab_track },
		{ id: 'logo', label: t.tab_logo },
		{ id: 'diagnostics', label: t.tab_diagnostics },
		{ id: 'editor', label: t.tab_editor },
		{ id: 'export', label: t.tab_export },
		{ id: 'perf', label: t.tab_perf }
	];

	function resetSelectedOverlayLayout() {
		const selected = overlays.find(
			overlay => overlay.id === selectedOverlayId
		);
		if (!selected) return;
		updateOverlay(selected.id, {
			enabled: true,
			positionX: 0,
			positionY: 0,
			scale: 1,
			rotation: 0,
			opacity: 1,
			blendMode: 'normal',
			cropShape: 'rectangle',
			edgeFade: 0.08,
			edgeBlur: 0,
			edgeGlow: 0.12
		});
	}

	function resetTab() {
		if (tab === 'scene') {
			resetSceneBindings();
			return;
		}
		if (tab === 'layers') {
			resetSection(
				MAIN_TAB_RESET_KEYS.layers.filter(
					k => !['imageUrl', 'logoUrl'].includes(k as string)
				)
			);
			resetSelectedOverlayLayout();
			return;
		}
		if (tab === 'advanced') {
			resetSection(
				ADVANCED_RESET_KEYS[advancedSub].filter(
					k => !['imageUrl', 'logoUrl'].includes(k as string)
				)
			);
			return;
		}

		resetSection(
			MAIN_TAB_RESET_KEYS[tab].filter(
				k => !['imageUrl', 'logoUrl'].includes(k as string)
			)
		);
	}

	void DEFAULT_STATE;

	return (
		<>
			{(maximized || forceMaximized) && (
				<EditorOverlay
					onClose={() => {
						if (forceMaximized && onForceClose) {
							onForceClose();
							return;
						}
						onMaximizedChange(false);
					}}
				/>
			)}
			{!forceMaximized ? (
				<div
					className={`fixed z-50 ${PANEL_ANCHOR_WRAPPER_CLASS[controlPanelAnchor]}`}
				>
					<button
						onClick={() => onOpenChange(!open)}
						className={`group h-10 w-10 rounded-full transition-all duration-200 ${theme.launcher} ${open ? theme.launcherOpen : ''}`}
						style={{
							borderRadius: 'var(--editor-radius-xl)',
							background: 'var(--editor-button-bg)',
							borderColor: 'var(--editor-button-border)',
							color: 'var(--editor-button-fg)',
							...radiusVars
						}}
						title={open ? 'Close panel' : 'Open editor'}
					>
						<span
							className="relative flex h-full w-full items-center justify-center overflow-hidden"
							style={{ borderRadius: 'var(--editor-radius-xl)' }}
						>
							{logoUrl && !open ? (
								<img
									src={logoUrl}
									alt=""
									className={`h-6 w-6 rounded-full object-cover opacity-85 ring-1 ${theme.launcherImageRing}`}
								/>
							) : (
								<span
									className={`text-lg font-semibold transition-opacity ${theme.launcherIcon}`}
								>
									{open ? '×' : '◌'}
								</span>
							)}
						</span>
					</button>

					{open && (
						<div
							className={`absolute box-border flex w-full max-w-[calc(100vw-1rem)] min-w-0 flex-col overflow-x-hidden ${theme.panelShell} ${PANEL_ANCHOR_OVERLAY_CLASS[controlPanelAnchor]}`}
							style={{
								borderRadius: 'var(--editor-radius-lg)',
								width: 'min(27rem, calc(100vw - 1rem))',
								backgroundColor: 'var(--editor-shell-bg)',
								borderColor: 'var(--editor-shell-border)',
								backdropFilter:
									'blur(var(--editor-shell-blur)) saturate(138%)',
								WebkitBackdropFilter:
									'blur(var(--editor-shell-blur)) saturate(138%)',
								...themeVars,
								...radiusVars
							}}
						>
							{/* Header */}
							<div
								className={`flex flex-wrap items-center gap-2 px-4 pt-3 pb-2 ${theme.panelHeader}`}
								style={{
									backgroundColor: 'var(--editor-header-bg)',
									borderBottomColor: 'var(--editor-header-border)'
								}}
							>
								<div className="flex min-w-0 flex-1 items-center gap-2">
									<span
										className={`text-xs uppercase tracking-widest font-bold ${theme.panelTitle}`}
										style={{ color: 'var(--editor-accent-soft)' }}
									>
										{t.title}
									</span>
								</div>
								{fullscreenSupported ? (
									<button
										onClick={() => void toggleFullscreen()}
										title={
											isFullscreen
												? t.label_exit_fullscreen
												: t.label_enter_fullscreen
										}
										aria-label={
											isFullscreen
												? t.label_exit_fullscreen
												: t.label_enter_fullscreen
										}
										className="flex h-8 w-10 items-center justify-center rounded border px-2 py-0.5 text-sm transition-colors"
										style={{
											borderRadius: 'var(--editor-radius-md)',
											background: 'var(--editor-button-bg)',
											borderColor: 'var(--editor-button-border)',
											color: 'var(--editor-button-fg)'
										}}
									>
										{isFullscreen ? '⤡' : '⤢'}
									</button>
								) : null}
								<button
									onClick={toggleHeaderAudioPause}
									title={t.hint_pause_audio_only}
									aria-label={t.hint_pause_audio_only}
									className="flex h-8 w-8 items-center justify-center rounded border px-2 py-0.5 text-sm transition-colors"
									style={{
										borderRadius: 'var(--editor-radius-md)',
										background: 'var(--editor-button-bg)',
										borderColor: 'var(--editor-button-border)',
										color: 'var(--editor-button-fg)'
									}}
								>
									{effectiveAudioPaused ? '▶' : '⏸'}
								</button>
								<button
									onClick={toggleHeaderPauseAll}
									title={t.hint_pause_all}
									aria-label={t.hint_pause_all}
									className="flex h-8 w-8 items-center justify-center rounded border border-orange-400/40 bg-orange-500/10 px-2 py-0.5 text-sm text-orange-100 transition-colors hover:border-orange-300 hover:bg-orange-500/15"
									style={{ borderRadius: 'var(--editor-radius-md)' }}
								>
									{effectiveAudioPaused || motionPaused ? '▶' : '⏸'}
								</button>
								<span
									className={`text-xs ${theme.panelSubtle}`}
									style={{ color: 'var(--editor-accent-muted)' }}
								>
									{t.autoSaved}
								</span>
								<button
									onClick={() =>
										setLanguage(
											language === 'en' ? 'es' : 'en'
										)
									}
									className="text-xs px-1.5 py-0.5 rounded border transition-colors"
									style={{
										borderRadius: 'var(--editor-radius-md)',
										background: 'var(--editor-button-bg)',
										borderColor: 'var(--editor-button-border)',
										color: 'var(--editor-button-fg)'
									}}
									title="Toggle language / Cambiar idioma"
								>
									{language === 'en' ? 'ES' : 'EN'}
								</button>
								<button
									onClick={() => onMaximizedChange(true)}
									title={t.label_open_editor_workspace}
									className="flex h-8 w-8 items-center justify-center rounded border px-2 py-0.5 text-sm transition-colors"
									style={{
										borderRadius: 'var(--editor-radius-md)',
										background: 'var(--editor-button-bg)',
										borderColor: 'var(--editor-button-border)',
										color: 'var(--editor-button-fg)'
									}}
								>
									⧉
								</button>
							</div>

							{/* Tabs — horizontal scroll, no wrap */}
							<div
								className={`flex min-w-0 flex-wrap gap-1 p-1.5 ${theme.tabBar}`}
								style={{
									background: 'var(--editor-tabbar-bg)',
									borderBottomColor: 'var(--editor-tabbar-border)'
								}}
							>
								{MAIN_TABS.map(row => (
									<button
										key={row.id}
										onClick={() => setTab(row.id)}
										className="rounded border px-2 py-1 text-xs whitespace-nowrap transition-colors"
										style={
											tab === row.id
												? {
														borderRadius:
															'var(--editor-radius-sm)',
														background:
															'var(--editor-active-bg)',
														borderColor:
															'var(--editor-accent-border)',
														color:
															'var(--editor-active-fg)'
												  }
												: {
														borderRadius:
															'var(--editor-radius-sm)',
														background:
															'var(--editor-tag-bg)',
														borderColor:
															'var(--editor-tag-border)',
														color:
															'var(--editor-tag-fg)'
												  }
										}
									>
										{row.label}
									</button>
								))}
							</div>

							{/* Tab Content */}
							<div className="editor-scroll flex min-w-0 flex-col gap-2.5 overflow-x-hidden overflow-y-auto p-3 max-h-[calc(100dvh-11rem)]">
								{tab === 'advanced' ? (
									<div
										className="flex flex-wrap gap-1"
										style={{
											borderBottom:
												'1px solid var(--editor-tabbar-border)',
											paddingBottom: 6
										}}
									>
										{ADVANCED_TABS.map(row => (
											<button
												key={row.id}
												type="button"
												onClick={() => setAdvancedSub(row.id)}
												className="rounded border px-2 py-0.5 text-[10px] whitespace-nowrap transition-colors"
												style={
													advancedSub === row.id
														? {
																background:
																	'var(--editor-active-bg)',
																borderColor:
																	'var(--editor-accent-border)',
																color:
																	'var(--editor-active-fg)'
															}
														: {
																background:
																	'var(--editor-tag-bg)',
																borderColor:
																	'var(--editor-tag-border)',
																color:
																	'var(--editor-tag-fg)'
															}
												}
											>
												{row.label}
											</button>
										))}
									</div>
								) : null}
								<ControlTabSuspense>
									{tab === 'scene' && (
										<SceneTab onReset={resetTab} />
									)}
									{tab === 'spectrum' && (
										<SpectrumTab onReset={resetTab} />
									)}
									{tab === 'looks' && (
										<FiltersTab onReset={resetTab} />
									)}
									{tab === 'layers' && (
										<>
											<BgTab onReset={resetTab} />
											<LayersTab onReset={resetTab} />
											<OverlaysTab onReset={resetTab} />
										</>
									)}
									{tab === 'motion' && (
										<MotionTab
											onResetParticles={() =>
												resetSection(
													(LEGACY_TAB_KEYS.particles ?? []).filter(
														k =>
															!['imageUrl', 'logoUrl'].includes(
																k as string
															)
													)
												)
											}
											onResetRain={() =>
												resetSection(
													(LEGACY_TAB_KEYS.rain ?? []).filter(
														k =>
															!['imageUrl', 'logoUrl'].includes(
																k as string
															)
													)
												)
											}
										/>
									)}
									{tab === 'audio' && (
										<AudioTab onReset={resetTab} />
									)}
									{tab === 'advanced' && advancedSub === 'track' && (
										<TrackTitleTab onReset={resetTab} />
									)}
									{tab === 'advanced' && advancedSub === 'logo' && (
										<LogoTab onReset={resetTab} />
									)}
									{tab === 'advanced' &&
										advancedSub === 'diagnostics' && (
											<DiagnosticsTab onReset={resetTab} />
										)}
									{tab === 'advanced' && advancedSub === 'editor' && (
										<EditorTab onReset={resetTab} />
									)}
									{tab === 'advanced' && advancedSub === 'export' && (
										<ExportTab />
									)}
									{tab === 'advanced' && advancedSub === 'perf' && (
										<PerfTab />
									)}
								</ControlTabSuspense>
							</div>
						</div>
					)}
				</div>
			) : null}
		</>
	);
}
