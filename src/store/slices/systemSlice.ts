import type { StateCreator } from 'zustand'
import { DEFAULT_STATE } from '@/lib/constants'
import {
  createCustomPresetId,
  extractPresetValues,
  resolvePreset,
} from '@/lib/presets'
import { syncStateWithActiveBackgroundImage } from '@/store/backgroundStoreUtils'
import type { WallpaperStore } from '@/store/wallpaperStoreTypes'

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0]
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1]
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2]

export function createSystemSlice(set: WallpaperSet, _get: WallpaperGet, _api: WallpaperApi) {
  return ({
  setPerformanceMode: (v) => set({ performanceMode: v }),
  setLanguage: (v) => set({ language: v }),
  setShowFps: (v) => set({ showFps: v }),
  setControlPanelAnchor: (v) => set({ controlPanelAnchor: v }),
  setFpsOverlayAnchor: (v) => set({ fpsOverlayAnchor: v }),
  setEditorTheme: (v) => set({ editorTheme: v }),
  setLayerZIndex: (id, zIndex) =>
    set((state) => ({
      layerZIndices: {
        ...state.layerZIndices,
        [id]: zIndex,
      },
    })),
  resetLayerZIndices: () => set({ layerZIndices: {} }),
  backgroundFallbackVisible: false,
  setBackgroundFallbackVisible: (v) => set({ backgroundFallbackVisible: v }),
  applyPreset: (id) =>
    set((state) => {
      const preset = resolvePreset(id, state.customPresets)
      if (!preset) return state
      return syncStateWithActiveBackgroundImage(state, {
        ...preset.values,
        activePreset: preset.id,
        isPresetDirty: false,
      })
    }),
  saveCustomPreset: (name) =>
    set((state) => {
      const currentCustom = state.customPresets[state.activePreset]
      const nextName = name?.trim() || currentCustom?.name || 'Custom Preset'
      const id = currentCustom?.id ?? createCustomPresetId()

      return {
        customPresets: {
          ...state.customPresets,
          [id]: {
            id,
            name: nextName,
            values: extractPresetValues(state),
          },
        },
        activePreset: id,
        isPresetDirty: false,
      }
    }),
  duplicatePreset: (name) =>
    set((state) => {
      const source = resolvePreset(state.activePreset, state.customPresets)
      const nextName = name?.trim() || `${source?.name ?? 'Preset'} Copy`
      const id = createCustomPresetId()

      return {
        customPresets: {
          ...state.customPresets,
          [id]: {
            id,
            name: nextName,
            values: extractPresetValues(state),
          },
        },
        activePreset: id,
        isPresetDirty: false,
      }
    }),
  revertToActivePreset: () =>
    set((state) => {
      const preset = resolvePreset(state.activePreset, state.customPresets)
      if (!preset) return state
      return syncStateWithActiveBackgroundImage(state, {
        ...preset.values,
        isPresetDirty: false,
      })
    }),
  reset: () =>
    set((state) => ({
      ...DEFAULT_STATE,
      customPresets: state.customPresets,
      language: state.language,
    })),
  resetSection: (keys) =>
    set((state) => syncStateWithActiveBackgroundImage(
      state,
      Object.fromEntries(keys.map((k) => [k, DEFAULT_STATE[k]]))
    )),
  }) satisfies Partial<WallpaperStore>
}
