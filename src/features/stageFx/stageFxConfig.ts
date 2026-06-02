import type { AudioSnapshot } from '@/lib/audio/audioChannels';
import type { PerformanceMode } from '@/types/wallpaper';

// ── Shared option types ───────────────────────────────────────────────────────

/** Audio channel selector shared by Stage Lights and Camera FX. */
export type FxAudioChannel = 'kick' | 'bass' | 'full';

export type SpectrumRotationDrive = 'off' | 'fixed' | 'audio' | 'fixed-audio';
/** `selected` reuses the spectrum's own `spectrumBandMode`. */
export type SpectrumRotationChannel = 'kick' | 'bass' | 'full' | 'selected';
export type RotationDirection = 'cw' | 'ccw';

export type StageLightsColorSource = 'manual' | 'theme' | 'image';
export type StageLightsBlendMode = 'lighter' | 'screen' | 'source-over';
export type StageLightsOrigin =
	| 'top'
	| 'bottom'
	| 'left'
	| 'right'
	| 'top-bottom'
	| 'sides'
	| 'all';
export type StageLightsMovementMode =
	| 'top-down'
	| 'bottom-up'
	| 'left-right'
	| 'right-left'
	| 'cross-sweep'
	| 'radial-sweep'
	| 'circular-sweep';
export type FlashLightShape =
	| 'full-screen'
	| 'circular-burst'
	| 'horizontal-blast'
	| 'vertical-blast'
	| 'center-bloom'
	| 'edge-flash'
	| 'vignette-invert';

export type CameraMotionMode =
	| 'none'
	| 'drift'
	| 'circle'
	| 'semicircle'
	| 'figure-eight'
	| 'orbit'
	| 'pendulum';
export type CameraMotionDirection = 'cw' | 'ccw';
export type ScreenShakeMode =
	| 'horizontal'
	| 'vertical'
	| 'free'
	| 'punch'
	| 'jitter'
	| 'kick-snap';

// ── Performance / safety caps (Task 5) ─────────────────────────────────────────
// Hard ceilings applied regardless of slider input so these effects can never
// whiteout the screen, run unbounded blur, or tank the frame budget.

export const STAGE_FX_CAPS = {
	maxBeamCount: 12,
	/** Canvas2D shadow/filter blur ceiling — the single most expensive op. */
	maxBeamBlurPx: 48,
	maxOpacity: 0.85,
	/** Independent Flash Light overlay opacity ceiling. */
	maxFlashOpacity: 0.62,
	maxFlashBlurPx: 42
} as const;

export const CAMERA_FX_CAPS = {
	maxShakePx: 36,
	maxMotionPx: 70,
	/** Slight base zoom hides edges revealed by shake/motion translation. */
	maxScale: 1.08
} as const;

/**
 * Scale Stage Lights down on weaker GPUs: fewer beams + less blur on `low`,
 * a mild trim on `medium`, untouched on `high`. Returns already-capped values.
 */
export function resolveStageLightsBudget(
	performanceMode: PerformanceMode,
	minBeamCount: number,
	maxBeamCount: number,
	blurPx: number
): { minBeamCount: number; maxBeamCount: number; blurPx: number } {
	const cappedMin = Math.max(
		1,
		Math.min(STAGE_FX_CAPS.maxBeamCount, Math.round(minBeamCount))
	);
	const cappedMax = Math.max(
		cappedMin,
		1,
		Math.min(STAGE_FX_CAPS.maxBeamCount, Math.round(maxBeamCount))
	);
	const cappedBlur = Math.max(0, Math.min(STAGE_FX_CAPS.maxBeamBlurPx, blurPx));
	if (performanceMode === 'low') {
		return {
			minBeamCount: Math.min(cappedMin, 4),
			maxBeamCount: Math.min(cappedMax, 4),
			blurPx: cappedBlur * 0.4
		};
	}
	if (performanceMode === 'medium') {
		return {
			minBeamCount: Math.min(cappedMin, 8),
			maxBeamCount: Math.min(cappedMax, 8),
			blurPx: cappedBlur * 0.75
		};
	}
	return {
		minBeamCount: cappedMin,
		maxBeamCount: cappedMax,
		blurPx: cappedBlur
	};
}

/**
 * Read the level for an FX audio channel from a snapshot. Returns 0 when audio
 * is silent/paused (the snapshot already reports zeros in those states), so an
 * `audio`-driven effect naturally idles to rest.
 */
export function readFxChannel(
	snapshot: AudioSnapshot,
	channel: FxAudioChannel
): number {
	if (channel === 'full') return snapshot.amplitude;
	const value = snapshot.channels[channel];
	return Number.isFinite(value) ? value : 0;
}

export function rotationDirectionSign(direction: RotationDirection): 1 | -1 {
	return direction === 'ccw' ? -1 : 1;
}
