import { AudioDataProvider } from '@/context/AudioDataContext'
import WallpaperCanvas from '@/components/wallpaper/WallpaperCanvas'
import AudioOverlay from '@/components/audio/AudioOverlay'
import ControlPanel from '@/components/controls/ControlPanel'

export default function App() {
  return (
    <AudioDataProvider>
      <main>
        <WallpaperCanvas />
        <AudioOverlay />
        <ControlPanel />
      </main>
    </AudioDataProvider>
  )
}
