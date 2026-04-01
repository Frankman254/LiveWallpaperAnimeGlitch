import { useState } from 'react'
import WallpaperAppProviders from '@/components/app/WallpaperAppProviders'
import WallpaperViewport from '@/components/wallpaper/WallpaperViewport'
import ControlPanel from '@/components/controls/ControlPanel'
import { useRestoreWallpaperAssets } from '@/hooks/useRestoreWallpaperAssets'
import { usePresetDirtyTracker } from '@/hooks/usePresetDirtyTracker'
import { useBroadcastWallpaperChanges } from '@/hooks/useWallpaperPreviewSync'

export default function EditorPage() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [overlayOpen, setOverlayOpen] = useState(false)
  useRestoreWallpaperAssets()
  usePresetDirtyTracker()
  useBroadcastWallpaperChanges()

  return (
    <WallpaperAppProviders>
        <WallpaperViewport editorMode interactionVisible={panelOpen || overlayOpen} />
        <ControlPanel
          open={panelOpen}
          maximized={overlayOpen}
          onOpenChange={setPanelOpen}
          onMaximizedChange={setOverlayOpen}
        />
    </WallpaperAppProviders>
  )
}
