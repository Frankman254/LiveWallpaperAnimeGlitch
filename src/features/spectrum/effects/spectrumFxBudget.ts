import type { PerformanceMode } from '@/types/wallpaper';

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

/** Smoothstep — low amounts stay subtle, max remains bounded. */
export function curveRgbSplitAmount(amount: number): number {
	const t = clamp01(amount);
	return t * t * (3 - 2 * t);
}

const RGB_SPLIT_MAX_BY_PERF: Record<PerformanceMode, number> = {
	low: 10,
	medium: 18,
	high: 28
};

/** Alpha for RGB fringe passes — scales with amount for perceptibility. */
export function resolveRgbSplitAlpha(amount: number): number {
	const curved = curveRgbSplitAmount(amount);
	if (curved <= 0.001) return 0;
	return 0.38 + curved * 0.52;
}

/**
 * Pixel offset for chromatic-aberration passes. Zero when disabled or amount
 * is negligible — callers should early-out before building paths.
 */
export function resolveRgbSplitOffsetPx(
	enabled: boolean,
	amount: number,
	referencePx: number,
	performanceMode: PerformanceMode,
	barCount: number
): number {
	if (!enabled) return 0;
	const curved = curveRgbSplitAmount(amount);
	if (curved <= 0.001) return 0;
	const densityScale = barCount > 220 ? 0.78 : barCount > 160 ? 0.88 : 1;
	const base = Math.max(4, referencePx * 0.016) * curved * 3.4 * densityScale;
	const cap =
		RGB_SPLIT_MAX_BY_PERF[performanceMode] ?? RGB_SPLIT_MAX_BY_PERF.high;
	return Math.min(base, cap);
}

export const PEAK_SPARKS_HARD_CAP = 12;
export const PEAK_SPARKS_DEFAULT_CAP = 8;

export function resolvePeakSparkCount(requested: number): number {
	return Math.max(
		0,
		Math.min(
			PEAK_SPARKS_HARD_CAP,
			Math.round(requested || PEAK_SPARKS_DEFAULT_CAP)
		)
	);
}
