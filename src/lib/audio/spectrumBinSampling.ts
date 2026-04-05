import type { ResolvedAudioReactiveChannel } from '@/types/wallpaper';

export function getBandRange(
	mode: ResolvedAudioReactiveChannel,
	binsLength: number
): [number, number] {
	switch (mode) {
		case 'kick':
			return [1, 14];
		case 'instrumental':
			return [14, 180];
		case 'bass':
			return [6, 28];
		case 'hihat':
			return [150, 240];
		case 'vocal':
			return [30, 120];
		default:
			return [1, Math.max(10, Math.floor(binsLength * 0.8))];
	}
}

/** Same weighting as `CircularSpectrum` radial/linear sampling. */
export function sampleBinsForChannel(
	bins: Uint8Array,
	index: number,
	barCount: number,
	selectedChannel: ResolvedAudioReactiveChannel
): number {
	if (bins.length === 0) return 0;
	const [startBin, endBin] = getBandRange(selectedChannel, bins.length);
	const logT = Math.pow(index / Math.max(barCount - 1, 1), 1.5);
	const binIdx = Math.floor(startBin + logT * (endBin - startBin));
	return (bins[Math.min(binIdx, bins.length - 1)] ?? 0) / 255;
}

export function buildChannelWeightedCurve(
	bins: Uint8Array,
	barCount: number,
	channel: ResolvedAudioReactiveChannel
): number[] {
	const out: number[] = [];
	const n = Math.max(1, barCount);
	for (let i = 0; i < n; i += 1) {
		out.push(sampleBinsForChannel(bins, i, n, channel));
	}
	return out;
}

/** Full FFT downsample (max per bucket) — reflects AnalyserNode output after its smoothing. */
export function downsampleFftMax(
	bins: Uint8Array,
	bucketCount: number
): number[] {
	if (bins.length === 0) return Array(Math.max(1, bucketCount)).fill(0);
	const out: number[] = [];
	const n = Math.max(1, bucketCount);
	for (let j = 0; j < n; j += 1) {
		const start = Math.floor((j / n) * bins.length);
		const end = Math.floor(((j + 1) / n) * bins.length);
		let max = 0;
		for (let k = start; k < end; k += 1) {
			max = Math.max(max, bins[k] ?? 0);
		}
		out.push(max / 255);
	}
	return out;
}
