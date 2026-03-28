export type PerformanceMode = "low" | "medium" | "high";

export type WallpaperState = {
  glitchIntensity: number;
  rgbShift: number;
  scanlineIntensity: number;
  parallaxStrength: number;
  particleCount: number;
  particleSpeed: number;
  rainEnabled: boolean;
  rainIntensity: number;
  audioReactive: boolean;
  audioSensitivity: number;
  performanceMode: PerformanceMode;
  activePreset: string;
  imageUrl: string | null;
};
