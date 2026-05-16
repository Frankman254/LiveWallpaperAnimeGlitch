import { useEffect, useRef, useState } from 'react';
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
	PanelLeftClose,
	PanelLeftOpen,
	Type,
	FileText,
	Circle,
	Bug,
	Download,
	Gauge
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
import { ControlTabSuspense } from './controlTabsLazy';
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
	Button,
	IconButton,
	SegmentedControl,
	SidebarNav,
	Toolbar,
	ToolbarDivider,
	ToolbarGroup,
	UI_COLORS,
	FONT,
	BLUR,
	GLOW,
	ICON_SIZE,
	type SidebarNavItem
} from '@/ui';
import ModernSceneTab from './tabs/modern/ModernSceneTab';
import ModernLooksTab from './tabs/modern/ModernLooksTab';
import ModernSpectrumTab from './tabs/modern/ModernSpectrumTab';
import ModernLayersTab from './tabs/modern/ModernLayersTab';
import ModernMotionTab from './tabs/modern/ModernMotionTab';
import ModernAudioTab from './tabs/modern/ModernAudioTab';
import ModernDiagnosticsTab from './tabs/modern/ModernDiagnosticsTab';
import ModernPerfTab from './tabs/modern/ModernPerfTab';
import ModernLogoTab from './tabs/modern/ModernLogoTab';
import ModernTrackTitleTab from './tabs/modern/ModernTrackTitleTab';
import ModernEditorTab from './tabs/modern/ModernEditorTab';
import ModernLyricsTab from './tabs/modern/ModernLyricsTab';
import ModernExportTab from './tabs/modern/ModernExportTab';
import CalibrationTab from './tabs/CalibrationTab';

interface ControlPanelProps {
	open: boolean;
	maximized: boolean;
	forceMaximized?: boolean;
	onOpenChange: (value: boolean) => void;
	onMaximizedChange: (value: boolean) => void;
	onForceClose?: () => void;
}

type EditorScrollPosition = {
	top: number;
	left: number;
};

type EditorScrollMap = Record<string, EditorScrollPosition>;

const MODERN_EDITOR_SCROLL_STORAGE_KEY = 'lwag-modern-editor-scroll-map';

function readModernEditorScrollMap(): EditorScrollMap {
	if (typeof window === 'undefined') return {};
	try {
		const parsed = JSON.parse(
			window.localStorage.getItem(MODERN_EDITOR_SCROLL_STORAGE_KEY) ?? '{}'
		);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			return {};
		}
		return Object.fromEntries(
			Object.entries(parsed)
				.map(([key, value]) => {
					if (!value || typeof value !== 'object') return null;
					const candidate = value as Partial<EditorScrollPosition>;
					const top = Number(candidate.top);
					const left = Number(candidate.left);
					if (!Number.isFinite(top) || !Number.isFinite(left)) {
						return null;
					}
					return [key, { top: Math.max(0, top), left: Math.max(0, left) }];
				})
				.filter(
					(entry): entry is [string, EditorScrollPosition] =>
						Array.isArray(entry)
				)
		);
	} catch {
		return {};
	}
}

