import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import type { WallpaperState } from '@/types/wallpaper';
import { SyncConflictError } from './SyncRepository';
import { LocalSyncRepository } from './localSyncRepository';

function deleteSyncDb(): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.deleteDatabase('lwag-sync');
		request.onsuccess = () => resolve();
		request.onerror = () => reject(request.error);
	});
}

function state(label: string): WallpaperState {
	return { audioFileName: label } as WallpaperState;
}

describe('LocalSyncRepository', () => {
	beforeEach(async () => {
		await deleteSyncDb();
	});

	it('atomically replaces project state and its complete asset manifest', async () => {
		const repository = new LocalSyncRepository();
		const first = await repository.saveProjectBundle(
			{
				id: 'project-a',
				name: 'Project A',
				storePersistVersion: 104,
				state: state('first')
			},
			[
				{
					assetId: 'old-image',
					kind: 'image',
					blob: new Blob(['old'], { type: 'image/png' })
				}
			]
		);
		expect(first.revision).toBe(1);

		const second = await repository.saveProjectBundle(
			{
				id: 'project-a',
				name: 'Project A updated',
				storePersistVersion: 104,
				state: state('second'),
				baseRevision: first.revision
			},
			[
				{
					assetId: 'new-audio',
					kind: 'audio',
					blob: new Blob(['new'], { type: 'audio/mpeg' })
				}
			]
		);

		expect(second.revision).toBe(2);
		expect(second.state.audioFileName).toBe('second');
		expect(await repository.getAsset('project-a', 'old-image')).toBeNull();
		expect(
			await (await repository.getAsset('project-a', 'new-audio'))?.text()
		).toBe('new');
		expect(await repository.listAssets('project-a')).toMatchObject([
			{
				assetId: 'new-audio',
				kind: 'audio',
				mimeType: 'audio/mpeg',
				sizeBytes: 3
			}
		]);
	});

	it('rejects a stale revision without changing state or blobs', async () => {
		const repository = new LocalSyncRepository();
		await repository.saveProjectBundle(
			{
				id: 'project-a',
				name: 'Stable',
				storePersistVersion: 104,
				state: state('stable')
			},
			[
				{
					assetId: 'asset',
					kind: 'image',
					blob: new Blob(['stable'], { type: 'image/png' })
				}
			]
		);

		await expect(
			repository.saveProjectBundle(
				{
					id: 'project-a',
					name: 'Stale write',
					storePersistVersion: 104,
					state: state('stale'),
					baseRevision: 0
				},
				[
					{
						assetId: 'asset',
						kind: 'image',
						blob: new Blob(['stale'], { type: 'image/png' })
					}
				]
			)
		).rejects.toBeInstanceOf(SyncConflictError);

		const stored = await repository.loadProject('project-a');
		expect(stored?.name).toBe('Stable');
		expect(stored?.state.audioFileName).toBe('stable');
		expect(
			await (await repository.getAsset('project-a', 'asset'))?.text()
		).toBe('stable');
	});

	it('deletes a project and all of its assets together', async () => {
		const repository = new LocalSyncRepository();
		await repository.saveProjectBundle(
			{
				id: 'project-a',
				name: 'Delete me',
				storePersistVersion: 104,
				state: state('delete')
			},
			[
				{
					assetId: 'asset',
					kind: 'image',
					blob: new Blob(['data'], { type: 'image/png' })
				}
			]
		);

		await repository.deleteProject('project-a');
		expect(await repository.loadProject('project-a')).toBeNull();
		expect(await repository.listAssets('project-a')).toEqual([]);
	});
});
