import type { SpectrumGradientFlowDirection } from '@/types/wallpaper';
import type { SpectrumSettings } from '../runtime/spectrumRuntime';

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

let gradientFlowPhase = 0;

/** Test hook — resets animated phase between unit tests. */
export function resetGradientFlowPhaseForTests(): void {
	gradientFlowPhase = 0;
}

/**
 * Animated phase offset (0..1) for gradient-driven spectrum fills/strokes.
 * Returns 0 when disabled — callers keep the legacy gradient path.
 */
export function resolveGradientFlowPhase(
	settings: SpectrumSettings,
	audioEnergy: number,
	dt: number
): number {
	if (!settings.spectrumGradientFlow) return 0;
	const speed = clamp01(settings.spectrumGradientFlowSpeed ?? 0.5);
	const direction =
		settings.spectrumGradientFlowDirection === 'reverse' ? -1 : 1;
	const baseRate = 0.04 + speed * 0.22;
	let delta = baseRate * dt * direction;
	if (settings.spectrumGradientFlowAudio) {
		delta += clamp01(audioEnergy) * speed * 0.35 * dt * direction;
	}
	gradientFlowPhase = (gradientFlowPhase + delta + 1) % 1;
	return gradientFlowPhase;
}

export function wrapGradientPhase(phase: number): number {
	return ((phase % 1) + 1) % 1;
}

export function directionSign(
	direction: SpectrumGradientFlowDirection | undefined
): 1 | -1 {
	return direction === 'reverse' ? -1 : 1;
}
