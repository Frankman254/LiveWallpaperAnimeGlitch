import type { WallpaperState } from '@/types/wallpaper'

export type LogoQuickProfile = 'subtle' | 'balanced' | 'dsg'

/**
 * Quick-apply logo reactivity presets.
 * Subtle → soft bounce. Balanced → punchy. DSG → aggressive snap.
 *
 * These live here (not in the tab) so they can be shared between UI,
 * export logic, and future preset management.
 */
export const LOGO_QUICK_PROFILES: Record<LogoQuickProfile, Partial<WallpaperState>> = {
  subtle: {
    logoBandMode: 'kick',
    logoAudioSensitivity: 2.1,
    logoReactiveScaleIntensity: 0.22,
    logoReactivitySpeed: 0.55,
    logoMinScale: 0.98,
    logoMaxScale: 1.55,
    logoPunch: 0.16,
    logoAttack: 0.72,
    logoRelease: 0.08,
    logoPeakWindow: 2.8,
    logoPeakFloor: 0.2,
  },
  balanced: {
    logoBandMode: 'kick',
    logoAudioSensitivity: 2.9,
    logoReactiveScaleIntensity: 0.46,
    logoReactivitySpeed: 0.7,
    logoMinScale: 0.98,
    logoMaxScale: 2.05,
    logoPunch: 0.32,
    logoAttack: 0.95,
    logoRelease: 0.055,
    logoPeakWindow: 2.15,
    logoPeakFloor: 0.15,
  },
  dsg: {
    logoBandMode: 'kick',
    logoAudioSensitivity: 3.7,
    logoReactiveScaleIntensity: 0.88,
    logoReactivitySpeed: 0.95,
    logoMinScale: 0.96,
    logoMaxScale: 2.75,
    logoPunch: 0.58,
    logoAttack: 1.2,
    logoRelease: 0.035,
    logoPeakWindow: 1.75,
    logoPeakFloor: 0.1,
  },
}
