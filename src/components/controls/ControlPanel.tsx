import { useEffect, useState } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import type { WallpaperState } from '@/types/wallpaper';
import EditorOverlay from './EditorOverlay';
import { DEFAULT_STATE } from '@/lib/constants';
import type { ControlPanelAnchor } from '@/types/wallpaper';
import {
	EDITOR_THEME_CLASSES,
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
	OverlaysTab,
	ParticlesTab,
	PerfTab,
	RainTab,
	SpectrumTab,
	TrackTitleTab
} from './controlTabsLazy';

type TabId =
	| 'layers'
	| 'presets'
	| 'filters'
	| 'audio'
	| 'track'
	| 'spectrum'
	| 'logo'
	| 'diagnostics'
	| 'particles'
	| 'rain'
	| 'overlays'
	| 'export'
	| 'perf';

const TAB_KEYS: Record<TabId, (keyof WallpaperState)[]> = {
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
	overlays: [],
	export: [],
	perf: [
		'performanceMode',
		'editorTheme',
		'editorThemeColorSource',
		'editorManualAccentColor',
		'editorManualSecondaryColor',
		'editorManualBackdropColor'
	]
};

const PANEL_ANCHOR_WRAPPER_CLASS: Record<ControlPanelAnchor, string> = {
	'top-left': 'top-8 left-6',
	'top-right': 'top-8 right-6',
	'bottom-left': 'bottom-6 left-6',
	'bottom-right': 'bottom-6 right-6'
};

const PANEL_ANCHOR_OVERLAY_CLASS: Record<ControlPanelAnchor, string> = {
	'top-left': 'top-14 left-0',
	'top-right': 'top-14 right-0',
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
	const [tab, setTab] = useState<TabId>('presets');
	const t = useT();
	const {
		resetSection,
		language,
		setLanguage,
		selectedOverlayId,
		overlays,
		updateOverlay,
		setSelectedOverlayId,
		controlPanelAnchor,
		editorTheme,
		editorThemeColorSource,
		editorManualAccentColor,
		editorManualSecondaryColor,
		editorManualBackdropColor,
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
			backdrop: editorManualBackdropColor
		}
	);
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

	const TABS: { id: TabId; label: string }[] = [
		{ id: 'layers', label: t.tab_layers },
		{ id: 'presets', label: t.tab_presets },
		{ id: 'filters', label: t.tab_filters },
		{ id: 'audio', label: t.tab_audio },
		{ id: 'track', label: t.tab_track },
		{ id: 'spectrum', label: t.tab_spectrum },
		{ id: 'logo', label: t.tab_logo },
		{ id: 'diagnostics', label: t.tab_diagnostics },
		{ id: 'particles', label: t.tab_particles },
		{ id: 'rain', label: t.tab_rain },
		{ id: 'overlays', label: t.tab_overlays },
		{ id: 'export', label: t.tab_export },
		{ id: 'perf', label: t.tab_perf }
	];

	function resetTab() {
		if (tab === 'overlays') {
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
			return;
		}

		resetSection(
			TAB_KEYS[tab].filter(
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
							background: 'var(--editor-button-bg)',
							borderColor: 'var(--editor-button-border)',
							color: 'var(--editor-button-fg)'
						}}
						title={open ? 'Close panel' : 'Open editor'}
					>
						<span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full">
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
							className={`absolute box-border flex w-full max-w-[calc(100vw-1rem)] min-w-0 flex-col overflow-x-hidden rounded-lg ${theme.panelShell} ${PANEL_ANCHOR_OVERLAY_CLASS[controlPanelAnchor]}`}
							style={{
								width: 'min(27rem, calc(100vw - 1rem))',
								background: 'var(--editor-shell-bg)',
								borderColor: 'var(--editor-shell-border)',
								...themeVars
							}}
						>
							{/* Header */}
							<div
								className={`flex flex-wrap items-center gap-2 px-4 pt-3 pb-2 ${theme.panelHeader}`}
								style={{
									background: 'var(--editor-header-bg)',
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
								{TABS.map(t => (
									<button
										key={t.id}
										onClick={() => setTab(t.id)}
										className="rounded border px-2 py-1 text-xs whitespace-nowrap transition-colors"
										style={
											tab === t.id
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
										{t.label}
									</button>
								))}
							</div>

							{/* Tab Content */}
							<div className="flex min-w-0 flex-col gap-2.5 overflow-x-hidden overflow-y-auto p-3 max-h-[calc(100dvh-9rem)]">
								<ControlTabSuspense>
									{tab === 'layers' && (
										<LayersTab onReset={resetTab} />
									)}
									{tab === 'presets' && (
										<BgTab onReset={resetTab} />
									)}
									{tab === 'filters' && (
										<FiltersTab onReset={resetTab} />
									)}
									{tab === 'audio' && (
										<AudioTab onReset={resetTab} />
									)}
									{tab === 'track' && (
										<TrackTitleTab onReset={resetTab} />
									)}
									{tab === 'spectrum' && (
										<SpectrumTab onReset={resetTab} />
									)}
									{tab === 'logo' && (
										<LogoTab onReset={resetTab} />
									)}
									{tab === 'diagnostics' && (
										<DiagnosticsTab onReset={resetTab} />
									)}
									{tab === 'particles' && (
										<ParticlesTab onReset={resetTab} />
									)}
									{tab === 'rain' && (
										<RainTab onReset={resetTab} />
									)}
									{tab === 'overlays' && (
										<OverlaysTab onReset={resetTab} />
									)}
									{tab === 'export' && <ExportTab />}
									{tab === 'perf' && <PerfTab />}
								</ControlTabSuspense>
							</div>
						</div>
					)}
				</div>
			) : null}
		</>
	);
}
