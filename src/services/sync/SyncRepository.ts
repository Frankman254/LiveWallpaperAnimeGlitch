import type { WallpaperState } from '@/types/wallpaper';

/**
 * Client-side sync abstraction. Today the only implementation is
 * `LocalSyncRepository` (IndexedDB); a Postgres/Supabase adapter implements the
 * same interface later, so nothing that calls a repository changes when the
 * real backend lands. The DB schema in `backend/schema` mirrors these types.
 */

/** Lightweight row for list views — no heavy `state` payload. */
export type ProjectSummary = {
	id: string;
	name: string;
	updatedAt: string;
	revision: number;
};

/** A full project: the versioned state payload plus sync metadata. Mirrors a
 *  row of `wallpaper_projects`. `state` is exactly what the settings export
 *  writes, so reads run the client migration chain from `storePersistVersion`. */
export type ProjectSnapshot = ProjectSummary & {
	storePersistVersion: number;
	state: WallpaperState;
};

export type AssetKind = 'image' | 'audio' | 'logo' | 'overlay' | 'lyrics';

/** Asset metadata — bytes live in object storage, never inline. Mirrors a row
 *  of `project_assets`. `contentHash` powers dedupe + change detection. */
export type AssetMeta = {
	assetId: string;
	kind: AssetKind;
	contentHash: string;
	sizeBytes: number;
	mimeType: string;
	storagePath?: string;
};

export type ProjectAssetWrite = {
	assetId: string;
	kind: AssetKind;
	storagePath?: string;
	blob: Blob;
};

/** Thrown by `saveProject` when the caller's `baseRevision` is stale (another
 *  device wrote in between). Callers reload and merge before retrying. */
export class SyncConflictError extends Error {
	constructor(
		public readonly projectId: string,
		public readonly serverRevision: number
	) {
		super(
			`Project ${projectId} changed on the server (revision ${serverRevision})`
		);
		this.name = 'SyncConflictError';
	}
}

export type SaveProjectInput = {
	id: string;
	name: string;
	storePersistVersion: number;
	state: WallpaperState;
	/** Revision the edit was based on. Omit for a first insert. When it lags
	 *  the stored revision the repository throws `SyncConflictError`. */
	baseRevision?: number;
};

export interface SyncRepository {
	listProjects(): Promise<ProjectSummary[]>;
	loadProject(id: string): Promise<ProjectSnapshot | null>;
	/** Insert or update. Returns the stored snapshot with its bumped revision. */
	saveProject(input: SaveProjectInput): Promise<ProjectSnapshot>;
	/** Atomically replace a project's state and complete asset manifest. */
	saveProjectBundle(
		input: SaveProjectInput,
		assets: ProjectAssetWrite[]
	): Promise<ProjectSnapshot>;
	deleteProject(id: string): Promise<void>;

	listAssets(projectId: string): Promise<AssetMeta[]>;
	getAsset(projectId: string, assetId: string): Promise<Blob | null>;
	/** Register (or refresh) an asset's metadata. The blob itself is handed to
	 *  object storage by the adapter; the local adapter keeps it in IndexedDB. */
	putAsset(
		projectId: string,
		meta: Omit<AssetMeta, 'contentHash' | 'sizeBytes' | 'mimeType'>,
		blob: Blob
	): Promise<AssetMeta>;
}
