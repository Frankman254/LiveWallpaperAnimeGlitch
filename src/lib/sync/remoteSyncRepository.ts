/**
 * `SyncRepository` over the HTTP API in `backend/server`.
 *
 * Deliberately a thin translation layer: the endpoints mirror the interface one
 * for one, so nothing that already calls a repository changes when a project
 * moves from local IndexedDB to the server. Anything smarter (merge policy,
 * offline queueing) belongs above this, not inside it.
 *
 * Blobs are the one place the two implementations genuinely differ. The local
 * adapter stores bytes in IndexedDB; here the bytes belong in object storage
 * and the API carries only metadata. Until an object-storage backend is chosen,
 * `getAsset` returns null and `putAsset` registers metadata only — so a caller
 * that needs bytes must keep using the local repository for them.
 */
import {
	SyncConflictError,
	type AssetMeta,
	type ProjectAssetWrite,
	type ProjectSnapshot,
	type ProjectSummary,
	type SaveProjectInput,
	type SyncRepository
} from './SyncRepository';
import { computeContentHash } from './contentHash';

export type RemoteSyncConfig = {
	/** API origin. Empty string means same-origin (the Vite dev proxy). */
	baseUrl?: string;
	/** Bearer token. Never hard-code one — read it from user input or storage. */
	token: string;
	fetchImpl?: typeof fetch;
};

export class RemoteSyncRepository implements SyncRepository {
	private readonly baseUrl: string;
	private readonly token: string;
	private readonly fetchImpl: typeof fetch;

	constructor(config: RemoteSyncConfig) {
		this.baseUrl = config.baseUrl?.replace(/\/$/, '') ?? '';
		this.token = config.token;
		this.fetchImpl = config.fetchImpl ?? globalThis.fetch.bind(globalThis);
	}

	private async request<T>(
		path: string,
		init: RequestInit & { projectId?: string } = {}
	): Promise<T> {
		const { projectId, ...rest } = init;
		const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
			...rest,
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${this.token}`,
				...(rest.headers ?? {})
			}
		});

		// 409 is the one status with domain meaning: another device wrote in
		// between. Surface it as the typed error callers already handle rather
		// than as a generic failure.
		if (response.status === 409) {
			const body = (await response.json().catch(() => ({}))) as {
				serverRevision?: number;
			};
			throw new SyncConflictError(
				projectId ?? '',
				body.serverRevision ?? 0
			);
		}
		if (response.status === 404) {
			return null as T;
		}
		if (!response.ok) {
			throw new Error(`Sync request failed: ${response.status} ${path}`);
		}
		if (response.status === 204) {
			return undefined as T;
		}
		return (await response.json()) as T;
	}

	listProjects(): Promise<ProjectSummary[]> {
		return this.request<ProjectSummary[]>('/api/projects');
	}

	loadProject(id: string): Promise<ProjectSnapshot | null> {
		return this.request<ProjectSnapshot | null>(
			`/api/projects/${encodeURIComponent(id)}`
		);
	}

	saveProject(input: SaveProjectInput): Promise<ProjectSnapshot> {
		return this.request<ProjectSnapshot>(
			`/api/projects/${encodeURIComponent(input.id)}`,
			{
				method: 'PUT',
				projectId: input.id,
				body: JSON.stringify({
					name: input.name,
					storePersistVersion: input.storePersistVersion,
					state: input.state,
					baseRevision: input.baseRevision
				})
			}
		);
	}

	/**
	 * Saves the project, then registers each asset's metadata.
	 *
	 * Not atomic across the two steps — the schema has no multi-statement
	 * endpoint yet — so a failure mid-manifest leaves the project saved with a
	 * partial asset list. That is recoverable (re-running replays the same
	 * upserts) but it is a real difference from the local adapter, which does
	 * this in one IndexedDB transaction.
	 */
	async saveProjectBundle(
		input: SaveProjectInput,
		assets: ProjectAssetWrite[]
	): Promise<ProjectSnapshot> {
		const saved = await this.saveProject(input);
		for (const asset of assets) {
			await this.putAsset(
				input.id,
				{
					assetId: asset.assetId,
					kind: asset.kind,
					storagePath: asset.storagePath
				},
				asset.blob
			);
		}
		return saved;
	}

	async deleteProject(id: string): Promise<void> {
		await this.request<void>(`/api/projects/${encodeURIComponent(id)}`, {
			method: 'DELETE'
		});
	}

	listAssets(projectId: string): Promise<AssetMeta[]> {
		return this.request<AssetMeta[]>(
			`/api/projects/${encodeURIComponent(projectId)}/assets`
		);
	}

	/** Always null: the API carries metadata, not bytes. See the class note. */
	async getAsset(): Promise<Blob | null> {
		return null;
	}

	async putAsset(
		projectId: string,
		meta: Omit<AssetMeta, 'contentHash' | 'sizeBytes' | 'mimeType'>,
		blob: Blob
	): Promise<AssetMeta> {
		// The hash is computed client-side so the server can dedupe without ever
		// receiving the bytes.
		const contentHash = await computeContentHash(blob);
		const full: AssetMeta = {
			...meta,
			contentHash,
			sizeBytes: blob.size,
			mimeType: blob.type || 'application/octet-stream'
		};
		await this.request<void>(
			`/api/projects/${encodeURIComponent(projectId)}/assets`,
			{ method: 'PUT', body: JSON.stringify(full) }
		);
		return full;
	}
}
