import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent
} from 'react';
import { useAudioData } from '@/hooks/useAudioData';
import { useT } from '@/lib/i18n';
import { useBackgroundPalette } from '@/hooks/useBackgroundPalette';
import { useWindowPresentationControls } from '@/hooks/useWindowPresentationControls';
import {
	EDITOR_THEME_CLASSES,
	getEditorRadiusVars,
	getScopedEditorThemeColorVars
} from '@/components/controls/editorTheme';
import {
	QuickActionsHeader,
	QuickActionsLayersPanel,
	QuickActionsShortcutsPanel,
	QuickActionsSlotsPanel,
	QuickActionsThemePanel
} from '@/components/wallpaper/quickActions/QuickActionsPanels';
import QuickActionsShell from '@/components/wallpaper/quickActions/QuickActionsShell';
import MediaDock from '@/components/controls/MediaDock';
import {
	PANEL_MARGIN,
	type ExpandPanel
} from '@/components/wallpaper/quickActions/quickActionsShared';
import { useQuickActionsLayout } from '@/components/wallpaper/quickActions/useQuickActionsLayout';
import { useQuickActionsState } from '@/components/wallpaper/quickActions/useQuickActionsState';
import { useQuickActionsViewModel } from '@/components/wallpaper/quickActions/useQuickActionsViewModel';
import { useWallpaperStore } from '@/store/wallpaperStore';

type HudDragState = {
	kind: 'panel' | 'launcher';
	pointerId: number;
	startClientX: number;
	startClientY: number;
	startLeft: number;
	startTop: number;
	elementWidth: number;
	elementHeight: number;
	viewportWidth: number;
	viewportHeight: number;
};

