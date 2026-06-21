import { useEffect, useState } from 'react';

export const OUTPUT_FPS_DEBUG_STORAGE_KEY = 'lwag-output-debug-fps';
export const OUTPUT_FPS_DEBUG_EVENT = 'lwag-output-debug-fps-change';

/**
 * Pure: is the output FPS overlay requested via URL? Supports both a top-level
 * query (`?debug=fps`) and a hash-route query (`#/present?debug=fps`). This is
 * intentionally opt-in only — it never returns true by default, so it is safe
 * for the production build used with OBS.
 */
export function parseOutputFpsDebugFlag(hash: string, search: string): boolean {
	return hash.includes('debug=fps') || search.includes('debug=fps');
}

/**
 * Resolves overlay visibility from all opt-in sources: URL flag OR a sticky
 * session-storage toggle (set by the Ctrl+Shift+F shortcut). DEV builds always
 * show it; production builds only when explicitly opted in.
 */
export function resolveOutputFpsDebugVisible(opts: {
	dev: boolean;
	hash: string;
	search: string;
	storageValue: string | null;
}): boolean {
	if (opts.dev) return true;
	if (opts.storageValue === '1') return true;
	return parseOutputFpsDebugFlag(opts.hash, opts.search);
}

function readSessionFlag(): string | null {
	try {
		return typeof sessionStorage !== 'undefined'
			? sessionStorage.getItem(OUTPUT_FPS_DEBUG_STORAGE_KEY)
			: null;
	} catch {
		return null;
	}
}

function computeVisible(): boolean {
	if (typeof window === 'undefined') return false;
	return resolveOutputFpsDebugVisible({
		dev: Boolean(import.meta.env.DEV),
		hash: window.location.hash,
		search: window.location.search,
		storageValue: readSessionFlag()
	});
}

/**
 * Output-shell hook: tracks whether the FPS overlay should be visible and wires
 * the Ctrl+Shift+F toggle (production-safe, opt-in). The toggle persists to
 * sessionStorage so it survives route changes within the recording session but
 * resets when the tab closes — so it can never leak into a default recording.
 */
export function useOutputFpsDebugVisible(): boolean {
	const [visible, setVisible] = useState(computeVisible);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const sync = () => setVisible(computeVisible());

		const onKeyDown = (event: KeyboardEvent) => {
			if (
				event.ctrlKey &&
				event.shiftKey &&
				(event.key === 'F' || event.key === 'f')
			) {
				event.preventDefault();
				const next = readSessionFlag() === '1' ? '0' : '1';
				try {
					sessionStorage.setItem(OUTPUT_FPS_DEBUG_STORAGE_KEY, next);
				} catch {
					/* sessionStorage unavailable */
				}
				window.dispatchEvent(new Event(OUTPUT_FPS_DEBUG_EVENT));
			}
		};

		window.addEventListener('keydown', onKeyDown);
		window.addEventListener(OUTPUT_FPS_DEBUG_EVENT, sync);
		window.addEventListener('hashchange', sync);
		return () => {
			window.removeEventListener('keydown', onKeyDown);
			window.removeEventListener(OUTPUT_FPS_DEBUG_EVENT, sync);
			window.removeEventListener('hashchange', sync);
		};
	}, []);

	return visible;
}
