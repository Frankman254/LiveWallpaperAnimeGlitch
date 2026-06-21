/**
 * Pure playlist navigation. Given the ordered list of navigable track ids and
 * the currently active id, resolve the next/previous id. Wraps around at the
 * ends, and returns null when there is nothing to navigate to (empty list) so
 * callers can no-op safely instead of crashing.
 */
export function resolveNextTrackId(
	orderedIds: readonly string[],
	activeId: string | null
): string | null {
	if (orderedIds.length === 0) return null;
	const idx = orderedIds.findIndex(id => id === activeId);
	// Unknown/!found active → start from the top; otherwise advance + wrap.
	return orderedIds[idx + 1] ?? orderedIds[0] ?? null;
}

export function resolvePrevTrackId(
	orderedIds: readonly string[],
	activeId: string | null
): string | null {
	if (orderedIds.length === 0) return null;
	const idx = orderedIds.findIndex(id => id === activeId);
	if (idx > 0) return orderedIds[idx - 1] ?? null;
	// At the first track (or active not found) → wrap to the last.
	return orderedIds[orderedIds.length - 1] ?? null;
}
