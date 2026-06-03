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

export const CAMERA_FX_TARGET_LABELS: Record<CameraMotionTarget, string> = {
	'global-background': 'Global BG',
	background: 'Background',
	'selected-overlay': 'Overlays',
	logo: 'Logo',
	spectrum: 'Spectrum',
	particles: 'Particles',
	rain: 'Rain',
	'track-title': 'Track Title',
	lyrics: 'Lyrics',
	'stage-lights': 'Stage Lights',
	'flash-light': 'Flash Light'
};

export function resolveAvailableCameraFxTargets(
	hasOverlay: boolean
): CameraMotionTarget[] {
	return hasOverlay
		? CAMERA_FX_TARGETS
		: CAMERA_FX_TARGETS.filter(target => target !== 'selected-overlay');
}
