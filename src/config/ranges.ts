/**
 * SINGLE SOURCE OF TRUTH for all slider ranges.
 *
 * Values are the exact ranges the UI uses — derived from auditing every tab.
 * Tabs import and spread these instead of hardcoding inline min/max/step.
 *
 * Rule: if a tab slider's range needs to change, change it here ONLY.
 */

export interface SliderRange {
  min: number
  max: number
  step: number
}

// ─── FX / image response ────────────────────────────────────────────────────
export const IMAGE_EFFECT_RANGES = {
  noiseIntensity:      { min: 0,    max: 0.8,  step: 0.01  },
  rgbShift:            { min: 0,    max: 0.03, step: 0.001 },
  rgbAudioSensitivity: { min: 0,    max: 0.03, step: 0.001 },
} satisfies Record<string, SliderRange>

export const SCANLINE_RANGES = {
  intensity:  { min: 0,   max: 1,    step: 0.01 },
  spacing:    { min: 200, max: 1600, step: 25   },
  thickness:  { min: 0.5, max: 6,    step: 0.1  },
} satisfies Record<string, SliderRange>

// ─── Filters (background / overlay) ──────────────────────────────────────────
export const FILTER_RANGES = {
  brightness:  { min: 0.4,  max: 2,   step: 0.01 },
  contrast:    { min: 0.4,  max: 2.5, step: 0.01 },
  saturation:  { min: 0,    max: 3,   step: 0.01 },
  blur:        { min: 0,    max: 12,  step: 0.1  },
  hueRotate:   { min: -180, max: 180, step: 1    },
} satisfies Record<string, SliderRange>

// Particle canvas uses slightly wider ranges than the main filter tab
export const PARTICLE_FILTER_RANGES = {
  brightness:  { min: 0.2, max: 2,   step: 0.05 },
  contrast:    { min: 0.2, max: 2,   step: 0.05 },
  saturation:  { min: 0,   max: 3,   step: 0.05 },
  blur:        { min: 0,   max: 12,  step: 0.25 },
  hueRotate:   { min: 0,   max: 360, step: 1    },
} satisfies Record<string, SliderRange>

// Global background image has a wider blur range
export const GLOBAL_FILTER_RANGES = {
  brightness:  { min: 0.2, max: 2,   step: 0.05 },
  contrast:    { min: 0.2, max: 2,   step: 0.05 },
  saturation:  { min: 0,   max: 3,   step: 0.05 },
  blur:        { min: 0,   max: 20,  step: 0.25 },
  hueRotate:   { min: 0,   max: 360, step: 1    },
} satisfies Record<string, SliderRange>

// ─── Image (background image transform) ───────────────────────────────────────
export const IMAGE_RANGES = {
  scale:         { min: 0.1, max: 4,   step: 0.05  },
  positionX:     { min: -1,  max: 1,   step: 0.02  },
  positionY:     { min: -1,  max: 1,   step: 0.02  },
  rotation:      { min: -180, max: 180, step: 1    },
  bassIntensity: { min: 0,   max: 1,   step: 0.05  },
  opacity:       { min: 0,   max: 1,   step: 0.05  },
} satisfies Record<string, SliderRange>

// ─── Slideshow / transition ────────────────────────────────────────────────────
export const SLIDESHOW_RANGES = {
  intervalSeconds:      { min: 5,   max: 300, step: 5    },
  intervalMinutes:      { min: 1,   max: 60,  step: 1    },
  transitionDuration:   { min: 0.2, max: 4,   step: 0.1  },
  transitionIntensity:  { min: 0.4, max: 2.5, step: 0.05 },
  transitionAudioDrive: { min: 0,   max: 1.5, step: 0.05 },
} satisfies Record<string, SliderRange>

// ─── FX tab ───────────────────────────────────────────────────────────────────
export const FX_RANGES = {
  parallax:         { min: 0, max: 0.1, step: 0.005 },
  audioSensitivity: { min: 0, max: 5,   step: 0.1   },
} satisfies Record<string, SliderRange>

// ─── Spectrum ─────────────────────────────────────────────────────────────────
export const SPECTRUM_RANGES = {
  barCount:           { min: 16,    max: 256,  step: 8    },
  barWidth:           { min: 1,     max: 16,   step: 0.5  },
  minHeight:          { min: 1,     max: 20,   step: 1    },
  maxHeight:          { min: 20,    max: 500,  step: 5    },
  innerRadius:        { min: 20,    max: 300,  step: 5    },
  radialAngle:        { min: -180,  max: 180,  step: 1    },
  rotationSpeed:      { min: -3,    max: 3,    step: 0.05 },
  smoothing:          { min: 0,     max: 0.99, step: 0.01 },
  opacity:            { min: 0,     max: 1,    step: 0.05 },
  glowIntensity:      { min: 0,     max: 3,    step: 0.1  },
  shadowBlur:         { min: 0,     max: 60,   step: 2    },
  peakDecay:          { min: 0.001, max: 0.02, step: 0.001 },
  positionX:          { min: -1,    max: 1,    step: 0.05 },
  positionY:          { min: -1,    max: 1,    step: 0.05 },
  logoGap:            { min: 0,     max: 72,   step: 1    },
  span:               { min: 0.2,   max: 1,    step: 0.02 },
  cloneOpacity:       { min: 0,     max: 1,    step: 0.05 },
  cloneScale:         { min: 0.4,   max: 2,    step: 0.05 },
  cloneGap:           { min: 0,     max: 48,   step: 1    },
  cloneRadialAngle:   { min: -180,  max: 180,  step: 1    },
  cloneBarCount:      { min: 16,    max: 256,  step: 8    },
  cloneBarWidth:      { min: 1,     max: 16,   step: 0.5  },
} satisfies Record<string, SliderRange>

