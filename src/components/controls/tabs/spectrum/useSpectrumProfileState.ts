import { useWallpaperStore } from '@/store/wallpaperStore';
import { selectSpectrumActiveProfileIndex } from '@/lib/featureProfiles';
import type { WallpaperState } from '@/types/wallpaper';

/**
 * Reactive view of the spectrum profile state. Subscribes to the store via a
 * selector that derives the active profile slot index from live profile
 * settings, so the active-profile indicator updates immediately after *any*
 * profile-relevant change — including changes that the consuming component does
 * not otherwise subscribe to. Returns a primitive, so the default Object.is
 * equality only re-renders the consumer when the active slot actually changes.
 */
export function useSpectrumProfileState(): { activeProfileIndex: number } {
	const activeProfileIndex = useWallpaperStore(state =>
		selectSpectrumActiveProfileIndex(state as WallpaperState)
	);
	return { activeProfileIndex };
}
