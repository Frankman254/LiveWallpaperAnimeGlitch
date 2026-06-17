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
	for (let i = 0; i < needed; i++) {
		if (buffers[i].length !== barCount) {
			buffers[i] = new Float32Array(barCount);
		}
	}
	runtime.echoTraceBuffers = buffers.slice(0, needed);
	return runtime.echoTraceBuffers;
}

/** Shift history and store the current frame. No-op when echo trace is off. */
export function updateEchoTraceHistory(
	runtime: SpectrumRuntimeState,
	settings: SpectrumSettings,
	heights: Float32Array,
	barCount: number
): void {
	if (!settings.spectrumEchoTrace) {
		runtime.echoTraceBuffers = undefined;
		return;
	}
	const echoCount = settings.spectrumEchoTraceCount === 2 ? 2 : 1;
	const buffers = ensureEchoBuffers(runtime, barCount, echoCount);
	for (let slot = buffers.length - 1; slot > 0; slot--) {
		buffers[slot].set(buffers[slot - 1]);
	}
	buffers[0].set(heights.subarray(0, barCount));
}

export type EchoTraceDrawContext = {
	ctx: CanvasRenderingContext2D;
	settings: SpectrumSettings;
	barCount: number;
	traceHeights: (heights: Float32Array, alpha: number, offset: number) => void;
};

/** Draw 1–2 decaying previous traces. No-op when disabled or history empty. */
export function drawEchoTracePasses(
	runtime: SpectrumRuntimeState,
	drawCtx: EchoTraceDrawContext
): void {
	const { settings, traceHeights } = drawCtx;
	if (!settings.spectrumEchoTrace) return;
	const buffers = runtime.echoTraceBuffers;
	if (!buffers || buffers.length === 0) return;

	const baseOpacity = clamp01(settings.spectrumEchoTraceOpacity ?? 0.35);
	const decay = clamp01(settings.spectrumEchoTraceDecay ?? 0.72);
	const offsetPx = Math.max(0, settings.spectrumEchoTraceOffset ?? 4);

	for (let slot = 0; slot < buffers.length; slot++) {
		const age = slot + 1;
		const alpha = baseOpacity * Math.pow(decay, age - 1);
		if (alpha <= 0.01) continue;
		traceHeights(buffers[slot], alpha, offsetPx * age);
	}
}
