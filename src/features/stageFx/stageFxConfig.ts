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

export type CameraMotionMode =
	| 'none'
	| 'drift'
	| 'circle'
	| 'semicircle'
	| 'figure-eight';

// ── Performance / safety caps (Task 5) ─────────────────────────────────────────
// Hard ceilings applied regardless of slider input so these effects can never
// whiteout the screen, run unbounded blur, or tank the frame budget.

export const STAGE_FX_CAPS = {
	maxBeamCount: 12,
	/** Canvas2D shadow/filter blur ceiling — the single most expensive op. */
	maxBeamBlurPx: 48,
	maxOpacity: 0.85,
	/** Max additive flash a peak can add — keeps kicks from whiting out. */
	maxFlash: 0.45
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
	beamCount: number,
	blurPx: number
): { beamCount: number; blurPx: number } {
	const cappedCount = Math.max(
		1,
		Math.min(STAGE_FX_CAPS.maxBeamCount, Math.round(beamCount))
	);
	const cappedBlur = Math.max(0, Math.min(STAGE_FX_CAPS.maxBeamBlurPx, blurPx));
	if (performanceMode === 'low') {
		return {
			beamCount: Math.min(cappedCount, 4),
			blurPx: cappedBlur * 0.4
		};
	}
	if (performanceMode === 'medium') {
		return {
			beamCount: Math.min(cappedCount, 8),
			blurPx: cappedBlur * 0.75
		};
	}
	return { beamCount: cappedCount, blurPx: cappedBlur };
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
