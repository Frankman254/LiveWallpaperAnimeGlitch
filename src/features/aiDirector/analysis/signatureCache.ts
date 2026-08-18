/**
 * IndexedDB cache for image signatures, keyed by `assetId`.
 *
 * Analysis is cheap but not free, and the batch flow re-reads every signature
 * on each pass over the pool. Entries carry the analyzer version, so bumping
 * `IMAGE_SIGNATURE_VERSION` invalidates them without a manual migration.
 *
 * Every operation degrades to a miss rather than throwing: a browser with
 * IndexedDB blocked (private mode, storage pressure) must still be able to run
 * the analysis, just without caching.
 */
import { IMAGE_SIGNATURE_VERSION, type ImageSignature } from './imageSignature';

const DB_NAME = 'lwag-ai-director';
const DB_VERSION = 1;
const STORE = 'signatures';

type CacheRow = {
	assetId: string;
	signature: ImageSignature;
	version: number;
	updatedAt: number;
};

function openDb(): Promise<IDBDatabase | null> {
	return new Promise(resolve => {
		if (typeof indexedDB === 'undefined') {
			resolve(null);
			return;
		}
		let request: IDBOpenDBRequest;
		try {
			request = indexedDB.open(DB_NAME, DB_VERSION);
		} catch {
			resolve(null);
			return;
		}
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE)) {
				db.createObjectStore(STORE, { keyPath: 'assetId' });
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => resolve(null);
		request.onblocked = () => resolve(null);
	});
}

function runRequest<T>(request: IDBRequest<T>): Promise<T | null> {
	return new Promise(resolve => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => resolve(null);
	});
}

/** Cached signature for `assetId`, or null on a miss / stale version. */
export async function readCachedSignature(
	assetId: string
): Promise<ImageSignature | null> {
	const db = await openDb();
	if (!db) return null;
	try {
		const store = db.transaction(STORE, 'readonly').objectStore(STORE);
		const row = (await runRequest(store.get(assetId))) as CacheRow | null;
		if (!row || row.version !== IMAGE_SIGNATURE_VERSION) return null;
		return row.signature;
	} catch {
		return null;
	} finally {
		db.close();
	}
}

/** Store a signature. Failures are swallowed — caching is an optimization. */
export async function writeCachedSignature(
	assetId: string,
	signature: ImageSignature
): Promise<void> {
	const db = await openDb();
	if (!db) return;
	try {
		const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
		await runRequest(
			store.put({
				assetId,
				signature,
				version: IMAGE_SIGNATURE_VERSION,
				updatedAt: Date.now()
			} satisfies CacheRow)
		);
	} catch {
		// Ignored: a failed cache write must never break analysis.
	} finally {
		db.close();
	}
}

/** Drop a single entry — used when an image's bytes are replaced in place. */
export async function invalidateCachedSignature(
	assetId: string
): Promise<void> {
	const db = await openDb();
	if (!db) return;
	try {
		const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
		await runRequest(store.delete(assetId));
	} catch {
		// Ignored.
	} finally {
		db.close();
	}
}

/**
 * Cache-through analysis. `analyze` is injected so the pure/DOM split stays
 * intact and tests can drive this without a canvas.
 */
export async function getOrComputeSignature(
	assetId: string,
	analyze: () => Promise<ImageSignature>
): Promise<ImageSignature> {
	const cached = await readCachedSignature(assetId);
	if (cached) return cached;
	const signature = await analyze();
	await writeCachedSignature(assetId, signature);
	return signature;
}
