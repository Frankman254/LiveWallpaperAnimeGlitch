import type { SpectrumRuntimeState } from '../runtime/spectrumRuntime';
import type { SpectrumSettings } from '../runtime/spectrumRuntime';

const ECHO_BUFFER_CAP = 2;

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

function ensureEchoBuffers(
	runtime: SpectrumRuntimeState,
	barCount: number,
	echoCount: number
): Float32Array[] {
	const needed = Math.min(ECHO_BUFFER_CAP, Math.max(1, echoCount));
	let buffers = runtime.echoTraceBuffers;
	if (!buffers) {
		buffers = [];
		runtime.echoTraceBuffers = buffers;
	}
	while (buffers.length < needed) {
		buffers.push(new Float32Array(barCount));
	}
	if (buffers.length > needed) {
		buffers.length = needed;
	}
	for (let i = 0; i < needed; i++) {
		if (buffers[i].length !== barCount) {
			buffers[i] = new Float32Array(barCount);
		}
	}
	return buffers;
}

/** Store current frame AFTER drawing — see spectrumDrawOrder contract. */
export function updateEchoTraceHistory(
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings,
	heights: Float32Array,
	barCount: number
): void {
	if (!settings.spectrumEchoTrace) {
		runtime.echoTraceBuffers = undefined;
		runtime.echoTraceFrameCount = 0;
		return;
	}
	const echoCount = settings.spectrumEchoTraceCount === 2 ? 2 : 1;
	const buffers = ensureEchoBuffers(runtime, barCount, echoCount);
	for (let slot = buffers.length - 1; slot > 0; slot--) {
		buffers[slot].set(buffers[slot - 1]);
	}
	buffers[0].set(heights.subarray(0, barCount));
	runtime.echoTraceFrameCount = Math.min(
		ECHO_BUFFER_CAP,
		(runtime.echoTraceFrameCount ?? 0) + 1
	);
}

export type EchoTraceDrawContext = {
	ctx: CanvasRenderingContext2D;
	settings: SpectrumSettings;
	traceHeights: (
		heights: Float32Array,
		alpha: number,
		offset: number
	) => void;
};

/** Draw 1–2 decaying previous traces. Skips until at least one frame stored. */
export function drawEchoTracePasses(
	runtime: SpectrumRuntimeState,
	drawCtx: EchoTraceDrawContext
): void {
	const { settings, traceHeights } = drawCtx;
	if (!settings.spectrumEchoTrace) return;
	if ((runtime.echoTraceFrameCount ?? 0) < 1) return;
	const buffers = runtime.echoTraceBuffers;
	if (!buffers || buffers.length === 0) return;

	const baseOpacity = clamp01(settings.spectrumEchoTraceOpacity ?? 0.45);
	const decay = clamp01(settings.spectrumEchoTraceDecay ?? 0.72);
	const offsetPx = Math.max(0, settings.spectrumEchoTraceOffset ?? 6);

	for (let slot = 0; slot < buffers.length; slot++) {
		const age = slot + 1;
		if (age > (runtime.echoTraceFrameCount ?? 0)) continue;
		const alpha = baseOpacity * Math.pow(decay, age - 1);
		if (alpha <= 0.01) continue;
		traceHeights(buffers[slot], alpha, offsetPx * age);
	}
}
