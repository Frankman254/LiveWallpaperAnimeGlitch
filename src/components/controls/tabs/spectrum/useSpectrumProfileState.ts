import { useWallpaperStore } from '@/store/wallpaperStore';
import { selectSpectrumActiveProfileIndexForTarget } from '@/features/spectrum/spectrumTargetProfile';
import type { SpectrumProfileTarget } from '@/features/spectrum/spectrumTargetProfile';
import type { WallpaperState } from '@/types/wallpaper';

/**
 * Reactive view of the spectrum profile state for the currently edited target.
 * Subscribes via a selector that derives the active slot index from the live
 * per-target settings, so the active-profile indicator updates immediately
 * after *any* profile-relevant change on that spectrum. Returns a primitive, so
 * the default Object.is equality only re-renders when the active slot changes.
 */
export function useSpectrumProfileState(target: SpectrumProfileTarget): {
	activeProfileIndex: number;
} {
	const activeProfileIndex = useWallpaperStore(state =>
		selectSpectrumActiveProfileIndexForTarget(
			state as WallpaperState,
			target
		)
	);
	return { activeProfileIndex };
}
