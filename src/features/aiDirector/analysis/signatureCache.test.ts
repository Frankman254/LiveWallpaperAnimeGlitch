import 'fake-indexeddb/auto';
import { describe, it, expect, vi } from 'vitest';
import {
	getOrComputeSignature,
	invalidateCachedSignature,
	readCachedSignature,
	writeCachedSignature
} from './signatureCache';
import { IMAGE_SIGNATURE_VERSION, type ImageSignature } from './imageSignature';

function signature(luma = 0.5): ImageSignature {
	return {
		palette: [{ hex: '#112233', weight: 1 }],
		luma,
		saturation: 0.4,
		contrast: 0.3,
		edgeDensity: 0.2,
		colorCount: 120,
		isPixelArt: false,
		aspect: 1.5,
		version: IMAGE_SIGNATURE_VERSION
	};
}

describe('signatureCache', () => {
	it('misses on an unknown asset', async () => {
		expect(await readCachedSignature('never-stored')).toBeNull();
	});

	it('round-trips a signature', async () => {
		await writeCachedSignature('asset-a', signature(0.42));
		expect(await readCachedSignature('asset-a')).toEqual(signature(0.42));
	});

	it('overwrites an existing entry', async () => {
		await writeCachedSignature('asset-b', signature(0.1));
		await writeCachedSignature('asset-b', signature(0.9));
		expect((await readCachedSignature('asset-b'))?.luma).toBe(0.9);
	});

	it('treats an entry from another analyzer version as a miss', async () => {
		await writeCachedSignature('asset-c', signature());
		// Simulate a version bump by writing a row with a stale version through
		// the same store the cache reads from.
		const db = await new Promise<IDBDatabase>(resolve => {
			const request = indexedDB.open('lwag-ai-director', 1);
			request.onsuccess = () => resolve(request.result);
		});
		await new Promise<void>(resolve => {
			const tx = db.transaction('signatures', 'readwrite');
			tx.objectStore('signatures').put({
				assetId: 'asset-c',
				signature: signature(),
				version: IMAGE_SIGNATURE_VERSION + 99,
				updatedAt: Date.now()
			});
			tx.oncomplete = () => resolve();
		});
		db.close();

		expect(await readCachedSignature('asset-c')).toBeNull();
	});

	it('drops an invalidated entry', async () => {
		await writeCachedSignature('asset-d', signature());
		await invalidateCachedSignature('asset-d');
		expect(await readCachedSignature('asset-d')).toBeNull();
	});

	it('computes once, then serves from cache', async () => {
		const analyze = vi.fn().mockResolvedValue(signature(0.77));

		const first = await getOrComputeSignature('asset-e', analyze);
		const second = await getOrComputeSignature('asset-e', analyze);

		expect(first).toEqual(second);
		expect(analyze).toHaveBeenCalledTimes(1);
	});
});
