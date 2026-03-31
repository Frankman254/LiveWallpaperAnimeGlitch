import type {
  LogoProfileSettings,
  ProfileSlot,
  SpectrumProfileSettings,
  WallpaperState,
} from '@/types/wallpaper'

export const LOGO_PROFILE_SLOT_COUNT = 3
export const SPECTRUM_PROFILE_SLOT_COUNT = 8

const SPECTRUM_PROFILE_KEYS = [
  'spectrumEnabled',
  'spectrumFollowLogo',
  'spectrumCircularClone',
  'spectrumRadius',
  'spectrumInnerRadius',
  'spectrumBarCount',
  'spectrumBarWidth',
  'spectrumMinHeight',
  'spectrumMaxHeight',
  'spectrumSmoothing',
  'spectrumOpacity',
  'spectrumGlowIntensity',
  'spectrumShadowBlur',
  'spectrumPrimaryColor',
  'spectrumSecondaryColor',
  'spectrumColorMode',
  'spectrumBandMode',
  'spectrumShape',
  'spectrumLayout',
  'spectrumDirection',
  'spectrumRotationSpeed',
  'spectrumMirror',
  'spectrumPeakHold',
  'spectrumPeakDecay',
  'spectrumPositionX',
  'spectrumPositionY',
] as const satisfies ReadonlyArray<keyof WallpaperState>

const LOGO_PROFILE_KEYS = [
  'logoEnabled',
  'logoBaseSize',
  'logoPositionX',
  'logoPositionY',
  'logoBandMode',
  'logoAudioSensitivity',
  'logoReactiveScaleIntensity',
  'logoReactivitySpeed',
  'logoAttack',
  'logoRelease',
  'logoMinScale',
  'logoMaxScale',
  'logoPunch',
  'logoPeakWindow',
  'logoPeakFloor',
  'logoGlowColor',
  'logoGlowBlur',
  'logoShadowEnabled',
  'logoShadowColor',
  'logoShadowBlur',
  'logoBackdropEnabled',
  'logoBackdropColor',
  'logoBackdropOpacity',
  'logoBackdropPadding',
] as const satisfies ReadonlyArray<keyof WallpaperState>

function pickState<K extends keyof WallpaperState>(
  state: WallpaperState,
  keys: readonly K[]
): Pick<WallpaperState, K> {
  const next = {} as Pick<WallpaperState, K>
  for (const key of keys) {
    next[key] = state[key] as Pick<WallpaperState, K>[K]
  }
  return next
}

function createEmptySlots<T>(prefix: string, count: number): Array<ProfileSlot<T>> {
  return Array.from({ length: count }, (_, index) => ({
    name: `${prefix} ${index + 1}`,
    values: null,
  }))
}

export function createDefaultSpectrumProfileSlots(): Array<ProfileSlot<SpectrumProfileSettings>> {
  return createEmptySlots<SpectrumProfileSettings>('Spectrum', SPECTRUM_PROFILE_SLOT_COUNT)
}

export function createDefaultLogoProfileSlots(): Array<ProfileSlot<LogoProfileSettings>> {
  return createEmptySlots<LogoProfileSettings>('Logo', LOGO_PROFILE_SLOT_COUNT)
}

export function extractSpectrumProfileSettings(state: WallpaperState): SpectrumProfileSettings {
  return pickState(state, SPECTRUM_PROFILE_KEYS)
}

export function extractLogoProfileSettings(state: WallpaperState): LogoProfileSettings {
  return pickState(state, LOGO_PROFILE_KEYS)
}

export function doProfileSettingsMatch<T extends object>(
  current: T,
  values: T | null
): boolean {
  if (!values) return false
  return Object.entries(values as Record<string, unknown>).every(
    ([key, value]) => (current as Record<string, unknown>)[key] === value
  )
}

export function normalizeProfileSlots<T>(
  slots: Array<ProfileSlot<T>> | undefined,
  fallbackFactory: () => Array<ProfileSlot<T>>
): Array<ProfileSlot<T>> {
  const fallback = fallbackFactory()
  return fallback.map((fallbackSlot, index) => {
    const candidate = slots?.[index]
    return {
      name: candidate?.name?.trim() || fallbackSlot.name,
      values: candidate?.values ?? null,
    }
  })
}

export function buildSpectrumProfileName(state: WallpaperState): string {
  const layout = state.spectrumLayout === 'horizontal' ? 'Bottom' : state.spectrumLayout
  const shape = state.spectrumShape.charAt(0).toUpperCase() + state.spectrumShape.slice(1)
  return `${layout} ${shape}`
}

export function buildLogoProfileName(state: WallpaperState): string {
  const band = state.logoBandMode.charAt(0).toUpperCase() + state.logoBandMode.slice(1)
  return `${band} ${state.logoMaxScale.toFixed(2)}x`
}
