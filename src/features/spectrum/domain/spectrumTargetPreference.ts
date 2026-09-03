import type { SpectrumProfileTarget } from './spectrumTargetProfile';

/** New UI-preference key for the shared active Spectrum target. */
const SPECTRUM_TARGET_KEY = 'lwag-spectrum-target';
/** Legacy key written by the old editor-local selector. Read as a fallback so
 *  a returning user keeps their last selection after the rename. */
const LEGACY_SPECTRUM_TARGET_KEY = 'lwag-modern-spectrum-target';

function isSpectrumTarget(value: unknown): value is SpectrumProfileTarget {
	return value === 'main' || value === 'instance';
}

/** Reads the persisted active target, preferring the new key and falling back
 *  to the legacy key. Defaults to the main spectrum. */
export function readPersistedSpectrumTarget(): SpectrumProfileTarget {
	if (typeof localStorage === 'undefined') return 'main';
	try {
		const next = localStorage.getItem(SPECTRUM_TARGET_KEY);
		if (isSpectrumTarget(next)) return next;
		const legacy = localStorage.getItem(LEGACY_SPECTRUM_TARGET_KEY);
		if (isSpectrumTarget(legacy)) return legacy;
	} catch {
		/* localStorage unavailable */
	}
	return 'main';
}

/** Persists the active target as a UI preference (new key only). */
export function writePersistedSpectrumTarget(
	target: SpectrumProfileTarget
): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(SPECTRUM_TARGET_KEY, target);
	} catch {
		/* localStorage unavailable */
	}
}
