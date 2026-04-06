import { useEffect, useMemo, useState } from 'react';
import type { ImageFitMode } from '@/types/wallpaper';
import { IMAGE_RANGES } from '@/config/ranges';
import { loadImageDimensions } from '@/lib/backgroundAutoFit';
import { getBackgroundBaseSize } from '@/components/wallpaper/layers/imageCanvasShared';

type SliderRange = {
	min: number;
	max: number;
	step: number;
};

type ViewportSize = {
	width: number;
	height: number;
};

type ImageDimensions = {
	width: number;
	height: number;
};

const FALLBACK_RANGES = {
	positionX: IMAGE_RANGES.positionX,
	positionY: IMAGE_RANGES.positionY
} as const;

function roundRangeExtent(value: number): number {
	return Math.max(0.1, Math.ceil(value / 0.02) * 0.02);
}

function createAxisRange(
	overflowPixels: number,
	viewportPixels: number,
	currentValue: number
): SliderRange {
	const normalizedOverflow =
		overflowPixels > 0
			? overflowPixels / Math.max(1, viewportPixels * 0.5)
			: 0;
	const extent = roundRangeExtent(
		Math.max(Math.abs(currentValue), normalizedOverflow)
	);
	return {
		min: -extent,
		max: extent,
		step: extent > 1 ? 0.01 : 0.005
	};
}

function getViewportSize(): ViewportSize {
	if (typeof window === 'undefined') {
		return { width: 1920, height: 1080 };
	}
	return {
		width: Math.max(1, window.innerWidth),
		height: Math.max(1, window.innerHeight)
	};
}

export function useBackgroundPositionRanges({
	url,
	fitMode,
	scale,
	positionX,
	positionY
}: {
	url: string | null;
	fitMode: ImageFitMode;
	scale: number;
	positionX: number;
	positionY: number;
}) {
	const [viewport, setViewport] = useState<ViewportSize>(() =>
		getViewportSize()
	);
	const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);

	useEffect(() => {
		if (!url) {
			setDimensions(null);
			return;
		}

		let cancelled = false;
		void loadImageDimensions(url)
			.then(nextDimensions => {
				if (!cancelled) setDimensions(nextDimensions);
			})
			.catch(() => {
				if (!cancelled) setDimensions(null);
			});

		return () => {
			cancelled = true;
		};
	}, [url]);

	useEffect(() => {
		if (typeof window === 'undefined') return undefined;

		const handleResize = () => {
			setViewport(getViewportSize());
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return useMemo(() => {
		if (!dimensions) {
			return FALLBACK_RANGES;
		}

		const base = getBackgroundBaseSize(
			viewport.width,
			viewport.height,
			dimensions.width,
			dimensions.height,
			fitMode
		);
		const scaledWidth = base.width * Math.max(0.01, scale);
		const scaledHeight = base.height * Math.max(0.01, scale);
		const overflowX = Math.max(0, (scaledWidth - viewport.width) / 2);
		const overflowY = Math.max(0, (scaledHeight - viewport.height) / 2);

		return {
			positionX: createAxisRange(overflowX, viewport.width, positionX),
			positionY: createAxisRange(overflowY, viewport.height, positionY)
		};
	}, [dimensions, fitMode, positionX, positionY, scale, viewport]);
}
