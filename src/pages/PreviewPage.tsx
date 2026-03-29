import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AudioDataProvider } from '@/context/AudioDataContext'
import { I18nProvider } from '@/lib/i18n'
import WallpaperCanvas from '@/components/wallpaper/WallpaperCanvas'
import AudioOverlay from '@/components/audio/AudioOverlay'
import SlideshowManager from '@/components/SlideshowManager'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { loadAllImages, loadImage } from '@/lib/db/imageDb'

async function restoreAssets() {
  const s = useWallpaperStore.getState()
  if (s.imageIds.length > 0) {
    const urlMap = await loadAllImages(s.imageIds)
    const urls: string[] = []
    const validIds: string[] = []
    for (const id of s.imageIds) {
      const url = urlMap.get(id)
      if (url) { validIds.push(id); urls.push(url) }
    }
    useWallpaperStore.setState({ imageUrls: urls, imageUrl: urls[0] ?? null, imageIds: validIds })
  }
  if (s.logoId) {
    const url = await loadImage(s.logoId)
    if (url) useWallpaperStore.setState({ logoUrl: url })
  }
}

export default function PreviewPage() {
  const [showUI, setShowUI] = useState(true)

  useEffect(() => {
    void restoreAssets()

    // Sync settings from editor tab via localStorage events
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'lwag-state') {
        void useWallpaperStore.persist.rehydrate()
        void restoreAssets()
      }
    }
    window.addEventListener('storage', handleStorage)

    // Hide UI overlay after 3s of inactivity
    let timer: ReturnType<typeof setTimeout>
    const resetTimer = () => {
      setShowUI(true)
      clearTimeout(timer)
      timer = setTimeout(() => setShowUI(false), 3000)
    }
    resetTimer()
    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keydown', resetTimer)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keydown', resetTimer)
      clearTimeout(timer)
    }
  }, [])

  function goFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void document.documentElement.requestFullscreen()
    }
  }

  return (
    <I18nProvider>
      <AudioDataProvider>
        <SlideshowManager />
        <main style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
          <WallpaperCanvas />
          <AudioOverlay />

          {/* Minimal overlay — fades out after inactivity */}
          <div
            className={`fixed top-3 right-3 z-50 flex gap-2 transition-opacity duration-500 ${
              showUI ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <button
              onClick={goFullscreen}
              className="px-3 py-1.5 text-xs rounded bg-black/70 border border-cyan-900 text-cyan-400 hover:border-cyan-500 transition-colors backdrop-blur-sm"
            >
              ⛶ Fullscreen
            </button>
            <Link
              to="/"
              className="px-3 py-1.5 text-xs rounded bg-black/70 border border-cyan-900 text-cyan-400 hover:border-cyan-500 transition-colors backdrop-blur-sm"
            >
              ← Editor
            </Link>
          </div>
        </main>
      </AudioDataProvider>
    </I18nProvider>
  )
}
