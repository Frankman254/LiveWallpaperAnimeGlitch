import { useEffect } from 'react'
import { loadAllImages, loadImage } from '@/lib/db/imageDb'
import { useWallpaperStore } from '@/store/wallpaperStore'

export async function restoreWallpaperAssets(): Promise<void> {
  const state = useWallpaperStore.getState()

  let nextImageIds = state.imageIds
  let nextImageUrls = state.imageUrls
  let nextImageUrl = state.imageUrl

  if (state.imageIds.length > 0) {
    const urlMap = await loadAllImages(state.imageIds)
    nextImageIds = []
    nextImageUrls = []

    for (const id of state.imageIds) {
      const url = urlMap.get(id)
      if (!url) continue
      nextImageIds.push(id)
      nextImageUrls.push(url)
    }

    nextImageUrl = nextImageUrls[0] ?? null
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
    imageIds: nextImageIds,
    imageUrls: nextImageUrls,
    imageUrl: nextImageUrl,
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
