import { AudioDataProvider } from '@/context/AudioDataContext'
import { I18nProvider } from '@/lib/i18n'
import WallpaperCanvas from '@/components/wallpaper/WallpaperCanvas'
import AudioOverlay from '@/components/audio/AudioOverlay'
import ControlPanel from '@/components/controls/ControlPanel'
import SlideshowManager from '@/components/SlideshowManager'

export default function App() {
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
