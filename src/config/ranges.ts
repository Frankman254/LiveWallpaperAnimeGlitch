/**
 * SINGLE SOURCE OF TRUTH for all slider ranges.
 *
 * UI tabs must import from here instead of hardcoding min/max/step.
 * Changing a range here updates every control that uses it.
 */

export interface SliderRange {
  min: number
  max: number
  step: number
}

// ─── Logo ────────────────────────────────────────────────────────────────────
export const LOGO_RANGES = {
  baseSize:              { min: 20,   max: 400,  step: 5    },
  positionX:             { min: -0.9, max: 0.9,  step: 0.01 },
  positionY:             { min: -0.9, max: 0.9,  step: 0.01 },
  audioSensitivity:      { min: 0,    max: 10,   step: 0.1  },
  reactiveScaleIntensity:{ min: 0.01, max: 1.5,  step: 0.01 },
  reactivitySpeed:       { min: 0.1,  max: 1.5,  step: 0.05 },
  minScale:              { min: 0.5,  max: 2,    step: 0.05 },
  maxScale:              { min: 1,    max: 4,    step: 0.05 },
  punch:                 { min: 0,    max: 1.5,  step: 0.05 },
  attack:                { min: 0.05, max: 1.5,  step: 0.05 },
  release:               { min: 0.01, max: 0.7,  step: 0.01 },
  peakWindow:            { min: 0.5,  max: 5,    step: 0.1  },
  peakFloor:             { min: 0,    max: 0.45, step: 0.01 },
  glowBlur:              { min: 0,    max: 80,   step: 2    },
  shadowBlur:            { min: 0,    max: 100,  step: 5    },
  backdropOpacity:       { min: 0,    max: 1,    step: 0.05 },
  backdropPadding:       { min: 0,    max: 80,   step: 2    },
} satisfies Record<string, SliderRange>

// ─── Spectrum ─────────────────────────────────────────────────────────────────
export const SPECTRUM_RANGES = {
  radius:         { min: 40,   max: 400,  step: 5    },
  innerRadius:    { min: 0,    max: 300,  step: 5    },
  barCount:       { min: 8,    max: 256,  step: 4    },
  barWidth:       { min: 0.5,  max: 8,    step: 0.25 },
  minHeight:      { min: 0,    max: 30,   step: 1    },
  maxHeight:      { min: 20,   max: 400,  step: 5    },
  smoothing:      { min: 0,    max: 0.98, step: 0.01 },
  opacity:        { min: 0,    max: 1,    step: 0.05 },
  glowIntensity:  { min: 0,    max: 3,    step: 0.05 },
  shadowBlur:     { min: 0,    max: 60,   step: 2    },
  rotationSpeed:  { min: 0,    max: 2,    step: 0.05 },
  peakDecay:      { min: 0,    max: 0.02, step: 0.001},
  positionX:      { min: -0.9, max: 0.9,  step: 0.01 },
  positionY:      { min: -0.9, max: 0.9,  step: 0.01 },
  span:           { min: 0.1,  max: 2,    step: 0.05 },
  cloneOpacity:   { min: 0,    max: 1,    step: 0.05 },
  cloneScale:     { min: 0.1,  max: 2,    step: 0.05 },
  cloneGap:       { min: 0,    max: 60,   step: 2    },
  cloneGlowIntensity: { min: 0, max: 3,   step: 0.05 },
  cloneBarCount:  { min: 8,    max: 256,  step: 4    },
} satisfies Record<string, SliderRange>

// ─── Glitch / FX ─────────────────────────────────────────────────────────────
export const GLITCH_RANGES = {
  intensity:          { min: 0,     max: 1,    step: 0.01  },
  barWidth:           { min: 2,     max: 40,   step: 1     },
  frequency:          { min: 0,     max: 1,    step: 0.01  },
  noiseIntensity:     { min: 0,     max: 0.5,  step: 0.005 },
  audioSensitivity:   { min: 0,     max: 1,    step: 0.01  },
  rgbShift:           { min: 0,     max: 0.03, step: 0.001 },
  rgbAudioSensitivity:{ min: 0,     max: 0.05, step: 0.001 },
} satisfies Record<string, SliderRange>

export const SCANLINE_RANGES = {
  intensity:  { min: 0,   max: 1,    step: 0.01 },
  spacing:    { min: 200, max: 2000, step: 50   },
  thickness:  { min: 0.5, max: 4,    step: 0.1  },
} satisfies Record<string, SliderRange>

