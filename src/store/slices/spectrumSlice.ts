import type { StateCreator } from 'zustand'
import { DEFAULT_STATE } from '@/lib/constants'
import {
  buildSpectrumProfileName,
  extractSpectrumProfileSettings,
  MAX_PROFILE_SLOT_COUNT,
} from '@/lib/featureProfiles'
import type { WallpaperStore } from '@/store/wallpaperStoreTypes'

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0]
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1]
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2]

export function createSpectrumSlice(set: WallpaperSet, _get: WallpaperGet, _api: WallpaperApi) {
  return ({
  setShowSpectrumDiagnosticsHud: (v) => set({ showSpectrumDiagnosticsHud: v }),
  setSpectrumEnabled: (v) => set({ spectrumEnabled: v }),
  setSpectrumMode: (v) => set({ spectrumMode: v }),
  setSpectrumLinearOrientation: (v) => set({ spectrumLinearOrientation: v }),
  setSpectrumLinearDirection: (v) => set({ spectrumLinearDirection: v }),
  setSpectrumRadialShape: (v) => set({ spectrumRadialShape: v }),
  setSpectrumRadialAngle: (v) => set({ spectrumRadialAngle: v }),
  setSpectrumRadialFitLogo: (v) => set({ spectrumRadialFitLogo: v }),
  setSpectrumFollowLogo: (v) => set({ spectrumFollowLogo: v }),
  setSpectrumLogoGap: (v) => set({ spectrumLogoGap: v }),
  setSpectrumCircularClone: (v) => set({ spectrumCircularClone: v }),
  setSpectrumSpan: (v) => set({ spectrumSpan: v }),
  setSpectrumCloneOpacity: (v) => set({ spectrumCloneOpacity: v }),
  setSpectrumCloneScale: (v) => set({ spectrumCloneScale: v }),
  setSpectrumCloneGap: (v) => set({ spectrumCloneGap: v }),
  setSpectrumCloneStyle: (v) => set({ spectrumCloneStyle: v }),
  setSpectrumCloneRadialShape: (v) => set({ spectrumCloneRadialShape: v }),
  setSpectrumCloneRadialAngle: (v) => set({ spectrumCloneRadialAngle: v }),
  setSpectrumCloneBarCount: (v) => set({ spectrumCloneBarCount: v }),
  setSpectrumCloneBarWidth: (v) => set({ spectrumCloneBarWidth: v }),
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
  setSpectrumRotationSpeed: (v) => set({ spectrumRotationSpeed: v }),
  setSpectrumMirror: (v) => set({ spectrumMirror: v }),
  setSpectrumPeakHold: (v) => set({ spectrumPeakHold: v }),
  setSpectrumPeakDecay: (v) => set({ spectrumPeakDecay: v }),
  setSpectrumPositionX: (v) => set({ spectrumPositionX: v }),
  setSpectrumPositionY: (v) => set({ spectrumPositionY: v }),
  addSpectrumProfileSlot: () =>
    set((state) => {
      if (state.spectrumProfileSlots.length >= MAX_PROFILE_SLOT_COUNT) return state
      return {
        spectrumProfileSlots: [
          ...state.spectrumProfileSlots,
          { name: `Spectrum ${state.spectrumProfileSlots.length + 1}`, values: null },
        ],
      }
    }),
  removeSpectrumProfileSlot: (index) =>
    set((state) => {
      if (index < 3 || index >= state.spectrumProfileSlots.length) return state
      return {
        spectrumProfileSlots: state.spectrumProfileSlots.filter((_, slotIndex) => slotIndex !== index),
      }
    }),
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
        spectrumMode: slot.values.spectrumMode ?? DEFAULT_STATE.spectrumMode,
        spectrumLinearOrientation: slot.values.spectrumLinearOrientation ?? DEFAULT_STATE.spectrumLinearOrientation,
        spectrumLinearDirection: slot.values.spectrumLinearDirection ?? DEFAULT_STATE.spectrumLinearDirection,
        spectrumRadialShape: slot.values.spectrumRadialShape ?? DEFAULT_STATE.spectrumRadialShape,
        spectrumRadialAngle: slot.values.spectrumRadialAngle ?? DEFAULT_STATE.spectrumRadialAngle,
        spectrumRadialFitLogo: slot.values.spectrumRadialFitLogo ?? DEFAULT_STATE.spectrumRadialFitLogo,
        spectrumCircularClone: slot.values.spectrumCircularClone ?? DEFAULT_STATE.spectrumCircularClone,
        spectrumLogoGap: slot.values.spectrumLogoGap ?? DEFAULT_STATE.spectrumLogoGap,
        spectrumSpan: slot.values.spectrumSpan ?? DEFAULT_STATE.spectrumSpan,
        spectrumCloneOpacity: slot.values.spectrumCloneOpacity ?? DEFAULT_STATE.spectrumCloneOpacity,
        spectrumCloneScale: slot.values.spectrumCloneScale ?? DEFAULT_STATE.spectrumCloneScale,
        spectrumCloneGap: slot.values.spectrumCloneGap ?? DEFAULT_STATE.spectrumCloneGap,
        spectrumCloneStyle: slot.values.spectrumCloneStyle ?? DEFAULT_STATE.spectrumCloneStyle,
        spectrumCloneRadialShape: slot.values.spectrumCloneRadialShape ?? DEFAULT_STATE.spectrumCloneRadialShape,
        spectrumCloneRadialAngle: slot.values.spectrumCloneRadialAngle ?? DEFAULT_STATE.spectrumCloneRadialAngle,
        spectrumCloneBarCount: slot.values.spectrumCloneBarCount ?? DEFAULT_STATE.spectrumCloneBarCount,
        spectrumCloneBarWidth: slot.values.spectrumCloneBarWidth ?? DEFAULT_STATE.spectrumCloneBarWidth,
      }
    }),
  }) satisfies Partial<WallpaperStore>
}
