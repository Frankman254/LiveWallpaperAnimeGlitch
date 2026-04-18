import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { resolveResponsiveHudLayout } from '@/features/layout/responsiveLayout';
import { useViewportResolution } from '@/features/layout/viewportMetrics';
import {
	PANEL_MARGIN,
	PANEL_MIN_HEIGHT,
	PANEL_WIDTH,
	type ExpandPanel,
	normalizedToPixel
} from '@/components/wallpaper/quickActions/quickActionsShared';

type UseQuickActionsLayoutOptions = {
	isOpen: boolean;
	expandPanel: ExpandPanel;
	quickActionsScale: number;
	quickActionsPositionX: number;
	quickActionsPositionY: number;
	quickActionsLauncherSize: number;
	layoutResponsiveEnabled: boolean;
	layoutReferenceWidth: number;
	layoutReferenceHeight: number;
	quickActionsLauncherPositionX: number;
	quickActionsLauncherPositionY: number;
};

export function useQuickActionsLayout({
	isOpen,
	expandPanel,
	quickActionsScale,
	quickActionsPositionX,
	quickActionsPositionY,
	quickActionsLauncherSize,
	layoutResponsiveEnabled,
	layoutReferenceWidth,
	layoutReferenceHeight,
	quickActionsLauncherPositionX,
	quickActionsLauncherPositionY
}: UseQuickActionsLayoutOptions) {
	const panelRef = useRef<HTMLDivElement | null>(null);
	const launcherRef = useRef<HTMLButtonElement | null>(null);
	const [panelMeasuredHeight, setPanelMeasuredHeight] =
		useState(PANEL_MIN_HEIGHT);
	const viewportSize = useViewportResolution();
	const responsiveHud = resolveResponsiveHudLayout(
		{
			layoutResponsiveEnabled,
			layoutReferenceWidth,
			layoutReferenceHeight,
			quickActionsScale,
			quickActionsLauncherSize
		},
		viewportSize.width,
		viewportSize.height
	);
	const effectiveScale = responsiveHud.quickActionsScale;
	const effectiveLauncherSize = responsiveHud.quickActionsLauncherSize;

	useEffect(() => {
		if (!panelRef.current) return undefined;
		const target = panelRef.current;
		const sync = () =>
			setPanelMeasuredHeight(
				Math.max(
					PANEL_MIN_HEIGHT,
					target.offsetHeight ||
						target.getBoundingClientRect().height /
							Math.max(effectiveScale, 0.01)
				)
			);
		sync();
		const observer = new ResizeObserver(sync);
		observer.observe(target);
		return () => observer.disconnect();
	}, [effectiveScale, expandPanel, isOpen, viewportSize.height, viewportSize.width]);

	const panelWidth = Math.min(
		viewportSize.width - PANEL_MARGIN * 2,
		PANEL_WIDTH
	);
	const scaledPanelWidth = panelWidth * effectiveScale;

	// Cap pre-transform height so that (height * scale) never exceeds the visible
	// viewport; otherwise the HUD grows with content and clips off-screen.
	const maxLayoutHeightUnscaled = Math.max(
		PANEL_MIN_HEIGHT,
		(viewportSize.height - PANEL_MARGIN * 2) / Math.max(effectiveScale, 0.01)
	);
	const clampedPanelHeight = Math.min(panelMeasuredHeight, maxLayoutHeightUnscaled);
	const scaledPanelHeight = clampedPanelHeight * effectiveScale;
	const launcherSizePx = Math.min(128, Math.max(24, effectiveLauncherSize));

	return {
		panelRef,
		launcherRef,
		launcherIconPx: Math.round(launcherSizePx * 0.625),
		panelStyle: {
			left: normalizedToPixel(
				quickActionsPositionX,
				scaledPanelWidth,
				viewportSize.width,
				PANEL_MARGIN
			),
			top: normalizedToPixel(
				quickActionsPositionY,
				scaledPanelHeight,
				viewportSize.height,
				PANEL_MARGIN
			),
			boxSizing: 'border-box',
			display: 'flex',
			flexDirection: 'column',
			minHeight: PANEL_MIN_HEIGHT,
			maxHeight: maxLayoutHeightUnscaled,
			overflow: 'hidden',
			width: panelWidth,
			transformOrigin: 'top left',
			transform:
				effectiveScale !== 1
					? `scale(${effectiveScale})`
					: undefined
		} satisfies CSSProperties,
		launcherStyle: {
			left: normalizedToPixel(
				quickActionsLauncherPositionX,
				launcherSizePx,
				viewportSize.width,
				PANEL_MARGIN
			),
			top: normalizedToPixel(
				quickActionsLauncherPositionY,
				launcherSizePx,
				viewportSize.height,
				PANEL_MARGIN
			),
			height: launcherSizePx,
			width: launcherSizePx,
			borderRadius: '999px'
		}
	};
}