// ─── Background / Image ───────────────────────────────────────────────────────
export const IMAGE_RANGES = {
  scale:          { min: 0.5, max: 3,   step: 0.05 },
  positionX:      { min: -1,  max: 1,   step: 0.01 },
  positionY:      { min: -1,  max: 1,   step: 0.01 },
  bassIntensity:  { min: 0,   max: 1,   step: 0.05 },
  parallax:       { min: 0,   max: 0.2, step: 0.005},
} satisfies Record<string, SliderRange>

export const FILTER_RANGES = {
  brightness:  { min: 0,   max: 3,   step: 0.05 },
  contrast:    { min: 0,   max: 3,   step: 0.05 },
  saturation:  { min: 0,   max: 3,   step: 0.05 },
  blur:        { min: 0,   max: 20,  step: 0.5  },
  hueRotate:   { min: 0,   max: 360, step: 5    },
} satisfies Record<string, SliderRange>

// ─── Particles ────────────────────────────────────────────────────────────────
export const PARTICLE_RANGES = {
  count:         { min: 5,   max: 300, step: 5   },
  speed:         { min: 0.1, max: 3,   step: 0.1 },
  sizeMin:       { min: 1,   max: 20,  step: 1   },
  sizeMax:       { min: 2,   max: 40,  step: 1   },
  opacity:       { min: 0,   max: 1,   step: 0.05},
  glowStrength:  { min: 0,   max: 2,   step: 0.1 },
  audioSizeBoost:    { min: 0, max: 5, step: 0.1 },
  audioOpacityBoost: { min: 0, max: 1, step: 0.05},
  scanlineIntensity: { min: 0, max: 1, step: 0.05},
  scanlineSpacing:   { min: 200, max: 2000, step: 50 },
  scanlineThickness: { min: 0.5, max: 4, step: 0.1  },
  rotationIntensity: { min: 0, max: 1, step: 0.05 },
} satisfies Record<string, SliderRange>

// ─── Rain ─────────────────────────────────────────────────────────────────────
export const RAIN_RANGES = {
  intensity:  { min: 0,    max: 1,     step: 0.05  },
  dropCount:  { min: 5,    max: 500,   step: 5     },
  angle:      { min: -45,  max: 45,    step: 1     },
  meshRotationZ: { min: -180, max: 180, step: 1    },
  length:     { min: 0.01, max: 0.5,   step: 0.01  },
  width:      { min: 0.0005, max: 0.01, step: 0.0005},
  blur:       { min: 0,    max: 0.02,  step: 0.001 },
  speed:      { min: 0.1,  max: 3,     step: 0.1   },
  variation:  { min: 0,    max: 1,     step: 0.05  },
} satisfies Record<string, SliderRange>

// ─── Slideshow ────────────────────────────────────────────────────────────────
export const SLIDESHOW_RANGES = {
  intervalSeconds:  { min: 1,   max: 600, step: 1   },
  transitionDuration: { min: 0.2, max: 4, step: 0.1 },
  transitionIntensity: { min: 0, max: 2,  step: 0.05},
  transitionAudioDrive: { min: 0, max: 1, step: 0.05},
} satisfies Record<string, SliderRange>

// ─── Track Title ──────────────────────────────────────────────────────────────
export const TRACK_TITLE_RANGES = {
  fontSize:        { min: 10,   max: 80,  step: 1    },
  letterSpacing:   { min: -5,   max: 20,  step: 0.5  },
  width:           { min: 0.1,  max: 1,   step: 0.01 },
  opacity:         { min: 0,    max: 1,   step: 0.05 },
  scrollSpeed:     { min: 0,    max: 200, step: 5    },
  rgbShift:        { min: 0,    max: 0.02,step: 0.001},
  glitchIntensity: { min: 0,    max: 1,   step: 0.01 },
  glitchBarWidth:  { min: 1,    max: 20,  step: 1    },
  glowBlur:        { min: 0,    max: 60,  step: 2    },
  backdropOpacity: { min: 0,    max: 1,   step: 0.05 },
  backdropPadding: { min: 0,    max: 40,  step: 2    },
  positionX:       { min: -0.9, max: 0.9, step: 0.01 },
  positionY:       { min: -0.9, max: 0.9, step: 0.01 },
} satisfies Record<string, SliderRange>
