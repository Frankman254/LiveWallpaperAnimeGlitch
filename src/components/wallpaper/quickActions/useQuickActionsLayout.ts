import { useEffect, useRef, useState } from 'react';
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
	quickActionsLauncherPositionX,
	quickActionsLauncherPositionY
}: UseQuickActionsLayoutOptions) {
	const panelRef = useRef<HTMLDivElement | null>(null);
	const launcherRef = useRef<HTMLButtonElement | null>(null);
	const [panelMeasuredHeight, setPanelMeasuredHeight] =
		useState(PANEL_MIN_HEIGHT);
	const [launcherMeasuredSize, setLauncherMeasuredSize] = useState(64);
	const [viewportSize, setViewportSize] = useState(() => ({
		width: typeof window === 'undefined' ? 1280 : window.innerWidth,
		height: typeof window === 'undefined' ? 720 : window.innerHeight
	}));

	useEffect(() => {
		const onResize = () =>
			setViewportSize({
				width: window.innerWidth,
				height: window.innerHeight
			});
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	useEffect(() => {
		if (!panelRef.current) return undefined;
		const target = panelRef.current;
		const sync = () =>
			setPanelMeasuredHeight(
				Math.max(
					PANEL_MIN_HEIGHT,
					target.getBoundingClientRect().height
				)
			);
		sync();
		const observer = new ResizeObserver(sync);
		observer.observe(target);
		return () => observer.disconnect();
	}, [expandPanel, isOpen, quickActionsScale]);

	useEffect(() => {
		if (!launcherRef.current) return undefined;
		const target = launcherRef.current;
		const sync = () =>
			setLauncherMeasuredSize(
				Math.max(32, target.getBoundingClientRect().width)
			);
		sync();
		const observer = new ResizeObserver(sync);
		observer.observe(target);
		return () => observer.disconnect();
	}, [isOpen, quickActionsLauncherSize]);

	const panelWidth = Math.min(
		viewportSize.width - PANEL_MARGIN * 2,
		PANEL_WIDTH
	);
	const scaledPanelWidth = panelWidth * quickActionsScale;
	const scaledPanelHeight = panelMeasuredHeight * quickActionsScale;
	const launcherSizePx = Math.min(96, Math.max(32, quickActionsLauncherSize));

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
			minHeight: PANEL_MIN_HEIGHT,
			width: panelWidth,
			transformOrigin: 'top left',
			transform:
				quickActionsScale !== 1
					? `scale(${quickActionsScale})`
					: undefined
		},
		launcherStyle: {
			left: normalizedToPixel(
				quickActionsLauncherPositionX,
				launcherMeasuredSize,
				viewportSize.width,
				PANEL_MARGIN
			),
			top: normalizedToPixel(
				quickActionsLauncherPositionY,
				launcherMeasuredSize,
				viewportSize.height,
				PANEL_MARGIN
			),
			height: launcherSizePx,
			width: launcherSizePx,
			borderRadius: '999px'
		}
	};
}
