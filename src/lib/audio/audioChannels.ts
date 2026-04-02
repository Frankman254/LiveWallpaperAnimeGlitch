import type { AudioReactiveChannel, ResolvedAudioReactiveChannel } from '@/types/wallpaper'

export type AudioChannelLevels = Record<ResolvedAudioReactiveChannel, number>

export interface AudioAnalysisState {
  lastUpdatedMs: number
  smoothed: AudioChannelLevels
  kickBand: number
  highBand: number
}

export interface AudioChannelSelectionState {
  current: ResolvedAudioReactiveChannel
  smoothedValue: number
  lastKickMs: number
}

export interface AudioSnapshot {
  bins: Uint8Array
  amplitude: number
  peak: number
  channels: AudioChannelLevels
  timestampMs: number
}

export interface ResolvedAudioChannelValue {
  /**
   * Smoothed level (EMA) — good for sticky auto-switch UI / stable reads.
   */
  value: number
  /**
   * Raw level for the resolved channel this frame — use this to drive motion
   * (BG zoom, particles, etc.). Spectrum motion comes from FFT bins, not from `value`.
   */
  instantLevel: number
  resolvedChannel: ResolvedAudioReactiveChannel
}

const NYQUIST_HZ = 22050
const AUTO_STICKY_MARGIN = 0.04

export const AUDIO_REACTIVE_CHANNELS: AudioReactiveChannel[] = [
  'auto',
  'kick',
  'instrumental',
  'bass',
  'hihat',
  'vocal',
  'full',
]

export const AUDIO_AUTO_FALLBACK_ORDER: ResolvedAudioReactiveChannel[] = [
  'kick',
  'instrumental',
  'bass',
  'hihat',
  'vocal',
  'full',
]

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function hzToBin(hz: number, binsLength: number): number {
  if (binsLength <= 1) return 0
  return Math.max(0, Math.min(binsLength - 1, Math.floor((hz / NYQUIST_HZ) * binsLength)))
}

function meanRange(bins: Uint8Array, minHz: number, maxHz: number): number {
  if (bins.length === 0) return 0
  const start = hzToBin(minHz, bins.length)
  const end = Math.max(start + 1, hzToBin(maxHz, bins.length))
  let sum = 0
  let count = 0
  for (let index = start; index <= end && index < bins.length; index += 1) {
    sum += bins[index] ?? 0
    count += 1
  }
  return count > 0 ? (sum / count) / 255 : 0
}

function peakRange(bins: Uint8Array, minHz: number, maxHz: number): number {
  if (bins.length === 0) return 0
  const start = hzToBin(minHz, bins.length)
  const end = Math.max(start + 1, hzToBin(maxHz, bins.length))
  let peak = 0
  for (let index = start; index <= end && index < bins.length; index += 1) {
    peak = Math.max(peak, bins[index] ?? 0)
  }
  return peak / 255
}

function smoothValue(previous: number, next: number, smoothing: number): number {
  return previous * smoothing + next * (1 - smoothing)
}

function zeroLevels(): AudioChannelLevels {
  return {
    full: 0,
    kick: 0,
    instrumental: 0,
    bass: 0,
    hihat: 0,
    vocal: 0,
  }
}

export function createAudioAnalysisState(): AudioAnalysisState {
  return {
    lastUpdatedMs: 0,
    smoothed: zeroLevels(),
    kickBand: 0,
    highBand: 0,
  }
}

export function createAudioChannelSelectionState(
  current: ResolvedAudioReactiveChannel = 'kick'
): AudioChannelSelectionState {
  return {
    current,
    smoothedValue: 0,
    lastKickMs: 0,
  }
}

