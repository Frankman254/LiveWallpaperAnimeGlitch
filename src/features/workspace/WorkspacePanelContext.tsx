import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	type ReactNode
} from 'react';
import {
	panelKey,
	readWorkspaceState,
	writeWorkspaceState
} from './workspaceState';

/**
 * Tells the components inside a panel which workspace route they belong to.
 *
 * Without this, every collapsible section would need its call site edited to
 * pass a route — 45 of them. A panel declares its route once at the top and
 * everything below addresses itself relative to it, so a section only has to
 * know its own id.
 *
 * Nesting appends: `<WorkspacePanel id="spectrum">` around
 * `<WorkspacePanel id="style">` yields `spectrum/style`.
 */
const WorkspacePanelRouteContext = createContext<string>('');

export function WorkspacePanel({
	id,
	children
}: {
	id: string;
	children: ReactNode;
}) {
	const parent = useContext(WorkspacePanelRouteContext);
	const route = useMemo(() => panelKey(parent, id), [parent, id]);
	return (
		<WorkspacePanelRouteContext.Provider value={route}>
			{children}
		</WorkspacePanelRouteContext.Provider>
	);
}

export function useWorkspacePanelRoute(): string {
	return useContext(WorkspacePanelRouteContext);
}

/**
 * Reads and writes which sections of the current panel are expanded.
 *
 * Returns `null` when there is no route — a panel that has not opted in keeps
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
