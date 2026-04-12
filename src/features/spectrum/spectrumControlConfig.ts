import type {
	SpectrumBandMode,
	SpectrumColorMode,
	SpectrumLinearDirection,
	SpectrumLinearOrientation,
	SpectrumMode,
	SpectrumRadialShape,
	SpectrumShape
} from '@/types/wallpaper';

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
	'dots',
	'capsules',
	'spikes'
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
	return shape === 'lines' ? 'blocks' : shape;
}
