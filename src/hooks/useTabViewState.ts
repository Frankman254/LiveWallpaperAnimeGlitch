import { useCallback, useSyncExternalStore } from 'react';
import {
	getSubTab,
	setSubTab,
	subscribeWorkspaceState
} from '@/editor/workspace/workspaceState';

/**
 * Which sub-view a tab is showing (Spectrum's Family/Style/Audio/FX, …),
 * remembered in the workspace.
 *
 * Every tab used to invent its own `localStorage` key
 * (`lwag-modern-spectrum-view`, `lwag-track-info-view`, …) — nine of them, with
 * no shared contract, no version and uneven coverage. They now share one entry
 * keyed by tab id, which also lets the shell read the ACTIVE sub-view and build
 * a full route (`spectrum/style`) for scroll and section state. Before, the
 * sub-view was locked inside each tab, so every sub-view of a tab shared one
 * scroll bucket and landed you at someone else's offset.
 *
 * Reactive on purpose: `ControlPanel` re-renders when a tab switches sub-view
 * so the scroll bucket follows it.
 */
export function useTabViewState<V extends string>(
	tabId: string,
	defaultView: V,
	isValid: (value: unknown) => value is V,
	options?: {
		/**
		 * Pre-workspace `localStorage` key, read once when the workspace has no
		 * record yet so nobody loses the view they had open. Safe to drop after
		 * a release or two.
		 */
		legacyStorageKey?: string;
	}
): [V, (next: V) => void] {
	const stored = useSyncExternalStore(
		subscribeWorkspaceState,
		() => getSubTab(tabId),
		() => undefined
	);

	let view: V = defaultView;
	if (isValid(stored)) {
		view = stored;
	} else if (stored === undefined && options?.legacyStorageKey) {
		const legacy = readLegacyView(options.legacyStorageKey);
		if (isValid(legacy)) view = legacy;
	}

	const setView = useCallback((next: V) => setSubTab(tabId, next), [tabId]);

	return [view, setView];
}

function readLegacyView(storageKey: string): unknown {
	if (typeof window === 'undefined') return undefined;
	try {
		return window.localStorage.getItem(storageKey) ?? undefined;
	} catch {
		return undefined;
	}
}
