import type { ResolvedAudioReactiveChannel } from '@/types/wallpaper'

export type LogoDiagnosticsSnapshot = {
  bandModeRequested: string
  resolvedChannel: ResolvedAudioReactiveChannel
  channelInstant: number
  driveScaled: number
  envelopeScale: number
  normalizedAmplitude: number
  smoothedAmplitude: number
  adaptivePeak: number
  adaptiveFloor: number
  logoBaseSize: number
  renderedSize: number
  logoPositionX: number
  logoPositionY: number
  spectrumFollowLogo: boolean
  spectrumUsesLogoPlacement: boolean
  logoEnabled: boolean
}

const empty: LogoDiagnosticsSnapshot = {
  bandModeRequested: 'kick',
  resolvedChannel: 'kick',
  channelInstant: 0,
  driveScaled: 0,
  envelopeScale: 1,
  normalizedAmplitude: 0,
  smoothedAmplitude: 0,
  adaptivePeak: 0,
  adaptiveFloor: 0,
  logoBaseSize: 80,
  renderedSize: 80,
  logoPositionX: 0,
  logoPositionY: 0,
  spectrumFollowLogo: false,
  spectrumUsesLogoPlacement: false,
  logoEnabled: false,
}

let snapshot: LogoDiagnosticsSnapshot = { ...empty }
const listeners = new Set<() => void>()

export function publishLogoDiagnosticsTelemetry(next: LogoDiagnosticsSnapshot): void {
  snapshot = next
  listeners.forEach((listener) => listener())
}

export function resetLogoDiagnosticsTelemetry(): void {
  snapshot = { ...empty }
  listeners.forEach((listener) => listener())
}

export function subscribeLogoDiagnosticsTelemetry(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)
  return () => listeners.delete(onStoreChange)
}

export function getLogoDiagnosticsSnapshot(): LogoDiagnosticsSnapshot {
  return snapshot
}
