import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { resolveResponsiveHudLayout } from '@/features/layout/responsiveLayout';
import { useViewportResolution } from '@/features/layout/viewportMetrics';
import {
	PANEL_MARGIN,
	PANEL_DEFAULT_HEIGHT,
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
		useState(PANEL_DEFAULT_HEIGHT);
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
		if (!isOpen || !panelRef.current) return undefined;
		const target = panelRef.current;
		const sync = () => {
			const measuredHeight =
				target.offsetHeight ||
				target.getBoundingClientRect().height /
					Math.max(effectiveScale, 0.01);
			if (measuredHeight > 0) {
				setPanelMeasuredHeight(measuredHeight);
			}
		};
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

	// The HUD is content-driven: its height is measured from the rendered
	// panel. We only enforce a physical ceiling at `viewport - margin*2` so it
	// can never render off-screen when scale is high. When content fits within
	// that ceiling there is no artificial cap and the inner scroll container
	// stays inactive (no scrollbar visible).
	const maxScaledPanelHeight = Math.max(
		PANEL_DEFAULT_HEIGHT * Math.max(effectiveScale, 0.01),
		viewportSize.height - PANEL_MARGIN * 2
	);
	const maxLayoutHeightUnscaled =
		maxScaledPanelHeight / Math.max(effectiveScale, 0.01);
	const clampedPanelHeight = Math.min(panelMeasuredHeight, maxLayoutHeightUnscaled);
	const scaledPanelHeight = clampedPanelHeight * effectiveScale;
	const launcherSizePx = Math.min(128, Math.max(24, effectiveLauncherSize));

	// The shell uses `py-3` (24px total) plus a 1px border on each side.
	// Leave that vertical chrome outside the scroll region so we do not end up
	// with a 1-2px phantom overflow that keeps the scrollbar visible.
	const shellVerticalChrome = 26;
	const maxScrollAreaHeight = Math.max(
		120,
		maxLayoutHeightUnscaled - shellVerticalChrome
	);

	return {
		panelRef,
		launcherRef,
		launcherIconPx: Math.round(launcherSizePx * 0.625),
		maxScrollAreaHeight,
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
			borderRadius: 'var(--editor-radius-xl)',
			isolation: 'isolate',
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
