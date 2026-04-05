import type { WallpaperState } from '@/types/wallpaper';

export type ImageBassZoomPresetId = 'classic' | 'smooth' | 'punchy';

/** Envelope fields shared with logo-style `createAudioEnvelope` (BG uses min=0 max=sensitivity). */
export type ImageBassZoomEnvelopeSlice = Pick<
	WallpaperState,
	| 'imageBassAttack'
	| 'imageBassRelease'
	| 'imageBassReactivitySpeed'
	| 'imageBassPeakWindow'
	| 'imageBassPeakFloor'
	| 'imageBassPunch'
	| 'imageBassReactiveScaleIntensity'
>;

/** Matches former hardcoded `ImageLayerCanvas` behavior (decay 0.62 → release ≈ 0.096, responseSpeed 2.65). */
export const IMAGE_BASS_ZOOM_CLASSIC: ImageBassZoomEnvelopeSlice = {
	imageBassAttack: 1.3,
	imageBassRelease: 0.02 + (1 - 0.62) * 0.2,
	imageBassReactivitySpeed: 2.65 / 2.4,
	imageBassPeakWindow: 1.05,
	imageBassPeakFloor: 0.015,
	imageBassPunch: 0.22,
	imageBassReactiveScaleIntensity: 1.2
};

/** Softer dynamics: wider peak memory, higher floor, gentler intensity (closer to “subtle” logo idea). */
export const IMAGE_BASS_ZOOM_SMOOTH: ImageBassZoomEnvelopeSlice = {
	imageBassAttack: 0.72,
	imageBassRelease: 0.1,
	imageBassReactivitySpeed: 0.55,
	imageBassPeakWindow: 2.5,
	imageBassPeakFloor: 0.14,
	imageBassPunch: 0.18,
	imageBassReactiveScaleIntensity: 0.78
};

/** Snappier transients, shorter peak window, more punch. */
export const IMAGE_BASS_ZOOM_PUNCHY: ImageBassZoomEnvelopeSlice = {
	imageBassAttack: 1.15,
	imageBassRelease: 0.055,
	imageBassReactivitySpeed: 0.92,
	imageBassPeakWindow: 0.85,
	imageBassPeakFloor: 0.025,
	imageBassPunch: 0.52,
	imageBassReactiveScaleIntensity: 1.35
};

export const IMAGE_BASS_ZOOM_PRESETS: Record<
	ImageBassZoomPresetId,
	ImageBassZoomEnvelopeSlice
> = {
	classic: IMAGE_BASS_ZOOM_CLASSIC,
	smooth: IMAGE_BASS_ZOOM_SMOOTH,
	punchy: IMAGE_BASS_ZOOM_PUNCHY
};

export function releaseToLegacyDecay(release: number): number {
	const decay = 1 - (release - 0.02) / 0.2;
	if (!Number.isFinite(decay)) return 0.62;
	return Math.min(0.95, Math.max(0.05, decay));
}
