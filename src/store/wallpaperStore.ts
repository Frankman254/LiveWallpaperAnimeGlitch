import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_STATE } from '@/lib/constants';
import {
	createAudioPlaylistSlice,
	createAudioSlice,
	createBackgroundSlice,
	createLogoSlice,
	createParticlesRainSlice,
	createSpectrumSlice,
	createSystemSlice
} from '@/store/storeSlices';
import {
	migrateWallpaperStore,
	partializeWallpaperStore
} from '@/store/wallpaperStorePersistence';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';

const safeStorage = {
	getItem: (name: string) => {
		const str = localStorage.getItem(name);
		if (!str) return null;
		try {
			JSON.parse(str);
			return str;
		} catch (e) {
			console.error(`[lwag] Error parsing ${name} from localStorage. Clearing corrupted data.`, e);
			localStorage.removeItem(name);
			return null;
		}
	},
	setItem: (name: string, value: string) => localStorage.setItem(name, value),
	removeItem: (name: string) => localStorage.removeItem(name)
};

export const useWallpaperStore = create<WallpaperStore>()(
	persist(
		(set, get, api) => ({
			...DEFAULT_STATE,
			...createBackgroundSlice(set, get, api),
			...createAudioSlice(set, get, api),
			...createAudioPlaylistSlice(set, get, api),
			...createSpectrumSlice(set, get, api),
			...createLogoSlice(set, get, api),
			...createParticlesRainSlice(set, get, api),
			...createSystemSlice(set, get, api)
		}),
		{
			name: 'lwag-state',
			version: 36,
			migrate: migrateWallpaperStore,
			partialize: partializeWallpaperStore,
			storage: createJSONStorage(() => safeStorage)
		}
	)
);

export type { WallpaperStore } from '@/store/wallpaperStoreTypes';
