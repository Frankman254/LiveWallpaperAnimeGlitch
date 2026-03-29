import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AudioDataProvider } from '@/context/AudioDataContext'
import { I18nProvider } from '@/lib/i18n'
import WallpaperViewport from '@/components/wallpaper/WallpaperViewport'
import { restoreWallpaperAssets, useRestoreWallpaperAssets } from '@/hooks/useRestoreWallpaperAssets'
import { useWallpaperStore } from '@/store/wallpaperStore'

export default function PreviewPage() {
  const [showUI, setShowUI] = useState(true)
  useRestoreWallpaperAssets()

  useEffect(() => {
    // Sync settings from editor tab via localStorage events
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'lwag-state') {
        void useWallpaperStore.persist.rehydrate()
        void restoreWallpaperAssets()
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
        <WallpaperViewport />

        <main style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
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
