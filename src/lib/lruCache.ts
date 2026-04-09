export function getLruEntry<K, V>(map: Map<K, V>, key: K): V | undefined {
	const value = map.get(key);
	if (value === undefined) return undefined;
	map.delete(key);
	map.set(key, value);
	return value;
}

export function setLruEntry<K, V>(
	map: Map<K, V>,
	key: K,
	value: V,
	maxSize: number
): V {
	if (map.has(key)) {
		map.delete(key);
	}
	map.set(key, value);
	while (map.size > maxSize) {
		const oldestKey = map.keys().next().value as K | undefined;
		if (oldestKey === undefined) break;
		map.delete(oldestKey);
	}
	return value;
}
