import { create } from "zustand";
import type { WallpaperState, PerformanceMode } from "@/types/wallpaper";
import { DEFAULT_STATE } from "@/lib/constants";
import { presets } from "@/lib/presets";
import type { PresetKey } from "@/types/presets";

type WallpaperStore = WallpaperState & {
  setGlitchIntensity: (v: number) => void;
  setRgbShift: (v: number) => void;
  setScanlineIntensity: (v: number) => void;
  setParallaxStrength: (v: number) => void;
  setParticleCount: (v: number) => void;
  setParticleSpeed: (v: number) => void;
  setRainEnabled: (v: boolean) => void;
  setRainIntensity: (v: number) => void;
  setAudioReactive: (v: boolean) => void;
  setAudioSensitivity: (v: number) => void;
  setPerformanceMode: (v: PerformanceMode) => void;
  setImageUrl: (v: string | null) => void;
  applyPreset: (key: PresetKey) => void;
  reset: () => void;
};

export const useWallpaperStore = create<WallpaperStore>((set) => ({
  ...DEFAULT_STATE,

  setGlitchIntensity: (v) => set({ glitchIntensity: v }),
  setRgbShift: (v) => set({ rgbShift: v }),
  setScanlineIntensity: (v) => set({ scanlineIntensity: v }),
  setParallaxStrength: (v) => set({ parallaxStrength: v }),
  setParticleCount: (v) => set({ particleCount: v }),
  setParticleSpeed: (v) => set({ particleSpeed: v }),
  setRainEnabled: (v) => set({ rainEnabled: v }),
  setRainIntensity: (v) => set({ rainIntensity: v }),
  setAudioReactive: (v) => set({ audioReactive: v }),
  setAudioSensitivity: (v) => set({ audioSensitivity: v }),
  setPerformanceMode: (v) => set({ performanceMode: v }),
  setImageUrl: (v) => set({ imageUrl: v }),

  applyPreset: (key) =>
    set((state) => ({
      ...state,
      ...presets[key],
      activePreset: key,
    })),

  reset: () => set(DEFAULT_STATE),
}));
