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

	return normalizeViewportResolution(
		window.innerWidth || window.screen?.width || FALLBACK_VIEWPORT.width,
		window.innerHeight || window.screen?.height || FALLBACK_VIEWPORT.height
	);
}

export function useViewportResolution(): ViewportResolution {
	const [resolution, setResolution] = useState<ViewportResolution>(() =>
		getCurrentViewportResolution()
	);

	useEffect(() => {
		if (typeof window === 'undefined') return undefined;

		const sync = () => setResolution(getCurrentViewportResolution());
		sync();
		window.addEventListener('resize', sync);
		return () => window.removeEventListener('resize', sync);
	}, []);

	return resolution;
}

export function formatViewportResolution({
	width,
	height
}: ViewportResolution): string {
	return `${width} x ${height}`;
}
