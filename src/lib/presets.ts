import type { PresetsMap } from "@/types/presets";

export const presets: PresetsMap = {
  softDream: {
    glitchIntensity: 0.08,
    rgbShift: 0.002,
    scanlineIntensity: 0.1,
    parallaxStrength: 0.02,
    particleCount: 40,
    particleSpeed: 0.3,
    rainEnabled: false,
    rainIntensity: 0.0,
    performanceMode: "medium",
  },
  cyberPop: {
    glitchIntensity: 0.2,
    rgbShift: 0.006,
    scanlineIntensity: 0.18,
    parallaxStrength: 0.04,
    particleCount: 80,
    particleSpeed: 0.7,
    rainEnabled: false,
    rainIntensity: 0.0,
    performanceMode: "medium",
  },
  rainyNight: {
    glitchIntensity: 0.12,
    rgbShift: 0.003,
    scanlineIntensity: 0.12,
    parallaxStrength: 0.02,
    particleCount: 30,
    particleSpeed: 0.4,
    rainEnabled: true,
    rainIntensity: 0.7,
    performanceMode: "medium",
  },
};
