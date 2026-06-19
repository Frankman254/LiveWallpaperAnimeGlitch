import { mixHexColors } from '../color/spectrumColor';
import { resolvePeakSparkCount } from './spectrumFxBudget';
import type { SpectrumSettings } from '../runtime/spectrumRuntime';

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

const topIndices = new Int32Array(12);
const topValues = new Float32Array(12);

/** Insert local peak into fixed-size top-N buffer (no heap alloc / sort). */
function insertPeakCandidate(index: number, value: number, cap: number): void {
	let insertAt = cap;
	for (let rank = 0; rank < cap; rank++) {
		if (value > topValues[rank]) {
			insertAt = rank;
			break;
		}
	}
	if (insertAt >= cap) return;
	for (let rank = cap - 1; rank > insertAt; rank--) {
		topIndices[rank] = topIndices[rank - 1];
		topValues[rank] = topValues[rank - 1];
	}
	topIndices[insertAt] = index;
	topValues[insertAt] = value;
}

function resolveSparkFill(settings: SpectrumSettings): string {
	return mixHexColors(settings.spectrumPrimaryColor, '#ffffff', 0.72);
}

/**
 * Capped bright accents at local spectral peaks. Reuses bar height data.
 */
export function drawPeakSparksPass(
	ctx: CanvasRenderingContext2D,
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings,
	placeSpark: (index: number, size: number) => void
): void {
	if (!settings.spectrumPeakSparks || barCount < 3) return;

	const threshold = clamp01(settings.spectrumPeakSparksThreshold ?? 0.45);
	const size = Math.max(2, settings.spectrumPeakSparksSize ?? 4);
	const maxHeight = Math.max(1, settings.spectrumMaxHeight);
	const sparkCap = resolvePeakSparkCount(settings.spectrumPeakSparksAmount);

	topIndices.fill(-1);
	topValues.fill(-Infinity);
	let found = 0;

	for (let i = 1; i < barCount - 1; i++) {
		const value = heights[i];
		if (value / maxHeight < threshold) continue;
		if (value <= heights[i - 1] || value <= heights[i + 1]) continue;
		insertPeakCandidate(i, value, sparkCap);
		found += 1;
	}
	if (found === 0) return;

	const count = Math.min(sparkCap, found);
	ctx.save();
	ctx.shadowBlur = 0;
	ctx.shadowColor = 'transparent';
	ctx.globalCompositeOperation = 'lighter';
	ctx.fillStyle = resolveSparkFill(settings);
	for (let rank = 0; rank < count; rank++) {
		if (topIndices[rank] < 0) break;
		const fade = 1 - (rank / Math.max(count, 1)) * 0.3;
		ctx.globalAlpha = fade;
		placeSpark(topIndices[rank], size);
	}
	ctx.restore();
}

/** Test helper — count peaks selected for synthetic heights. */
export function countPeakSparkCandidates(
	heights: Float32Array,
	barCount: number,
	settings: SpectrumSettings
): number {
	if (!settings.spectrumPeakSparks || barCount < 3) return 0;
	const threshold = clamp01(settings.spectrumPeakSparksThreshold ?? 0.45);
	const maxHeight = Math.max(1, settings.spectrumMaxHeight);
	const sparkCap = resolvePeakSparkCount(settings.spectrumPeakSparksAmount);
	topIndices.fill(-1);
	topValues.fill(-Infinity);
	let found = 0;
	for (let i = 1; i < barCount - 1; i++) {
		const value = heights[i];
		if (value / maxHeight < threshold) continue;
		if (value <= heights[i - 1] || value <= heights[i + 1]) continue;
		insertPeakCandidate(i, value, sparkCap);
		found += 1;
	}
	return Math.min(sparkCap, found);
}
