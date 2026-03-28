export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeMousePosition(
  x: number,
  y: number,
  width: number,
  height: number
): [number, number] {
  return [(x / width) * 2 - 1, -(y / height) * 2 + 1];
}

export function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
