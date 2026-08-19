/**
 * IndexedDB-backed storage for the Zustand persist middleware.
 *
 * Why this replaces `localStorage`: `localStorage` gives about 5 MB, and a real
 * project — a 200-image pool, 120 spectrum slots, 60 slots per other family,
 * dozens of scenes and setlists — reaches that. The failure mode is nasty
 * rather than loud: the write throws, the session keeps working from memory,
 * and everything since the last successful write disappears on reload. That is
 * the shape of a "disappears with no repro" bug. IndexedDB has orders of
 * magnitude more room and no synchronous main-thread cost.
 *
 * Two behaviours make the switch safe:
 *
 *  - **One-way migration on first read.** If IndexedDB is empty and
 *    `localStorage` holds a state, it is copied over. The `localStorage` copy
 *    is deliberately left in place — it costs a few MB and it is the escape
 *    hatch if this adapter ever has to be reverted.
 *  - **Fallback, never failure.** If IndexedDB is unavailable (private mode,
 *    blocked storage), every operation transparently uses `localStorage`
 *    instead. Losing the bigger quota is much better than losing persistence.
 */
import { reportPersistenceFailure } from './persistenceStatus';

const DB_NAME = 'lwag-store';
const DB_VERSION = 1;
const STORE = 'persist';

/** Cached open handle — reopening per write would serialize on the upgrade. */
let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
	if (dbPromise) return dbPromise;
	dbPromise = new Promise(resolve => {
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
				db.createObjectStore(STORE);
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => resolve(null);
		request.onblocked = () => resolve(null);
	});
	return dbPromise;
}

function runRequest<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

/** Reset the cached handle. Tests use this; production never needs it. */
export function resetIndexedDbStorageForTests(): void {
	dbPromise = null;
}

function readLocalStorage(name: string): string | null {
	try {
		return localStorage.getItem(name);
	} catch {
		return null;
	}
}

/**
 * Parse-check a payload before handing it to persist. A truncated or corrupted
 * value would otherwise throw inside the middleware and take the editor down;
 * dropping it falls back to defaults, which is recoverable.
 */
function validate(name: string, raw: string | null): string | null {
	if (!raw) return null;
	try {
		JSON.parse(raw);
		return raw;
	} catch (error) {
		console.error(
			`[lwag] Corrupted persisted state for ${name}; ignoring it.`,
			error
		);
		return null;
	}
}

export const indexedDbStorage = {
	async getItem(name: string): Promise<string | null> {
		const db = await openDb();
		if (!db) return validate(name, readLocalStorage(name));

		try {
			const store = db.transaction(STORE, 'readonly').objectStore(STORE);
			const stored = await runRequest(store.get(name));
			if (typeof stored === 'string') return validate(name, stored);

			// Nothing in IndexedDB yet — adopt whatever localStorage has, so an
			// existing install keeps its project on first load after the switch.
			const legacy = validate(name, readLocalStorage(name));
			if (legacy) {
				await indexedDbStorage.setItem(name, legacy);
			}
			return legacy;
		} catch (error) {
			console.error(`[lwag] IndexedDB read failed for ${name}.`, error);
			return validate(name, readLocalStorage(name));
		}
	},

	async setItem(name: string, value: string): Promise<void> {
		const db = await openDb();
		if (!db) {
			// No IndexedDB: keep the old localStorage path, quota reporting and
			// all, rather than silently dropping the write.
			try {
				localStorage.setItem(name, value);
			} catch (error) {
				console.error(
					`[lwag] Failed to persist ${name} (no IndexedDB, localStorage quota exceeded or unavailable). State kept in memory only.`,
					error
				);
				reportPersistenceFailure(name, error);
			}
			return;
		}

		try {
			const tx = db.transaction(STORE, 'readwrite');
			tx.objectStore(STORE).put(value, name);
			await new Promise<void>((resolve, reject) => {
				tx.oncomplete = () => resolve();
				tx.onerror = () => reject(tx.error);
				tx.onabort = () => reject(tx.error);
			});
		} catch (error) {
			// IndexedDB has its own quota. Report it the same way so the user
			// still gets the "export before reloading" warning.
			console.error(
				`[lwag] Failed to persist ${name} to IndexedDB.`,
				error
			);
			reportPersistenceFailure(name, error);
		}
	},

	async removeItem(name: string): Promise<void> {
		const db = await openDb();
		try {
			localStorage.removeItem(name);
		} catch {
			// Ignored — clearing the legacy copy is best-effort.
		}
		if (!db) return;
		try {
			const tx = db.transaction(STORE, 'readwrite');
			tx.objectStore(STORE).delete(name);
			await new Promise<void>(resolve => {
				tx.oncomplete = () => resolve();
				tx.onerror = () => resolve();
			});
		} catch {
			// Ignored.
		}
	}
};
