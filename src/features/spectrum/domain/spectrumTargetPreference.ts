import type { SpectrumProfileTarget } from './spectrumTargetProfile';

/** Current UI-preference key for the shared active Spectrum target. */
const SPECTRUM_TARGET_KEY = 'vibrix-spectrum-target';
/**
 * Keys this preference used to live under, newest first. Read as fallbacks so
 * a returning user keeps their last selection across both renames: the
 * editor-local selector wrote `lwag-modern-*`, the shared one wrote `lwag-*`,
 * and the product rename to Vibrix moved it again.
 */
const LEGACY_SPECTRUM_TARGET_KEYS = [
	'lwag-spectrum-target',
	'lwag-modern-spectrum-target'
] as const;

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
		for (const key of LEGACY_SPECTRUM_TARGET_KEYS) {
			const legacy = localStorage.getItem(key);
			if (isSpectrumTarget(legacy)) return legacy;
		}
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
