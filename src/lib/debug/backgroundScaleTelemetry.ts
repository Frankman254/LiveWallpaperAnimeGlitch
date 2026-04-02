export type BackgroundScaleTelemetrySnapshot = {
  /** True when the slideshow background canvas is rendering this frame */
  hasSignal: boolean
  imageBassReactive: boolean
  baseScale: number
  bassBoost: number
  maxBoost: number
  driveInstant: number
}

const empty: BackgroundScaleTelemetrySnapshot = {
  hasSignal: false,
  imageBassReactive: false,
  baseScale: 1,
  bassBoost: 0,
  maxBoost: 0,
  driveInstant: 0,
}

let snapshot: BackgroundScaleTelemetrySnapshot = { ...empty }
const listeners = new Set<() => void>()

export function publishBackgroundScaleTelemetry(next: Partial<BackgroundScaleTelemetrySnapshot>): void {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((listener) => listener())
}

export function resetBackgroundScaleTelemetry(): void {
  snapshot = { ...empty }
  listeners.forEach((listener) => listener())
}

export function subscribeBackgroundScaleTelemetry(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)
  return () => listeners.delete(onStoreChange)
}

export function getBackgroundScaleTelemetrySnapshot(): BackgroundScaleTelemetrySnapshot {
  return snapshot
}
