import { useEffect } from 'react'
import { AudioDataProvider } from '@/context/AudioDataContext'
import { I18nProvider } from '@/lib/i18n'
import WallpaperCanvas from '@/components/wallpaper/WallpaperCanvas'
import AudioOverlay from '@/components/audio/AudioOverlay'
import ControlPanel from '@/components/controls/ControlPanel'
import SlideshowManager from '@/components/SlideshowManager'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { loadAllImages, loadImage } from '@/lib/db/imageDb'
import { presets } from '@/lib/presets'
import type { PresetKey } from '@/types/presets'

function AppInner() {
  useEffect(() => {
    // Restore persisted images from IndexedDB on startup
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
          // Remove orphaned IDs from any cleared browser storage
          imageIds: validIds,
        })
      }

      if (s.logoId) {
        const url = await loadImage(s.logoId)
        if (url) {
          useWallpaperStore.setState({ logoUrl: url })
        } else {
          useWallpaperStore.setState({ logoId: null })
        }
      }
    }

    void restoreAssets()

    // Dirty-state watcher: compare live state to active preset values
    const unsubscribe = useWallpaperStore.subscribe((state) => {
      if (state.isPresetDirty) return
      const preset = presets[state.activePreset as PresetKey]
      if (!preset) return
      const dirty = (Object.keys(preset) as (keyof typeof preset)[]).some(
        (k) => (preset as Record<string, unknown>)[k] !== (state as Record<string, unknown>)[k]
      )
      if (dirty) useWallpaperStore.setState({ isPresetDirty: true })
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

export default function App() {
  return <AppInner />
}
