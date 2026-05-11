import { useEffect, useState } from 'react';
import {
	X,
	Play,
	Pause,
	Maximize2,
	Minimize2,
	LayoutGrid,
	Zap,
	MousePointer,
	AudioWaveform,
	Image as ImageIcon,
	SlidersHorizontal,
	Move,
	Activity,
	Sparkles,
	Layers,
	Wand2,
	Music,
	Settings,
	History
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import EditorOverlay from './EditorOverlay';
import {
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
	ExportTab,
	FiltersTab,
	LayersTab,
	LyricsTab,
	LogoTab,
	MotionTab,
	OverlaysTab,
	PerfTab,
	EditorTab,
	SpectrumTab,
	TrackTitleTab
} from './controlTabsLazy';
import VisualWorkloadBanner from './VisualWorkloadBanner';
import {
	PANEL_ANCHOR_OVERLAY_CLASS,
	PANEL_ANCHOR_WRAPPER_CLASS
} from './controlPanelAnchorStyles';
import {
	ADVANCED_RESET_KEYS,
	LEGACY_TAB_KEYS,
	MAIN_TAB_RESET_KEYS,
	resolveCanvasInteractionTab,
	type AdvancedSubTab,
	type MainTabId
} from './controlPanelResetKeys';
import type { ActiveTool } from '@/types/wallpaper';
import {
	IconButton,
	SegmentedControl,
	Tabs,
	UI_COLORS,
	FONT,
	BLUR,
	GLOW,
	ICON_SIZE,
	type TabItem
} from '@/ui';
import ModernTabFrame from './ModernTabFrame';
import ModernSceneTab from './tabs/modern/ModernSceneTab';

interface ModernControlPanelProps {
	open: boolean;
	maximized: boolean;
	forceMaximized?: boolean;
	onOpenChange: (value: boolean) => void;
	onMaximizedChange: (value: boolean) => void;
	onForceClose?: () => void;
}

const MAIN_TAB_ICON: Record<MainTabId, React.ReactNode> = {
	scene: <Layers size={ICON_SIZE.md} />,
	spectrum: <Activity size={ICON_SIZE.md} />,
	looks: <Wand2 size={ICON_SIZE.md} />,
	layers: <Layers size={ICON_SIZE.md} />,
	motion: <Sparkles size={ICON_SIZE.md} />,
	audio: <Music size={ICON_SIZE.md} />,
	advanced: <Settings size={ICON_SIZE.md} />
};

export default function ModernControlPanel({
	open,
	maximized,
	forceMaximized = false,
	onOpenChange,
	onMaximizedChange,
	onForceClose
}: ModernControlPanelProps) {
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
		language,
		selectedOverlayId,
		overlays,
		controlPanelAnchor,
		editorTheme,
		editorThemeColorSource,
		editorCornerRadius,
		editorControlCornerRadius,
		editorUiScale,
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
		uiMode,
		enableDragMode,
		activeTool
	} = useWallpaperStore(
		useShallow(s => ({
			language: s.language,
			selectedOverlayId: s.selectedOverlayId,
			overlays: s.overlays,
			controlPanelAnchor: s.controlPanelAnchor,
			editorTheme: s.editorTheme,
			editorThemeColorSource: s.editorThemeColorSource,
			editorUiScale: s.editorUiScale,
			editorCornerRadius: s.editorCornerRadius,
			editorControlCornerRadius: s.editorControlCornerRadius,
			editorManualAccentColor: s.editorManualAccentColor,
			editorManualSecondaryColor: s.editorManualSecondaryColor,
			editorManualBackdropColor: s.editorManualBackdropColor,
			editorManualTextPrimaryColor: s.editorManualTextPrimaryColor,
			editorManualTextSecondaryColor: s.editorManualTextSecondaryColor,
			editorManualBackdropOpacity: s.editorManualBackdropOpacity,
			editorManualBlurPx: s.editorManualBlurPx,
			editorManualSurfaceOpacity: s.editorManualSurfaceOpacity,
			editorManualItemOpacity: s.editorManualItemOpacity,
			logoUrl: s.logoUrl,
			audioPaused: s.audioPaused,
			motionPaused: s.motionPaused,
			uiMode: s.uiMode,
			enableDragMode: s.enableDragMode,
			activeTool: s.activeTool
		}))
	);
	const resetSection = useWallpaperStore(s => s.resetSection);
	const resetSceneSlotBindings = useWallpaperStore(
		s => s.resetSceneSlotBindings
	);
	const setLanguage = useWallpaperStore(s => s.setLanguage);
	const updateOverlay = useWallpaperStore(s => s.updateOverlay);
	const setSelectedOverlayId = useWallpaperStore(s => s.setSelectedOverlayId);
	const setAudioPaused = useWallpaperStore(s => s.setAudioPaused);
	const setMotionPaused = useWallpaperStore(s => s.setMotionPaused);
	const setUIMode = useWallpaperStore(s => s.setUIMode);
	const setEnableDragMode = useWallpaperStore(s => s.setEnableDragMode);
	const setActiveTool = useWallpaperStore(s => s.setActiveTool);
	const setEditorUiVariant = useWallpaperStore(s => s.setEditorUiVariant);
	const { isFullscreen, fullscreenSupported, toggleFullscreen } =
		useWindowPresentationControls();
	const {
		captureMode,
		isPaused,
		pauseFileForSystem,
		resumeFileFromSystem
	} = useAudioContext();
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

	const SIMPLE_HIDDEN_TABS: MainTabId[] = ['motion', 'advanced'];

	const MAIN_TABS: TabItem<MainTabId>[] = [
		{ id: 'scene', label: t.tab_scene, icon: MAIN_TAB_ICON.scene },
		{ id: 'spectrum', label: t.tab_spectrum, icon: MAIN_TAB_ICON.spectrum },
		{ id: 'looks', label: t.tab_looks, icon: MAIN_TAB_ICON.looks },
		{ id: 'layers', label: t.tab_layers, icon: MAIN_TAB_ICON.layers },
		{ id: 'motion', label: t.tab_motion, icon: MAIN_TAB_ICON.motion },
		{ id: 'audio', label: t.tab_audio, icon: MAIN_TAB_ICON.audio },
		{ id: 'advanced', label: t.tab_advanced, icon: MAIN_TAB_ICON.advanced }
	];

	const visibleTabs =
		uiMode === 'simple'
			? MAIN_TABS.filter(t => !SIMPLE_HIDDEN_TABS.includes(t.id))
			: MAIN_TABS;

	useEffect(() => {
		if (uiMode === 'simple' && SIMPLE_HIDDEN_TABS.includes(tab)) {
			setTab('scene');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [uiMode]);

	const ADVANCED_TABS: TabItem<AdvancedSubTab>[] = [
		{ id: 'track', label: t.tab_track },
		{ id: 'lyrics', label: t.tab_lyrics },
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
			resetSceneSlotBindings();
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

	const safeUiScale = Math.min(2, Math.max(0.7, editorUiScale ?? 1));
	const panelTransformOrigin = controlPanelAnchor.startsWith('top')
		? controlPanelAnchor.endsWith('left')
			? 'top left'
			: 'top right'
		: controlPanelAnchor.endsWith('left')
			? 'bottom left'
			: 'bottom right';
	const panelInset =
		'max(0.5rem, env(safe-area-inset-left)) + max(0.5rem, env(safe-area-inset-right))';
	const baseMaxRem = tab === 'scene' ? 54 : 30;
	const panelWidth = `min(${baseMaxRem}rem, calc((100vw - (${panelInset})) / ${safeUiScale}))`;
	const verticalMarginRem = controlPanelAnchor.startsWith('top') ? 8 : 6;
	const panelMaxHeight = `calc((100dvh - ${verticalMarginRem}rem) / ${safeUiScale})`;
	const panelScaleStyle =
		safeUiScale === 1
			? undefined
			: {
					transform: `scale(${safeUiScale})`,
					transformOrigin: panelTransformOrigin
				};

	const TOOL_ITEMS: { id: ActiveTool; icon: React.ReactNode; label: string }[] = [
		{ id: 'none', icon: <MousePointer size={ICON_SIZE.xs} />, label: 'Select' },
		{ id: 'logo', icon: <ImageIcon size={ICON_SIZE.xs} />, label: 'Logo' },
		{ id: 'spectrum', icon: <AudioWaveform size={ICON_SIZE.xs} />, label: 'Spectrum' },
		{ id: 'hud', icon: <SlidersHorizontal size={ICON_SIZE.xs} />, label: 'HUD' }
	];

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
					style={themeVars as React.CSSProperties}
				>
					{/* Launcher: square accent button matching the design (Activity icon over accent) */}
					<button
						onClick={() => onOpenChange(!open)}
						className="group h-11 w-11 transition-all duration-200 sm:h-10 sm:w-10 inline-flex items-center justify-center"
						style={{
							borderRadius: 'var(--editor-radius-lg)',
							background: UI_COLORS.accent,
							color: UI_COLORS.accentFg,
							border: `1px solid ${UI_COLORS.accentBorder}`,
							boxShadow: GLOW.panel,
							...radiusVars
						}}
						title={open ? 'Close panel' : 'Open editor'}
					>
						{logoUrl && !open ? (
							<img
								src={logoUrl}
								alt=""
								className="h-6 w-6 rounded-full object-cover opacity-90"
							/>
						) : open ? (
							<X size={18} />
						) : (
							<Activity size={16} strokeWidth={2.5} />
						)}
					</button>

					{open && (
						<div
							className={`absolute box-border flex min-w-0 flex-col overflow-x-hidden ${PANEL_ANCHOR_OVERLAY_CLASS[controlPanelAnchor]}`}
							style={{
								maxHeight: panelMaxHeight,
								borderRadius: 'var(--editor-radius-xl)',
								width: panelWidth,
								background: UI_COLORS.shell,
								border: `1px solid ${UI_COLORS.borderStrong}`,
								backdropFilter: BLUR.heavy,
								WebkitBackdropFilter: BLUR.heavy,
								boxShadow: GLOW.modal,
								color: UI_COLORS.fg,
								...themeVars,
								...radiusVars,
								...panelScaleStyle
							}}
						>
							{/* ── Header (design's gradient overlay strip) ── */}
							<div
								className="flex flex-wrap items-center gap-2 px-4 py-3 sm:flex-nowrap"
								style={{
									background:
										'linear-gradient(180deg, rgba(255,255,255,0.04), transparent)',
									borderBottom:
										'1px solid color-mix(in srgb, var(--editor-tag-border) 45%, transparent)'
								}}
							>
								<div
									className="grid place-items-center shrink-0"
									style={{
										width: 32,
										height: 32,
										borderRadius: 'var(--editor-radius-md)',
										background: 'var(--lwag-accent)',
										color: 'var(--editor-active-fg)'
									}}
								>
									{logoUrl ? (
										<img
											src={logoUrl}
											alt=""
											className="h-6 w-6 rounded object-cover"
										/>
									) : (
										<Activity size={18} strokeWidth={2.5} />
									)}
								</div>
								<div className="min-w-0 flex flex-col mr-auto">
									<span
										className="text-[13px] font-semibold leading-tight"
										style={{ color: 'var(--editor-accent-fg)' }}
									>
										{t.title}
									</span>
									<span
										className="text-[10px] tracking-[0.04em]"
										style={{
											color: 'var(--editor-accent-muted)',
											fontFamily:
												'"JetBrains Mono", ui-monospace, monospace'
										}}
									>
										{uiMode === 'advanced'
											? 'advanced mode'
											: 'simple mode'}
									</span>
								</div>
								<SegmentedControl
									size="sm"
									value={uiMode}
									onChange={v => setUIMode(v)}
									options={[
										{
											value: 'simple',
											label: 'Simple',
											icon: <Sparkles size={11} />
										},
										{
											value: 'advanced',
											label: 'Adv',
											icon: <SlidersHorizontal size={11} />
										}
									]}
								/>
								<IconButton
									active={enableDragMode}
									onClick={() => setEnableDragMode(!enableDragMode)}
									title={
										enableDragMode
											? 'Drag mode on — click to disable'
											: 'Enable drag mode'
									}
								>
									<Move size={ICON_SIZE.sm} />
								</IconButton>
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
								{uiMode === 'advanced' && (
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
								{uiMode === 'advanced' && (
									<IconButton
										onClick={() =>
											setLanguage(language === 'en' ? 'es' : 'en')
										}
										title="Toggle language"
									>
										<span className="text-[10px] font-semibold">
											{language === 'en' ? 'ES' : 'EN'}
										</span>
									</IconButton>
								)}
								<IconButton
									onClick={() => onMaximizedChange(true)}
									title={t.label_open_editor_workspace}
								>
									<LayoutGrid size={ICON_SIZE.sm} />
								</IconButton>
								<IconButton
									onClick={() => setEditorUiVariant('legacy')}
									title="Switch to legacy UI"
								>
									<History size={ICON_SIZE.sm} />
								</IconButton>
							</div>

							{/* ── Drag-mode tool bar ── */}
							{enableDragMode && (
								<div
									className="flex items-center gap-1 px-4 py-1.5"
									style={{
										background: 'rgba(0, 0, 0, 0.18)',
										borderBottom:
											'1px solid color-mix(in srgb, var(--editor-tag-border) 40%, transparent)'
									}}
								>
									<Zap
										size={10}
										style={{ color: 'var(--editor-accent-muted)' }}
									/>
									<span
										className="text-[10px] mr-2 uppercase tracking-[0.1em]"
										style={{ color: 'var(--editor-accent-muted)' }}
									>
										Active tool
									</span>
									{TOOL_ITEMS.map(tool => (
										<button
											key={tool.id}
											onClick={() => setActiveTool(tool.id)}
											className="flex items-center gap-1 px-2 py-0.5 text-[10px] transition-colors"
											style={
												activeTool === tool.id
													? {
															borderRadius:
																'var(--editor-radius-sm)',
															background: 'var(--lwag-accent)',
															color: 'var(--editor-active-fg)',
															border: 0
														}
													: {
															borderRadius:
																'var(--editor-radius-sm)',
															background: 'transparent',
															color:
																'var(--editor-accent-muted)',
															border: 0
														}
											}
										>
											{tool.icon}
											{tool.label}
										</button>
									))}
								</div>
							)}

							{/* ── Tab strip (dark inset bg per design) ── */}
							<div
								className="px-2 py-1"
								style={{
									background: UI_COLORS.overlay,
									borderBottom: `1px solid ${UI_COLORS.hairline}`
								}}
							>
								<Tabs<MainTabId>
									items={visibleTabs}
									value={tab}
									onChange={setTab}
									ariaLabel="Main tabs"
								/>
							</div>

							{/* ── Mode banner (design's persistent indicator) ── */}
							<div
								className="flex items-center gap-2 px-4 py-1.5 uppercase tracking-[0.1em] text-[10px]"
								style={{
									background:
										uiMode === 'advanced'
											? UI_COLORS.accentSoft
											: 'transparent',
									borderBottom: `1px solid ${UI_COLORS.hairline}`,
									color:
										uiMode === 'advanced'
											? UI_COLORS.accent
											: UI_COLORS.fgMute,
									fontFamily: FONT.mono
								}}
							>
								{uiMode === 'advanced' ? (
									<>
										<SlidersHorizontal size={11} />
										Advanced — all controls visible
									</>
								) : (
									<>
										<Sparkles size={11} />
										Simple — high-impact controls only
									</>
								)}
							</div>

							{/* ── Tab content scroll body ── */}
							<div className="editor-scroll flex flex-1 min-h-0 min-w-0 flex-col gap-3 overflow-x-hidden overflow-y-auto px-4 pt-4 pb-6">
								<VisualWorkloadBanner />
								{tab === 'advanced' ? (
									<div
										style={{
											borderBottom: `1px solid ${UI_COLORS.hairline}`,
											paddingBottom: 6
										}}
									>
										<Tabs<AdvancedSubTab>
											items={ADVANCED_TABS}
											value={advancedSub}
											onChange={setAdvancedSub}
											size="sm"
											ariaLabel="Advanced sub-tabs"
										/>
									</div>
								) : null}
								<ControlTabSuspense>
									{tab === 'scene' && (
										<ModernSceneTab
											onReset={resetTab}
											onRequestMainTab={setTab}
										/>
									)}
									{tab === 'spectrum' && (
										<ModernTabFrame title={t.tab_spectrum}>
											<SpectrumTab onReset={resetTab} />
										</ModernTabFrame>
									)}
									{tab === 'looks' && (
										<ModernTabFrame title={t.tab_looks}>
											<FiltersTab onReset={resetTab} />
										</ModernTabFrame>
									)}
									{tab === 'layers' && (
										<>
											<ModernTabFrame title="Background">
												<BgTab onReset={resetTab} />
											</ModernTabFrame>
											<ModernTabFrame title={t.tab_layers}>
												<LayersTab onReset={resetTab} />
											</ModernTabFrame>
											<ModernTabFrame title={t.tab_overlays}>
												<OverlaysTab onReset={resetTab} />
											</ModernTabFrame>
										</>
									)}
									{tab === 'motion' && (
										<ModernTabFrame title={t.tab_motion}>
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
										</ModernTabFrame>
									)}
									{tab === 'audio' && (
										<ModernTabFrame title={t.tab_audio}>
											<AudioTab onReset={resetTab} />
										</ModernTabFrame>
									)}
									{tab === 'advanced' && advancedSub === 'track' && (
										<ModernTabFrame title={t.tab_track}>
											<TrackTitleTab onReset={resetTab} />
										</ModernTabFrame>
									)}
									{tab === 'advanced' && advancedSub === 'lyrics' && (
										<ModernTabFrame title={t.tab_lyrics}>
											<LyricsTab onReset={resetTab} />
										</ModernTabFrame>
									)}
									{tab === 'advanced' && advancedSub === 'logo' && (
										<ModernTabFrame title={t.tab_logo}>
											<LogoTab onReset={resetTab} />
										</ModernTabFrame>
									)}
									{tab === 'advanced' && advancedSub === 'diagnostics' && (
										<ModernTabFrame title={t.tab_diagnostics}>
											<DiagnosticsTab onReset={resetTab} />
										</ModernTabFrame>
									)}
									{tab === 'advanced' && advancedSub === 'editor' && (
										<ModernTabFrame title={t.tab_editor}>
											<EditorTab onReset={resetTab} />
										</ModernTabFrame>
									)}
									{tab === 'advanced' && advancedSub === 'export' && (
										<ModernTabFrame title={t.tab_export}>
											<ExportTab />
										</ModernTabFrame>
									)}
									{tab === 'advanced' && advancedSub === 'perf' && (
										<ModernTabFrame title={t.tab_perf}>
											<PerfTab />
										</ModernTabFrame>
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
