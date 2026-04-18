import { useEffect, useState } from 'react';

export type ViewportResolution = {
	width: number;
	height: number;
};

const FALLBACK_VIEWPORT: ViewportResolution = {
	width: 1920,
	height: 1080
};

export function normalizeViewportResolution(
	width: number,
	height: number
): ViewportResolution {
	const safeWidth = Number.isFinite(width)
		? Math.max(1, Math.round(width))
		: FALLBACK_VIEWPORT.width;
	const safeHeight = Number.isFinite(height)
		? Math.max(1, Math.round(height))
		: FALLBACK_VIEWPORT.height;

	return {
		width: safeWidth,
		height: safeHeight
	};
}

export function getCurrentViewportResolution(): ViewportResolution {
	if (typeof window === 'undefined') {
		return FALLBACK_VIEWPORT;
	}

	// visualViewport reflects the true paintable area and fires its own resize
	// events when the window moves between monitors with different DPI/scale.
	const vv = window.visualViewport;
	const width = vv
		? vv.width
		: window.innerWidth || window.screen?.width || FALLBACK_VIEWPORT.width;
	const height = vv
		? vv.height
		: window.innerHeight ||
			window.screen?.height ||
			FALLBACK_VIEWPORT.height;

	return normalizeViewportResolution(width, height);
}

export function useViewportResolution(): ViewportResolution {
	const [resolution, setResolution] = useState<ViewportResolution>(() =>
		getCurrentViewportResolution()
	);

	useEffect(() => {
		if (typeof window === 'undefined') return undefined;

		let rafId: ReturnType<typeof requestAnimationFrame> | null = null;

		// Chromium (and Brave) sometimes fires "resize" before innerWidth /
		// innerHeight are updated when moving between monitors.  Defer one
		// animation frame so the browser has committed the new layout.
		const scheduleSync = () => {
			if (rafId !== null) cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(() => {
				rafId = null;
				setResolution(getCurrentViewportResolution());
			});
		};

		scheduleSync();

		window.addEventListener('resize', scheduleSync);
		window.addEventListener('orientationchange', scheduleSync);

		const vv = window.visualViewport;
		if (vv) {
			vv.addEventListener('resize', scheduleSync);
		}

		return () => {
			window.removeEventListener('resize', scheduleSync);
			window.removeEventListener('orientationchange', scheduleSync);
			if (vv) {
				vv.removeEventListener('resize', scheduleSync);
			}
			if (rafId !== null) cancelAnimationFrame(rafId);
		};
	}, []);

	return resolution;
}

export function formatViewportResolution({
	width,
	height
}: ViewportResolution): string {
	return `${width} x ${height}`;
}
