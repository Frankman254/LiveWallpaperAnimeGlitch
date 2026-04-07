/**
 * Offline content analysis for a single audio file.
 *
 * Computes:
 *  - contentStartMs / contentEndMs: where meaningful audio begins/ends
 *  - introTrimMs / outroTrimMs: amount of silence at start/end
 *  - estimatedBpm: lightweight autocorrelation-based tempo estimate
 *  - beatStrength: 0–1 how rhythmic/percussive the track is
 *  - loudnessDb: simple integrated RMS loudness (dBFS)
 *  - durationMs: total duration
 *  - mixOutStartMs: suggested crossfade-out start point
 *
 * Uses OfflineAudioContext.decodeAudioData — zero interaction with playback.
 */

export type TrackContentMetrics = {
	contentStartMs: number;
	contentEndMs: number;
	introTrimMs: number;
	outroTrimMs: number;
	mixOutStartMs: number;
	estimatedBpm: number;
	beatStrength: number;
	loudnessDb: number;
	durationMs: number;
};

const SILENCE_THRESHOLD = 0.005; // RMS threshold for silence detection
const SILENCE_WINDOW_MS = 50; // ms per analysis window
const MAX_SCAN_SEC = 30; // max seconds to scan for silence at start/end
const BPM_MIN = 60;
const BPM_MAX = 200;

/**
 * Analyze track content for silence boundaries, BPM, and loudness.
 * Returns null if the file cannot be decoded or is too short.
 */
export async function analyzeTrackContent(
	file: File,
	crossfadeDurationMs = 3000
): Promise<TrackContentMetrics | null> {
	try {
		const arrayBuffer = await file.arrayBuffer();
		const decodeCtx = new OfflineAudioContext(1, 1, 44100);
		let decoded: AudioBuffer;
		try {
			decoded = await decodeCtx.decodeAudioData(arrayBuffer);
		} catch {
			return null;
		}

		const src = decoded.getChannelData(0);
		const sampleRate = decoded.sampleRate;
		const totalSamples = src.length;
		const durationMs = (totalSamples / sampleRate) * 1000;

		if (totalSamples < sampleRate * 0.5) return null; // < 0.5s

		// ── Silence detection ─────────────────────────────────────────────
		const windowSamples = Math.max(
			1,
			Math.round((SILENCE_WINDOW_MS / 1000) * sampleRate)
		);
		const maxScanSamples = Math.min(
			totalSamples,
			Math.round(MAX_SCAN_SEC * sampleRate)
		);

		// Scan forward for content start
		let contentStartSample = 0;
		for (let i = 0; i + windowSamples <= maxScanSamples; i += windowSamples) {
			let sumSq = 0;
			for (let j = i; j < i + windowSamples; j++) {
				sumSq += src[j] * src[j];
			}
			const rms = Math.sqrt(sumSq / windowSamples);
			if (rms > SILENCE_THRESHOLD) {
				contentStartSample = Math.max(0, i - windowSamples);
				break;
			}
			contentStartSample = i + windowSamples;
		}

		// Scan backward for content end
		let contentEndSample = totalSamples;
		const scanEnd = Math.max(0, totalSamples - maxScanSamples);
		for (
			let i = totalSamples - windowSamples;
			i >= scanEnd;
			i -= windowSamples
		) {
			let sumSq = 0;
			for (let j = i; j < Math.min(i + windowSamples, totalSamples); j++) {
				sumSq += src[j] * src[j];
			}
			const rms = Math.sqrt(sumSq / windowSamples);
			if (rms > SILENCE_THRESHOLD) {
				contentEndSample = Math.min(
					totalSamples,
					i + windowSamples * 2
				);
				break;
			}
			contentEndSample = i;
		}

		const contentStartMs = (contentStartSample / sampleRate) * 1000;
		const contentEndMs = (contentEndSample / sampleRate) * 1000;
		const introTrimMs = contentStartMs;
		const outroTrimMs = durationMs - contentEndMs;

		// Mix-out point: where crossfade should start
		const mixOutStartMs = Math.max(
			contentStartMs + 1000, // at least 1s of content
			contentEndMs - crossfadeDurationMs
		);

		// ── Loudness (integrated RMS in dBFS) ─────────────────────────────
		const STRIDE = 16;
		const n = Math.floor(totalSamples / STRIDE);
		let sumSq = 0;
		for (let i = 0; i < n; i++) {
			const v = src[i * STRIDE];
			sumSq += v * v;
		}
		const rms = Math.sqrt(sumSq / n);
		const loudnessDb =
			rms > 0 ? 20 * Math.log10(rms) : -96;

		// ── BPM estimation via autocorrelation ────────────────────────────
		// Step 1: Create onset strength envelope
		const envSr = sampleRate / STRIDE;
		const envLen = n;
		const envelope = new Float32Array(envLen);

		// Half-wave rectified difference of downsampled signal
		let prev = 0;
		for (let i = 0; i < envLen; i++) {
			const v = Math.abs(src[i * STRIDE]);
			envelope[i] = Math.max(0, v - prev);
			prev = v;
		}

		// Simple low-pass smoothing on envelope
		const smoothed = new Float32Array(envLen);
		const smoothAlpha = 0.15;
		smoothed[0] = envelope[0];
		for (let i = 1; i < envLen; i++) {
			smoothed[i] = smoothed[i - 1] + smoothAlpha * (envelope[i] - smoothed[i - 1]);
		}

		// Step 2: Autocorrelation in BPM range
		const minLag = Math.round(envSr * (60 / BPM_MAX));
		const maxLag = Math.round(envSr * (60 / BPM_MIN));
		// Use center portion for stability
		const acStart = Math.round(envLen * 0.1);
		const acEnd = Math.min(envLen, Math.round(envLen * 0.9));
		const acLen = acEnd - acStart;

		let bestLag = minLag;
		let bestCorr = -Infinity;
		let totalCorr = 0;

		for (let lag = minLag; lag <= maxLag && lag < acLen; lag++) {
			let corr = 0;
			const corrLen = Math.min(acLen - lag, acLen);
			for (let i = 0; i < corrLen; i++) {
				corr += smoothed[acStart + i] * smoothed[acStart + i + lag];
			}
			corr /= corrLen;
			totalCorr += Math.abs(corr);
			if (corr > bestCorr) {
				bestCorr = corr;
				bestLag = lag;
			}
		}

		const estimatedBpm = (envSr * 60) / bestLag;

		// Step 3: Beat strength — ratio of peak auto-correlation to average
		const avgCorr =
			totalCorr / Math.max(1, maxLag - minLag + 1);
		const beatStrength =
			avgCorr > 0
				? Math.min(1, (bestCorr / avgCorr - 1) / 3)
				: 0;

		return {
			contentStartMs: Math.round(contentStartMs),
			contentEndMs: Math.round(contentEndMs),
			introTrimMs: Math.round(introTrimMs),
			outroTrimMs: Math.round(Math.max(0, outroTrimMs)),
			mixOutStartMs: Math.round(mixOutStartMs),
			estimatedBpm: Math.round(estimatedBpm * 10) / 10,
			beatStrength: Math.round(beatStrength * 100) / 100,
			loudnessDb: Math.round(loudnessDb * 10) / 10,
			durationMs: Math.round(durationMs)
		};
	} catch {
		return null;
	}
}
