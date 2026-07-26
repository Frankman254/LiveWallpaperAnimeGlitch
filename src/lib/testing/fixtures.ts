import type { ProfileSlot, Setlist } from '@/types/wallpaper';

/**
 * Fixtures for types whose required fields tests keep forgetting.
 *
 * `ProfileSlot.id` (migration v104) and `Setlist.createdAt` were both added to
 * production types without updating the test literals that build them, and
 * `test:types` accumulated ~25 errors from the drift. Building fixtures through
 * these helpers means the next required field is one edit here instead of
 * twenty across the suite.
 *
 * Excluded from the app build via `tsconfig.json`'s `exclude`.
 *
 * Ids are derived from the name rather than generated, so a failing assertion
 * points at a readable id and reruns stay deterministic.
 */

export function emptyProfileSlot<T>(name: string): ProfileSlot<T> {
	return { id: `slot-${name}`, name, values: null };
}

export function profileSlot<T>(name: string, values: T): ProfileSlot<T> {
	return { id: `slot-${name}`, name, values };
}

export function emptyProfileSlots<T>(
	...names: readonly string[]
): ProfileSlot<T>[] {
	return names.map(name => emptyProfileSlot<T>(name));
}

export function setlist(patch: Partial<Setlist> & { id: string }): Setlist {
	return {
		name: patch.id,
		imageAssetIds: [],
		trackIds: [],
		createdAt: 0,
		...patch
	};
}
