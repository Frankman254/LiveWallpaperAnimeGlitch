import { useEffect } from 'react';
import { doesStateMatchPreset } from '@/lib/presets';
import { useWallpaperStore } from '@/store/wallpaperStore';

export function usePresetDirtyTracker(): void {
	useEffect(() => {
		const unsubscribe = useWallpaperStore.subscribe(state => {
			const isDirty = !doesStateMatchPreset(state);
			if (state.isPresetDirty !== isDirty) {
				useWallpaperStore.setState({ isPresetDirty: isDirty });
			}
		});
		return unsubscribe;
	}, []);
}
