const DB_NAME = 'lwag-images';
const DB_VERSION = 1;
const STORE = 'images';

interface ImageRecord {
	id: string;
	data: ArrayBuffer;
	type: string;
}

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = e => {
			const db = (e.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE)) {
				db.createObjectStore(STORE, { keyPath: 'id' });
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function saveImage(file: File): Promise<string> {
	const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	const data = await file.arrayBuffer();
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, 'readwrite');
		tx.objectStore(STORE).put({
			id,
			data,
			type: file.type
		} satisfies ImageRecord);
		tx.oncomplete = () => {
			db.close();
			resolve(id);
		};
		tx.onerror = () => {
			db.close();
			reject(tx.error);
		};
	});
}

export async function loadImage(id: string): Promise<string | null> {
	const db = await openDb();
	return new Promise(resolve => {
		const tx = db.transaction(STORE, 'readonly');
		const req = tx.objectStore(STORE).get(id);
		req.onsuccess = () => {
			db.close();
			if (!req.result) {
				resolve(null);
				return;
			}
			const rec = req.result as ImageRecord;
			const blob = new Blob([rec.data], { type: rec.type });
			resolve(URL.createObjectURL(blob));
		};
		req.onerror = () => {
			db.close();
			resolve(null);
		};
	});
}

export async function deleteImage(id: string): Promise<void> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, 'readwrite');
		tx.objectStore(STORE).delete(id);
		tx.oncomplete = () => {
			db.close();
			resolve();
		};
		tx.onerror = () => {
			db.close();
			reject(tx.error);
		};
	});
}

export async function loadAllImages(
	ids: string[]
): Promise<Map<string, string>> {
	const map = new Map<string, string>();
	await Promise.all(
		ids.map(async id => {
			const url = await loadImage(id);
			if (url) map.set(id, url);
		})
	);
	return map;
}
