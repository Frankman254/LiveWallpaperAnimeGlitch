/**
 * Where the user had the editor arranged — tab, subtab, scroll, open sections.
 *
 * Deliberately NOT in the wallpaper store and NOT in the `.lwag`: this is
 * "where I was working", not "what the wallpaper looks like". See
 * `workspaceKeys.ts` for the same boundary applied to the keys that do live in
 * the wallpaper store.
 *
 * ── Why there is no migration chain here ────────────────────────────────────
 * A bumped version DISCARDS the stored workspace and starts fresh. Losing your
 * scroll position costs one scroll; a migration bug costs real work. The
 * project store earns its 3000-line migration file because it holds the user's
 * creation — this holds their scroll offset.
 *
 * ── Why the keys are strings, never indexes ────────────────────────────────
 * Panels are addressed by a stable route (`spectrum/style`), so reordering
 * tabs or inserting a section cannot silently restore the wrong panel.
 */

export const WORKSPACE_PERSIST_VERSION = 1;

const STORAGE_KEY = 'lwag-workspace';

/** Scroll + open sections for one addressable panel. */
export type PanelWorkspaceState = {
	scrollTop?: number;
	scrollLeft?: number;
	/** Ids of the sections the user left expanded. */
	openSections?: string[];
};

export type WorkspaceState = {
	version: number;
	navigation: {
		/** Last main tab, e.g. `spectrum`. */
		mainTab?: string;
		/** Last sub-view per tab, keyed by tab id — never by index. */
		subTabs: Record<string, string>;
	};
	panels: Record<string, PanelWorkspaceState>;
};

export function createEmptyWorkspaceState(): WorkspaceState {
	return {
		version: WORKSPACE_PERSIST_VERSION,
		navigation: { subTabs: {} },
		panels: {}
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeNumber(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isFinite(value) && value >= 0
		? value
		: undefined;
}

function sanitizeStringMap(value: unknown): Record<string, string> {
	if (!isRecord(value)) return {};
	const out: Record<string, string> = {};
	for (const [key, entry] of Object.entries(value)) {
		if (typeof entry === 'string') out[key] = entry;
	}
	return out;
}

function sanitizePanels(value: unknown): Record<string, PanelWorkspaceState> {
	if (!isRecord(value)) return {};
	const out: Record<string, PanelWorkspaceState> = {};
	for (const [key, entry] of Object.entries(value)) {
		if (!isRecord(entry)) continue;
		const panel: PanelWorkspaceState = {};
		const top = sanitizeNumber(entry.scrollTop);
		const left = sanitizeNumber(entry.scrollLeft);
		if (top !== undefined) panel.scrollTop = top;
		if (left !== undefined) panel.scrollLeft = left;
		if (Array.isArray(entry.openSections)) {
			panel.openSections = entry.openSections.filter(
				(id): id is string => typeof id === 'string'
			);
		}
		out[key] = panel;
	}
	return out;
}

/**
 * Reads the stored workspace, discarding anything unusable.
 *
 * Never throws and never returns a partially-formed object: a corrupt or
 * hand-edited payload must degrade to "fresh editor", not to a crash on boot.
 */
export function parseWorkspaceState(raw: unknown): WorkspaceState {
	if (!isRecord(raw)) return createEmptyWorkspaceState();
	if (raw.version !== WORKSPACE_PERSIST_VERSION) {
		return createEmptyWorkspaceState();
	}
	const navigation = isRecord(raw.navigation) ? raw.navigation : {};
	const mainTab =
		typeof navigation.mainTab === 'string' ? navigation.mainTab : undefined;
	return {
		version: WORKSPACE_PERSIST_VERSION,
		navigation: {
			...(mainTab ? { mainTab } : {}),
			subTabs: sanitizeStringMap(navigation.subTabs)
		},
		panels: sanitizePanels(raw.panels)
	};
}

/**
 * In-memory snapshot.
 *
 * Two reasons it exists rather than reading `localStorage` on demand:
 * `useSyncExternalStore` needs a stable object identity or it re-renders
 * forever, and the panels that read this do so while a wallpaper canvas is
 * animating, where a synchronous storage read per render is avoidable work.
 */
let snapshot: WorkspaceState | null = null;
const listeners = new Set<() => void>();

function loadFromStorage(): WorkspaceState {
	if (typeof window === 'undefined') return createEmptyWorkspaceState();
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return createEmptyWorkspaceState();
		return parseWorkspaceState(JSON.parse(raw));
	} catch {
		return createEmptyWorkspaceState();
	}
}

export function readWorkspaceState(): WorkspaceState {
	if (!snapshot) snapshot = loadFromStorage();
	return snapshot;
}

export function writeWorkspaceState(state: WorkspaceState): void {
	snapshot = state;
	for (const listener of listeners) listener();
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		/* storage full or unavailable — workspace restore is a nicety */
	}
}

/** Applies a change without callers having to read-modify-write by hand. */
export function updateWorkspaceState(
	update: (current: WorkspaceState) => WorkspaceState
): void {
	writeWorkspaceState(update(readWorkspaceState()));
}

export function subscribeWorkspaceState(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/** Test seam — drops the cache so a suite can start from clean storage. */
export function resetWorkspaceStateCache(): void {
	snapshot = null;
}

/** Reads the sub-view a tab was last showing. */
export function getSubTab(tabId: string): string | undefined {
	return readWorkspaceState().navigation.subTabs[tabId];
}

export function setSubTab(tabId: string, view: string): void {
	updateWorkspaceState(current => ({
		...current,
		navigation: {
			...current.navigation,
			subTabs: { ...current.navigation.subTabs, [tabId]: view }
		}
	}));
}

/** Route key for a panel. Stable by construction: ids, never positions. */
export function panelKey(...segments: (string | undefined | null)[]): string {
	return segments.filter(Boolean).join('/');
}
