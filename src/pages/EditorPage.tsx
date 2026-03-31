import WallpaperAppProviders from '@/components/app/WallpaperAppProviders'
import WallpaperViewport from '@/components/wallpaper/WallpaperViewport'
import ControlPanel from '@/components/controls/ControlPanel'
import { useRestoreWallpaperAssets } from '@/hooks/useRestoreWallpaperAssets'
import { usePresetDirtyTracker } from '@/hooks/usePresetDirtyTracker'
import { useBroadcastWallpaperChanges } from '@/hooks/useWallpaperPreviewSync'

export default function EditorPage() {
  useRestoreWallpaperAssets()
  usePresetDirtyTracker()
  useBroadcastWallpaperChanges()

  return (
    <WallpaperAppProviders>
        <WallpaperViewport editorMode />
        <ControlPanel />
    </WallpaperAppProviders>
  )
}
