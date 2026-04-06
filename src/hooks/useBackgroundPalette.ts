import { useEffect, useMemo, useState } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import {
	DEFAULT_BACKGROUND_PALETTE,
	getBackgroundPalette,
	resolvePaletteSourceUrl,
	type BackgroundPalette
} from '@/lib/backgroundPalette';

export function useBackgroundPalette(): BackgroundPalette {
	const backgroundImageEnabled = useWallpaperStore(
		state => state.backgroundImageEnabled
	);
	const imageUrl = useWallpaperStore(state => state.imageUrl);
	const globalBackgroundEnabled = useWallpaperStore(
		state => state.globalBackgroundEnabled
	);
	const globalBackgroundUrl = useWallpaperStore(
		state => state.globalBackgroundUrl
	);
	const sourceUrl = useMemo(
		() =>
			resolvePaletteSourceUrl({
				backgroundImageEnabled,
				imageUrl,
				globalBackgroundEnabled,
				globalBackgroundUrl
			}),
		[
			backgroundImageEnabled,
			imageUrl,
			globalBackgroundEnabled,
			globalBackgroundUrl
		]
	);
	const [palette, setPalette] = useState<BackgroundPalette>(
		DEFAULT_BACKGROUND_PALETTE
	);

	useEffect(() => {
		let cancelled = false;
		void getBackgroundPalette(sourceUrl).then(nextPalette => {
			if (!cancelled) setPalette(nextPalette);
		});
		return () => {
			cancelled = true;
		};
	}, [sourceUrl]);

	return sourceUrl
		? palette.sourceUrl === sourceUrl
			? palette
			: { ...DEFAULT_BACKGROUND_PALETTE, sourceUrl }
		: DEFAULT_BACKGROUND_PALETTE;
}