function writeModernEditorScrollMap(scrollMap: EditorScrollMap) {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(
			MODERN_EDITOR_SCROLL_STORAGE_KEY,
			JSON.stringify(scrollMap)
		);
	} catch {
		/* localStorage unavailable — scroll restore is optional */
	}
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
	const contentScrollRef = useRef<HTMLDivElement | null>(null);
	const scrollMapRef = useRef<EditorScrollMap>(readModernEditorScrollMap());
	const scrollPersistRafRef = useRef<number | null>(null);
	const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
		if (typeof window === 'undefined') return false;
		try {
			return (
				window.localStorage.getItem('lwag-sidebar-collapsed') === '1'
			);
		} catch {
			return false;
		}
	});
	useEffect(() => {
		if (typeof window === 'undefined') return;
		try {
			window.localStorage.setItem(
				'lwag-sidebar-collapsed',
				sidebarCollapsed ? '1' : '0'
			);
		} catch {
			/* localStorage unavailable — fail open */
		}
	}, [sidebarCollapsed]);
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
	const { isFullscreen, fullscreenSupported, toggleFullscreen } =
		useWindowPresentationControls();
	const { captureMode, isPaused, pauseFileForSystem, resumeFileFromSystem } =
		useAudioContext();
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
	const activeScrollKey =
		tab === 'advanced' ? `advanced:${advancedSub}` : tab;

	useEffect(() => {
		return () => {
			if (
				scrollPersistRafRef.current !== null &&
				typeof window !== 'undefined'
			) {
				window.cancelAnimationFrame(scrollPersistRafRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!open && !maximized && !forceMaximized) return;
		const node = contentScrollRef.current;
		if (!node || typeof window === 'undefined') return;
		const nextPosition = scrollMapRef.current[activeScrollKey] ?? {
			top: 0,
			left: 0
		};
		const frame = window.requestAnimationFrame(() => {
			node.scrollTop = nextPosition.top;
			node.scrollLeft = nextPosition.left;
		});
		return () => window.cancelAnimationFrame(frame);
	}, [activeScrollKey, forceMaximized, maximized, open]);

	function persistEditorScrollPosition(node: HTMLDivElement) {
		scrollMapRef.current = {
			...scrollMapRef.current,
			[activeScrollKey]: {
				top: node.scrollTop,
				left: node.scrollLeft
			}
		};
		if (
			scrollPersistRafRef.current !== null ||
			typeof window === 'undefined'
		) {
			return;
		}
		scrollPersistRafRef.current = window.requestAnimationFrame(() => {
			scrollPersistRafRef.current = null;
			writeModernEditorScrollMap(scrollMapRef.current);
		});
	}

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

	const MAIN_TABS: SidebarNavItem<MainTabId>[] = [
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

	const ADVANCED_TABS: SidebarNavItem<AdvancedSubTab>[] = [
		{ id: 'track', label: t.tab_track, icon: <Type size={ICON_SIZE.xs} /> },
		{
			id: 'lyrics',
			label: t.tab_lyrics,
			icon: <FileText size={ICON_SIZE.xs} />
		},
		{ id: 'logo', label: t.tab_logo, icon: <Circle size={ICON_SIZE.xs} /> },
		{
			id: 'calibration',
			label: 'Calibración',
			icon: <Wand2 size={ICON_SIZE.xs} />
		},
		{
			id: 'diagnostics',
			label: t.tab_diagnostics,
			icon: <Bug size={ICON_SIZE.xs} />
		},
		{
			id: 'editor',
			label: t.tab_editor,
			icon: <SlidersHorizontal size={ICON_SIZE.xs} />
		},
		{
			id: 'export',
			label: t.tab_export,
			icon: <Download size={ICON_SIZE.xs} />
		},
		{ id: 'perf', label: t.tab_perf, icon: <Gauge size={ICON_SIZE.xs} /> }
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
	const baseMaxRem = 30;
	const panelWidth = `min(${baseMaxRem}rem, calc((100vw - (${panelInset})) / ${safeUiScale}))`;
	// Vertical reserved space for: wrapper anchor offset (2rem) + panel anchor
	// offset relative to wrapper (3rem) + 1rem visual safety. Total:
	//   top anchors:    wrapper top-12 (3rem) + panel top-12 (3rem) + 1rem = 7rem
	//   bottom anchors: wrapper bottom-8 (2rem) + panel bottom-12 (3rem) + 1rem = 6rem
	// Anything smaller pushes the panel past the viewport edge (was 3/4rem and
	// caused visible overflow on heavy tabs).
	const verticalMarginRem = controlPanelAnchor.startsWith('top') ? 7 : 6;
	const panelMaxHeight = `calc((100dvh - ${verticalMarginRem}rem) / ${safeUiScale})`;
	const panelScaleStyle =
		safeUiScale === 1
			? undefined
			: {
					transform: `scale(${safeUiScale})`,
					transformOrigin: panelTransformOrigin
				};

	const TOOL_ITEMS: {
		id: ActiveTool;
		icon: React.ReactNode;
		label: string;
	}[] = [
		{
			id: 'none',
			icon: <MousePointer size={ICON_SIZE.xs} />,
			label: 'Select'
		},
		{ id: 'logo', icon: <ImageIcon size={ICON_SIZE.xs} />, label: 'Logo' },
		{
			id: 'spectrum',
			icon: <AudioWaveform size={ICON_SIZE.xs} />,
			label: 'Spectrum'
		},
		{
			id: 'hud',
			icon: <SlidersHorizontal size={ICON_SIZE.xs} />,
			label: 'HUD'
		}
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
							<Toolbar
								density="compact"
								className="flex-nowrap gap-1 px-2 py-1"
								style={{
									background:
										`linear-gradient(180deg, ${UI_COLORS.sheen}, transparent)`,
									borderBottom:
										'1px solid color-mix(in srgb, var(--editor-tag-border) 45%, transparent)',
									borderRadius:
										'var(--editor-radius-xl) var(--editor-radius-xl) 0 0',
									borderLeft: 0,
									borderRight: 0,
									borderTop: 0,
									boxShadow: 'none',
									backdropFilter: 'none',
									WebkitBackdropFilter: 'none'
								}}
							>
								<div
									className="grid place-items-center shrink-0"
									style={{
										width: 22,
										height: 22,
										borderRadius: 'var(--editor-radius-md)',
										background: 'var(--lwag-accent)',
										color: 'var(--editor-active-fg)'
									}}
								>
									{logoUrl ? (
										<img
											src={logoUrl}
											alt=""
											className="h-3.5 w-3.5 rounded object-cover"
										/>
									) : (
										<Activity size={13} strokeWidth={2.5} />
									)}
								</div>
								<div className="mr-auto min-w-0">
									<span
										className="block truncate text-[11px] font-semibold leading-none"
										style={{
											color: 'var(--editor-accent-fg)'
										}}
									>
										{t.title}
									</span>
								</div>
								<ToolbarGroup
									density="compact"
									className="ml-auto flex-nowrap justify-end"
								>
									<SegmentedControl
										size="sm"
										density="compact"
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
												icon: (
													<SlidersHorizontal
														size={11}
													/>
												)
											}
										]}
									/>
									<ToolbarDivider className="hidden sm:block" />
									<IconButton
										density="compact"
										size="sm"
										active={enableDragMode}
										onClick={() =>
											setEnableDragMode(!enableDragMode)
										}
										title={
											enableDragMode
												? 'Drag mode on — click to disable'
												: 'Enable drag mode'
										}
									>
										<Move size={ICON_SIZE.sm} />
									</IconButton>
									<IconButton
										density="compact"
										size="sm"
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
											density="compact"
											size="sm"
											variant="warning"
											onClick={toggleHeaderPauseAll}
											title={t.hint_pause_all}
										>
											{effectiveAudioPaused ||
											motionPaused ? (
												<Play size={ICON_SIZE.sm} />
											) : (
												<Pause size={ICON_SIZE.sm} />
											)}
										</IconButton>
									)}
									{fullscreenSupported ? (
										<IconButton
											density="compact"
											size="sm"
											onClick={() =>
												void toggleFullscreen()
											}
											title={
												isFullscreen
													? t.label_exit_fullscreen
													: t.label_enter_fullscreen
											}
										>
											{isFullscreen ? (
												<Minimize2
													size={ICON_SIZE.sm}
												/>
											) : (
												<Maximize2
													size={ICON_SIZE.sm}
												/>
											)}
										</IconButton>
									) : null}
									{uiMode === 'advanced' && (
										<IconButton
											density="compact"
											size="sm"
											onClick={() =>
												setLanguage(
													language === 'en'
														? 'es'
														: 'en'
												)
											}
											title="Toggle language"
										>
											<span className="text-[10px] font-semibold">
												{language === 'en'
													? 'ES'
													: 'EN'}
											</span>
										</IconButton>
									)}
									<IconButton
										density="compact"
										size="sm"
										onClick={() => onMaximizedChange(true)}
										title={t.label_open_editor_workspace}
									>
										<LayoutGrid size={ICON_SIZE.sm} />
									</IconButton>
								</ToolbarGroup>
							</Toolbar>

							{/* ── Drag-mode tool bar ── */}
							{enableDragMode && (
								<Toolbar
									density="compact"
									className="gap-1 px-0.5 py-1"
									style={{
										background: UI_COLORS.overlay,
										borderBottom:
											'1px solid color-mix(in srgb, var(--editor-tag-border) 40%, transparent)',
										borderLeft: 0,
										borderRight: 0,
										borderTop: 0,
										borderRadius: 0,
										boxShadow: 'none',
										backdropFilter: 'none',
										WebkitBackdropFilter: 'none'
									}}
								>
									<Zap
										size={10}
										style={{
											color: 'var(--editor-accent-muted)'
										}}
									/>
									<span
										className="text-[9px] mr-1.5 uppercase tracking-[0.1em]"
										style={{
											color: 'var(--editor-accent-muted)'
										}}
									>
										Active tool
									</span>
									<ToolbarGroup
										density="compact"
										className="flex-wrap"
									>
										{TOOL_ITEMS.map(tool => (
											<Button
												key={tool.id}
												onClick={() =>
													setActiveTool(tool.id)
												}
												variant={
													activeTool === tool.id
														? 'primary'
														: 'ghost'
												}
												size="sm"
												density="compact"
												icon={tool.icon}
												active={activeTool === tool.id}
											>
												{tool.label}
											</Button>
										))}
									</ToolbarGroup>
								</Toolbar>
							)}

							{/* ── Mode banner (design's persistent indicator) ── */}
							<div
								className="flex items-center gap-1 px-2 py-px uppercase tracking-[0.08em] text-[9px]"
								style={{
									background: 'transparent',
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
										<SlidersHorizontal size={10} />
										Advanced
									</>
								) : (
									<>
										<Sparkles size={10} />
										Simple
									</>
								)}
							</div>

							{/* ── Split: vertical sidebar + content scroll ── */}
							<div className="flex flex-1 min-h-0 min-w-0">
								{/* Sidebar (vertical nav) — collapsible */}
								<aside
									className="shrink-0 flex flex-col gap-0 p-1 overflow-y-auto"
									style={{
										width: sidebarCollapsed ? 38 : 'max-content',
										minWidth: sidebarCollapsed ? 38 : 96,
										maxWidth: sidebarCollapsed ? 38 : 160,
										background: UI_COLORS.overlay,
										borderRight: `1px solid ${UI_COLORS.hairline}`,
										transition:
											'width 200ms cubic-bezier(0.22, 1, 0.36, 1)'
									}}
								>
									<div
										className="mb-0.5 flex justify-center border-b pb-0.5"
										style={{
											borderColor: UI_COLORS.hairline
										}}
									>
										<IconButton
											type="button"
											onClick={() =>
												setSidebarCollapsed(c => !c)
											}
											title={
												sidebarCollapsed
													? 'Expand sidebar'
													: 'Collapse sidebar'
											}
											aria-label={
												sidebarCollapsed
													? 'Expand sidebar'
													: 'Collapse sidebar'
											}
											size="sm"
											density="compact"
											variant="default"
										>
											{sidebarCollapsed ? (
												<PanelLeftOpen
													size={ICON_SIZE.md}
												/>
											) : (
												<PanelLeftClose
													size={ICON_SIZE.md}
												/>
											)}
										</IconButton>
									</div>
									<SidebarNav<MainTabId>
										items={visibleTabs}
										value={tab}
										onChange={setTab}
										compact={sidebarCollapsed}
										density="compact"
										ariaLabel="Editor tabs"
									/>
									{tab === 'advanced' ? (
										<div
											className="mt-0.5 border-t pt-0.5"
											style={{
												borderColor: UI_COLORS.hairline
											}}
										>
											<SidebarNav<AdvancedSubTab>
												items={ADVANCED_TABS}
												value={advancedSub}
												onChange={setAdvancedSub}
												compact={sidebarCollapsed}
												density="compact"
												ariaLabel="Advanced tools"
											/>
										</div>
									) : null}
								</aside>

								{/* Tab content scroll body */}
								<div
									ref={contentScrollRef}
									onScroll={event =>
										persistEditorScrollPosition(
											event.currentTarget
										)
									}
									className="editor-scroll flex flex-1 min-h-0 min-w-0 flex-col gap-1 overflow-x-hidden overflow-y-auto px-1.5 pt-1 pb-1.5"
									style={
										{
											'--section-card-compact-header-padding':
												'6px 8px',
											'--section-card-compact-body-padding':
												'8px'
										} as React.CSSProperties
									}
								>
									<VisualWorkloadBanner />
									<ControlTabSuspense>
										{tab === 'scene' && (
											<ModernSceneTab
												onReset={resetTab}
												onRequestMainTab={setTab}
											/>
										)}
										{tab === 'spectrum' && (
											<ModernSpectrumTab
												onReset={resetTab}
											/>
										)}
										{tab === 'looks' && (
											<ModernLooksTab
												onReset={resetTab}
											/>
										)}
										{tab === 'layers' && (
											<ModernLayersTab onReset={resetTab} />
										)}
										{tab === 'motion' && (
											<ModernMotionTab
												onResetParticles={() =>
													resetSection(
														(
															LEGACY_TAB_KEYS.particles ??
															[]
														).filter(
															k =>
																![
																	'imageUrl',
																	'logoUrl'
																].includes(
																	k as string
																)
														)
													)
												}
												onResetRain={() =>
													resetSection(
														(
															LEGACY_TAB_KEYS.rain ??
															[]
														).filter(
															k =>
																![
																	'imageUrl',
																	'logoUrl'
																].includes(
																	k as string
																)
														)
													)
												}
											/>
										)}
										{tab === 'audio' && (
											<ModernAudioTab onReset={resetTab} />
										)}
										{tab === 'advanced' &&
											advancedSub === 'track' && (
												<ModernTrackTitleTab
													onReset={resetTab}
												/>
											)}
										{tab === 'advanced' &&
											advancedSub === 'lyrics' && (
												<ModernLyricsTab
													onReset={resetTab}
												/>
											)}
										{tab === 'advanced' &&
											advancedSub === 'logo' && (
												<ModernLogoTab
													onReset={resetTab}
												/>
											)}
										{tab === 'advanced' &&
											advancedSub === 'calibration' && (
												<CalibrationTab
													onReset={resetTab}
												/>
											)}
										{tab === 'advanced' &&
											advancedSub === 'diagnostics' && (
												<ModernDiagnosticsTab
													onReset={resetTab}
												/>
											)}
										{tab === 'advanced' &&
											advancedSub === 'editor' && (
												<ModernEditorTab
													onReset={resetTab}
												/>
											)}
										{tab === 'advanced' &&
											advancedSub === 'export' && (
												<ModernExportTab />
											)}
										{tab === 'advanced' &&
											advancedSub === 'perf' && (
												<ModernPerfTab />
											)}
									</ControlTabSuspense>
								</div>
							</div>
						</div>
					)}
				</div>
			) : null}
		</>
	);
}
