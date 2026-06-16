import { CANONICAL_DEFAULT_STATE_PATCH } from '@/lib/canonicalFactoryPresets';
import { DEFAULT_STATE } from '@/lib/constants';
import type { WallpaperState } from '@/types/wallpaper';

export const FACTORY_DEFAULT_STATE = {
	...DEFAULT_STATE,
	...CANONICAL_DEFAULT_STATE_PATCH
} as WallpaperState;

export function cloneFactoryDefaultState(): WallpaperState {
	if (typeof structuredClone === 'function') {
		return structuredClone(FACTORY_DEFAULT_STATE);
	}

	return JSON.parse(JSON.stringify(FACTORY_DEFAULT_STATE)) as WallpaperState;
}

export function getFactoryDefaultValue<K extends keyof WallpaperState>(
	key: K
): WallpaperState[K] {
	if (
		Object.prototype.hasOwnProperty.call(CANONICAL_DEFAULT_STATE_PATCH, key)
	) {
		return CANONICAL_DEFAULT_STATE_PATCH[key] as WallpaperState[K];
	}

	return DEFAULT_STATE[key];
}
