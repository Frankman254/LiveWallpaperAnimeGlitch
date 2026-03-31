import type { ImageFitMode, SlideshowTransitionType } from '@/types/wallpaper'

export const FIT_MODES: ImageFitMode[] = ['cover', 'contain', 'stretch', 'fit-width', 'fit-height']

export const TRANSITION_TYPES: SlideshowTransitionType[] = [
  'fade',
  'slide-left',
  'slide-right',
  'zoom-in',
  'blur-dissolve',
  'bars-horizontal',
  'bars-vertical',
  'rgb-shift',
  'distortion',
]

export const TRANSITION_LABELS: Record<SlideshowTransitionType, string> = {
  fade: 'Fade',
  'slide-left': '← Slide',
  'slide-right': 'Slide →',
  'zoom-in': 'Zoom',
  'blur-dissolve': 'Dissolve',
  'bars-horizontal': 'Bars H',
  'bars-vertical': 'Bars V',
  'rgb-shift': 'RGB Split',
  distortion: 'Distort',
}

export const VISIBLE_BACKGROUND_THUMBNAILS = 10
