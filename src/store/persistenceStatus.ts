export type PersistenceFailure = {
	id: number;
	storageName: string;
	kind: 'quota' | 'unavailable';
};

type Listener = () => void;

let failure: PersistenceFailure | null = null;
let nextFailureId = 1;
const listeners = new Set<Listener>();

export function classifyPersistenceFailure(
	error: unknown
): PersistenceFailure['kind'] {
	if (
		typeof error === 'object' &&
		error !== null &&
		('name' in error || 'code' in error)
	) {
		const name = 'name' in error ? String(error.name) : '';
		const code = 'code' in error ? Number(error.code) : 0;
		if (
			name === 'QuotaExceededError' ||
			name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
			code === 22 ||
			code === 1014
		) {
			return 'quota';
		}
	}
	return 'unavailable';
}

export function reportPersistenceFailure(
	storageName: string,
	error: unknown
): void {
	if (failure?.storageName === storageName) return;
	failure = {
		id: nextFailureId,
		storageName,
		kind: classifyPersistenceFailure(error)
	};
	nextFailureId += 1;
	listeners.forEach(listener => listener());
}

export function clearPersistenceFailure(id?: number): void {
	if (!failure || (id !== undefined && failure.id !== id)) return;
	failure = null;
	listeners.forEach(listener => listener());
}

export function getPersistenceFailureSnapshot(): PersistenceFailure | null {
	return failure;
}

export function subscribePersistenceFailure(listener: Listener): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}
