import { useEffect } from 'react'
import { AudioDataProvider } from '@/context/AudioDataContext'
import { I18nProvider } from '@/lib/i18n'
import WallpaperCanvas from '@/components/wallpaper/WallpaperCanvas'
import AudioOverlay from '@/components/audio/AudioOverlay'
import ControlPanel from '@/components/controls/ControlPanel'
import SlideshowManager from '@/components/SlideshowManager'
import { doesStateMatchPreset } from '@/lib/presets'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { loadAllImages, loadImage } from '@/lib/db/imageDb'

export default function EditorPage() {
  useEffect(() => {
    async function restoreAssets() {
      const s = useWallpaperStore.getState()
      if (s.imageIds.length > 0) {
        const urlMap = await loadAllImages(s.imageIds)
        const validIds: string[] = []
        const urls: string[] = []
        for (const id of s.imageIds) {
          const url = urlMap.get(id)
          if (url) { validIds.push(id); urls.push(url) }
        }
        useWallpaperStore.setState({
          imageUrls: urls,
          imageUrl: urls[0] ?? null,
          imageIds: validIds,
        })
      }
      if (s.logoId) {
        const url = await loadImage(s.logoId)
        if (url) useWallpaperStore.setState({ logoUrl: url })
        else useWallpaperStore.setState({ logoId: null })
      }
    }
    void restoreAssets()

    const unsubscribe = useWallpaperStore.subscribe((state) => {
      const isDirty = !doesStateMatchPreset(state)
      if (state.isPresetDirty !== isDirty) {
        useWallpaperStore.setState({ isPresetDirty: isDirty })
      }
    })
    return unsubscribe
  }, [])

  return (
    <I18nProvider>
      <AudioDataProvider>
        <SlideshowManager />
        <main>
          <WallpaperCanvas />
          <AudioOverlay />
          <ControlPanel />
        </main>
      </AudioDataProvider>
    </I18nProvider>
  )
}
