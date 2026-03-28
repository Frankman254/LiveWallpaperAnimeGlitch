import type { WallpaperState } from "@/types/wallpaper";

export const DEFAULT_STATE: WallpaperState = {
  glitchIntensity: 0.1,
  rgbShift: 0.003,
  scanlineIntensity: 0.12,
  parallaxStrength: 0.03,
  particleCount: 60,
  particleSpeed: 0.5,
  rainEnabled: false,
  rainIntensity: 0.5,
  audioReactive: false,
  audioSensitivity: 1.0,
  performanceMode: "medium",
  activePreset: "cyberPop",
  imageUrl: null,
};

export const PARTICLE_LIMITS: Record<string, number> = {
  low: 20,
  medium: 60,
  high: 120,
};
