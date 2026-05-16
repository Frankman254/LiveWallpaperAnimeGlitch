import { useState, type CSSProperties, type ReactNode } from 'react';
import {
	X,
	Play,
	Pause,
	Maximize2,
	Minimize2,
	Layers as LayersIcon,
	Image as ImageIcon,
	AudioWaveform,
	SlidersHorizontal,
	Sparkles,
	Music2,
	Type,
	Wrench,
	Activity,
	Download,
	Gauge,
	Settings2,
	Film,
	Zap
} from 'lucide-react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import type { WallpaperState } from '@/types/wallpaper';
import { useViewportResolution } from '@/features/layout/viewportMetrics';
import { resolveResponsiveEditorLayout } from '@/features/layout/responsiveLayout';
import {
	EDITOR_THEME_CLASSES,
	getEditorRadiusVars,
	getScopedEditorThemeColorVars
} from './editorTheme';
import { useWindowPresentationControls } from '@/hooks/useWindowPresentationControls';
import { useAudioContext } from '@/context/useAudioContext';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import { ControlTabSuspense } from './controlTabsLazy';
import { lazy } from 'react';

const SceneTab = lazy(() => import('./tabs/modern/ModernSceneTab'));
const SpectrumTab = lazy(() => import('./tabs/modern/ModernSpectrumTab'));
const FiltersTab = lazy(() => import('./tabs/modern/ModernLooksTab'));
const MotionTab = lazy(() => import('./tabs/modern/ModernMotionTab'));
const AudioTab = lazy(() => import('./tabs/modern/ModernAudioTab'));
const LogoTab = lazy(() => import('./tabs/modern/ModernLogoTab'));
const TrackTitleTab = lazy(() => import('./tabs/modern/ModernTrackTitleTab'));
const LyricsTab = lazy(() => import('./tabs/modern/ModernLyricsTab'));
const EditorTab = lazy(() => import('./tabs/modern/ModernEditorTab'));
const DiagnosticsTab = lazy(() => import('./tabs/modern/ModernDiagnosticsTab'));
const ExportTab = lazy(() => import('./tabs/modern/ModernExportTab'));
const PerfTab = lazy(() => import('./tabs/modern/ModernPerfTab'));
const BackgroundPanel = lazy(
	() => import('./tabs/modern/ModernBackgroundPanel')
);
const LayersTab = lazy(
	() => import('./tabs/modern/layers/ModernLayerStackPanel')
);
const OverlaysTab = lazy(
	() => import('./tabs/modern/layers/ModernOverlaysPanel')
);
const EditorOverlayInsightsPane = lazy(
	() => import('./tabs/modern/editor/EditorOverlayInsightsPane')
);
import { EDITOR_OVERLAY_TAB_KEYS } from './controlPanelResetKeys';
import IconButton from '@/ui/IconButton';
import { ICON_SIZE } from './ui/designTokens';
import { useIsAdvanced } from './UIMode';
import { SegmentedControl } from '@/ui';

type SectionId =
	| 'scene'
	| 'layers'
	| 'presets'
	| 'overlays'
	| 'spectrum'
	| 'filters'
	| 'motion'
	| 'logo'
	| 'track'
	| 'lyrics'
	| 'audio'
	| 'editor'
	| 'diagnostics'
	| 'export'
	| 'perf';

type SectionGroup = {
	id: string;
	label: string;
	items: { id: SectionId; label: string; icon: ReactNode }[];
	advancedOnly?: boolean;
};

