import { FACTORY_DEFAULT_STATE } from '@/lib/factoryDefaults';
import { useWallpaperStore } from '@/store/wallpaperStore';
import type { WallpaperState } from '@/types/wallpaper';

type NumericSetter = (value: number) => void;

let numericDefaultsBySetter: WeakMap<NumericSetter, number> | null = null;

function buildNumericDefaultsBySetter(): WeakMap<NumericSetter, number> {
	const defaults = new WeakMap<NumericSetter, number>();
	const store = useWallpaperStore.getState() as unknown as Record<
		string,
		unknown
	>;

	for (const [actionName, action] of Object.entries(store)) {
		if (!actionName.startsWith('set') || typeof action !== 'function')
			continue;
		const stateKey =
			`${actionName.charAt(3).toLowerCase()}${actionName.slice(4)}` as keyof WallpaperState;
		const value = FACTORY_DEFAULT_STATE[stateKey];
		if (typeof value === 'number')
			defaults.set(action as NumericSetter, value);
	}

	return defaults;
}

/** Resolve the canonical factory number for a direct Zustand setter. */
export function getFactoryNumericDefaultForSetter(
	setter: NumericSetter
): number | undefined {
	numericDefaultsBySetter ??= buildNumericDefaultsBySetter();
	return numericDefaultsBySetter.get(setter);
}
