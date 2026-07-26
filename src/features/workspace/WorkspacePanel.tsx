import { useContext, useMemo, type ReactNode } from 'react';
import { panelKey } from './workspaceState';
import { WorkspacePanelRouteContext } from './workspacePanelRoute';

/**
 * Declares the workspace route for everything rendered inside it.
 *
 * Nesting appends: `<WorkspacePanel id="spectrum">` around
 * `<WorkspacePanel id="style">` yields `spectrum/style`.
 */
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