export default function EditorOverlay({ onClose }: { onClose: () => void }) {
	const t = useT();
	const {
		resetSection,
		resetSceneSlotBindings,
		language,
		setLanguage,
		overlays,
		selectedOverlayId,
		updateOverlay,
		layoutResponsiveEnabled,
		layoutReferenceWidth,
		layoutReferenceHeight,
		editorTheme,
		editorThemeColorSource,
		editorCornerRadius,
		editorControlCornerRadius,
		editorManualAccentColor,
		editorManualSecondaryColor,
		editorManualBackdropColor,
		editorManualTextPrimaryColor,
		editorManualTextSecondaryColor,
		editorManualBackdropOpacity,
		editorManualBlurPx,
		editorManualSurfaceOpacity,
		editorManualItemOpacity,
		audioPaused,
		motionPaused,
		setAudioPaused,
		setMotionPaused,
		uiMode,
		setUIMode,
		logoUrl
	} = useWallpaperStore();
	const { isFullscreen, fullscreenSupported, toggleFullscreen } =
		useWindowPresentationControls();
	const { captureMode, isPaused, pauseFileForSystem, resumeFileFromSystem } =
		useAudioContext();
	const isAdvanced = useIsAdvanced();
	const theme = EDITOR_THEME_CLASSES[editorTheme];
	const viewportResolution = useViewportResolution();
	const editorUiScale = resolveResponsiveEditorLayout(
		{
			layoutResponsiveEnabled,
			layoutReferenceWidth,
			layoutReferenceHeight
		},
		viewportResolution.width,
		viewportResolution.height
	).editorScale;
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
	const radiusVars = getEditorRadiusVars(
		editorCornerRadius,
		editorControlCornerRadius
	);
	const effectiveAudioPaused =
		captureMode === 'file' ? isPaused || audioPaused : audioPaused;

	const [activeSection, setActiveSection] = useState<SectionId>('scene');

	function makeReset(tabId: string) {
		return () => {
			if (tabId === 'scene') {
				resetSceneSlotBindings();
				return;
			}
			if (tabId === 'layers') {
				resetSection(
					([
						...(EDITOR_OVERLAY_TAB_KEYS.presets ?? []),
						...(EDITOR_OVERLAY_TAB_KEYS.layers ?? [])
					] as (keyof WallpaperState)[]).filter(
						k => !['imageUrl', 'logoUrl'].includes(k as string)
					)
				);
				const selected = overlays.find(
					overlay => overlay.id === selectedOverlayId
				);
				if (selected) {
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
				return;
			}
			if (tabId === 'overlays') {
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
				(EDITOR_OVERLAY_TAB_KEYS[tabId] ?? []).filter(
					k => !['imageUrl', 'logoUrl'].includes(k as string)
				)
			);
		};
	}

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

	const iconSize = ICON_SIZE.sm;
	const SECTION_GROUPS: SectionGroup[] = [
		{
			id: 'compose',
			label: 'COMPOSE',
			items: [
				{
					id: 'scene',
					label: t.tab_scene,
					icon: <Film size={iconSize} />
				},
				{
					id: 'layers',
					label: t.tab_layers,
					icon: <LayersIcon size={iconSize} />
				}
			]
		},
		{
			id: 'image',
			label: 'IMAGE',
			items: [
				{
					id: 'presets',
					label: t.tab_presets,
					icon: <ImageIcon size={iconSize} />
				},
				{
					id: 'overlays',
					label: t.tab_overlays,
					icon: <Sparkles size={iconSize} />
				}
			]
		},
		{
			id: 'effects',
			label: 'EFFECTS',
			items: [
				{
					id: 'spectrum',
					label: t.tab_spectrum,
					icon: <AudioWaveform size={iconSize} />
				},
				{
					id: 'filters',
					label: t.tab_looks,
					icon: <SlidersHorizontal size={iconSize} />
				},
				{
					id: 'motion',
					label: t.tab_motion,
					icon: <Zap size={iconSize} />
				}
			]
		},
		{
			id: 'branding',
			label: 'BRANDING',
			items: [
				{
					id: 'logo',
					label: t.tab_logo,
					icon: <ImageIcon size={iconSize} />
				},
				{
					id: 'track',
					label: t.tab_track,
					icon: <Type size={iconSize} />
				},
				{
					id: 'lyrics',
					label: t.tab_lyrics,
					icon: <Type size={iconSize} />
				}
			]
		},
		{
			id: 'audio',
			label: 'AUDIO',
			items: [
				{
					id: 'audio',
					label: t.tab_audio,
					icon: <Music2 size={iconSize} />
				}
			]
		},
		{
			id: 'advanced',
			label: 'ADVANCED',
			advancedOnly: true,
			items: [
				{
					id: 'editor',
					label: t.tab_editor,
					icon: <Settings2 size={iconSize} />
				},
				{
					id: 'diagnostics',
					label: t.tab_diagnostics,
					icon: <Activity size={iconSize} />
				},
				{
					id: 'export',
					label: t.tab_export,
					icon: <Download size={iconSize} />
				},
				{
					id: 'perf',
					label: t.tab_perf,
					icon: <Gauge size={iconSize} />
				}
			]
		}
	];

	const visibleGroups = isAdvanced
		? SECTION_GROUPS
		: SECTION_GROUPS.filter(g => !g.advancedOnly);

	const allVisibleIds = visibleGroups.flatMap(g => g.items.map(i => i.id));
	const effectiveActive: SectionId = allVisibleIds.includes(activeSection)
		? activeSection
		: 'scene';

	const activeLabel =
		visibleGroups
			.flatMap(g => g.items)
			.find(i => i.id === effectiveActive)?.label ?? t.tab_scene;
	const flatNavItems = visibleGroups.flatMap(group =>
		group.items.map(item => ({
			...item,
			groupLabel: group.label
		}))
	);
	const expandedEditorVars = {
		'--bg-preview-height': 'clamp(320px, 28vw, 560px)',
		'--bg-control-gap': '0.75rem',
		'--bg-stepper-size': '2.4rem',
		'--bg-input-height': '2.4rem',
		'--bg-slider-hit-height': '2.4rem',
		'--bg-slider-track-height': '6px',
		'--bg-slider-thumb-size': '16px',
		'--profile-slot-card-min': '220px',
		'--profile-slot-row-padding': '0.625rem 0.75rem',
		'--profile-slot-row-min-h': '2.5rem',
		'--section-card-compact-header-padding': '14px 16px',
		'--section-card-compact-body-padding': '18px',
		'--editor-slot-gap': '0.5rem'
	} as CSSProperties;

	function renderActiveSection() {
		switch (effectiveActive) {
			case 'scene':
				return <SceneTab onReset={makeReset('scene')} />;
			case 'layers':
				return <LayersTab />;
			case 'presets':
				return <BackgroundPanel />;
			case 'overlays':
				return <OverlaysTab onReset={makeReset('overlays')} />;
			case 'spectrum':
				return <SpectrumTab onReset={makeReset('spectrum')} />;
			case 'filters':
				return <FiltersTab onReset={makeReset('filters')} />;
			case 'motion':
				return (
					<MotionTab
						onResetParticles={makeReset('particles')}
						onResetRain={makeReset('rain')}
					/>
				);
			case 'logo':
				return <LogoTab onReset={makeReset('logo')} />;
			case 'track':
				return <TrackTitleTab onReset={makeReset('track')} />;
			case 'lyrics':
				return <LyricsTab onReset={makeReset('lyrics')} />;
			case 'audio':
				return <AudioTab onReset={makeReset('audio')} />;
			case 'editor':
				return <EditorTab onReset={makeReset('editor')} />;
			case 'diagnostics':
				return <DiagnosticsTab onReset={makeReset('diagnostics')} />;
			case 'export':
				return <ExportTab />;
			case 'perf':
				return <PerfTab />;
			default:
				return null;
		}
	}

	return (
		<div
			className={`fixed inset-0 z-[100] flex max-h-dvh max-w-dvw flex-col overflow-hidden p-3 ${theme.overlayShell}`}
			style={{
				background:
					'color-mix(in srgb, var(--editor-shell-bg) 84%, rgba(0,0,0,0.72))',
				backdropFilter: 'blur(var(--editor-shell-blur)) saturate(138%)',
				WebkitBackdropFilter:
					'blur(var(--editor-shell-blur)) saturate(138%)',
				...themeVars,
				...radiusVars,
				...expandedEditorVars
			}}
		>
			<div
				className="flex h-full w-full min-h-0 min-w-0 flex-col overflow-hidden"
				style={
					editorUiScale === 1
						? undefined
						: {
								width: `calc(100% / ${editorUiScale})`,
								height: `calc(100% / ${editorUiScale})`,
								maxWidth: `calc(100% / ${editorUiScale})`,
								maxHeight: `calc(100% / ${editorUiScale})`,
								transform: `scale(${editorUiScale})`,
								transformOrigin: 'top left'
						  }
				}
			>
				<div
					className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border"
					style={{
						borderRadius: 'var(--editor-radius-xl)',
						borderColor: 'var(--editor-shell-border)',
						background:
							'linear-gradient(180deg, color-mix(in srgb, var(--editor-shell-bg) 96%, transparent), color-mix(in srgb, var(--editor-shell-bg) 88%, #030712 12%))',
						boxShadow:
							'0 26px 70px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.06)'
					}}
				>
					<header
						className="flex shrink-0 items-center gap-4 border-b px-5 py-4"
						style={{
							borderBottomColor: 'var(--editor-header-border)',
							background:
								'linear-gradient(180deg, color-mix(in srgb, var(--editor-header-bg) 94%, transparent), color-mix(in srgb, var(--editor-shell-bg) 92%, transparent))'
						}}
					>
						<div
							className="grid h-10 w-10 shrink-0 place-items-center border"
							style={{
								borderRadius: 'var(--editor-radius-lg)',
								borderColor: 'var(--editor-accent-border)',
								background: 'var(--editor-active-bg)',
								color: 'var(--editor-active-fg)'
							}}
						>
							{logoUrl ? (
								<img
									src={logoUrl}
									alt=""
									className="h-7 w-7 rounded object-cover"
								/>
							) : (
								<Activity size={18} strokeWidth={2.35} />
							)}
						</div>
						<div className="min-w-0">
							<h1
								className={`truncate text-[16px] font-bold leading-tight ${theme.panelTitle}`}
								style={{ color: 'var(--editor-accent-fg)' }}
							>
								{t.title}
							</h1>
							<p
								className="truncate text-[11px] leading-tight"
								style={{
									color: 'var(--editor-accent-muted)',
									fontFamily:
										'"JetBrains Mono", ui-monospace, SFMono-Regular, monospace'
								}}
							>
								{activeLabel} · {isAdvanced ? 'Advanced' : 'Simple'} ·{' '}
								{t.autoSaved}
							</p>
						</div>

						<div className="ml-auto flex items-center gap-2">
							<SegmentedControl
								size="md"
								value={uiMode}
								onChange={setUIMode}
								options={[
									{
										value: 'simple',
										label: 'Simple',
										icon: <Sparkles size={13} />
									},
									{
										value: 'advanced',
										label: 'Advanced',
										icon: <SlidersHorizontal size={13} />
									}
								]}
							/>
							<IconButton
								onClick={toggleHeaderAudioPause}
								title={t.hint_pause_audio_only}
							>
								{effectiveAudioPaused ? (
									<Play size={ICON_SIZE.sm} />
								) : (
									<Pause size={ICON_SIZE.sm} />
								)}
							</IconButton>
							{isAdvanced && (
								<IconButton
									variant="warning"
									onClick={toggleHeaderPauseAll}
									title={t.hint_pause_all}
								>
									{effectiveAudioPaused || motionPaused ? (
										<Play size={ICON_SIZE.sm} />
									) : (
										<Pause size={ICON_SIZE.sm} />
									)}
								</IconButton>
							)}
							{fullscreenSupported ? (
								<IconButton
									onClick={() => void toggleFullscreen()}
									title={
										isFullscreen
											? t.label_exit_fullscreen
											: t.label_enter_fullscreen
									}
								>
									{isFullscreen ? (
										<Minimize2 size={ICON_SIZE.sm} />
									) : (
										<Maximize2 size={ICON_SIZE.sm} />
									)}
								</IconButton>
							) : null}
							{isAdvanced && (
								<button
									onClick={() =>
										setLanguage(language === 'en' ? 'es' : 'en')
									}
									className="h-8 rounded border px-2 text-[11px] font-semibold transition-colors"
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
							)}
							<IconButton onClick={onClose} title="Close full editor">
								<X size={ICON_SIZE.sm} />
							</IconButton>
						</div>
					</header>

					<nav
						className="timeline-scroll flex shrink-0 items-center gap-2 overflow-x-auto border-b px-5 py-2"
						style={{
							background: 'var(--editor-tabbar-bg)',
							borderBottomColor: 'var(--editor-tabbar-border)',
							scrollbarWidth: 'thin',
							scrollbarColor:
								'var(--editor-accent-border, rgba(80,160,200,0.35)) transparent'
						}}
					>
						{flatNavItems.map(item => {
							const isActive = item.id === effectiveActive;
							return (
								<button
									key={item.id}
									type="button"
									onClick={() => setActiveSection(item.id)}
									className="flex shrink-0 items-center gap-2 rounded border px-3 py-2 text-left text-[13px] font-semibold transition-colors"
									style={
										isActive
											? {
													borderRadius: 'var(--editor-radius-md)',
													background: 'var(--editor-active-bg)',
													borderColor: 'var(--editor-accent-color)',
													color: 'var(--editor-active-fg)',
													boxShadow:
														'0 8px 22px color-mix(in srgb, var(--editor-accent-color) 16%, transparent)'
												}
											: {
													borderRadius: 'var(--editor-radius-md)',
													background: 'transparent',
													borderColor: 'transparent',
													color: 'var(--editor-accent-soft)'
												}
									}
									title={`${item.groupLabel} / ${item.label}`}
								>
									<span className="shrink-0">{item.icon}</span>
									<span className="truncate">{item.label}</span>
								</button>
							);
						})}
					</nav>

					<div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
						<main
							className="editor-scroll min-h-0 min-w-0 overflow-y-auto overflow-x-hidden"
							style={{
								scrollbarWidth: 'thin',
								scrollbarColor:
									'var(--editor-accent-border, rgba(80,160,200,0.35)) transparent'
							}}
						>
							<div className="mx-auto flex w-full max-w-none min-w-0 flex-col gap-5 px-5 py-5 xl:px-8 xl:py-6">
								<div className="flex items-center gap-2">
									<Wrench
										size={ICON_SIZE.sm}
										style={{ color: 'var(--editor-accent-muted)' }}
									/>
									<h2
										className={`text-[13px] font-bold uppercase tracking-[0.16em] ${theme.panelTitle}`}
										style={{ color: 'var(--editor-accent-soft)' }}
									>
										{activeLabel}
									</h2>
								</div>
								<ControlTabSuspense>{renderActiveSection()}</ControlTabSuspense>
							</div>
						</main>
						<aside
							className="editor-scroll hidden min-h-0 min-w-0 overflow-y-auto overflow-x-hidden border-l xl:block"
							style={{
								borderLeftColor:
									'var(--editor-header-border, rgba(255,255,255,0.06))',
								background:
									'color-mix(in srgb, var(--editor-shell-bg) 92%, #000 8%)',
								scrollbarWidth: 'thin',
								scrollbarColor:
									'var(--editor-accent-border, rgba(80,160,200,0.35)) transparent'
							}}
						>
							<div className="flex flex-col gap-3 px-4 py-5">
								<ControlTabSuspense>
									<EditorOverlayInsightsPane />
								</ControlTabSuspense>
							</div>
						</aside>
					</div>
				</div>
			</div>
		</div>
	);
}
