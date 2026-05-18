import { MAX_SPECTRUM_MANUAL_SECTIONS } from '@/types/wallpaper';

/**
 * Manual spectrum control runtime.
 *
 * Module-scoped because the keyboard handler (in WallpaperViewport) and the
 * spectrum render path (in CircularSpectrum) must share state without
 * threading it through React. The section levels are NOT in the Zustand
 * store: they update at frame rate (60Hz on key press) and would trigger
 * cascading re-renders if persisted.
 *
 * Lifecycle:
 *  - `setSectionTarget(index, target)` — called by keydown (target=1) /
 *    keyup (target=0) handlers.
 *  - `tickManualSections(attack, release, dt)` — called by the spectrum
 *    render loop once per frame BEFORE the bin sampling loop.
 *  - `getSectionLevel(index)` — read inside the per-bin sampling loop.
 *  - `resetManualSections()` — called when drive mode flips back to 'audio'
 *    or when the keyboard hook unmounts; ensures stale presses don't leak
 *    into the next session.
 *
 * `MAX_SPECTRUM_MANUAL_SECTIONS` is the hard ceiling. The user-facing
 * `spectrumManualSections` slider tops out at 12 (the same constant) and
 * the runtime always sizes its arrays to that ceiling — switching the
 * section count mid-press leaves the unused slots at zero, no crash.
 */

type SectionRuntime = {
	current: number;
	target: number;
};

const sections: SectionRuntime[] = Array.from(
	{ length: MAX_SPECTRUM_MANUAL_SECTIONS },
	() => ({ current: 0, target: 0 })
);

export function setSectionTarget(index: number, target: number): void {
	const slot = sections[index];
	if (!slot) return;
	slot.target = Math.max(0, Math.min(1, target));
}

export function tickManualSections(
	attackSeconds: number,
	releaseSeconds: number,
	dt: number
): void {
	const safeDt = Math.max(0, Math.min(0.1, dt));
	const safeAttack = Math.max(0.001, attackSeconds);
	const safeRelease = Math.max(0.001, releaseSeconds);
	for (const slot of sections) {
		const rate = slot.target > slot.current ? safeAttack : safeRelease;
		// One-pole lowpass — frame-rate independent. Higher rate = slower
		// response; `dt / rate` ≈ fraction of distance to close per frame.
		const alpha = 1 - Math.exp(-safeDt / rate);
		slot.current += (slot.target - slot.current) * alpha;
		// Snap to baseline once close enough to avoid floating point noise
		// keeping a section "barely on" forever.
		if (slot.target === 0 && slot.current < 0.0005) slot.current = 0;
	}
}

export function getSectionLevel(index: number): number {
	return sections[index]?.current ?? 0;
}

export function resetManualSections(): void {
	for (const slot of sections) {
		slot.current = 0;
		slot.target = 0;
	}
}

/**
 * Read-only snapshot for the HUD. Returns a fresh array each call sized to
 * the active section count — callers shouldn't mutate.
 */
export function snapshotManualSections(activeCount: number): number[] {
	const safeCount = Math.max(
		0,
		Math.min(MAX_SPECTRUM_MANUAL_SECTIONS, Math.round(activeCount))
	);
	const out = new Array<number>(safeCount);
	for (let i = 0; i < safeCount; i++) out[i] = sections[i]?.current ?? 0;
	return out;
}
