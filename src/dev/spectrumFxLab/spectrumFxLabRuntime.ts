import type { SpectrumRuntimeState } from '@/features/spectrum/runtime/spectrumRuntime';
import { createSpectrumRuntimeState } from '@/features/spectrum/runtime/spectrumRuntime';

/** Clears stateful accent history so OFF/ON canvases stay independent. */
export function resetSpectrumFxLabRuntime(runtime: SpectrumRuntimeState): void {
	runtime.echoTraceBuffers = undefined;
	runtime.echoTraceFrameCount = 0;
	runtime.oscilloscopePhosphorCanvas = null;
	runtime.oscilloscopeSmoothedSamples = undefined;
	runtime.oscilloscopeDisplaySamples = undefined;
}

export function createFreshLabRuntime(): SpectrumRuntimeState {
	return createSpectrumRuntimeState();
}
