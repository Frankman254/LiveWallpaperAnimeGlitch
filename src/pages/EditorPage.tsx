import { useEffect } from 'react'
import { AudioDataProvider } from '@/context/AudioDataContext'
import { I18nProvider } from '@/lib/i18n'
import WallpaperViewport from '@/components/wallpaper/WallpaperViewport'
import ControlPanel from '@/components/controls/ControlPanel'
import { doesStateMatchPreset } from '@/lib/presets'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { useRestoreWallpaperAssets } from '@/hooks/useRestoreWallpaperAssets'

export default function EditorPage() {
  useRestoreWallpaperAssets()

  useEffect(() => {
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
        <WallpaperViewport editorMode />
        <ControlPanel />
      </AudioDataProvider>
    </I18nProvider>
  )
}
