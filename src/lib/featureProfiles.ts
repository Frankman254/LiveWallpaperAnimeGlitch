import type {
  BackgroundProfileSettings,
  LogoProfileSettings,
  ProfileSlot,
  SpectrumProfileSettings,
  WallpaperState,
} from '@/types/wallpaper'

export const BACKGROUND_PROFILE_SLOT_COUNT = 3
export const LOGO_PROFILE_SLOT_COUNT = 3
export const SPECTRUM_PROFILE_SLOT_COUNT = 8
export const MAX_PROFILE_SLOT_COUNT = 10

const BACKGROUND_PROFILE_KEYS = [
  'imageBassReactive',
  'imageBassScaleIntensity',
  'imageAudioReactiveDecay',
  'imageBassAttack',
  'imageBassRelease',
  'imageBassReactivitySpeed',
  'imageBassPeakWindow',
  'imageBassPeakFloor',
  'imageBassPunch',
  'imageBassReactiveScaleIntensity',
  'imageAudioChannel',
  'parallaxStrength',
] as const satisfies ReadonlyArray<keyof WallpaperState>

const SPECTRUM_PROFILE_KEYS = [
  'spectrumEnabled',
  'spectrumMode',
  'spectrumLinearOrientation',
  'spectrumLinearDirection',
  'spectrumRadialShape',
  'spectrumRadialAngle',
  'spectrumRadialFitLogo',
  'spectrumFollowLogo',
  'spectrumLogoGap',
  'spectrumCircularClone',
  'spectrumSpan',
  'spectrumCloneOpacity',
  'spectrumCloneScale',
  'spectrumCloneGap',
  'spectrumCloneStyle',
  'spectrumCloneRadialShape',
  'spectrumCloneRadialAngle',
  'spectrumCloneBarCount',
  'spectrumCloneBarWidth',
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

export function createDefaultBackgroundProfileSlots(): Array<ProfileSlot<BackgroundProfileSettings>> {
  return createEmptySlots<BackgroundProfileSettings>('BG', BACKGROUND_PROFILE_SLOT_COUNT)
}

export function createDefaultLogoProfileSlots(): Array<ProfileSlot<LogoProfileSettings>> {
  return createEmptySlots<LogoProfileSettings>('Logo', LOGO_PROFILE_SLOT_COUNT)
}

export function extractBackgroundProfileSettings(state: WallpaperState): BackgroundProfileSettings {
  return pickState(state, BACKGROUND_PROFILE_KEYS)
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
  fallbackFactory: () => Array<ProfileSlot<T>>,
  prefix: string
): Array<ProfileSlot<T>> {
  const fallback = fallbackFactory()
  const targetLength = Math.max(
    fallback.length,
    Math.min(slots?.length ?? fallback.length, MAX_PROFILE_SLOT_COUNT)
  )

  return Array.from({ length: targetLength }, (_, index) => {
    const candidate = slots?.[index]
    const fallbackSlot = fallback[index] ?? {
      name: `${prefix} ${index + 1}`,
      values: null,
    }
    return {
      name: candidate?.name?.trim() || fallbackSlot.name,
      values: candidate?.values ?? null,
    }
  })
}

export function buildSpectrumProfileName(state: WallpaperState): string {
  const modeLabel = state.spectrumMode === 'radial'
    ? state.spectrumRadialShape.charAt(0).toUpperCase() + state.spectrumRadialShape.slice(1)
    : state.spectrumLinearOrientation === 'horizontal' ? 'Horizontal' : 'Vertical'
  const style = state.spectrumShape.charAt(0).toUpperCase() + state.spectrumShape.slice(1)
  return `${modeLabel} ${style}`
}

export function buildBackgroundProfileName(state: WallpaperState): string {
  const channel = state.imageAudioChannel.charAt(0).toUpperCase() + state.imageAudioChannel.slice(1)
  return `${channel} ${state.imageBassScaleIntensity.toFixed(2)}x`
}

export function buildLogoProfileName(state: WallpaperState): string {
  const band = state.logoBandMode.charAt(0).toUpperCase() + state.logoBandMode.slice(1)
  return `${band} ${state.logoMaxScale.toFixed(2)}x`
}
