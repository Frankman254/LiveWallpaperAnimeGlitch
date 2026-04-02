import type { StateCreator } from 'zustand'
import {
  buildLogoProfileName,
  extractLogoProfileSettings,
} from '@/lib/featureProfiles'
import type { WallpaperStore } from '@/store/wallpaperStoreTypes'

type WallpaperSet = Parameters<StateCreator<WallpaperStore>>[0]
type WallpaperGet = Parameters<StateCreator<WallpaperStore>>[1]
type WallpaperApi = Parameters<StateCreator<WallpaperStore>>[2]

export function createLogoSlice(set: WallpaperSet, _get: WallpaperGet, _api: WallpaperApi) {
  return ({
  setShowLogoDiagnosticsHud: (v) => set({ showLogoDiagnosticsHud: v }),
  setLogoEnabled: (v) => set({ logoEnabled: v }),
  setLogoUrl: (v) => set({ logoUrl: v }),
  setLogoId: (v) => set({ logoId: v }),
  setLogoBaseSize: (v) => set({ logoBaseSize: v }),
  setLogoPositionX: (v) => set({ logoPositionX: v }),
  setLogoPositionY: (v) => set({ logoPositionY: v }),
  setLogoBandMode: (v) => set({ logoBandMode: v }),
  setLogoAudioSensitivity: (v) => set({ logoAudioSensitivity: v }),
  setLogoReactiveScaleIntensity: (v) => set({ logoReactiveScaleIntensity: v }),
  setLogoReactivitySpeed: (v) => set({ logoReactivitySpeed: v }),
  setLogoAttack: (v) => set({ logoAttack: v }),
  setLogoRelease: (v) => set({ logoRelease: v }),
  setLogoMinScale: (v) => set({ logoMinScale: v }),
  setLogoMaxScale: (v) => set({ logoMaxScale: v }),
  setLogoPunch: (v) => set({ logoPunch: v }),
  setLogoPeakWindow: (v) => set({ logoPeakWindow: v }),
  setLogoPeakFloor: (v) => set({ logoPeakFloor: v }),
  setLogoGlowColor: (v) => set({ logoGlowColor: v }),
  setLogoGlowBlur: (v) => set({ logoGlowBlur: v }),
  setLogoShadowEnabled: (v) => set({ logoShadowEnabled: v }),
  setLogoShadowColor: (v) => set({ logoShadowColor: v }),
  setLogoShadowBlur: (v) => set({ logoShadowBlur: v }),
  setLogoBackdropEnabled: (v) => set({ logoBackdropEnabled: v }),
  setLogoBackdropColor: (v) => set({ logoBackdropColor: v }),
  setLogoBackdropOpacity: (v) => set({ logoBackdropOpacity: v }),
  setLogoBackdropPadding: (v) => set({ logoBackdropPadding: v }),
  saveLogoProfileSlot: (index) =>
    set((state) => {
      if (index < 0 || index >= state.logoProfileSlots.length) return state
      const nextSlots = state.logoProfileSlots.map((slot, slotIndex) => (
        slotIndex === index
          ? {
              name: buildLogoProfileName(state),
              values: extractLogoProfileSettings(state),
            }
          : slot
      ))
      return { logoProfileSlots: nextSlots }
    }),
  loadLogoProfileSlot: (index) =>
    set((state) => {
      const slot = state.logoProfileSlots[index]
      if (!slot?.values) return state
      return { ...slot.values }
    }),
  }) satisfies Partial<WallpaperStore>
}
