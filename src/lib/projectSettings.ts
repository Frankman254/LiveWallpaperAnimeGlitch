import { restoreWallpaperAssets } from '@/hooks/useRestoreWallpaperAssets'
import { createBackgroundImageItem } from '@/lib/backgroundImages'
import { DEFAULT_STATE } from '@/lib/constants'
import { useWallpaperStore } from '@/store/wallpaperStore'
import type { BackgroundImageItem, OverlayImageItem, WallpaperState } from '@/types/wallpaper'

const SETTINGS_FORMAT = 'lwag-settings'
const SETTINGS_VERSION = 1

type SettingsEnvelope = {
  format: typeof SETTINGS_FORMAT
  version: typeof SETTINGS_VERSION
  exportedAt: string
  assetsIncluded: false
  state: WallpaperState
}

const WALLPAPER_STATE_KEYS = Object.keys(DEFAULT_STATE) as Array<keyof WallpaperState>

function createBaseState(): WallpaperState {
  return {
    ...DEFAULT_STATE,
    backgroundImages: [],
    imageIds: [],
    imageUrls: [],
    overlays: [],
    customPresets: { ...DEFAULT_STATE.customPresets },
    layerZIndices: { ...DEFAULT_STATE.layerZIndices },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeBackgroundImages(source: Partial<WallpaperState>): BackgroundImageItem[] {
  const fallback = {
    scale: source.imageScale ?? DEFAULT_STATE.imageScale,
    positionX: source.imagePositionX ?? DEFAULT_STATE.imagePositionX,
    positionY: source.imagePositionY ?? DEFAULT_STATE.imagePositionY,
    fitMode: source.imageFitMode ?? DEFAULT_STATE.imageFitMode,
    mirror: source.imageMirror ?? DEFAULT_STATE.imageMirror,
    opacity: source.imageOpacity ?? DEFAULT_STATE.imageOpacity,
    transitionType: source.slideshowTransitionType ?? DEFAULT_STATE.slideshowTransitionType,
    transitionDuration: source.slideshowTransitionDuration ?? DEFAULT_STATE.slideshowTransitionDuration,
    transitionIntensity: source.slideshowTransitionIntensity ?? DEFAULT_STATE.slideshowTransitionIntensity,
    transitionAudioDrive: source.slideshowTransitionAudioDrive ?? DEFAULT_STATE.slideshowTransitionAudioDrive,
  }

  const fromState = Array.isArray(source.backgroundImages) && source.backgroundImages.length > 0
    ? source.backgroundImages
    : Array.isArray(source.imageIds)
      ? source.imageIds.map((assetId) => ({ assetId }))
      : []

  return fromState
    .filter((image): image is Partial<BackgroundImageItem> & { assetId: string } => (
      isRecord(image) && typeof image.assetId === 'string' && image.assetId.length > 0
    ))
    .map((image) => (
      createBackgroundImageItem(image.assetId, null, {
        scale: typeof image.scale === 'number' ? image.scale : fallback.scale,
        positionX: typeof image.positionX === 'number' ? image.positionX : fallback.positionX,
        positionY: typeof image.positionY === 'number' ? image.positionY : fallback.positionY,
        fitMode: image.fitMode ?? fallback.fitMode,
        mirror: typeof image.mirror === 'boolean' ? image.mirror : fallback.mirror,
        opacity: typeof image.opacity === 'number' ? image.opacity : fallback.opacity,
        transitionType: image.transitionType ?? fallback.transitionType,
        transitionDuration: typeof image.transitionDuration === 'number' ? image.transitionDuration : fallback.transitionDuration,
        transitionIntensity: typeof image.transitionIntensity === 'number' ? image.transitionIntensity : fallback.transitionIntensity,
        transitionAudioDrive: typeof image.transitionAudioDrive === 'number' ? image.transitionAudioDrive : fallback.transitionAudioDrive,
      })
    ))
}

function normalizeOverlays(source: Partial<WallpaperState>): OverlayImageItem[] {
  if (!Array.isArray(source.overlays)) return []

  return source.overlays.reduce<OverlayImageItem[]>((acc, overlay, index) => {
    if (
      !isRecord(overlay) ||
      typeof overlay.id !== 'string' ||
      overlay.id.length === 0 ||
      typeof overlay.assetId !== 'string' ||
      overlay.assetId.length === 0
    ) {
      return acc
    }

    acc.push({
      id: overlay.id,
      assetId: overlay.assetId,
      name: typeof overlay.name === 'string' && overlay.name.length > 0 ? overlay.name : `Overlay ${index + 1}`,
      url: null,
      enabled: typeof overlay.enabled === 'boolean' ? overlay.enabled : true,
      zIndex: typeof overlay.zIndex === 'number' ? overlay.zIndex : 90,
      positionX: typeof overlay.positionX === 'number' ? overlay.positionX : 0,
      positionY: typeof overlay.positionY === 'number' ? overlay.positionY : 0,
      scale: typeof overlay.scale === 'number' ? overlay.scale : 1,
      rotation: typeof overlay.rotation === 'number' ? overlay.rotation : 0,
      opacity: typeof overlay.opacity === 'number' ? overlay.opacity : 1,
      blendMode: overlay.blendMode ?? 'normal',
      cropShape: overlay.cropShape ?? 'rectangle',
      edgeFade: typeof overlay.edgeFade === 'number' ? overlay.edgeFade : 0.08,
      edgeBlur: typeof overlay.edgeBlur === 'number' ? overlay.edgeBlur : 0,
      edgeGlow: typeof overlay.edgeGlow === 'number' ? overlay.edgeGlow : 0.12,
      width: typeof overlay.width === 'number' ? overlay.width : 320,
      height: typeof overlay.height === 'number' ? overlay.height : 320,
    })

    return acc
  }, [])
}

function normalizeWallpaperState(candidate: Partial<WallpaperState>): WallpaperState {
  const nextState = createBaseState()

  for (const key of WALLPAPER_STATE_KEYS) {
    if (key in candidate) {
      ;(nextState as Record<string, unknown>)[key] = candidate[key] as unknown
    }
  }

  nextState.audioCaptureState = DEFAULT_STATE.audioCaptureState
  nextState.audioPaused = DEFAULT_STATE.audioPaused
  nextState.motionPaused = DEFAULT_STATE.motionPaused
  nextState.imageUrl = null
  nextState.imageUrls = []
  nextState.globalBackgroundUrl = null
  nextState.logoUrl = null
  nextState.isPresetDirty = false
  nextState.backgroundImages = normalizeBackgroundImages(candidate)
  nextState.overlays = normalizeOverlays(candidate)
  nextState.imageIds = nextState.backgroundImages.map((image) => image.assetId)

  const activeImageId = nextState.activeImageId && nextState.backgroundImages.some((image) => image.assetId === nextState.activeImageId)
    ? nextState.activeImageId
    : (nextState.backgroundImages[0]?.assetId ?? null)
  const activeImage = nextState.backgroundImages.find((image) => image.assetId === activeImageId) ?? null

  nextState.activeImageId = activeImageId
  nextState.imageScale = activeImage?.scale ?? nextState.imageScale
  nextState.imagePositionX = activeImage?.positionX ?? nextState.imagePositionX
  nextState.imagePositionY = activeImage?.positionY ?? nextState.imagePositionY
  nextState.imageOpacity = activeImage?.opacity ?? nextState.imageOpacity
  nextState.imageFitMode = activeImage?.fitMode ?? nextState.imageFitMode
  nextState.imageMirror = activeImage?.mirror ?? nextState.imageMirror
  nextState.slideshowTransitionType = activeImage?.transitionType ?? nextState.slideshowTransitionType
  nextState.slideshowTransitionDuration = activeImage?.transitionDuration ?? nextState.slideshowTransitionDuration
  nextState.slideshowTransitionIntensity = activeImage?.transitionIntensity ?? nextState.slideshowTransitionIntensity
  nextState.slideshowTransitionAudioDrive = activeImage?.transitionAudioDrive ?? nextState.slideshowTransitionAudioDrive
  nextState.selectedOverlayId = nextState.selectedOverlayId && nextState.overlays.some((overlay) => overlay.id === nextState.selectedOverlayId)
    ? nextState.selectedOverlayId
    : (nextState.overlays[0]?.id ?? null)
  nextState.customPresets = isRecord(candidate.customPresets)
    ? candidate.customPresets as WallpaperState['customPresets']
    : { ...DEFAULT_STATE.customPresets }
  nextState.layerZIndices = isRecord(candidate.layerZIndices)
    ? candidate.layerZIndices as WallpaperState['layerZIndices']
    : { ...DEFAULT_STATE.layerZIndices }

  return nextState
}

export function buildWallpaperSettingsExport(): SettingsEnvelope {
  const state = normalizeWallpaperState(useWallpaperStore.getState())
  return {
    format: SETTINGS_FORMAT,
    version: SETTINGS_VERSION,
    exportedAt: new Date().toISOString(),
    assetsIncluded: false,
    state,
  }
}

export function createWallpaperSettingsJson(): string {
  return JSON.stringify(buildWallpaperSettingsExport(), null, 2)
}

export function parseWallpaperSettingsJson(raw: string): WallpaperState {
  const parsed = JSON.parse(raw) as unknown
  if (!isRecord(parsed)) {
    throw new Error('invalid-settings-file')
  }

  const candidate = parsed.format === SETTINGS_FORMAT && isRecord(parsed.state)
    ? parsed.state as Partial<WallpaperState>
    : parsed as Partial<WallpaperState>

  return normalizeWallpaperState(candidate)
}

export async function applyWallpaperSettingsJson(raw: string): Promise<{ missingAssets: boolean }> {
  const nextState = parseWallpaperSettingsJson(raw)
  useWallpaperStore.setState(nextState)
  await restoreWallpaperAssets()

  const restoredState = useWallpaperStore.getState()
  const missingAssets =
    (nextState.backgroundImages.length > restoredState.backgroundImages.length) ||
    (nextState.overlays.length > restoredState.overlays.length) ||
    (Boolean(nextState.logoId) && !restoredState.logoUrl) ||
    (Boolean(nextState.globalBackgroundId) && !restoredState.globalBackgroundUrl)

  return { missingAssets }
}
