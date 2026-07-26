import { useSyncExternalStore } from 'react';
import { getSubTab, subscribeWorkspaceState } from './workspaceState';

/**
 * The sub-view a tab is currently showing, or `undefined` for tabs that have
 * none.
 *
 * Lets the editor shell build a full route (`spectrum/style`) for the scroll
 * bucket and section state without every tab having to report upward.
 */
export function useWorkspaceSubTab(tabId: string): string | undefined {
	return useSyncExternalStore(
		subscribeWorkspaceState,
		() => getSubTab(tabId),
		() => undefined
	);
}
