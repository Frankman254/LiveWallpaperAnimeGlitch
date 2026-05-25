import { useEffect, useMemo, useState } from 'react';
import type { ImageFitMode } from '@/types/wallpaper';
import { IMAGE_RANGES } from '@/config/ranges';
import { loadImageDimensions } from '@/lib/backgroundAutoFit';
import { resolveImageTransform } from '@/features/background/resolveImageTransform';

type SliderRange = {
	min: number;
	max: number;
	step: number;
};

export type BackgroundPositionRanges = {
	positionX: SliderRange;
	positionY: SliderRange;
	/** Minimum scale needed to cover the viewport (rotation-aware). */
	minScale: number;
	/**
	 * Legal normalized position window for full coverage, always computed
	 * (regardless of keepCovered) so callers can correct stored values the
	 * moment coverage is enabled.
	 */
	coverageBounds: { minX: number; maxX: number; minY: number; maxY: number };
};

type ViewportSize = {
	width: number;
	height: number;
};

type ImageDimensions = {
	width: number;
	height: number;
};

const FALLBACK_RANGES: BackgroundPositionRanges = {
	positionX: IMAGE_RANGES.positionX,
	positionY: IMAGE_RANGES.positionY,
	minScale: 1,
	coverageBounds: { minX: -1, maxX: 1, minY: -1, maxY: 1 }
};

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
	positionY,
	layoutResponsiveEnabled,
	layoutBackgroundReframeEnabled,
	layoutReferenceWidth,
	layoutReferenceHeight,
	mirror = false,
	rotation = 0,
	keepCovered = false,
	focusX = null,
	focusY = null,
	mirrorFill = false,
	mirrorFillInvert = false
}: {
	url: string | null;
	fitMode: ImageFitMode;
	scale: number;
	positionX: number;
	positionY: number;
	layoutResponsiveEnabled: boolean;
	layoutBackgroundReframeEnabled: boolean;
	layoutReferenceWidth: number;
	layoutReferenceHeight: number;
	mirror?: boolean;
	rotation?: number;
	keepCovered?: boolean;
	focusX?: number | null;
	focusY?: number | null;
	mirrorFill?: boolean;
	mirrorFillInvert?: boolean;
}): BackgroundPositionRanges {
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

		const layout = {
			layoutResponsiveEnabled,
			layoutBackgroundReframeEnabled,
			layoutReferenceWidth,
			layoutReferenceHeight
		};
		const freeTransform = resolveImageTransform({
			viewportWidth: viewport.width,
			viewportHeight: viewport.height,
			imageWidth: dimensions.width,
			imageHeight: dimensions.height,
			scale,
			rotation,
			positionX,
			positionY,
			fitMode,
			mirror,
			keepCovered: false,
			focusX,
			focusY,
			mirrorFill,
			mirrorFillInvert,
			layout
		});
		// Always resolve the covered transform so we expose minScale +
		// coverageBounds even when coverage is OFF (callers correct stored
		// values the moment it's toggled on).
		const covered = resolveImageTransform({
			viewportWidth: viewport.width,
			viewportHeight: viewport.height,
			imageWidth: dimensions.width,
			imageHeight: dimensions.height,
			scale,
			rotation,
			positionX,
			positionY,
			fitMode,
			mirror,
			keepCovered: true,
			focusX,
			focusY,
			mirrorFill,
			mirrorFillInvert,
			layout: {
				layoutResponsiveEnabled,
				layoutBackgroundReframeEnabled,
				layoutReferenceWidth,
				layoutReferenceHeight
			}
		});
		const coverageBounds = covered.bounds;
		const minScale = covered.minScaleForCoverage;

		// Coverage ON: clamp the position sliders to the legal coverage window
		// (rotation + focus aware) so the user cannot expose the background.
		if (keepCovered) {
			const stepX =
				coverageBounds.maxX - coverageBounds.minX > 1 ? 0.01 : 0.005;
			const stepY =
				coverageBounds.maxY - coverageBounds.minY > 1 ? 0.01 : 0.005;
			return {
				positionX: {
					min: coverageBounds.minX,
					max: coverageBounds.maxX,
					step: stepX
				},
				positionY: {
					min: coverageBounds.minY,
					max: coverageBounds.maxY,
					step: stepY
				},
				minScale,
				coverageBounds
			};
		}

		const scaledWidth =
			freeTransform.baseWidth * freeTransform.effectiveScale;
		const scaledHeight =
			freeTransform.baseHeight * freeTransform.effectiveScale;
		const overflowX = Math.max(0, (scaledWidth - viewport.width) / 2);
		const overflowY = Math.max(0, (scaledHeight - viewport.height) / 2);

		return {
			positionX: createAxisRange(overflowX, viewport.width, positionX),
			positionY: createAxisRange(overflowY, viewport.height, positionY),
			minScale,
			coverageBounds
		};
	}, [
		dimensions,
		fitMode,
		focusX,
		focusY,
		keepCovered,
		layoutBackgroundReframeEnabled,
		layoutReferenceHeight,
		layoutReferenceWidth,
		layoutResponsiveEnabled,
		mirror,
		mirrorFill,
		mirrorFillInvert,
		positionX,
		positionY,
		rotation,
		scale,
		viewport
	]);
}
