import WallpaperCanvas from '@/components/wallpaper/WallpaperCanvas'
import AudioOverlay from '@/components/audio/AudioOverlay'
import SlideshowManager from '@/components/SlideshowManager'
import OverlayInteractionStage from '@/components/wallpaper/OverlayInteractionStage'

export default function WallpaperViewport({ editorMode = false }: { editorMode?: boolean }) {
  return (
    <>
      <SlideshowManager />
      <main style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
        <WallpaperCanvas />
        <AudioOverlay />
        {editorMode && <OverlayInteractionStage />}
      </main>
    </>
  )
}
