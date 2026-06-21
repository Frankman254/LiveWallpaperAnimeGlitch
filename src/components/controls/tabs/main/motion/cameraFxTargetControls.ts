import type { Translations } from '@/lib/i18n';
import type { CameraMotionTarget } from '@/features/stageFx/stageFxConfig';

export const CAMERA_FX_TARGETS: CameraMotionTarget[] = [
	'global-background',
	'background',
	'selected-overlay',
	'logo',
	'spectrum',
	'particles',
	'rain',
	'track-title',
	'lyrics',
	'stage-lights',
	'flash-light'
];

/** Translated label for each affected-layer target. Pass the active `useT()`. */
export function getCameraFxTargetLabels(
	t: Translations
): Record<CameraMotionTarget, string> {
	return {
		'global-background': t.sfx_target_global_bg,
		background: t.sfx_target_background,
		'selected-overlay': t.sfx_target_overlays,
		logo: t.sfx_target_logo,
		spectrum: t.sfx_target_spectrum,
		particles: t.sfx_target_particles,
		rain: t.sfx_target_rain,
		'track-title': t.sfx_target_track_title,
		lyrics: t.sfx_target_lyrics,
		'stage-lights': t.sfx_target_stage_lights,
		'flash-light': t.sfx_target_flash_light
	};
}

export function resolveAvailableCameraFxTargets(
	hasOverlay: boolean
): CameraMotionTarget[] {
	return hasOverlay
		? CAMERA_FX_TARGETS
		: CAMERA_FX_TARGETS.filter(target => target !== 'selected-overlay');
}
