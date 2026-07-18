import { useCallback, useState } from 'react';

/**
 * Sub-view state for editor tabs (e.g. Spectrum's Family/Style/Audio/FX),
 * persisted to localStorage so the tab reopens where the user left it.
 *
 * Canonical replacement for the read/write/useState triplet that was
 * copy-pasted across SpectrumTab, LogoTab and TrackTitleTab.
 */
export function useTabViewState<V extends string>(
	storageKey: string,
	defaultView: V,
	isValid: (value: unknown) => value is V
): [V, (next: V) => void] {
	const [view, setView] = useState<V>(() => {
		if (typeof window === 'undefined') return defaultView;
		try {
			const value = window.localStorage.getItem(storageKey);
			return isValid(value) ? value : defaultView;
		} catch {
			return defaultView;
		}
	});

	const setAndPersist = useCallback(
		(next: V) => {
			setView(next);
			if (typeof window === 'undefined') return;
			try {
				window.localStorage.setItem(storageKey, next);
			} catch {
				/* localStorage unavailable */
			}
		},
		[storageKey]
	);

	return [view, setAndPersist];
}
