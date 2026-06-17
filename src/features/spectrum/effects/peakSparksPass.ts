import { resolvePeakSparkCount } from './spectrumFxBudget';
import type { SpectrumSettings } from '../runtime/spectrumRuntime';

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

type SparkCandidate = { index: number; value: number };

/**
 * Draws a capped set of bright accents at local spectral peaks. Reuses bar
 * height data — no particle system, no per-frame allocations beyond scratch.
 */
export function drawPeakSparksPass(
	ctx: CanvasRenderingContext2D,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings,
	placeSpark: (index: number, size: number) => void
): void {
	if (!settings.spectrumPeakSparks || barCount < 3) return;

	const threshold = clamp01(settings.spectrumPeakSparksThreshold ?? 0.65);
	const size = Math.max(1.5, settings.spectrumPeakSparksSize ?? 3);
	const maxHeight = Math.max(1, settings.spectrumMaxHeight);
	const sparkCap = resolvePeakSparkCount(settings.spectrumPeakSparksAmount);

	const candidates: SparkCandidate[] = [];
	for (let i = 1; i < barCount - 1; i++) {
		const value = heights[i];
		if (value / maxHeight < threshold) continue;
		if (value <= heights[i - 1] || value <= heights[i + 1]) continue;
		candidates.push({ index: i, value });
	}
	if (candidates.length === 0) return;

	candidates.sort((a, b) => b.value - a.value);
	const count = Math.min(sparkCap, candidates.length);

	ctx.save();
	ctx.shadowBlur = 0;
	ctx.globalCompositeOperation = 'lighter';
	ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
	for (let rank = 0; rank < count; rank++) {
		const fade = 1 - rank / Math.max(count, 1) * 0.35;
		ctx.globalAlpha = fade;
		placeSpark(candidates[rank].index, size);
	}
	ctx.restore();
}
