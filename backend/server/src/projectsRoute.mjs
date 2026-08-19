/**
 * Project sync API — the server half of `SyncRepository`.
 *
 * Endpoints mirror the client contract in `src/lib/sync/SyncRepository.ts` one
 * for one, so the remote adapter is a thin translation layer rather than a new
 * design. Blobs are deliberately absent: the schema stores only asset metadata
 * (hash, size, mime, storage path) and the bytes belong in object storage.
 *
 * Concurrency: every project row carries a `revision` bumped by a trigger on
 * write. A caller passes the revision its edit was based on; a mismatch is a
 * 409 rather than a silent overwrite, which is what lets two devices detect
 * that they diverged instead of one quietly losing its slots.
 */

function rowToSummary(row) {
	return {
		id: row.id,
		name: row.name,
		updatedAt: row.updated_at.toISOString(),
		revision: Number(row.revision)
	};
}

function rowToSnapshot(row) {
	return {
		...rowToSummary(row),
		storePersistVersion: row.store_persist_version,
		state: row.state
	};
}

export function createProjectsRouter({ pool, logger = console }) {
	return {
		async list(req, res) {
			const { rows } = await pool.query(
				`select id, name, updated_at, revision
				   from wallpaper_projects
				  where owner_id = $1
				  order by updated_at desc`,
				[req.ownerId]
			);
			res.json(rows.map(rowToSummary));
		},

		async load(req, res) {
			const { rows } = await pool.query(
				`select id, name, updated_at, revision, store_persist_version, state
				   from wallpaper_projects
				  where owner_id = $1 and id = $2`,
				[req.ownerId, req.params.id]
			);
			if (rows.length === 0) {
				res.status(404).json({ error: 'not found' });
				return;
			}
			res.json(rowToSnapshot(rows[0]));
		},

		async save(req, res) {
			const { name, storePersistVersion, state, baseRevision } =
				req.body ?? {};
			const id = req.params.id;

			if (!state || typeof storePersistVersion !== 'number') {
				res.status(400).json({
					error: 'state and storePersistVersion are required'
				});
				return;
			}

			const client = await pool.connect();
			try {
				await client.query('begin');

				const existing = await client.query(
					`select revision from wallpaper_projects
					  where owner_id = $1 and id = $2 for update`,
					[req.ownerId, id]
				);

				if (existing.rows.length === 0) {
					// First insert. A caller that thinks it is updating (has a
					// baseRevision) but finds nothing is looking at a deleted
					// project — report the conflict rather than silently resurrect.
					if (baseRevision !== undefined) {
						await client.query('rollback');
						res.status(409).json({
							error: 'conflict',
							serverRevision: 0
						});
						return;
					}
					const inserted = await client.query(
						`insert into wallpaper_projects
						   (id, owner_id, name, store_persist_version, state)
						 values ($1, $2, $3, $4, $5)
						 returning id, name, updated_at, revision,
						           store_persist_version, state`,
						[
							id,
							req.ownerId,
							name ?? 'Untitled',
							storePersistVersion,
							state
						]
					);
					await client.query('commit');
					res.json(rowToSnapshot(inserted.rows[0]));
					return;
				}

				const serverRevision = Number(existing.rows[0].revision);
				if (
					baseRevision !== undefined &&
					baseRevision !== serverRevision
				) {
					await client.query('rollback');
					res.status(409).json({ error: 'conflict', serverRevision });
					return;
				}

				const updated = await client.query(
					`update wallpaper_projects
					    set name = $3,
					        store_persist_version = $4,
					        state = $5
					  where owner_id = $1 and id = $2
					  returning id, name, updated_at, revision,
					            store_persist_version, state`,
					[
						req.ownerId,
						id,
						name ?? 'Untitled',
						storePersistVersion,
						state
					]
				);
				await client.query('commit');
				res.json(rowToSnapshot(updated.rows[0]));
			} catch (error) {
				await client.query('rollback').catch(() => {});
				logger.error(
					'[projects] save failed:',
					error?.message ?? error
				);
				res.status(500).json({ error: 'save failed' });
			} finally {
				client.release();
			}
		},

		async remove(req, res) {
			await pool.query(
				`delete from wallpaper_projects where owner_id = $1 and id = $2`,
				[req.ownerId, req.params.id]
			);
			res.status(204).end();
		},

		async listAssets(req, res) {
			const { rows } = await pool.query(
				`select a.asset_id, a.kind, a.content_hash, a.size_bytes,
				        a.mime_type, a.storage_path
				   from project_assets a
				   join wallpaper_projects p on p.id = a.project_id
				  where p.owner_id = $1 and a.project_id = $2`,
				[req.ownerId, req.params.id]
			);
			res.json(
				rows.map(row => ({
					assetId: row.asset_id,
					kind: row.kind,
					contentHash: row.content_hash,
					sizeBytes: Number(row.size_bytes),
					mimeType: row.mime_type,
					storagePath: row.storage_path ?? undefined
				}))
			);
		},

		async putAsset(req, res) {
			const {
				assetId,
				kind,
				contentHash,
				sizeBytes,
				mimeType,
				storagePath
			} = req.body ?? {};
			if (!assetId || !kind || !contentHash) {
				res.status(400).json({
					error: 'assetId, kind and contentHash are required'
				});
				return;
			}

			const owns = await pool.query(
				`select 1 from wallpaper_projects where owner_id = $1 and id = $2`,
				[req.ownerId, req.params.id]
			);
			if (owns.rows.length === 0) {
				res.status(404).json({ error: 'not found' });
				return;
			}

			await pool.query(
				`insert into project_assets
				   (project_id, asset_id, kind, content_hash, size_bytes,
				    mime_type, storage_path)
				 values ($1, $2, $3, $4, $5, $6, $7)
				 on conflict (project_id, asset_id) do update
				   set kind = excluded.kind,
				       content_hash = excluded.content_hash,
				       size_bytes = excluded.size_bytes,
				       mime_type = excluded.mime_type,
				       storage_path = excluded.storage_path`,
				[
					req.params.id,
					assetId,
					kind,
					contentHash,
					sizeBytes ?? 0,
					mimeType ?? 'application/octet-stream',
					storagePath ?? null
				]
			);
			res.status(204).end();
		}
	};
}