export default function QuickActionsPanel() {
	const t = useT();
	const state = useQuickActionsState();
	const enableDragMode = useWallpaperStore(s => s.enableDragMode);
	const activeTool = useWallpaperStore(s => s.activeTool);
	const setQuickActionsPositionX = useWallpaperStore(
		s => s.setQuickActionsPositionX
	);
	const setQuickActionsPositionY = useWallpaperStore(
		s => s.setQuickActionsPositionY
	);
	const setQuickActionsLauncherPositionX = useWallpaperStore(
		s => s.setQuickActionsLauncherPositionX
	);
	const setQuickActionsLauncherPositionY = useWallpaperStore(
		s => s.setQuickActionsLauncherPositionY
	);
	const audio = useAudioData();
	const backgroundPalette = useBackgroundPalette();
	const { isFullscreen, fullscreenSupported, toggleFullscreen } =
		useWindowPresentationControls();
	const [isOpen, setIsOpen] = useState(true);
	const [expandPanel, setExpandPanel] = useState<ExpandPanel>(null);
	const hudDragRef = useRef<HudDragState | null>(null);

	const toggleExpand = useCallback((panel: Exclude<ExpandPanel, null>) => {
		setExpandPanel(prev => (prev === panel ? null : panel));
	}, []);

	// HUD is a sibling of the editor with its own color source + manual palette.
	// Theme selection is shared, but HUD visual tokens are independent.
	const themeVars = getScopedEditorThemeColorVars(
		state.quickActionsColorSource,
		backgroundPalette,
		state.editorTheme,
		{
			accent: state.quickActionsManualAccentColor,
			secondary: state.quickActionsManualSecondaryColor,
			backdrop: state.quickActionsManualBackdropColor,
			textPrimary: state.quickActionsManualTextPrimaryColor,
			textSecondary: state.quickActionsManualTextSecondaryColor
		},
		{
			backdropOpacity: state.quickActionsBackdropOpacity,
			blurPx: state.quickActionsBlurPx,
			surfaceOpacity: state.quickActionsManualSurfaceOpacity,
			itemOpacity: state.quickActionsManualItemOpacity
		}
	);
	const radiusVars = getEditorRadiusVars(
		state.editorCornerRadius,
		state.editorControlCornerRadius
	);
	const usesRainbowChrome =
		state.editorTheme === 'rainbow' &&
		state.quickActionsColorSource === 'theme';
	const theme = EDITOR_THEME_CLASSES[state.editorTheme];
	const headerInsetStyle = {
		paddingInline: 'max(10px, calc(var(--editor-radius-xl) * 0.24))',
		paddingTop: 'max(6px, calc(var(--editor-radius-xl) * 0.18))'
	} as const;
	const hudDragEnabled = enableDragMode && activeTool === 'hud';

	const { panelRef, launcherRef, launcherIconPx, panelStyle, launcherStyle, maxScrollAreaHeight } =
		useQuickActionsLayout({
			isOpen,
			expandPanel,
			quickActionsScale: state.quickActionsScale,
			quickActionsPositionX: state.quickActionsPositionX,
			quickActionsPositionY: state.quickActionsPositionY,
			quickActionsLauncherSize: state.quickActionsLauncherSize,
			layoutResponsiveEnabled: state.layoutResponsiveEnabled,
			layoutReferenceWidth: state.layoutReferenceWidth,
			layoutReferenceHeight: state.layoutReferenceHeight,
			quickActionsLauncherPositionX: state.quickActionsLauncherPositionX,
			quickActionsLauncherPositionY: state.quickActionsLauncherPositionY
		});

	const handleHudPointerMove = useCallback((event: PointerEvent) => {
		const drag = hudDragRef.current;
		if (!drag || drag.pointerId !== event.pointerId) return;
		if (event.cancelable) event.preventDefault();

		const dx = event.clientX - drag.startClientX;
		const dy = event.clientY - drag.startClientY;
		const maxLeft = Math.max(
			PANEL_MARGIN,
			drag.viewportWidth - drag.elementWidth - PANEL_MARGIN
		);
		const maxTop = Math.max(
			PANEL_MARGIN,
			drag.viewportHeight - drag.elementHeight - PANEL_MARGIN
		);
		const nextLeft = Math.min(
			maxLeft,
			Math.max(PANEL_MARGIN, drag.startLeft + dx)
		);
		const nextTop = Math.min(
			maxTop,
			Math.max(PANEL_MARGIN, drag.startTop + dy)
		);
		const usableWidth = Math.max(
			0,
			drag.viewportWidth - drag.elementWidth - PANEL_MARGIN * 2
		);
		const usableHeight = Math.max(
			0,
			drag.viewportHeight - drag.elementHeight - PANEL_MARGIN * 2
		);
		const nextNormX =
			usableWidth > 0 ? (nextLeft - PANEL_MARGIN) / usableWidth : 0;
		const nextNormY =
			usableHeight > 0 ? (nextTop - PANEL_MARGIN) / usableHeight : 0;

		if (drag.kind === 'panel') {
			setQuickActionsPositionX(nextNormX);
			setQuickActionsPositionY(nextNormY);
			return;
		}

		setQuickActionsLauncherPositionX(nextNormX);
		setQuickActionsLauncherPositionY(nextNormY);
	}, [
		setQuickActionsLauncherPositionX,
		setQuickActionsLauncherPositionY,
		setQuickActionsPositionX,
		setQuickActionsPositionY
	]);

	const finishHudDrag = useCallback(() => {
		window.removeEventListener('pointermove', handleHudPointerMove);
		window.removeEventListener('pointerup', finishHudDrag);
		window.removeEventListener('pointercancel', finishHudDrag);
		hudDragRef.current = null;
	}, [handleHudPointerMove]);

	const startHudDrag = useCallback(
		(
			event: ReactPointerEvent<HTMLElement>,
			kind: HudDragState['kind'],
			element: HTMLDivElement | HTMLButtonElement | null
		) => {
			if (!hudDragEnabled || !element) return;
			if (event.cancelable) event.preventDefault();
			event.currentTarget.setPointerCapture?.(event.pointerId);
			const rect = element.getBoundingClientRect();
			hudDragRef.current = {
				kind,
				pointerId: event.pointerId,
				startClientX: event.clientX,
				startClientY: event.clientY,
				startLeft: rect.left,
				startTop: rect.top,
				elementWidth: rect.width,
				elementHeight: rect.height,
				viewportWidth: window.innerWidth,
				viewportHeight: window.innerHeight
			};
			window.addEventListener('pointermove', handleHudPointerMove, {
				passive: false
			});
			window.addEventListener('pointerup', finishHudDrag);
			window.addEventListener('pointercancel', finishHudDrag);
		},
		[finishHudDrag, hudDragEnabled]
	);

	useEffect(
		() => () => {
			finishHudDrag();
		},
		[finishHudDrag]
	);

	const {
		headerActions,
		imageLabel,
		imageNav,
		layerActions,
		looksActions,
		looksSlots,
		spectrumActions,
		spectrumSlots,
		motionActions,
		motionSlots,
		particlesSlots,
		rainSlots,
		audioActions,
		logoShortcutActions,
		logoSlots,
		titleActions,
		titleSlots,
		systemActions,
		statusLabel,
		themeActions,
		colorSourceActions
	} = useQuickActionsViewModel({
		state,
		t,
		audio,
		expandPanel,
		toggleExpand,
		isFullscreen,
		fullscreenSupported,
		toggleFullscreen
	});

	if (!state.quickActionsEnabled) return null;

	return (
		<QuickActionsShell
			containerStyle={{ ...themeVars, ...radiusVars }}
			isOpen={isOpen}
			panelRef={panelRef}
			panelStyle={panelStyle}
			panelFrameClassName={`${usesRainbowChrome ? theme.panelShell : ''}`}
			panelFrameStyle={{
				borderRadius: 'var(--editor-radius-xl)',
				border: '1px solid var(--editor-shell-border)',
				background: !usesRainbowChrome
					? 'linear-gradient(180deg, color-mix(in srgb, var(--editor-hud-bg) 94%, transparent), color-mix(in srgb, var(--editor-shell-bg) 90%, transparent))'
					: undefined,
				backdropFilter: 'blur(var(--editor-shell-blur)) saturate(145%)',
				WebkitBackdropFilter:
					'blur(var(--editor-shell-blur)) saturate(145%)',
				boxShadow:
					'0 22px 48px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.07)'
			}}
			panelContentClassName="relative flex min-h-0 w-full flex-col px-5 py-4"
			launcherRef={launcherRef}
			launcherStyle={{
				...launcherStyle,
				borderColor: isOpen
					? 'var(--editor-button-border)'
					: 'var(--editor-shell-border)',
				background: !usesRainbowChrome
					? isOpen
						? 'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 92%, transparent), color-mix(in srgb, var(--editor-shell-bg) 88%, transparent))'
						: 'linear-gradient(180deg, color-mix(in srgb, var(--editor-button-bg) 82%, transparent), color-mix(in srgb, var(--editor-shell-bg) 86%, transparent))'
					: undefined,
				color: 'var(--editor-accent-soft)',
				backdropFilter: 'blur(var(--editor-shell-blur)) saturate(145%)',
				WebkitBackdropFilter:
					'blur(var(--editor-shell-blur)) saturate(145%)',
				boxShadow: isOpen
					? '0 18px 42px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)'
					: '0 18px 42px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)'
			}}
			launcherClassName={`pointer-events-auto absolute z-10 flex items-center justify-center border shadow-2xl transition-all duration-300 hover:-translate-y-0.5 ${
				usesRainbowChrome ? theme.launcher : ''
			}`}
			launcherTitle={t.label_quick_actions}
			onToggle={() => setIsOpen(prev => !prev)}
			panelOverlayChildren={
				hudDragEnabled ? (
					<div
						onPointerDown={event =>
							startHudDrag(event, 'panel', panelRef.current)
						}
						aria-label="Drag HUD"
						title="Drag HUD"
						className="h-full w-full"
						style={{
							borderRadius: 'var(--editor-radius-xl)',
							cursor: 'grab',
							background:
								'color-mix(in srgb, var(--editor-active-bg) 10%, transparent)',
							border:
								'1px dashed color-mix(in srgb, var(--editor-accent-color) 55%, transparent)'
						}}
					/>
				) : undefined
			}
			panelChildren={
				<div
					className="editor-scroll scrollbar-none flex flex-col gap-2 overflow-y-auto overflow-x-hidden overscroll-contain"
					style={{ maxHeight: maxScrollAreaHeight }}
				>
					<div style={headerInsetStyle}>
						<QuickActionsHeader
							statusLabel={statusLabel}
							trackLabel=""
							secondaryContent={null}
							actions={headerActions}
							isRainbow={usesRainbowChrome}
							compact
						/>
					</div>

					{expandPanel === 'layers' && (
						<QuickActionsLayersPanel
							actions={layerActions}
							isRainbow={usesRainbowChrome}
						/>
					)}

					{expandPanel === 'looks' && (
						<QuickActionsShortcutsPanel
							actions={looksActions}
							isRainbow={usesRainbowChrome}
						/>
					)}

					{expandPanel === 'looks_slots' &&
						state.looksProfileSlots.length > 0 && (
							<QuickActionsSlotsPanel
								slots={looksSlots}
								isRainbow={usesRainbowChrome}
							/>
						)}

					{expandPanel === 'spectrum' && (
						<QuickActionsShortcutsPanel
							actions={spectrumActions}
							isRainbow={usesRainbowChrome}
						/>
					)}

					{expandPanel === 'spectrum_slots' &&
						state.spectrumProfileSlots.length > 0 && (
							<QuickActionsSlotsPanel
								slots={spectrumSlots}
								isRainbow={usesRainbowChrome}
							/>
						)}

					{expandPanel === 'motion' && (
						<QuickActionsShortcutsPanel
							actions={motionActions}
							isRainbow={usesRainbowChrome}
						/>
					)}

					{expandPanel === 'motion_slots' &&
						state.motionProfileSlots.length > 0 && (
							<QuickActionsSlotsPanel
								slots={motionSlots}
								isRainbow={usesRainbowChrome}
							/>
						)}

					{expandPanel === 'particles_slots' &&
						state.particlesProfileSlots.length > 0 && (
							<QuickActionsSlotsPanel
								slots={particlesSlots}
								isRainbow={usesRainbowChrome}
							/>
						)}

					{expandPanel === 'rain_slots' &&
						state.rainProfileSlots.length > 0 && (
							<QuickActionsSlotsPanel
								slots={rainSlots}
								isRainbow={usesRainbowChrome}
							/>
						)}

					{expandPanel === 'audio' && (
						<QuickActionsShortcutsPanel
							actions={audioActions}
							isRainbow={usesRainbowChrome}
						/>
					)}

					{expandPanel === 'logo' && (
						<QuickActionsShortcutsPanel
							actions={logoShortcutActions}
							isRainbow={usesRainbowChrome}
						/>
					)}

					{expandPanel === 'title' && (
						<QuickActionsShortcutsPanel
							actions={titleActions}
							isRainbow={usesRainbowChrome}
						/>
					)}

					{expandPanel === 'title_slots' &&
						state.trackTitleProfileSlots.length > 0 && (
							<QuickActionsSlotsPanel
								slots={titleSlots}
								isRainbow={usesRainbowChrome}
							/>
						)}

					{expandPanel === 'system' && (
						<QuickActionsShortcutsPanel
							actions={systemActions}
							isRainbow={usesRainbowChrome}
						/>
					)}

					{expandPanel === 'logo_slots' &&
						state.logoProfileSlots.length > 0 && (
							<QuickActionsSlotsPanel
								slots={logoSlots}
								isRainbow={usesRainbowChrome}
							/>
						)}

					{expandPanel === 'themes' && (
						<QuickActionsThemePanel
							themeActions={themeActions}
							colorSourceActions={colorSourceActions}
							isRainbow={usesRainbowChrome}
						/>
					)}

					<MediaDock
						imageLabel={imageLabel}
						isRainbow={usesRainbowChrome}
						imageNav={imageNav}
						hudSafeInset
					/>
				</div>
			}
			launcherChildren={
				state.logoUrl ? (
					<img
						src={state.logoUrl}
						alt=""
						className="rounded-full object-cover opacity-95 ring-1"
						style={{
							width: launcherIconPx,
							height: launcherIconPx,
							borderColor: 'var(--editor-shell-border)'
						}}
					/>
				) : (
					<span
						className="font-semibold leading-none"
						style={{
							fontSize: Math.round(
								(Number(launcherStyle.width) || 48) * 0.28
							)
						}}
					>
						{isOpen ? '×' : '◌'}
					</span>
				)
			}
			launcherOverlayChildren={
				hudDragEnabled ? (
					<span
						onPointerDown={event =>
							startHudDrag(event, 'launcher', launcherRef.current)
						}
						aria-label="Drag HUD launcher"
						title="Drag HUD launcher"
						className="h-full w-full"
						style={{
							borderRadius: '999px',
							cursor: 'grab',
							background:
								'color-mix(in srgb, var(--editor-active-bg) 12%, transparent)',
							border:
								'1px dashed color-mix(in srgb, var(--editor-accent-color) 55%, transparent)'
						}}
					/>
				) : undefined
			}
		/>
	);
}