export function analyzeAudioChannels(
  bins: Uint8Array,
  state: AudioAnalysisState,
  channelSmoothing: number,
  timestampMs: number
): AudioChannelLevels {
  if (bins.length === 0) {
    state.lastUpdatedMs = timestampMs
    state.kickBand = 0
    state.highBand = 0
    state.smoothed = zeroLevels()
    return state.smoothed
  }

  const smoothing = clamp01(channelSmoothing)
  const fullBand = meanRange(bins, 35, 16000)
  const kickBand = peakRange(bins, 35, 105)
  const bassBody = meanRange(bins, 70, 190)
  const lowMid = meanRange(bins, 180, 900)
  const vocalBody = meanRange(bins, 260, 3400)
  const presence = meanRange(bins, 900, 4200)
  const highBand = meanRange(bins, 5200, 12000)
  const airBand = peakRange(bins, 7500, 15000)

  const kickTransient = clamp01(Math.max(0, kickBand - state.kickBand * 0.9) * 2.4)
  const hihatTransient = clamp01(Math.max(0, airBand - state.highBand * 0.88) * 2.9)

  const rawLevels: AudioChannelLevels = {
    full: clamp01(fullBand * 1.18),
    kick: clamp01((kickBand * 0.74) + (bassBody * 0.28) + (kickTransient * 0.92) - (vocalBody * 0.08)),
    bass: clamp01((bassBody * 0.92) + (kickBand * 0.3) + (lowMid * 0.12) - (highBand * 0.05)),
    hihat: clamp01((highBand * 0.72) + (airBand * 0.62) + (hihatTransient * 0.88) - (kickBand * 0.04)),
    vocal: clamp01((vocalBody * 0.78) + (presence * 0.26) - (kickBand * 0.1) - (airBand * 0.05)),
    instrumental: 0,
  }

  rawLevels.instrumental = clamp01(
    (rawLevels.full * 0.56)
      + (lowMid * 0.34)
      + (bassBody * 0.22)
      + (highBand * 0.14)
      - (rawLevels.vocal * 0.12)
  )

  state.smoothed = {
    full: smoothValue(state.smoothed.full, rawLevels.full, smoothing),
    kick: smoothValue(state.smoothed.kick, rawLevels.kick, smoothing),
    instrumental: smoothValue(state.smoothed.instrumental, rawLevels.instrumental, smoothing),
    bass: smoothValue(state.smoothed.bass, rawLevels.bass, smoothing),
    hihat: smoothValue(state.smoothed.hihat, rawLevels.hihat, smoothing),
    vocal: smoothValue(state.smoothed.vocal, rawLevels.vocal, smoothing),
  }
  state.lastUpdatedMs = timestampMs
  state.kickBand = kickBand
  state.highBand = airBand
  return state.smoothed
}

export function resolveAudioChannelValue(
  channels: AudioChannelLevels,
  requestedChannel: AudioReactiveChannel,
  selectionState: AudioChannelSelectionState,
  selectedChannelSmoothing: number,
  autoKickThreshold: number,
  autoSwitchHoldMs: number,
  timestampMs: number
): ResolvedAudioChannelValue {
  let resolvedChannel: ResolvedAudioReactiveChannel = requestedChannel === 'auto'
    ? selectionState.current
    : requestedChannel

  if (requestedChannel === 'auto') {
    if (channels.kick >= autoKickThreshold) {
      selectionState.lastKickMs = timestampMs
      resolvedChannel = 'kick'
    } else if (
      selectionState.current === 'kick'
      && timestampMs - selectionState.lastKickMs < autoSwitchHoldMs
    ) {
      resolvedChannel = 'kick'
    } else {
      const candidates = AUDIO_AUTO_FALLBACK_ORDER.filter((channel) => channel !== 'kick')
      let bestChannel = candidates[0] ?? 'instrumental'
      for (const channel of candidates) {
        if (channels[channel] > channels[bestChannel]) {
          bestChannel = channel
        }
      }

      const currentLevel = channels[selectionState.current] ?? 0
      const bestLevel = channels[bestChannel] ?? 0
      resolvedChannel = currentLevel + AUTO_STICKY_MARGIN >= bestLevel
        ? selectionState.current
        : bestChannel
    }
  }

  selectionState.current = resolvedChannel
  const instantLevel = channels[resolvedChannel] ?? 0
  const effectiveSmoothing = clamp01(
    requestedChannel === 'auto'
      ? selectedChannelSmoothing
      : selectedChannelSmoothing * 0.35
  )
  selectionState.smoothedValue = smoothValue(
    selectionState.smoothedValue,
    instantLevel,
    effectiveSmoothing
  )

  return {
    value: selectionState.smoothedValue,
    instantLevel,
    resolvedChannel,
  }
}
