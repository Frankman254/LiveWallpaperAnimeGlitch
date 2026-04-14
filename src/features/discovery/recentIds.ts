/**
 * Pushes `id` to the front of `ids`, removes duplicates, caps length.
 */
export function pushRecentUnique(
	ids: readonly string[],
	id: string,
	max: number
): string[] {
	const without = ids.filter(x => x !== id);
	return [id, ...without].slice(0, max);
}
