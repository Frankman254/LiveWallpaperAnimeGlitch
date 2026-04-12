const DB_NAME = 'lwag-folders';
const DB_VERSION = 1;
const STORE = 'handles';

interface FolderHandleRecord {
	id: string;
	handle: FileSystemDirectoryHandle;
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

export async function saveFolderHandle(
	id: string,
	handle: FileSystemDirectoryHandle
): Promise<void> {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, 'readwrite');
		tx.objectStore(STORE).put({ id, handle } satisfies FolderHandleRecord);
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

export async function getFolderHandle(
	id: string
): Promise<FileSystemDirectoryHandle | null> {
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
			resolve((req.result as FolderHandleRecord).handle);
		};
		req.onerror = () => {
			db.close();
			resolve(null);
		};
	});
}

export async function removeFolderHandle(id: string): Promise<void> {
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

export async function getVirtualFileBlob(
	folderId: 'audio' | 'image',
	fileName: string
): Promise<Blob | null> {
	try {
		const handle = await getFolderHandle(folderId);
		if (!handle) return null;

		// Verify permission
		const fh = handle as any;
		if (typeof fh.queryPermission === 'function') {
			if ((await fh.queryPermission({ mode: 'read' })) !== 'granted') {
				const perm = await fh.requestPermission({ mode: 'read' });
				if (perm !== 'granted') return null;
			}
		}

		const fileHandle = await handle.getFileHandle(fileName);
		const file = await fileHandle.getFile();
		return file;
	} catch (error) {
		console.warn(`[lwag] Missing virtual file: ${fileName} in ${folderId}`, error);
		return null;
	}
}
