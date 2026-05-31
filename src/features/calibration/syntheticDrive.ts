/**
 * Periodic test pulse for calibration's "Sintético" mode.
 *
 * A sharp-attack / exponential-decay transient at 120 BPM (one pulse every
 * 0.5s) that mimics a kick drum. Shared by the calibration preview canvas
 * (`EnvelopeWaveformPreview`) and the live render injection (logo + BG zoom
 * drive resolvers) so the on-screen element and the preview curve pulse with
 * the same shape and tempo.
 *
 * @param timeSeconds monotonic seconds — either `performance.now() / 1000`
 *   (render path) or an accumulated dt (preview path). Returns a normalized
 *   0..1 amplitude, treated like a raw audio-channel reading downstream.
 */
export function syntheticKickValue(timeSeconds: number): number {
	const period = 0.5; // 120 BPM
	const phase = (timeSeconds % period) / period;
	return phase < 0.08 ? phase / 0.08 : Math.exp(-(phase - 0.08) * 6);
}
