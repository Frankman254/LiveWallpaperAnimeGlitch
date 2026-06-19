import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FACTORY_DEFAULT_STATE } from '@/lib/factoryDefaults';
import {
	createAudioPlaylistSlice,
	createAudioSlice,
	createAudioLyricsSlice,
	createBackgroundSlice,
	createCalibrationSlice,
	createLayoutSlice,
	createLogoSlice,
	createParticlesRainSlice,
	createSetlistsSlice,
	createStageCameraSlice,
	createSpectrumSlice,
	createSystemSlice
} from '@/store/storeSlices';
import { migrateWallpaperStore } from '@/store/wallpaperStoreMigrations';
import { partializeWallpaperStore } from '@/store/wallpaperStorePersistence';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import { STORE_PERSIST_VERSION } from '@/lib/version';

const safeStorage = {
	getItem: (name: string) => {
		const str = localStorage.getItem(name);
		if (!str) return null;
		try {
			JSON.parse(str);
			return str;
		} catch (e) {
			console.error(
				`[lwag] Error parsing ${name} from localStorage. Clearing corrupted data.`,
				e
			);
			localStorage.removeItem(name);
			return null;
		}
	},
	setItem: (name: string, value: string) => {
		try {
			localStorage.setItem(name, value);
		} catch (e) {
			// Quota exceeded (too many saved slots / heavy state) or storage
			// disabled. Don't let the persist write throw and crash the editor;
			// the in-memory state stays intact for this session. Surfacing a
			// proper "storage full" toast is a follow-up.
			console.error(
				`[lwag] Failed to persist ${name} to localStorage (quota exceeded or storage unavailable). State kept in memory only.`,
				e
			);
		}
	},
	removeItem: (name: string) => localStorage.removeItem(name)
};

export const useWallpaperStore = create<WallpaperStore>()(
	persist(
		(set, get, api) => ({
			...FACTORY_DEFAULT_STATE,
			...createBackgroundSlice(set, get, api),
			...createAudioSlice(set, get, api),
			...createAudioLyricsSlice(set, get, api),
			...createAudioPlaylistSlice(set, get, api),
			...createLayoutSlice(set, get, api),
			...createSpectrumSlice(set, get, api),
			...createLogoSlice(set, get, api),
			...createParticlesRainSlice(set, get, api),
			...createSystemSlice(set, get, api),
			...createCalibrationSlice(set, get, api),
			...createSetlistsSlice(set, get, api),
			...createStageCameraSlice(set, get, api)
		}),
		{
			name: 'lwag-state',
			version: STORE_PERSIST_VERSION,
			migrate: migrateWallpaperStore,
			partialize: partializeWallpaperStore,
			storage: createJSONStorage(() => safeStorage)
		}
	)
);

export type { WallpaperStore } from '@/store/wallpaperStoreTypes';
