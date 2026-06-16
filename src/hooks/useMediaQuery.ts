import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query. Returns `true` when the query matches.
 *
 * Defaults to `false` during SSR or when `matchMedia` is unavailable.
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState<boolean>(() => {
		if (typeof window === 'undefined' || !window.matchMedia) return false;
		return window.matchMedia(query).matches;
	});

	useEffect(() => {
		if (typeof window === 'undefined' || !window.matchMedia) return;
		const mediaQuery = window.matchMedia(query);
		const handler = (event: MediaQueryListEvent) =>
			setMatches(event.matches);
		setMatches(mediaQuery.matches);
		if (mediaQuery.addEventListener) {
			mediaQuery.addEventListener('change', handler);
			return () => mediaQuery.removeEventListener('change', handler);
		}
		// Safari < 14 fallback
		mediaQuery.addListener(handler);
		return () => mediaQuery.removeListener(handler);
	}, [query]);

	return matches;
}
