import type { ReactNode } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import type { WallpaperState } from '@/types/wallpaper';
import { DEFAULT_STATE } from '@/lib/constants';
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

function SectionCard({
	title,
	children,
	themeClasses
}: {
	title: string;
	children: ReactNode;
	themeClasses: (typeof EDITOR_THEME_CLASSES)[keyof typeof EDITOR_THEME_CLASSES];
}) {
	return (
		<div
			className={`flex w-full min-w-0 flex-col ${themeClasses.sectionShell}`}
			style={{
				borderRadius: 'var(--editor-radius-lg)',
				borderColor: 'var(--editor-accent-border)',
				background: 'var(--editor-surface-bg)'
			}}
		>
			<div className={`px-3 py-2 ${themeClasses.sectionHeader}`}>
				<span
					className={`text-xs uppercase tracking-widest font-bold ${themeClasses.sectionTitle}`}
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{title}
				</span>
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto p-3">
				{children}
			</div>
		</div>
	);
}

function EditorColumn({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-w-[280px] flex-1 basis-[20rem] flex-col gap-3">
			{children}
		</div>
	);
}

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
	const radiusVars = getEditorRadiusVars(editorCornerRadius);
	const effectiveAudioPaused =
		captureMode === 'file' ? isPaused || audioPaused : audioPaused;

	void DEFAULT_STATE;

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
					<div className="flex min-w-0 flex-1 items-center gap-2">
						<span
							className={`text-sm uppercase tracking-widest font-bold ${theme.panelTitle}`}
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							{t.title}
						</span>
					</div>
					{fullscreenSupported ? (
						<button
							onClick={() => void toggleFullscreen()}
							className="flex h-8 w-10 items-center justify-center rounded border px-2 py-1 text-sm transition-colors"
							style={{
								borderRadius: 'var(--editor-radius-md)',
								background: 'var(--editor-button-bg)',
								borderColor: 'var(--editor-button-border)',
								color: 'var(--editor-button-fg)'
							}}
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
						>
							{isFullscreen ? '⤡' : '⤢'}
						</button>
					) : null}
					<button
						onClick={toggleHeaderAudioPause}
						className="flex h-8 w-8 items-center justify-center rounded border px-2 py-1 text-sm transition-colors"
						style={{
							borderRadius: 'var(--editor-radius-md)',
							background: 'var(--editor-button-bg)',
							borderColor: 'var(--editor-button-border)',
							color: 'var(--editor-button-fg)'
						}}
						title={t.hint_pause_audio_only}
						aria-label={t.hint_pause_audio_only}
					>
						{effectiveAudioPaused ? '▶' : '⏸'}
					</button>
					<button
						onClick={toggleHeaderPauseAll}
						className="flex h-8 w-8 items-center justify-center rounded border border-orange-400/40 bg-orange-500/10 px-2 py-1 text-sm text-orange-100 transition-colors hover:border-orange-300 hover:bg-orange-500/15"
						style={{ borderRadius: 'var(--editor-radius-md)' }}
						title={t.hint_pause_all}
						aria-label={t.hint_pause_all}
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
							setLanguage(language === 'en' ? 'es' : 'en')
						}
						className="text-xs px-2 py-1 rounded border transition-colors"
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
						onClick={onClose}
						className="flex h-8 w-8 items-center justify-center rounded-full text-base transition-colors"
						style={{
							borderRadius: 'var(--editor-radius-lg)',
							background: 'var(--editor-button-bg)',
							border: '1px solid var(--editor-button-border)',
							color: 'var(--editor-button-fg)'
						}}
						title="Close full editor"
					>
						×
					</button>
				</div>

				{/* Grid of all sections */}
				<div
					className="editor-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3"
					style={{
						scrollbarWidth: 'thin',
						scrollbarColor:
							'var(--editor-accent-border, rgba(80,160,200,0.35)) transparent'
					}}
				>
					<div className="flex flex-wrap items-start gap-3">
						<EditorColumn>
							<SectionCard title={t.tab_scene} themeClasses={theme}>
								<ControlTabSuspense>
									<SceneTab onReset={makeReset('scene')} />
								</ControlTabSuspense>
							</SectionCard>
							<SectionCard title={t.tab_layers} themeClasses={theme}>
								<ControlTabSuspense>
									<LayersTab onReset={makeReset('layers')} />
								</ControlTabSuspense>
							</SectionCard>
							<SectionCard title={t.tab_audio} themeClasses={theme}>
								<ControlTabSuspense>
									<AudioTab onReset={makeReset('audio')} />
								</ControlTabSuspense>
							</SectionCard>
						</EditorColumn>

						<EditorColumn>
							<SectionCard title={t.tab_presets} themeClasses={theme}>
								<ControlTabSuspense>
									<BgTab onReset={makeReset('presets')} />
								</ControlTabSuspense>
							</SectionCard>
							<SectionCard title={t.tab_motion} themeClasses={theme}>
								<ControlTabSuspense>
									<MotionTab
										onResetParticles={makeReset('particles')}
										onResetRain={makeReset('rain')}
									/>
								</ControlTabSuspense>
							</SectionCard>
							<SectionCard title={t.tab_track} themeClasses={theme}>
								<ControlTabSuspense>
									<TrackTitleTab onReset={makeReset('track')} />
								</ControlTabSuspense>
							</SectionCard>

							<SectionCard title={t.tab_editor} themeClasses={theme}>
								<ControlTabSuspense>
									<EditorTab onReset={makeReset('editor')} />
								</ControlTabSuspense>
							</SectionCard>
						</EditorColumn>

						<EditorColumn>
							<SectionCard title={t.tab_looks} themeClasses={theme}>
								<ControlTabSuspense>
									<FiltersTab onReset={makeReset('filters')} />
								</ControlTabSuspense>
							</SectionCard>
							<SectionCard
								title={t.tab_spectrum}
								themeClasses={theme}
							>
								<ControlTabSuspense>
									<SpectrumTab onReset={makeReset('spectrum')} />
								</ControlTabSuspense>
							</SectionCard>
							<SectionCard title={t.tab_logo} themeClasses={theme}>
								<ControlTabSuspense>
									<LogoTab onReset={makeReset('logo')} />
								</ControlTabSuspense>
							</SectionCard>
						</EditorColumn>

						<EditorColumn>
							<SectionCard
								title={t.tab_overlays}
								themeClasses={theme}
							>
								<ControlTabSuspense>
									<OverlaysTab onReset={makeReset('overlays')} />
								</ControlTabSuspense>
							</SectionCard>
							<SectionCard
								title={t.tab_diagnostics}
								themeClasses={theme}
							>
								<ControlTabSuspense>
									<DiagnosticsTab
										onReset={makeReset('diagnostics')}
									/>
								</ControlTabSuspense>
							</SectionCard>
							<SectionCard title={t.tab_export} themeClasses={theme}>
								<ControlTabSuspense>
									<ExportTab />
								</ControlTabSuspense>
							</SectionCard>
							<SectionCard title={t.tab_perf} themeClasses={theme}>
								<ControlTabSuspense>
									<PerfTab />
								</ControlTabSuspense>
							</SectionCard>
						</EditorColumn>
					</div>
				</div>
			</div>
		</div>
	);
}
