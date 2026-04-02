import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_STATE } from '@/lib/constants'
import {
  createAudioSlice,
  createBackgroundSlice,
  createLogoSlice,
  createParticlesRainSlice,
  createSpectrumSlice,
  createSystemSlice,
} from '@/store/storeSlices'
import { migrateWallpaperStore, partializeWallpaperStore } from '@/store/wallpaperStorePersistence'
import type { WallpaperStore } from '@/store/wallpaperStoreTypes'

export const useWallpaperStore = create<WallpaperStore>()(
  persist(
    (set, get, api) => ({
      ...DEFAULT_STATE,
      ...createBackgroundSlice(set, get, api),
      ...createAudioSlice(set, get, api),
      ...createSpectrumSlice(set, get, api),
      ...createLogoSlice(set, get, api),
      ...createParticlesRainSlice(set, get, api),
      ...createSystemSlice(set, get, api),
    }),
    {
      name: 'lwag-state',
      version: 18,
      migrate: migrateWallpaperStore,
      partialize: partializeWallpaperStore,
    }
  )
)

export type { WallpaperStore } from '@/store/wallpaperStoreTypes'
