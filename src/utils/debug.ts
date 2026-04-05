/**
 * Dev-only debug logger.
 *
 * All calls are no-ops in production (import.meta.env.DEV = false after build).
 * Zero cost in prod: the condition is dead-code-eliminated by the bundler.
 *
 * Usage:
 *   import { debugLog, debugWarn, createDebugScope } from '@/utils/debug'
 *
 *   // Global shorthand
 *   debugLog('[Spectrum]', 'bar count changed', count)
 *
 *   // Scoped logger (prefix is added automatically)
 *   const log = createDebugScope('AudioEnvelope')
 *   log('peak:', adaptivePeak, 'floor:', adaptiveFloor)
 */

const IS_DEV = import.meta.env.DEV;

// ─── Raw helpers ──────────────────────────────────────────────────────────────

export function debugLog(...args: unknown[]): void {
	if (IS_DEV) {
		console.log(...args);
	}
}

export function debugWarn(...args: unknown[]): void {
	if (IS_DEV) {
		console.warn(...args);
	}
}

export function debugError(...args: unknown[]): void {
	if (IS_DEV) {
		console.error(...args);
	}
}

// ─── Scoped logger ────────────────────────────────────────────────────────────

/**
 * Returns a logger that automatically prepends a scope tag.
 *
 * @example
 *   const log = createDebugScope('BackgroundSlide')
 *   log('transition started', { from: 'A', to: 'B' })
 *   // → "[BackgroundSlide] transition started { from: 'A', to: 'B' }"
 */
export function createDebugScope(scope: string) {
	const tag = `[${scope}]`;
	return (...args: unknown[]) => debugLog(tag, ...args);
}

// ─── Performance timing ───────────────────────────────────────────────────────

/**
 * Wraps a function and logs how long it took (dev only).
 * Returns the original function unchanged in production.
 */
export function debugTime<T extends (...args: unknown[]) => unknown>(
	label: string,
	fn: T
): T {
	if (!IS_DEV) return fn;
	return ((...args: Parameters<T>) => {
		const t0 = performance.now();
		const result = fn(...args);
		const elapsed = (performance.now() - t0).toFixed(2);
		debugLog(`[perf] ${label}: ${elapsed}ms`);
		return result;
	}) as T;
}

// ─── State diff ───────────────────────────────────────────────────────────────

/**
 * Logs only the keys that changed between two objects (dev only).
 * Useful for Zustand store diffs in selectors / effects.
 */
export function debugDiff(
	label: string,
	prev: Record<string, unknown>,
	next: Record<string, unknown>
): void {
	if (!IS_DEV) return;
	const changed: Record<string, { from: unknown; to: unknown }> = {};
	const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
	for (const key of keys) {
		if (prev[key] !== next[key]) {
			changed[key] = { from: prev[key], to: next[key] };
		}
	}
	if (Object.keys(changed).length > 0) {
		debugLog(`[diff:${label}]`, changed);
	}
}
