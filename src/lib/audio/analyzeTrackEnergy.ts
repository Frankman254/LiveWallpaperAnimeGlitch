export type TrackEnergyMetrics = {
	/** 0–1: overall RMS loudness (normalized to peak across the signal) */
	energyScore: number;
	/** 0–1: fraction of RMS energy below ~200 Hz relative to total */
	bassScore: number;
	/** 0–1: fraction of 50 ms windows that exceed a silence threshold */
	densityScore: number;
};

/**
 * Offline, non-realtime energy analysis for a single audio file.
 * Uses OfflineAudioContext.decodeAudioData so it never creates a running
 * AudioContext and has zero interaction with the playback pipeline.
 *
 * Returns null if the file cannot be decoded or is too short.
 */
export async function analyzeTrackEnergy(
	file: File
): Promise<TrackEnergyMetrics | null> {
	try {
		const arrayBuffer = await file.arrayBuffer();

		// Decode in a throwaway 1-sample offline context (decode only, no render)
		const decodeCtx = new OfflineAudioContext(1, 1, 44100);
		let decoded: AudioBuffer;
		try {
			decoded = await decodeCtx.decodeAudioData(arrayBuffer);
		} catch {
			return null;
		}

		const src = decoded.getChannelData(0);
		const sampleRate = decoded.sampleRate;

		// Downsample by stride-16 to keep analysis fast (~44 100/16 ≈ 2 756 samples/s)
		const STRIDE = 16;
		const n = Math.floor(src.length / STRIDE);
		if (n < 10) return null;

		const s = new Float32Array(n);
		for (let i = 0; i < n; i++) s[i] = src[i * STRIDE] ?? 0;

		const effectiveSr = sampleRate / STRIDE;

		// ── Overall RMS energy ────────────────────────────────────────────────
		let sumSq = 0;
		let peak = 0;
		for (let i = 0; i < n; i++) {
			const v = Math.abs(s[i]);
			sumSq += v * v;
			if (v > peak) peak = v;
		}
		const rms = Math.sqrt(sumSq / n);
		// Normalize to peak so quiet but "full" tracks aren't penalized
		const energyScore = peak > 0 ? Math.min(1, rms / (peak * 0.7071)) : 0;

		// ── Bass score via 1-pole IIR low-pass (~200 Hz) ─────────────────────
		// Cutoff at 200 Hz:  rc = 1 / (2π * fc)
		const fc = 200;
		const rc = 1 / (2 * Math.PI * fc);
		const dt = 1 / effectiveSr;
		const alpha = dt / (rc + dt); // low-pass coefficient
		const bass = new Float32Array(n);
		bass[0] = s[0];
		for (let i = 1; i < n; i++) {
			bass[i] = bass[i - 1] + alpha * (s[i] - bass[i - 1]);
		}
		let bassSumSq = 0;
		for (let i = 0; i < n; i++) bassSumSq += bass[i] * bass[i];
		const bassRms = Math.sqrt(bassSumSq / n);
		const bassScore = rms > 0 ? Math.min(1, bassRms / rms) : 0;

		// ── Peak density: fraction of 50 ms windows with energy above threshold ─
		const windowSamples = Math.max(1, Math.round(0.05 * effectiveSr));
		const silenceThreshold = 0.01;
		let totalWindows = 0;
		let activeWindows = 0;
		for (let i = 0; i + windowSamples <= n; i += windowSamples) {
			let wSumSq = 0;
			for (let j = i; j < i + windowSamples; j++) {
				wSumSq += s[j] * s[j];
			}
			const wRms = Math.sqrt(wSumSq / windowSamples);
			totalWindows++;
			if (wRms > silenceThreshold) activeWindows++;
		}
		const densityScore = totalWindows > 0 ? activeWindows / totalWindows : 0;

		return { energyScore, bassScore, densityScore };
	} catch {
		return null;
	}
}
