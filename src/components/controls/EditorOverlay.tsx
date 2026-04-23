import { useState, type ReactNode } from 'react';
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
import {
	AudioTab,
	BgTab,
	ControlTabSuspense,
	DiagnosticsTab,
	EditorTab,
	ExportTab,
	FiltersTab,
	LayersTab,
	LogoTab,
	MotionTab,
	OverlaysTab,
	PerfTab,
	SceneTab,
	SpectrumTab,
	TrackTitleTab
} from './controlTabsLazy';
import { EDITOR_OVERLAY_TAB_KEYS } from './controlPanelResetKeys';
import IconButton from './ui/IconButton';
import { ICON_SIZE } from './ui/designTokens';
import { useIsAdvanced } from './UIMode';

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
		setMotionPaused
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

	function renderActiveSection() {
		switch (effectiveActive) {
			case 'scene':
				return <SceneTab onReset={makeReset('scene')} />;
			case 'layers':
				return <LayersTab onReset={makeReset('layers')} />;
			case 'presets':
				return <BgTab onReset={makeReset('presets')} />;
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
			className={`fixed inset-0 z-[100] flex max-h-dvh max-w-dvw flex-col overflow-hidden ${theme.overlayShell}`}
			style={{
				background: 'var(--editor-shell-bg)',
				backdropFilter: 'blur(var(--editor-shell-blur)) saturate(138%)',
				WebkitBackdropFilter:
					'blur(var(--editor-shell-blur)) saturate(138%)',
				...themeVars,
				...radiusVars
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
				{/* Top bar */}
				<div
					className={`flex flex-wrap items-center gap-2 px-6 py-3 ${theme.overlayTopBar}`}
					style={{
						background: 'var(--editor-header-bg)',
						borderBottomColor: 'var(--editor-header-border)'
					}}
				>
					<span
						className={`text-sm uppercase tracking-widest font-bold ${theme.panelTitle}`}
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						{t.title}
					</span>
					<span
						className="text-[11px] uppercase tracking-wider"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						/ {activeLabel}
					</span>

					<div className="ml-auto flex items-center gap-1.5">
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

						<span
							className={`text-[11px] ${theme.panelSubtle}`}
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							{t.autoSaved}
						</span>

						{isAdvanced && (
							<button
								onClick={() =>
									setLanguage(language === 'en' ? 'es' : 'en')
								}
								className="text-[11px] px-2 py-1 rounded border transition-colors"
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
				</div>

				{/* Body: sidebar nav + active section */}
				<div className="flex min-h-0 flex-1 overflow-hidden">
					{/* Left nav rail */}
					<nav
						className="editor-scroll flex w-[220px] shrink-0 flex-col gap-3 overflow-y-auto border-r px-3 py-4"
						style={{
							background: 'var(--editor-tabbar-bg)',
							borderRightColor: 'var(--editor-tabbar-border)',
							scrollbarWidth: 'thin',
							scrollbarColor:
								'var(--editor-accent-border, rgba(80,160,200,0.35)) transparent'
						}}
					>
						{visibleGroups.map(group => (
							<div
								key={group.id}
								className="flex flex-col gap-1"
							>
								<span
									className="px-2 text-[10px] font-semibold uppercase tracking-[0.18em]"
									style={{
										color: 'var(--editor-accent-muted)'
									}}
								>
									{group.label}
								</span>
								<div className="flex flex-col gap-0.5">
									{group.items.map(item => {
										const isActive =
											item.id === effectiveActive;
										return (
											<button
												key={item.id}
												type="button"
												onClick={() =>
													setActiveSection(item.id)
												}
												className="flex items-center gap-2 rounded border px-2 py-1.5 text-left text-[12px] transition-colors"
												style={
													isActive
														? {
																borderRadius:
																	'var(--editor-radius-sm)',
																background:
																	'var(--editor-active-bg)',
																borderColor:
																	'var(--editor-accent-color)',
																color:
																	'var(--editor-active-fg)'
														  }
														: {
																borderRadius:
																	'var(--editor-radius-sm)',
																background:
																	'transparent',
																borderColor:
																	'transparent',
																color:
																	'var(--editor-accent-soft)'
														  }
												}
											>
												<span className="shrink-0">
													{item.icon}
												</span>
												<span className="truncate">
													{item.label}
												</span>
											</button>
										);
									})}
								</div>
							</div>
						))}
					</nav>

					{/* Main content area */}
					<main
						className="editor-scroll min-w-0 flex-1 overflow-y-auto overflow-x-hidden"
						style={{
							scrollbarWidth: 'thin',
							scrollbarColor:
								'var(--editor-accent-border, rgba(80,160,200,0.35)) transparent'
						}}
					>
						<div className="mx-auto flex w-full max-w-[960px] flex-col gap-4 p-6">
							<div className="flex items-center gap-2">
								<Wrench
									size={ICON_SIZE.sm}
									style={{
										color: 'var(--editor-accent-muted)'
									}}
								/>
								<h2
									className={`text-sm uppercase tracking-widest font-bold ${theme.panelTitle}`}
									style={{
										color: 'var(--editor-accent-soft)'
									}}
								>
									{activeLabel}
								</h2>
							</div>
							<div
								className={`flex min-w-0 flex-col gap-3 border p-4 ${theme.sectionShell}`}
								style={{
									borderRadius: 'var(--editor-radius-lg)',
									borderColor:
										'var(--editor-accent-border)',
									background: 'var(--editor-surface-bg)'
								}}
							>
								<ControlTabSuspense>
									{renderActiveSection()}
								</ControlTabSuspense>
							</div>
						</div>
					</main>
				</div>
			</div>
		</div>
	);
}
