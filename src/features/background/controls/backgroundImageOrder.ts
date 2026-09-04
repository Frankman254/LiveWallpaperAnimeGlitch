export function moveIdToIndex(
	ids: string[],
	id: string,
	targetIndex: number
): string[] {
	const sourceIndex = ids.indexOf(id);
	if (sourceIndex < 0) return ids;
	const next = ids.filter(candidate => candidate !== id);
	const clamped = Math.max(0, Math.min(next.length, targetIndex));
	next.splice(clamped, 0, id);
	return next;
}

export function shuffleIds(ids: string[]): string[] {
	const next = [...ids];
	for (let index = next.length - 1; index > 0; index -= 1) {
		const randomIndex = Math.floor(Math.random() * (index + 1));
		[next[index], next[randomIndex]] = [next[randomIndex], next[index]];
	}
	return next;
}
