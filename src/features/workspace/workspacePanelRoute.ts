import { createContext, useCallback, useContext } from 'react';
import { readWorkspaceState, writeWorkspaceState } from './workspaceState';

/**
 * Route of the panel the current subtree belongs to, e.g. `spectrum/style`.
 *
 * Without it every collapsible section would need its call site edited to pass
 * a route — 45 of them. A panel declares its route once and everything below
 * addresses itself relative to it, so a section only has to know its own id.
 */
export const WorkspacePanelRouteContext = createContext<string>('');

export function useWorkspacePanelRoute(): string {
	return useContext(WorkspacePanelRouteContext);
}

/**
 * Reads and writes which sections of the current panel are expanded.
 *
 * Does nothing when there is no route: a panel that has not opted in keeps
 * today's behaviour (open state lives and dies with the component) rather than
 * silently sharing one bucket with every other unrouted panel.
 */
export function useSectionOpenState(sectionId: string | undefined): {
	isRemembered: boolean;
	readOpen: (fallback: boolean) => boolean;
	writeOpen: (open: boolean) => void;
} {
	const route = useWorkspacePanelRoute();
	const isRemembered = Boolean(route && sectionId);

	const readOpen = useCallback(
		(fallback: boolean) => {
			if (!isRemembered) return fallback;
			const stored = readWorkspaceState().panels[route]?.openSections;
			// No record yet → the panel's own default decides.
			if (!stored) return fallback;
			return stored.includes(sectionId as string);
		},
		[isRemembered, route, sectionId]
	);

	const writeOpen = useCallback(
		(open: boolean) => {
			if (!isRemembered) return;
			const workspace = readWorkspaceState();
			const panel = workspace.panels[route] ?? {};
			const current = new Set(panel.openSections ?? []);
			if (open) current.add(sectionId as string);
			else current.delete(sectionId as string);
			writeWorkspaceState({
				...workspace,
				panels: {
					...workspace.panels,
					[route]: { ...panel, openSections: [...current] }
				}
			});
		},
		[isRemembered, route, sectionId]
	);

	return { isRemembered, readOpen, writeOpen };
}
