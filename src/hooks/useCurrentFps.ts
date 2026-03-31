import { useSyncExternalStore } from 'react'

type Listener = () => void

const listeners = new Set<Listener>()

let animationFrameId: number | null = null
let lastFrameTime = 0
let lastSampleTime = 0
let framesSinceSample = 0
let fpsSnapshot = 0
let smoothedFps = 0

function emitChange() {
  listeners.forEach((listener) => listener())
}

function resetLoopState() {
  lastFrameTime = 0
  lastSampleTime = 0
  framesSinceSample = 0
  smoothedFps = 0
  fpsSnapshot = 0
}

function stopLoop() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  resetLoopState()
}

function onFrame(now: number) {
  if (listeners.size === 0) {
    stopLoop()
    return
  }

  if (lastFrameTime === 0) {
    lastFrameTime = now
    lastSampleTime = now
    animationFrameId = requestAnimationFrame(onFrame)
    return
  }

  framesSinceSample += 1
  lastFrameTime = now

  const elapsed = now - lastSampleTime
  if (elapsed >= 250) {
    const instantFps = (framesSinceSample * 1000) / elapsed
    smoothedFps = smoothedFps === 0 ? instantFps : smoothedFps * 0.72 + instantFps * 0.28

    const nextSnapshot = Math.max(0, Math.round(smoothedFps))
    if (nextSnapshot !== fpsSnapshot) {
      fpsSnapshot = nextSnapshot
      emitChange()
    }

    framesSinceSample = 0
    lastSampleTime = now
  }

  animationFrameId = requestAnimationFrame(onFrame)
}

function ensureLoop() {
  if (animationFrameId === null && typeof window !== 'undefined') {
    animationFrameId = requestAnimationFrame(onFrame)
  }
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  ensureLoop()

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      stopLoop()
    }
  }
}

function getSnapshot() {
  return fpsSnapshot
}

export function useCurrentFps() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
