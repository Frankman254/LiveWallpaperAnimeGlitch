import { useEffect, useState } from 'react';
import {
	X,
	Circle,
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
	Move
} from 'lucide-react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import EditorOverlay from './EditorOverlay';
import { DEFAULT_STATE } from '@/lib/constants';
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
		resetSceneSlotBindings,
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
		logoUrl,
		audioPaused,
		motionPaused,
		setAudioPaused,
		setMotionPaused,
		uiMode,
		setUIMode,
		enableDragMode,
		setEnableDragMode,
		activeTool,
		setActiveTool
	} = useWallpaperStore();
	const { isFullscreen, fullscreenSupported, toggleFullscreen } =
		useWindowPresentationControls();
	const {
		captureMode,
		isPaused,
		pauseFileForSystem,
		resumeFileFromSystem
	} = useAudioContext();
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

	const MAIN_TABS: { id: MainTabId; label: string }[] = [
		{ id: 'scene', label: t.tab_scene },
		{ id: 'spectrum', label: t.tab_spectrum },
		{ id: 'looks', label: t.tab_looks },
		{ id: 'layers', label: t.tab_layers },
		{ id: 'motion', label: t.tab_motion },
		{ id: 'audio', label: t.tab_audio },
		{ id: 'advanced', label: t.tab_advanced }
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

	void DEFAULT_STATE;

	const TOOL_ITEMS: { id: ActiveTool; icon: React.ReactNode; label: string }[] = [
		{ id: 'none', icon: <MousePointer size={12} />, label: 'Select' },
		{ id: 'logo', icon: <ImageIcon size={12} />, label: 'Logo' },
		{ id: 'spectrum', icon: <AudioWaveform size={12} />, label: 'Spectrum' },
		{ id: 'hud', icon: <SlidersHorizontal size={12} />, label: 'HUD' }
	];

	const iconBtn =
		'flex h-7 w-7 items-center justify-center rounded border transition-colors';
	const iconBtnStyle = {
		borderRadius: 'var(--editor-radius-md)',
		background: 'var(--editor-button-bg)',
		borderColor: 'var(--editor-button-border)',
		color: 'var(--editor-button-fg)'
	};

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
					{/* Launcher button */}
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
							) : open ? (
								<X size={18} />
							) : (
								<Circle size={16} />
							)}
						</span>
					</button>

					{open && (
						<div
							className={`absolute box-border flex min-w-0 flex-col overflow-x-hidden ${theme.panelShell} ${PANEL_ANCHOR_OVERLAY_CLASS[controlPanelAnchor]}`}
							style={{
								maxHeight: controlPanelAnchor.startsWith('top')
									? 'calc(100dvh - 8rem)'
									: 'calc(100dvh - 6rem)',
								borderRadius: 'var(--editor-radius-lg)',
								width: 'min(30rem, calc(100vw - 1rem))',
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
							{/* ── Header ── */}
							<div
								className={`flex items-center gap-1.5 px-3 pt-2.5 pb-2 ${theme.panelHeader}`}
								style={{
									backgroundColor: 'var(--editor-header-bg)',
									borderBottomColor: 'var(--editor-header-border)'
								}}
							>
								{/* Title */}
								<span
									className={`text-xs uppercase tracking-widest font-bold mr-auto ${theme.panelTitle}`}
									style={{ color: 'var(--editor-accent-soft)' }}
								>
									{t.title}
								</span>

								{/* Simple / Advanced pill */}
								<div
									className="flex items-center rounded-full border overflow-hidden text-[10px]"
									style={{
										borderColor: 'var(--editor-accent-border)',
										background: 'var(--editor-tag-bg)'
									}}
								>
									<button
										onClick={() => setUIMode('simple')}
										className="px-2.5 py-0.5 transition-colors"
										style={
											uiMode === 'simple'
												? {
														background: 'var(--editor-active-bg)',
														color: 'var(--editor-active-fg)'
												  }
												: { color: 'var(--editor-accent-muted)' }
										}
									>
										Simple
									</button>
									<button
										onClick={() => setUIMode('advanced')}
										className="px-2.5 py-0.5 transition-colors"
										style={
											uiMode === 'advanced'
												? {
														background: 'var(--editor-active-bg)',
														color: 'var(--editor-active-fg)'
												  }
												: { color: 'var(--editor-accent-muted)' }
										}
									>
										Advanced
									</button>
								</div>

								{/* Drag mode toggle */}
								<button
									onClick={() => setEnableDragMode(!enableDragMode)}
									title={enableDragMode ? 'Drag mode on — click to disable' : 'Enable drag mode'}
									className={`${iconBtn}`}
									style={{
										...iconBtnStyle,
										background: enableDragMode
											? 'var(--editor-active-bg)'
											: 'var(--editor-button-bg)',
										borderColor: enableDragMode
											? 'var(--editor-accent-color)'
											: 'var(--editor-button-border)',
										color: enableDragMode
											? 'var(--editor-active-fg)'
											: 'var(--editor-button-fg)'
									}}
								>
									<Move size={13} />
								</button>

								{/* Audio play/pause */}
								<button
									onClick={toggleHeaderAudioPause}
									title={t.hint_pause_audio_only}
									className={iconBtn}
									style={iconBtnStyle}
								>
									{effectiveAudioPaused ? <Play size={13} /> : <Pause size={13} />}
								</button>

								{/* Pause all — advanced mode only */}
								{uiMode === 'advanced' && (
									<button
										onClick={toggleHeaderPauseAll}
										title={t.hint_pause_all}
										className={`${iconBtn} border-orange-400/40 bg-orange-500/10 text-orange-100 hover:border-orange-300 hover:bg-orange-500/15`}
										style={{ borderRadius: 'var(--editor-radius-md)' }}
									>
										{effectiveAudioPaused || motionPaused ? (
											<Play size={13} />
										) : (
											<Pause size={13} />
										)}
									</button>
								)}

								{/* Fullscreen */}
								{fullscreenSupported ? (
									<button
										onClick={() => void toggleFullscreen()}
										title={
											isFullscreen
												? t.label_exit_fullscreen
												: t.label_enter_fullscreen
										}
										className={iconBtn}
										style={iconBtnStyle}
									>
										{isFullscreen ? (
											<Minimize2 size={13} />
										) : (
											<Maximize2 size={13} />
										)}
									</button>
								) : null}

								{/* Language — advanced mode only */}
								{uiMode === 'advanced' && (
									<button
										onClick={() =>
											setLanguage(language === 'en' ? 'es' : 'en')
										}
										className="text-[10px] px-1.5 py-0.5 rounded border transition-colors"
										style={{
											borderRadius: 'var(--editor-radius-md)',
											background: 'var(--editor-button-bg)',
											borderColor: 'var(--editor-button-border)',
											color: 'var(--editor-button-fg)'
										}}
										title="Toggle language"
									>
										{language === 'en' ? 'ES' : 'EN'}
									</button>
								)}

								{/* Maximize workspace */}
								<button
									onClick={() => onMaximizedChange(true)}
									title={t.label_open_editor_workspace}
									className={iconBtn}
									style={iconBtnStyle}
								>
									<LayoutGrid size={13} />
								</button>
							</div>

							{/* ── Active Tool Bar (only in drag mode) ── */}
							{enableDragMode && (
								<div
									className="flex items-center gap-1 px-3 py-1.5"
									style={{
										background: 'var(--editor-header-bg)',
										borderBottom: '1px solid var(--editor-tabbar-border)'
									}}
								>
									<Zap size={10} style={{ color: 'var(--editor-accent-muted)' }} />
									<span
										className="text-[10px] mr-2"
										style={{ color: 'var(--editor-accent-muted)' }}
									>
										Active tool
									</span>
									{TOOL_ITEMS.map(tool => (
										<button
											key={tool.id}
											onClick={() => setActiveTool(tool.id)}
											className="flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] transition-colors"
											style={
												activeTool === tool.id
													? {
															borderRadius: 'var(--editor-radius-sm)',
															background: 'var(--editor-active-bg)',
															borderColor: 'var(--editor-accent-color)',
															color: 'var(--editor-active-fg)',
															boxShadow: '0 0 6px var(--editor-accent-color)'
													  }
													: {
															borderRadius: 'var(--editor-radius-sm)',
															background: 'var(--editor-tag-bg)',
															borderColor: 'var(--editor-tag-border)',
															color: 'var(--editor-tag-fg)'
													  }
											}
										>
											{tool.icon}
											{tool.label}
										</button>
									))}
								</div>
							)}

							{/* ── Main Tabs ── */}
							<div
								className={`flex min-w-0 flex-wrap gap-1 p-1.5 ${theme.tabBar}`}
								style={{
									background: 'var(--editor-tabbar-bg)',
									borderBottomColor: 'var(--editor-tabbar-border)'
								}}
							>
								{visibleTabs.map(row => (
									<button
										key={row.id}
										onClick={() => setTab(row.id)}
										className="rounded border px-2 py-1 text-xs whitespace-nowrap transition-colors"
										style={
											tab === row.id
												? {
														borderRadius: 'var(--editor-radius-sm)',
														background: 'var(--editor-active-bg)',
														borderColor: 'var(--editor-accent-border)',
														color: 'var(--editor-active-fg)'
												  }
												: {
														borderRadius: 'var(--editor-radius-sm)',
														background: 'var(--editor-tag-bg)',
														borderColor: 'var(--editor-tag-border)',
														color: 'var(--editor-tag-fg)'
												  }
										}
									>
										{row.label}
									</button>
								))}
							</div>

							{/* ── Tab Content ── */}
							<div className="editor-scroll flex flex-1 min-h-0 min-w-0 flex-col gap-2.5 overflow-x-hidden overflow-y-auto px-3 pt-4 pb-6">
								<VisualWorkloadBanner />
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
										<SceneTab
											onReset={resetTab}
											onRequestMainTab={setTab}
										/>
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
