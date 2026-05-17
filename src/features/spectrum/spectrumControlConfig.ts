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

export const SPECTRUM_FAMILIES: SpectrumFamily[] = [
	'classic',
	'oscilloscope',
	'tunnel',
	'liquid',
	'orbital',
	'spiral'
];

/**
 * Circular logo clone: families with a stable radial layout (the clone
 * always sits around the logo). Spectrogram is intentionally excluded —
 * its waterfall doesn't map to a ring without re-projecting the strip.
 * Spiral is clone-friendly: the inner-radius offset keeps the main + clone
 * concentric around the logo.
 */
export const SPECTRUM_CLONE_FAMILIES: SpectrumFamily[] = [
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
	spectrogram: 'Gram',
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
export const SPECTRUM_RADIAL_SHAPES: SpectrumRadialShape[] = [
	'circle',
	'square',
	'triangle',
	'star',
	'diamond',
	'hexagon',
	'octagon'
];
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

export const SPECTRUM_RADIAL_SHAPE_LABELS: Record<SpectrumRadialShape, string> =
	{
		circle: 'Circle',
		square: 'Square',
		triangle: 'Triangle',
		star: 'Star',
		diamond: 'Diamond',
		hexagon: 'Hexagon',
		octagon: 'Octagon'
	};

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
 * `spectrogram` ships hidden — the renderer + registry entry stay so
 * persisted state doesn't crash, but the waterfall preview was visually
 * intrusive so we fall back to `classic` for anyone who had it selected.
 */
export function normalizeSpectrumFamily(family: SpectrumFamily): SpectrumFamily {
	if (family === 'spectrogram') return 'classic';
	return family;
}