// ─── Logo ─────────────────────────────────────────────────────────────────────
export const LOGO_RANGES = {
  baseSize:               { min: 20,   max: 400,  step: 5    },
  positionX:              { min: -0.9, max: 0.9,  step: 0.01 },
  positionY:              { min: -0.9, max: 0.9,  step: 0.01 },
  audioSensitivity:       { min: 0,    max: 10,   step: 0.1  },
  reactiveScaleIntensity: { min: 0.01, max: 1.5,  step: 0.01 },
  reactivitySpeed:        { min: 0.1,  max: 1.5,  step: 0.05 },
  minScale:               { min: 0.5,  max: 2,    step: 0.05 },
  maxScale:               { min: 1,    max: 4,    step: 0.05 },
  punch:                  { min: 0,    max: 1.5,  step: 0.05 },
  attack:                 { min: 0.05, max: 1.5,  step: 0.05 },
  release:                { min: 0.01, max: 0.7,  step: 0.01 },
  peakWindow:             { min: 0.5,  max: 5,    step: 0.1  },
  peakFloor:              { min: 0,    max: 0.45, step: 0.01 },
  glowBlur:               { min: 0,    max: 80,   step: 2    },
  shadowBlur:             { min: 0,    max: 100,  step: 5    },
  backdropOpacity:        { min: 0,    max: 1,    step: 0.05 },
  backdropPadding:        { min: 0,    max: 80,   step: 2    },
} satisfies Record<string, SliderRange>

// ─── Particles ────────────────────────────────────────────────────────────────
export const PARTICLE_RANGES = {
  count:             { min: 0,   max: 200,  step: 10   },
  speed:             { min: 0,   max: 5,    step: 0.1  },
  sizeMin:           { min: 1,   max: 60,   step: 1    },
  sizeMax:           { min: 1,   max: 60,   step: 1    },
  opacity:           { min: 0,   max: 1,    step: 0.05 },
  glowStrength:      { min: 0,   max: 2,    step: 0.1  },
  audioSizeBoost:    { min: 0,   max: 30,   step: 1    },
  audioOpacityBoost: { min: 0,   max: 1,    step: 0.05 },
  scanlineIntensity: { min: 0,   max: 1,    step: 0.01 },
  scanlineSpacing:   { min: 120, max: 1400, step: 10   },
  scanlineThickness: { min: 0.4, max: 4,    step: 0.1  },
  rotationIntensity: { min: 0,   max: 4,    step: 0.05 },
} satisfies Record<string, SliderRange>

// ─── Rain ─────────────────────────────────────────────────────────────────────
export const RAIN_RANGES = {
  intensity:     { min: 0,      max: 1,     step: 0.05   },
  dropCount:     { min: 5,      max: 100,   step: 5      },
  angle:         { min: -180,   max: 180,   step: 1      },
  meshRotationZ: { min: -45,    max: 45,    step: 1      },
  length:        { min: 0.01,   max: 0.4,   step: 0.01   },
  width:         { min: 0.0002, max: 0.012, step: 0.0002 },
  blur:          { min: 0,      max: 0.02,  step: 0.001  },
  speed:         { min: 0.1,    max: 6,     step: 0.1    },
  variation:     { min: 0,      max: 1,     step: 0.05   },
} satisfies Record<string, SliderRange>

// ─── Track Title ──────────────────────────────────────────────────────────────
export const TRACK_TITLE_RANGES = {
  positionX:       { min: -0.95, max: 0.95, step: 0.01 },
  positionY:       { min: -0.95, max: 0.95, step: 0.01 },
  fontSize:        { min: 12,    max: 96,   step: 1    },
  letterSpacing:   { min: 0,     max: 12,   step: 0.2  },
  width:           { min: 0.2,   max: 1,    step: 0.01 },
  opacity:         { min: 0,     max: 1,    step: 0.05 },
  scrollSpeed:     { min: 0,     max: 240,  step: 2    },
  glowBlur:        { min: 0,     max: 80,   step: 2    },
  backdropOpacity: { min: 0,     max: 1,    step: 0.05 },
  backdropPadding: { min: 0,     max: 40,   step: 1    },
  filterBrightness:{ min: 0.4,   max: 2,    step: 0.01 },
  filterContrast:  { min: 0.4,   max: 2.5,  step: 0.01 },
  filterSaturation:{ min: 0,     max: 3,    step: 0.01 },
  filterBlur:      { min: 0,     max: 12,   step: 0.1  },
  filterHueRotate: { min: -180,  max: 180,  step: 1    },
  rgbShift:        { min: 0,     max: 0.03, step: 0.001 },
} satisfies Record<string, SliderRange>
