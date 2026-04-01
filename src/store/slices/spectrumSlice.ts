import type { StateCreator } from 'zustand'
import { DEFAULT_STATE } from '@/lib/constants'
import {
  buildSpectrumProfileName,
  extractSpectrumProfileSettings,
} from '@/lib/featureProfiles'
import type { WallpaperStore } from '@/store/wallpaperStoreTypes'

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0]
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1]
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2]

export function createSpectrumSlice(set: WallpaperSet, _get: WallpaperGet, _api: WallpaperApi) {
  return ({
  setSpectrumEnabled: (v) => set({ spectrumEnabled: v }),
  setSpectrumFollowLogo: (v) => set({ spectrumFollowLogo: v }),
  setSpectrumCircularClone: (v) => set({ spectrumCircularClone: v }),
  setSpectrumSpan: (v) => set({ spectrumSpan: v }),
  setSpectrumCloneOpacity: (v) => set({ spectrumCloneOpacity: v }),
  setSpectrumCloneScale: (v) => set({ spectrumCloneScale: v }),
  setSpectrumCloneGap: (v) => set({ spectrumCloneGap: v }),
  setSpectrumCloneGlowIntensity: (v) => set({ spectrumCloneGlowIntensity: v }),
  setSpectrumClonePrimaryColor: (v) => set({ spectrumClonePrimaryColor: v }),
  setSpectrumCloneSecondaryColor: (v) => set({ spectrumCloneSecondaryColor: v }),
  setSpectrumCloneColorMode: (v) => set({ spectrumCloneColorMode: v }),
  setSpectrumCloneBarCount: (v) => set({ spectrumCloneBarCount: v }),
  setSpectrumCloneShape: (v) => set({ spectrumCloneShape: v }),
  setSpectrumRadius: (v) => set({ spectrumRadius: v }),
  setSpectrumInnerRadius: (v) => set({ spectrumInnerRadius: v }),
  setSpectrumBarCount: (v) => set({ spectrumBarCount: v }),
  setSpectrumBarWidth: (v) => set({ spectrumBarWidth: v }),
  setSpectrumMinHeight: (v) => set({ spectrumMinHeight: v }),
  setSpectrumMaxHeight: (v) => set({ spectrumMaxHeight: v }),
  setSpectrumSmoothing: (v) => set({ spectrumSmoothing: v }),
  setSpectrumOpacity: (v) => set({ spectrumOpacity: v }),
  setSpectrumGlowIntensity: (v) => set({ spectrumGlowIntensity: v }),
  setSpectrumShadowBlur: (v) => set({ spectrumShadowBlur: v }),
  setSpectrumPrimaryColor: (v) => set({ spectrumPrimaryColor: v }),
  setSpectrumSecondaryColor: (v) => set({ spectrumSecondaryColor: v }),
  setSpectrumColorMode: (v) => set({ spectrumColorMode: v }),
  setSpectrumBandMode: (v) => set({ spectrumBandMode: v }),
  setSpectrumShape: (v) => set({ spectrumShape: v }),
  setSpectrumLayout: (v) => set({ spectrumLayout: v }),
  setSpectrumDirection: (v) => set({ spectrumDirection: v }),
  setSpectrumRotationSpeed: (v) => set({ spectrumRotationSpeed: v }),
  setSpectrumMirror: (v) => set({ spectrumMirror: v }),
  setSpectrumPeakHold: (v) => set({ spectrumPeakHold: v }),
  setSpectrumPeakDecay: (v) => set({ spectrumPeakDecay: v }),
  setSpectrumPositionX: (v) => set({ spectrumPositionX: v }),
  setSpectrumPositionY: (v) => set({ spectrumPositionY: v }),
  saveSpectrumProfileSlot: (index) =>
    set((state) => {
      if (index < 0 || index >= state.spectrumProfileSlots.length) return state
      const nextSlots = state.spectrumProfileSlots.map((slot, slotIndex) => (
        slotIndex === index
          ? {
              name: buildSpectrumProfileName(state),
              values: extractSpectrumProfileSettings(state),
            }
          : slot
      ))
      return { spectrumProfileSlots: nextSlots }
    }),
  loadSpectrumProfileSlot: (index) =>
    set((state) => {
      const slot = state.spectrumProfileSlots[index]
      if (!slot?.values) return state
      return {
        ...slot.values,
        spectrumCircularClone: slot.values.spectrumCircularClone ?? DEFAULT_STATE.spectrumCircularClone,
        spectrumSpan: slot.values.spectrumSpan ?? DEFAULT_STATE.spectrumSpan,
        spectrumCloneOpacity: slot.values.spectrumCloneOpacity ?? DEFAULT_STATE.spectrumCloneOpacity,
        spectrumCloneScale: slot.values.spectrumCloneScale ?? DEFAULT_STATE.spectrumCloneScale,
        spectrumCloneGap: slot.values.spectrumCloneGap ?? DEFAULT_STATE.spectrumCloneGap,
        spectrumCloneGlowIntensity: slot.values.spectrumCloneGlowIntensity ?? DEFAULT_STATE.spectrumCloneGlowIntensity,
        spectrumClonePrimaryColor: slot.values.spectrumClonePrimaryColor ?? DEFAULT_STATE.spectrumClonePrimaryColor,
        spectrumCloneSecondaryColor: slot.values.spectrumCloneSecondaryColor ?? DEFAULT_STATE.spectrumCloneSecondaryColor,
        spectrumCloneColorMode: slot.values.spectrumCloneColorMode ?? DEFAULT_STATE.spectrumCloneColorMode,
        spectrumCloneBarCount: slot.values.spectrumCloneBarCount ?? DEFAULT_STATE.spectrumCloneBarCount,
        spectrumCloneShape: slot.values.spectrumCloneShape ?? DEFAULT_STATE.spectrumCloneShape,
      }
    }),
  }) satisfies Partial<WallpaperStore>
}
