import { DEFAULT_STATE } from '@/lib/constants'
import type { BackgroundImageItem, WallpaperState } from '@/types/wallpaper'

export type BackgroundImageLayout = Pick<BackgroundImageItem, 'scale' | 'positionX' | 'positionY' | 'fitMode'>

export function getDefaultBackgroundImageLayout(): BackgroundImageLayout {
  return {
    scale: DEFAULT_STATE.imageScale,
    positionX: DEFAULT_STATE.imagePositionX,
    positionY: DEFAULT_STATE.imagePositionY,
    fitMode: DEFAULT_STATE.imageFitMode,
  }
}

export function createBackgroundImageItem(
  assetId: string,
  url: string | null,
  layout: BackgroundImageLayout = getDefaultBackgroundImageLayout()
): BackgroundImageItem {
  return {
    assetId,
    url,
    scale: layout.scale,
    positionX: layout.positionX,
    positionY: layout.positionY,
    fitMode: layout.fitMode,
  }
}

export function getBackgroundImageRuntimePatch(image: BackgroundImageItem | null): Pick<
  WallpaperState,
  'imageUrl' | 'imageScale' | 'imagePositionX' | 'imagePositionY' | 'imageFitMode'
> {
  return {
    imageUrl: image?.url ?? null,
    imageScale: image?.scale ?? DEFAULT_STATE.imageScale,
    imagePositionX: image?.positionX ?? DEFAULT_STATE.imagePositionX,
    imagePositionY: image?.positionY ?? DEFAULT_STATE.imagePositionY,
    imageFitMode: image?.fitMode ?? DEFAULT_STATE.imageFitMode,
  }
}

export function isBackgroundImageUsingDefaultLayout(image: BackgroundImageItem): boolean {
  const defaults = getDefaultBackgroundImageLayout()
  return (
    image.scale === defaults.scale &&
    image.positionX === defaults.positionX &&
    image.positionY === defaults.positionY &&
    image.fitMode === defaults.fitMode
  )
}
