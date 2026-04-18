import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

export function partializeWallpaperStore(
	state: WallpaperStore
): Partial<WallpaperStore> {
	const {
		audioCaptureState,
		imageUrl,
		globalBackgroundUrl,
		logoUrl,
		imageUrls,
		isPresetDirty,
		backgroundFallbackVisible,
		setBackgroundFallbackVisible,
		sleepModeActive,
		setSleepModeActive,
		controlPanelActiveTab,
		setControlPanelActiveTab,
		...rest
	} = state;

	void audioCaptureState;
	void imageUrl;
	void globalBackgroundUrl;
	void logoUrl;
	void imageUrls;
	void isPresetDirty;
	void backgroundFallbackVisible;
	void setBackgroundFallbackVisible;
	void sleepModeActive;
	void setSleepModeActive;
	void controlPanelActiveTab;
	void setControlPanelActiveTab;

	return {
		...rest,
		backgroundImages: state.backgroundImages.map(image => ({
			...image,
			url: null as string | null
		})),
		overlays: state.overlays.map(overlay => ({
			...overlay,
			url: null as string | null
		}))
	};
}
