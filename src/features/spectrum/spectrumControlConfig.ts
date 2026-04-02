import type {
  SpectrumBandMode,
  SpectrumColorMode,
  SpectrumLinearDirection,
  SpectrumLinearOrientation,
  SpectrumMode,
  SpectrumRadialShape,
  SpectrumShape,
} from '@/types/wallpaper'

export const SPECTRUM_MODES: SpectrumMode[] = ['radial', 'linear']
export const SPECTRUM_LINEAR_ORIENTATIONS: SpectrumLinearOrientation[] = ['horizontal', 'vertical']
export const SPECTRUM_LINEAR_DIRECTIONS: SpectrumLinearDirection[] = ['normal', 'flipped']
export const SPECTRUM_RADIAL_SHAPES: SpectrumRadialShape[] = ['circle', 'square', 'triangle', 'star']
export const SPECTRUM_STYLES: SpectrumShape[] = ['bars', 'lines', 'wave', 'dots']
export const SPECTRUM_COLOR_MODES: SpectrumColorMode[] = ['solid', 'gradient', 'rainbow']
export const SPECTRUM_BAND_MODES: SpectrumBandMode[] = ['auto', 'kick', 'instrumental', 'bass', 'hihat', 'vocal', 'full']

export const SPECTRUM_MODE_LABELS: Record<SpectrumMode, string> = {
  radial: 'Radial',
  linear: 'Linear',
}

export const SPECTRUM_LINEAR_ORIENTATION_LABELS: Record<SpectrumLinearOrientation, string> = {
  horizontal: 'Horizontal',
  vertical: 'Vertical',
}

export const SPECTRUM_LINEAR_DIRECTION_LABELS: Record<SpectrumLinearDirection, string> = {
  normal: 'Normal',
  flipped: 'Flipped',
}

export const SPECTRUM_RADIAL_SHAPE_LABELS: Record<SpectrumRadialShape, string> = {
  circle: 'Circle',
  square: 'Square',
  triangle: 'Triangle',
  star: 'Star',
}

export const SPECTRUM_BAND_LABELS: Partial<Record<SpectrumBandMode, string>> = {
  auto: 'Auto',
  kick: 'Kick',
  instrumental: 'Instrumental',
  full: 'Full',
  bass: 'Bass',
  hihat: 'HiHat',
  vocal: 'Vocal',
}
