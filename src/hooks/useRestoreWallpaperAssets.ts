import { useEffect } from 'react'
import { loadAllImages, loadImage } from '@/lib/db/imageDb'
import { useWallpaperStore } from '@/store/wallpaperStore'

export async function restoreWallpaperAssets(): Promise<void> {
  const state = useWallpaperStore.getState()

  let nextBackgroundImages = state.backgroundImages
  let nextImageIds = state.imageIds
  let nextImageUrls = state.imageUrls
  let nextActiveImageId = state.activeImageId
  let nextImageUrl = state.imageUrl
  let nextImageScale = state.imageScale
  let nextImagePositionX = state.imagePositionX
  let nextImagePositionY = state.imagePositionY
  let nextImageBassReactive = state.imageBassReactive
  let nextImageBassScaleIntensity = state.imageBassScaleIntensity
  let nextImageFitMode = state.imageFitMode

  const imageAssetIds = state.backgroundImages.length > 0
    ? state.backgroundImages.map((image) => image.assetId)
    : state.imageIds

  if (imageAssetIds.length > 0) {
    const urlMap = await loadAllImages(imageAssetIds)

    nextBackgroundImages = (state.backgroundImages.length > 0
      ? state.backgroundImages
      : state.imageIds.map((assetId) => ({
          assetId,
          url: null,
          scale: state.imageScale,
          positionX: state.imagePositionX,
          positionY: state.imagePositionY,
          bassReactive: state.imageBassReactive,
          bassScaleIntensity: state.imageBassScaleIntensity,
          fitMode: state.imageFitMode,
        }))
    )
      .map((image) => ({
        ...image,
        url: urlMap.get(image.assetId) ?? null,
      }))
      .filter((image) => image.url)

    nextImageIds = nextBackgroundImages.map((image) => image.assetId)
    nextImageUrls = nextBackgroundImages
      .map((image) => image.url)
      .filter((url): url is string => Boolean(url))

    if (!nextBackgroundImages.some((image) => image.assetId === nextActiveImageId)) {
      nextActiveImageId = nextBackgroundImages[0]?.assetId ?? null
    }

    const activeImage = nextBackgroundImages.find((image) => image.assetId === nextActiveImageId) ?? nextBackgroundImages[0] ?? null
    nextActiveImageId = activeImage?.assetId ?? null
    nextImageUrl = activeImage?.url ?? null
    nextImageScale = activeImage?.scale ?? state.imageScale
    nextImagePositionX = activeImage?.positionX ?? state.imagePositionX
    nextImagePositionY = activeImage?.positionY ?? state.imagePositionY
    nextImageBassReactive = activeImage?.bassReactive ?? state.imageBassReactive
    nextImageBassScaleIntensity = activeImage?.bassScaleIntensity ?? state.imageBassScaleIntensity
    nextImageFitMode = activeImage?.fitMode ?? state.imageFitMode
  }

  let nextLogoUrl = state.logoUrl
  let nextLogoId = state.logoId
  if (state.logoId) {
    const logoUrl = await loadImage(state.logoId)
    if (logoUrl) nextLogoUrl = logoUrl
    else nextLogoId = null
  }

  let nextSelectedOverlayId = state.selectedOverlayId
  let nextOverlays = state.overlays
  if (state.overlays.length > 0) {
    const overlayIds = state.overlays.map((overlay) => overlay.assetId)
    const overlayUrlMap = await loadAllImages(overlayIds)

    nextOverlays = state.overlays
      .map((overlay) => ({
        ...overlay,
        url: overlayUrlMap.get(overlay.assetId) ?? null,
      }))
      .filter((overlay) => overlay.url)

    if (!nextOverlays.some((overlay) => overlay.id === nextSelectedOverlayId)) {
      nextSelectedOverlayId = nextOverlays[0]?.id ?? null
    }
  }

  useWallpaperStore.setState({
    backgroundImages: nextBackgroundImages,
    activeImageId: nextActiveImageId,
    imageIds: nextImageIds,
    imageUrls: nextImageUrls,
    imageUrl: nextImageUrl,
    imageScale: nextImageScale,
    imagePositionX: nextImagePositionX,
    imagePositionY: nextImagePositionY,
    imageBassReactive: nextImageBassReactive,
    imageBassScaleIntensity: nextImageBassScaleIntensity,
    imageFitMode: nextImageFitMode,
    logoId: nextLogoId,
    logoUrl: nextLogoUrl,
    overlays: nextOverlays,
    selectedOverlayId: nextSelectedOverlayId,
  })
}

export function useRestoreWallpaperAssets(): void {
  useEffect(() => {
    void restoreWallpaperAssets()
  }, [])
}
