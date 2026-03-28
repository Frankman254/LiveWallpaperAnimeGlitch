import type { WallpaperState } from "./wallpaper";

export type PresetKey = "softDream" | "cyberPop" | "rainyNight";

export type Preset = Partial<
  Omit<WallpaperState, "activePreset" | "imageUrl" | "audioReactive" | "audioSensitivity">
>;

export type PresetsMap = Record<PresetKey, Preset>;
