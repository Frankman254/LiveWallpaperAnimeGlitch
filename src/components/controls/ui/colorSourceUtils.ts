import type { ColorSourceMode } from '@/types/wallpaper';

/**
 * Returns the shared color source if every entry matches, otherwise `null`.
 * `null` is rendered as "Mixed" by ColorSourceShortcuts so the user can tell
 * that pulling a button will overwrite divergent sub-sources.
 */
export function resolveSharedColorSource(
	sources: ColorSourceMode[]
): ColorSourceMode | null {
	if (sources.length === 0) return null;
	const first = sources[0];
	return sources.every(s => s === first) ? first : null;
}
