import { useEffect, useMemo } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';

/** Cycles through background images using the active image item. Renders nothing. */
export default function SlideshowManager() {
	const {
		backgroundImages,
		activeImageId,
		slideshowEnabled,
		slideshowInterval,
		motionPaused
	} = useWallpaperStore();
	const slideshowIds = useMemo(
		() =>
			backgroundImages
				.filter(image => image.url)
				.map(image => image.assetId),
		[backgroundImages]
	);

	useEffect(() => {
		if (!slideshowEnabled || motionPaused || slideshowIds.length < 2)
			return;

		const timeoutId = window.setTimeout(
			() => {
				const state = useWallpaperStore.getState();
				const items = state.backgroundImages.filter(image => image.url);
				if (items.length < 2) return;
				const currentIndex = Math.max(
					0,
					items.findIndex(
						image => image.assetId === state.activeImageId
					)
				);
				const nextItem = items[(currentIndex + 1) % items.length];
				state.setActiveImageId(nextItem.assetId);
			},
			Math.max(1, slideshowInterval) * 1000
		);

		return () => clearTimeout(timeoutId);
	}, [
		activeImageId,
		motionPaused,
		slideshowEnabled,
		slideshowIds,
		slideshowInterval
	]);

	return null;
}
