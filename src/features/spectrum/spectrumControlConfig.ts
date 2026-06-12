import type {
	SpectrumBandMode,
	SpectrumColorMode,
	SpectrumFamily,
	SpectrumLinearDirection,
	SpectrumLinearOrientation,
	SpectrumMode,
	SpectrumRadialShape,
	SpectrumShape
} from '@/types/wallpaper';
import {
	RADIAL_SHAPE_IDS,
	RADIAL_SHAPE_LABELS
} from '@/features/spectrum/geometry/radialGeometry';

export const SPECTRUM_FAMILIES: SpectrumFamily[] = [
	'classic',
	'oscilloscope',
	'tunnel',
	'liquid',
	'orbital',
	'spiral'
];

export const SPECTRUM_FAMILY_LABELS: Record<SpectrumFamily, string> = {
	classic: 'Classic',
	oscilloscope: 'Scope',
	tunnel: 'Tunnel',
	liquid: 'Liquid',
	orbital: 'Orbital',
	spiral: 'Spiral'
};

export const SPECTRUM_MODES: SpectrumMode[] = ['radial', 'linear'];
export const SPECTRUM_LINEAR_ORIENTATIONS: SpectrumLinearOrientation[] = [
	'horizontal',
	'vertical'
];
export const SPECTRUM_LINEAR_DIRECTIONS: SpectrumLinearDirection[] = [
	'normal',
	'flipped'
];
/** Derived from the radial shape registry — single source of truth lives
 *  in `radialGeometry.ts`. Cast to mutable array for back-compat with code
 *  that historically declared it as a non-readonly array. */
export const SPECTRUM_RADIAL_SHAPES: SpectrumRadialShape[] = [...RADIAL_SHAPE_IDS];
export const SPECTRUM_RADIAL_STYLES: SpectrumShape[] = [
	'bars',
	'blocks',
	'wave',
	'dots'
];
export const SPECTRUM_LINEAR_STYLES: SpectrumShape[] = [
	'bars',
	'blocks',
	'wave',
	'dots'
];
export const SPECTRUM_STYLES: SpectrumShape[] = SPECTRUM_LINEAR_STYLES;
export const SPECTRUM_COLOR_MODES: SpectrumColorMode[] = [
	'solid',
	'gradient',
	'rainbow',
	'visible-rotate'
];
export const SPECTRUM_BAND_MODES: SpectrumBandMode[] = [
	'auto',
	'kick',
	'instrumental',
	'bass',
	'hihat',
	'vocal',
	'full'
];

export const SPECTRUM_MODE_LABELS: Record<SpectrumMode, string> = {
	radial: 'Radial',
	linear: 'Linear'
};

export const SPECTRUM_LINEAR_ORIENTATION_LABELS: Record<
	SpectrumLinearOrientation,
	string
> = {
	horizontal: 'Horizontal',
	vertical: 'Vertical'
};

export const SPECTRUM_LINEAR_DIRECTION_LABELS: Record<
	SpectrumLinearDirection,
	string
> = {
	normal: 'Normal',
	flipped: 'Flipped'
};

/** Derived from the radial shape registry. */
export const SPECTRUM_RADIAL_SHAPE_LABELS: Record<SpectrumRadialShape, string> =
	RADIAL_SHAPE_LABELS;

export const SPECTRUM_BAND_LABELS: Partial<Record<SpectrumBandMode, string>> = {
	auto: 'Auto',
	kick: 'Kick',
	instrumental: 'Instrumental',
	full: 'Full',
	bass: 'Bass',
	hihat: 'HiHat',
	vocal: 'Vocal'
};

export function normalizeSpectrumShape(shape: SpectrumShape): SpectrumShape {
	return shape === 'lines' || shape === 'capsules' ? 'blocks' : shape;
}

/**
 * Coerce a persisted family id into one the picker currently exposes.
 * Anyone with a legacy `spectrogram` value in their store falls back to
 * `classic`; the family was retired entirely (renderer + capability entry
 * removed) because its waterfall preview did not fit the editor.
 */
export function normalizeSpectrumFamily(family: SpectrumFamily): SpectrumFamily {
	if ((family as string) === 'spectrogram') return 'classic';
	return family;
}
