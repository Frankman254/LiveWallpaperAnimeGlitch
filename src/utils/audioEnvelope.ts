/**
 * Reusable audio-reactive envelope processor.
 *
 * Standardizes attack/release smoothing, adaptive peak normalization, and
 * value mapping across all reactive systems (logo, bg zoom, spectrum).
 *
 * Usage:
 *   const env = createAudioEnvelope()           // one instance per visual element
 *   const result = env.tick(amplitude, dt, cfg)  // call every frame
 *
 * All state is held inside the returned object — safe to use multiple
 * instances in parallel without shared module-level variables.
 */

export interface AudioEnvelopeConfig {
  /** 0–1.5: how fast the envelope rises on loud hits */
  attack: number
  /** 0.01–0.7: how fast it falls back to silence */
  release: number
  /** Multiplier controlling response speed. Usually reactivitySpeed × 2.4 */
  responseSpeed: number
  /** Seconds the adaptive peak remembers loud moments before decaying */
  peakWindow: number
  /** Fraction of peak that sets the noise floor (suppresses silence bounce) */
  peakFloor: number
  /** Additional transient punch factor added on sharp hits */
  punch: number
  /** 0–2.5: how much of the envelope drives the final output value */
  scaleIntensity: number
  /** Target output minimum */
  min: number
  /** Target output maximum */
  max: number
}

export interface AudioEnvelopeState {
  /** Envelope output mapped to [min, max] */
  value: number
  /** Normalised amplitude in [0, 1] after floor/peak removal */
  normalizedAmplitude: number
  smoothedAmplitude: number
  adaptivePeak: number
  adaptiveFloor: number
}

export interface AudioEnvelope {
  tick(rawAmplitude: number, dt: number, config: AudioEnvelopeConfig): AudioEnvelopeState
  reset(): void
  getState(): AudioEnvelopeState
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

/**
 * Create a stateful audio envelope instance.
 * Create one instance per visual element, reuse across frames.
 */
export function createAudioEnvelope(): AudioEnvelope {
  let smoothedAmplitude = 0
  let lastAmplitude = 0
  let adaptivePeak = 0.35
  let adaptiveFloor = 0
  let renderedValue = 0

  function tick(rawAmplitude: number, dt: number, cfg: AudioEnvelopeConfig): AudioEnvelopeState {
    const responseSpeed = Math.max(0.2, cfg.responseSpeed)
    const attack = Math.max(0.05, cfg.attack)
    const release = Math.max(0.01, cfg.release)
    const peakWindow = Math.max(0.45, cfg.peakWindow)
    const peakFloor = clamp(cfg.peakFloor, 0, 0.75)
    const safeDt = Math.max(dt, 1 / 120)

    // Asymmetric smoothing: fast rise, slow fall
    const riseStep = 1 - Math.exp(-(3 + attack * 14) * responseSpeed * safeDt)
    const fallStep = 1 - Math.exp(-(0.8 + release * 16) * responseSpeed * safeDt)

    if (rawAmplitude > smoothedAmplitude) {
      smoothedAmplitude += (rawAmplitude - smoothedAmplitude) * riseStep
    } else {
      smoothedAmplitude += (rawAmplitude - smoothedAmplitude) * fallStep
    }

    // Adaptive peak: tracks loudest moments, decays slowly
    const peakDecay = Math.exp(-safeDt / peakWindow)
    adaptivePeak = Math.max(smoothedAmplitude, adaptivePeak * peakDecay, 0.16)

    // Adaptive floor: suppresses near-silence bounce
    const floorTarget = smoothedAmplitude * peakFloor
    const floorRiseStep = 1 - Math.exp(-(0.35 + release * 8) * safeDt)
    const floorDropStep = 1 - Math.exp(-(2.2 + attack * 10) * safeDt)
    if (floorTarget > adaptiveFloor) {
      adaptiveFloor += (floorTarget - adaptiveFloor) * floorRiseStep
    } else {
      adaptiveFloor += (floorTarget - adaptiveFloor) * floorDropStep
    }

    const usableRange = Math.max(0.08, adaptivePeak - adaptiveFloor)
    const normalizedAmplitude = clamp((smoothedAmplitude - adaptiveFloor) / usableRange, 0, 1)

    // Transient punch: extra boost on sharp volume jumps
    const transient = Math.max(0, rawAmplitude - lastAmplitude)
    lastAmplitude = rawAmplitude

    const reactiveScale = clamp(cfg.scaleIntensity, 0.01, 2.5)
    const excitedAmplitude = clamp(
      normalizedAmplitude * (0.12 + reactiveScale * 0.88) +
        transient * Math.max(0, cfg.punch) * 0.65,
      0,
      1.2
    )

    const targetValue = cfg.min + (cfg.max - cfg.min) * clamp(excitedAmplitude, 0, 1)
    const followStep = targetValue > renderedValue ? riseStep : fallStep
    renderedValue += (targetValue - renderedValue) * followStep
    renderedValue = clamp(renderedValue, cfg.min, cfg.max)

    return {
      value: renderedValue,
      normalizedAmplitude,
      smoothedAmplitude,
      adaptivePeak,
      adaptiveFloor,
    }
  }

  function reset(): void {
    smoothedAmplitude = 0
    lastAmplitude = 0
    adaptivePeak = 0.35
    adaptiveFloor = 0
    renderedValue = 0
  }

  function getState(): AudioEnvelopeState {
    const usableRange = Math.max(0.08, adaptivePeak - adaptiveFloor)
    return {
      value: renderedValue,
      normalizedAmplitude: clamp((smoothedAmplitude - adaptiveFloor) / usableRange, 0, 1),
      smoothedAmplitude,
      adaptivePeak,
      adaptiveFloor,
    }
  }

  return { tick, reset, getState }
}
