/**
 * PERSISTENCE MODEL — THREE LAYERS
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Layer 1 — SCENE STATE  (persisted to localStorage, key: 'lwag-state')
 *   All visual settings: filters, spectrum, logo, particles, rain, slideshow,
 *   filters, layer z-indices, presets, editor theme, language.
 *   BackgroundImageItem.url and OverlayImageItem.url are set to null before
 *   saving — they are reconstructed from Layer 2 on load.
 *
 * Layer 2 — ASSET REFERENCES  (persisted to IndexedDB via imageDb.ts)
 *   Blob URLs for uploaded background images, overlay images, and logo.
 *   Keys: imageIds[], logoId, overlays[].assetId
 *   Reconstructed on load by useRestoreWallpaperAssets hook.
 *
 * Layer 3 — RUNTIME STATE  (never persisted, dropped by partialize)
 *   audioCaptureState, imageUrl, globalBackgroundUrl, logoUrl, imageUrls,
 *   isPresetDirty, editorPanelOpen, editorOverlayOpen, backgroundFallbackVisible,
 *   and all UI-only action setters.
 *
 * When adding a new state field:
 *   - Scene field: add to WallpaperState, include in DEFAULT_STATE, and add
 *     a ?? fallback in migrateWallpaperStore.
 *   - Asset field: store the id in Layer 1 and the blob URL in Layer 2.
 *   - Runtime field: add to the exclusion list in partializeWallpaperStore.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { DEFAULT_STATE } from '@/lib/constants'
import {
  createDefaultLogoProfileSlots,
  createDefaultSpectrumProfileSlots,
  normalizeProfileSlots,
} from '@/lib/featureProfiles'
import {
  buildBackgroundImageCollectionPatch,
  normalizePersistedBackgroundImages,
} from '@/store/backgroundStoreUtils'
import type { WallpaperStore } from '@/store/wallpaperStoreTypes'

function normalizeAudioChannel(value: unknown, fallback: WallpaperStore['logoBandMode']) {
  switch (value) {
    case 'auto':
    case 'full':
    case 'kick':
    case 'instrumental':
    case 'bass':
    case 'hihat':
    case 'vocal':
      return value
    case 'peak':
      return 'kick'
    case 'mid':
      return 'instrumental'
    case 'treble':
      return 'hihat'
    case 'low-mid':
      return 'instrumental'
    case 'high-mid':
      return 'vocal'
    default:
      return fallback
  }
}

function migrateLogoProfileSlots(state: Partial<WallpaperStore>) {
  return normalizeProfileSlots(state.logoProfileSlots, createDefaultLogoProfileSlots).map((slot) => ({
    ...slot,
    values: slot.values
      ? {
          ...slot.values,
          logoBandMode: normalizeAudioChannel(slot.values.logoBandMode, DEFAULT_STATE.logoBandMode),
        }
      : null,
  }))
}

function migrateSpectrumProfileSlots(state: Partial<WallpaperStore>) {
  return normalizeProfileSlots(state.spectrumProfileSlots, createDefaultSpectrumProfileSlots).map((slot) => ({
    ...slot,
    values: slot.values
      ? {
          ...slot.values,
          spectrumBandMode: normalizeAudioChannel(slot.values.spectrumBandMode, DEFAULT_STATE.spectrumBandMode),
        }
      : null,
  }))
}

export function migrateWallpaperStore(persistedState: unknown): WallpaperStore {
  const state = persistedState as Partial<WallpaperStore> | undefined
  if (!state) return persistedState as WallpaperStore
  const legacySpectrumLayout = (state as { spectrumLayout?: string }).spectrumLayout
  const legacySpectrumDirection = (state as { spectrumDirection?: string }).spectrumDirection
  const legacySpectrumMode = legacySpectrumLayout === 'circular' ? 'radial' : 'linear'
  const legacySpectrumLinearOrientation = legacySpectrumLayout === 'left' || legacySpectrumLayout === 'right'
    ? 'vertical'
    : 'horizontal'
  const legacySpectrumLinearDirection = legacySpectrumLayout === 'top' || legacySpectrumLayout === 'left'
    ? 'flipped'
    : 'normal'
  const legacySpectrumPositionX = legacySpectrumLayout === 'left'
    ? -0.85
    : legacySpectrumLayout === 'right'
      ? 0.85
      : (state.spectrumPositionX ?? DEFAULT_STATE.spectrumPositionX)
  const legacySpectrumPositionY = legacySpectrumLayout === 'top' || legacySpectrumLayout === 'top-inverted'
    ? 0.85
    : legacySpectrumLayout === 'bottom' || legacySpectrumLayout === 'horizontal'
      ? -0.85
      : (state.spectrumPositionY ?? DEFAULT_STATE.spectrumPositionY)
  const sanitizedState = { ...state } as Partial<WallpaperStore> & Record<string, unknown>
  delete sanitizedState.glitchIntensity
  delete sanitizedState.glitchBarWidth
  delete sanitizedState.glitchDirection
  delete sanitizedState.glitchFrequency
  delete sanitizedState.glitchStyle
  delete sanitizedState.glitchAudioReactive
  delete sanitizedState.glitchAudioSensitivity
  delete sanitizedState.audioTrackTitleGlitchIntensity
  delete sanitizedState.audioTrackTitleGlitchBarWidth
  delete sanitizedState.spectrumLayout
  delete sanitizedState.spectrumDirection

  const persistedParticleColorMode = (state as { particleColorMode?: string }).particleColorMode
  const normalizedBackgroundImages = normalizePersistedBackgroundImages(state)
  const backgroundState = buildBackgroundImageCollectionPatch(
    {
      ...DEFAULT_STATE,
      ...state,
      backgroundImages: normalizedBackgroundImages,
      activeImageId: state.activeImageId ?? normalizedBackgroundImages[0]?.assetId ?? null,
    },
    normalizedBackgroundImages,
    state.activeImageId ?? normalizedBackgroundImages[0]?.assetId ?? null
  )
  const normalizedOverlays = (state.overlays ?? []).map((overlay) => ({
    ...overlay,
    zIndex: Math.max(overlay.zIndex ?? 90, 90),
    blendMode: overlay.blendMode ?? 'normal',
    cropShape: overlay.cropShape ?? 'rectangle',
    edgeFade: overlay.edgeFade ?? 0.08,
    edgeBlur: overlay.edgeBlur ?? 0,
    edgeGlow: overlay.edgeGlow ?? 0.12,
  }))
  const migratedCustomPresets = Object.fromEntries(
    Object.entries(state.customPresets ?? {}).map(([id, preset]) => [
      id,
      {
        ...preset,
        values: {
          ...preset.values,
          logoBandMode: normalizeAudioChannel(preset.values.logoBandMode, DEFAULT_STATE.logoBandMode),
          spectrumBandMode: normalizeAudioChannel(preset.values.spectrumBandMode, DEFAULT_STATE.spectrumBandMode),
          imageAudioChannel: normalizeAudioChannel(preset.values.imageAudioChannel, DEFAULT_STATE.imageAudioChannel),
          rgbShiftAudioChannel: normalizeAudioChannel(preset.values.rgbShiftAudioChannel, DEFAULT_STATE.rgbShiftAudioChannel),
          particleAudioChannel: normalizeAudioChannel(preset.values.particleAudioChannel, DEFAULT_STATE.particleAudioChannel),
          slideshowTransitionAudioChannel: normalizeAudioChannel(
            preset.values.slideshowTransitionAudioChannel,
            DEFAULT_STATE.slideshowTransitionAudioChannel
          ),
        },
      },
    ])
  )

  return {
    ...sanitizedState,
    ...backgroundState,
    overlays: normalizedOverlays,
    selectedOverlayId: state.selectedOverlayId ?? null,
    layerZIndices: state.layerZIndices ?? {},
    spectrumMode: state.spectrumMode ?? legacySpectrumMode,
    spectrumLinearOrientation: state.spectrumLinearOrientation ?? legacySpectrumLinearOrientation,
    spectrumLinearDirection: state.spectrumLinearDirection ?? legacySpectrumLinearDirection,
    spectrumRadialShape: state.spectrumRadialShape ?? DEFAULT_STATE.spectrumRadialShape,
    spectrumRadialAngle: state.spectrumRadialAngle ?? DEFAULT_STATE.spectrumRadialAngle,
    spectrumRadialFitLogo: state.spectrumRadialFitLogo ?? DEFAULT_STATE.spectrumRadialFitLogo,
    spectrumCircularClone: state.spectrumCircularClone ?? DEFAULT_STATE.spectrumCircularClone,
    spectrumLogoGap: state.spectrumLogoGap ?? DEFAULT_STATE.spectrumLogoGap,
    spectrumSpan: state.spectrumSpan ?? DEFAULT_STATE.spectrumSpan,
    spectrumCloneOpacity: state.spectrumCloneOpacity ?? DEFAULT_STATE.spectrumCloneOpacity,
    spectrumCloneScale: state.spectrumCloneScale ?? DEFAULT_STATE.spectrumCloneScale,
    spectrumCloneGap: state.spectrumCloneGap ?? DEFAULT_STATE.spectrumCloneGap,
    spectrumCloneStyle: state.spectrumCloneStyle ?? DEFAULT_STATE.spectrumCloneStyle,
    spectrumCloneRadialShape: state.spectrumCloneRadialShape ?? DEFAULT_STATE.spectrumCloneRadialShape,
    spectrumCloneRadialAngle: state.spectrumCloneRadialAngle ?? DEFAULT_STATE.spectrumCloneRadialAngle,
    spectrumCloneBarCount: state.spectrumCloneBarCount ?? DEFAULT_STATE.spectrumCloneBarCount,
    spectrumCloneBarWidth: state.spectrumCloneBarWidth ?? DEFAULT_STATE.spectrumCloneBarWidth,
    spectrumRotationSpeed: legacySpectrumDirection === 'counterclockwise'
      ? -Math.abs(state.spectrumRotationSpeed ?? DEFAULT_STATE.spectrumRotationSpeed)
      : (state.spectrumRotationSpeed ?? DEFAULT_STATE.spectrumRotationSpeed),
    showBackgroundScaleMeter: state.showBackgroundScaleMeter ?? DEFAULT_STATE.showBackgroundScaleMeter,
    showSpectrumDiagnosticsHud: state.showSpectrumDiagnosticsHud ?? DEFAULT_STATE.showSpectrumDiagnosticsHud,
    showLogoDiagnosticsHud: state.showLogoDiagnosticsHud ?? DEFAULT_STATE.showLogoDiagnosticsHud,
    filterTarget: state.filterTarget ?? 'background',
    filterBrightness: state.filterBrightness ?? 1,
    filterContrast: state.filterContrast ?? 1,
    filterSaturation: state.filterSaturation ?? 1,
    filterBlur: state.filterBlur ?? 0,
    filterHueRotate: state.filterHueRotate ?? 0,
    globalBackgroundId: state.globalBackgroundId ?? DEFAULT_STATE.globalBackgroundId,
    globalBackgroundUrl: null,
    globalBackgroundScale: state.globalBackgroundScale ?? DEFAULT_STATE.globalBackgroundScale,
    globalBackgroundPositionX: state.globalBackgroundPositionX ?? DEFAULT_STATE.globalBackgroundPositionX,
    globalBackgroundPositionY: state.globalBackgroundPositionY ?? DEFAULT_STATE.globalBackgroundPositionY,
    globalBackgroundFitMode: state.globalBackgroundFitMode ?? DEFAULT_STATE.globalBackgroundFitMode,
    globalBackgroundOpacity: state.globalBackgroundOpacity ?? DEFAULT_STATE.globalBackgroundOpacity,
    globalBackgroundBrightness: state.globalBackgroundBrightness ?? DEFAULT_STATE.globalBackgroundBrightness,
    globalBackgroundContrast: state.globalBackgroundContrast ?? DEFAULT_STATE.globalBackgroundContrast,
    globalBackgroundSaturation: state.globalBackgroundSaturation ?? DEFAULT_STATE.globalBackgroundSaturation,
    globalBackgroundBlur: state.globalBackgroundBlur ?? DEFAULT_STATE.globalBackgroundBlur,
    globalBackgroundHueRotate: state.globalBackgroundHueRotate ?? DEFAULT_STATE.globalBackgroundHueRotate,
    particleColorMode: persistedParticleColorMode === 'random' ? 'rainbow' : (state.particleColorMode ?? DEFAULT_STATE.particleColorMode),
    particleFilterBrightness: state.particleFilterBrightness ?? DEFAULT_STATE.particleFilterBrightness,
    particleFilterContrast: state.particleFilterContrast ?? DEFAULT_STATE.particleFilterContrast,
    particleFilterSaturation: state.particleFilterSaturation ?? DEFAULT_STATE.particleFilterSaturation,
    particleFilterBlur: state.particleFilterBlur ?? DEFAULT_STATE.particleFilterBlur,
    particleFilterHueRotate: state.particleFilterHueRotate ?? DEFAULT_STATE.particleFilterHueRotate,
    particleScanlineIntensity: state.particleScanlineIntensity ?? DEFAULT_STATE.particleScanlineIntensity,
    particleScanlineSpacing: state.particleScanlineSpacing ?? DEFAULT_STATE.particleScanlineSpacing,
    particleScanlineThickness: state.particleScanlineThickness ?? DEFAULT_STATE.particleScanlineThickness,
    particleRotationIntensity: state.particleRotationIntensity ?? DEFAULT_STATE.particleRotationIntensity,
    particleRotationDirection: state.particleRotationDirection ?? DEFAULT_STATE.particleRotationDirection,
    logoBandMode: normalizeAudioChannel(state.logoBandMode, DEFAULT_STATE.logoBandMode),
    logoPositionX: state.logoPositionX ?? DEFAULT_STATE.logoPositionX,
    logoPositionY: state.logoPositionY ?? DEFAULT_STATE.logoPositionY,
    logoPeakWindow: state.logoPeakWindow ?? DEFAULT_STATE.logoPeakWindow,
    logoPeakFloor: state.logoPeakFloor ?? DEFAULT_STATE.logoPeakFloor,
    logoProfileSlots: migrateLogoProfileSlots(state),
    spectrumProfileSlots: migrateSpectrumProfileSlots(state),
    audioPaused: state.audioPaused ?? DEFAULT_STATE.audioPaused,
    motionPaused: state.motionPaused ?? DEFAULT_STATE.motionPaused,
    audioChannelSmoothing: state.audioChannelSmoothing ?? DEFAULT_STATE.audioChannelSmoothing,
    audioSelectedChannelSmoothing: state.audioSelectedChannelSmoothing ?? DEFAULT_STATE.audioSelectedChannelSmoothing,
    audioAutoKickThreshold: state.audioAutoKickThreshold ?? DEFAULT_STATE.audioAutoKickThreshold,
    audioAutoSwitchHoldMs: state.audioAutoSwitchHoldMs ?? DEFAULT_STATE.audioAutoSwitchHoldMs,
    audioTrackTitleEnabled: state.audioTrackTitleEnabled ?? DEFAULT_STATE.audioTrackTitleEnabled,
    audioTrackTitleLayoutMode: state.audioTrackTitleLayoutMode ?? DEFAULT_STATE.audioTrackTitleLayoutMode,
    audioTrackTitleFontStyle: state.audioTrackTitleFontStyle ?? DEFAULT_STATE.audioTrackTitleFontStyle,
    audioTrackTitleUppercase: state.audioTrackTitleUppercase ?? DEFAULT_STATE.audioTrackTitleUppercase,
    audioTrackTitlePositionX: state.audioTrackTitlePositionX ?? DEFAULT_STATE.audioTrackTitlePositionX,
    audioTrackTitlePositionY: state.audioTrackTitlePositionY ?? DEFAULT_STATE.audioTrackTitlePositionY,
    audioTrackTitleFontSize: state.audioTrackTitleFontSize ?? DEFAULT_STATE.audioTrackTitleFontSize,
    audioTrackTitleLetterSpacing: state.audioTrackTitleLetterSpacing ?? DEFAULT_STATE.audioTrackTitleLetterSpacing,
    audioTrackTitleWidth: state.audioTrackTitleWidth ?? DEFAULT_STATE.audioTrackTitleWidth,
    audioTrackTitleOpacity: state.audioTrackTitleOpacity ?? DEFAULT_STATE.audioTrackTitleOpacity,
    audioTrackTitleScrollSpeed: state.audioTrackTitleScrollSpeed ?? DEFAULT_STATE.audioTrackTitleScrollSpeed,
    audioTrackTitleRgbShift: state.audioTrackTitleRgbShift ?? DEFAULT_STATE.audioTrackTitleRgbShift,
    audioTrackTitleTextColor: state.audioTrackTitleTextColor ?? DEFAULT_STATE.audioTrackTitleTextColor,
    audioTrackTitleGlowColor: state.audioTrackTitleGlowColor ?? DEFAULT_STATE.audioTrackTitleGlowColor,
    audioTrackTitleGlowBlur: state.audioTrackTitleGlowBlur ?? DEFAULT_STATE.audioTrackTitleGlowBlur,
    audioTrackTitleBackdropEnabled: state.audioTrackTitleBackdropEnabled ?? DEFAULT_STATE.audioTrackTitleBackdropEnabled,
    audioTrackTitleBackdropColor: state.audioTrackTitleBackdropColor ?? DEFAULT_STATE.audioTrackTitleBackdropColor,
    audioTrackTitleBackdropOpacity: state.audioTrackTitleBackdropOpacity ?? DEFAULT_STATE.audioTrackTitleBackdropOpacity,
    audioTrackTitleBackdropPadding: state.audioTrackTitleBackdropPadding ?? DEFAULT_STATE.audioTrackTitleBackdropPadding,
    audioTrackTitleFilterBrightness: state.audioTrackTitleFilterBrightness ?? DEFAULT_STATE.audioTrackTitleFilterBrightness,
    audioTrackTitleFilterContrast: state.audioTrackTitleFilterContrast ?? DEFAULT_STATE.audioTrackTitleFilterContrast,
    audioTrackTitleFilterSaturation: state.audioTrackTitleFilterSaturation ?? DEFAULT_STATE.audioTrackTitleFilterSaturation,
    audioTrackTitleFilterBlur: state.audioTrackTitleFilterBlur ?? DEFAULT_STATE.audioTrackTitleFilterBlur,
    audioTrackTitleFilterHueRotate: state.audioTrackTitleFilterHueRotate ?? DEFAULT_STATE.audioTrackTitleFilterHueRotate,
    slideshowTransitionIntensity: state.slideshowTransitionIntensity ?? DEFAULT_STATE.slideshowTransitionIntensity,
    slideshowTransitionAudioDrive: state.slideshowTransitionAudioDrive ?? DEFAULT_STATE.slideshowTransitionAudioDrive,
    slideshowTransitionAudioChannel: normalizeAudioChannel(
      state.slideshowTransitionAudioChannel,
      DEFAULT_STATE.slideshowTransitionAudioChannel
    ),
    imageAudioReactiveDecay: state.imageAudioReactiveDecay ?? DEFAULT_STATE.imageAudioReactiveDecay,
    imageBassAttack: state.imageBassAttack ?? DEFAULT_STATE.imageBassAttack,
    imageBassRelease: state.imageBassRelease ?? (0.02 + (1 - (state.imageAudioReactiveDecay ?? DEFAULT_STATE.imageAudioReactiveDecay)) * 0.2),
    imageBassReactivitySpeed: state.imageBassReactivitySpeed ?? DEFAULT_STATE.imageBassReactivitySpeed,
    imageBassPeakWindow: state.imageBassPeakWindow ?? DEFAULT_STATE.imageBassPeakWindow,
    imageBassPeakFloor: state.imageBassPeakFloor ?? DEFAULT_STATE.imageBassPeakFloor,
    imageBassPunch: state.imageBassPunch ?? DEFAULT_STATE.imageBassPunch,
    imageBassReactiveScaleIntensity: state.imageBassReactiveScaleIntensity ?? DEFAULT_STATE.imageBassReactiveScaleIntensity,
    imageBassZoomPresetId: state.imageBassZoomPresetId ?? DEFAULT_STATE.imageBassZoomPresetId,
    imageAudioChannel: normalizeAudioChannel(state.imageAudioChannel, DEFAULT_STATE.imageAudioChannel),
    rgbShiftAudioChannel: normalizeAudioChannel(state.rgbShiftAudioChannel, DEFAULT_STATE.rgbShiftAudioChannel),
    particleAudioChannel: normalizeAudioChannel(state.particleAudioChannel, DEFAULT_STATE.particleAudioChannel),
    spectrumBandMode: normalizeAudioChannel(state.spectrumBandMode, DEFAULT_STATE.spectrumBandMode),
    spectrumPositionX: state.spectrumPositionX ?? legacySpectrumPositionX,
    spectrumPositionY: state.spectrumPositionY ?? legacySpectrumPositionY,
    showFps: state.showFps ?? DEFAULT_STATE.showFps,
    controlPanelAnchor: state.controlPanelAnchor ?? DEFAULT_STATE.controlPanelAnchor,
    fpsOverlayAnchor: state.fpsOverlayAnchor ?? DEFAULT_STATE.fpsOverlayAnchor,
    editorTheme: state.editorTheme ?? DEFAULT_STATE.editorTheme,
    customPresets: migratedCustomPresets,
  } as WallpaperStore
}

export function partializeWallpaperStore(state: WallpaperStore): Partial<WallpaperStore> {
  const {
    audioCaptureState,
    imageUrl,
    globalBackgroundUrl,
    logoUrl,
    imageUrls,
    isPresetDirty,
    backgroundFallbackVisible,
    setBackgroundFallbackVisible,
    ...rest
  } = state

  void audioCaptureState
  void imageUrl
  void globalBackgroundUrl
  void logoUrl
  void imageUrls
  void isPresetDirty
  void backgroundFallbackVisible
  void setBackgroundFallbackVisible

  return {
    ...rest,
    backgroundImages: state.backgroundImages.map((image) => ({
      ...image,
      url: null as string | null,
    })),
    overlays: state.overlays.map((overlay) => ({
      ...overlay,
      url: null as string | null,
    })),
  }
}
