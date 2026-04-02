import { useCallback, useEffect, useState } from 'react'

type MiniPlayerMode = 'closed' | 'document-pip' | 'popup'

type DocumentPictureInPictureApi = {
  window?: Window | null
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>
}

const WINDOW_MODE_EVENT = 'wallpaper-window-mode-change'
const MINI_PLAYER_WINDOW_NAME = 'live-wallpaper-mini-player'

let miniPlayerWindowRef: Window | null = null
let miniPlayerModeRef: MiniPlayerMode = 'closed'

function emitWindowModeChange() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(WINDOW_MODE_EVENT))
}

function getDocumentPictureInPictureApi(): DocumentPictureInPictureApi | null {
  if (typeof window === 'undefined') return null
  return (window as Window & { documentPictureInPicture?: DocumentPictureInPictureApi }).documentPictureInPicture ?? null
}

function getPreviewUrl(): string {
  const base = window.location.href.replace(/#.*$/, '')
  return `${base}#/preview`
}

function resolveMiniPlayerMode(): MiniPlayerMode {
  if (miniPlayerWindowRef && !miniPlayerWindowRef.closed) {
    return miniPlayerModeRef
  }
  miniPlayerWindowRef = null
  miniPlayerModeRef = 'closed'
  return 'closed'
}

function attachMiniPlayerWindowLifecycle(nextWindow: Window, mode: Exclude<MiniPlayerMode, 'closed'>) {
  miniPlayerWindowRef = nextWindow
  miniPlayerModeRef = mode

  const clearRef = () => {
    if (miniPlayerWindowRef === nextWindow) {
      miniPlayerWindowRef = null
      miniPlayerModeRef = 'closed'
      emitWindowModeChange()
    }
  }

  nextWindow.addEventListener('pagehide', clearRef, { once: true })
  nextWindow.addEventListener('beforeunload', clearRef, { once: true })
  emitWindowModeChange()
}

async function openDocumentMiniPlayer(): Promise<void> {
  const api = getDocumentPictureInPictureApi()
  if (!api) {
    throw new Error('document-picture-in-picture-unavailable')
  }

  if (miniPlayerWindowRef && !miniPlayerWindowRef.closed) {
    miniPlayerWindowRef.focus()
    miniPlayerModeRef = 'document-pip'
    emitWindowModeChange()
    return
  }

  const pipWindow = await api.requestWindow({
    width: 520,
    height: 320,
  })

  const doc = pipWindow.document
  doc.title = 'Live Wallpaper Mini Player'
  doc.body.style.margin = '0'
  doc.body.style.width = '100vw'
  doc.body.style.height = '100vh'
  doc.body.style.background = '#000'
  doc.body.style.overflow = 'hidden'

  const iframe = doc.createElement('iframe')
  iframe.src = getPreviewUrl()
  iframe.title = 'Live Wallpaper Preview'
  iframe.allow = 'fullscreen'
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.border = '0'
  iframe.style.display = 'block'

  doc.body.replaceChildren(iframe)
  attachMiniPlayerWindowLifecycle(pipWindow, 'document-pip')
}

function openPopupMiniPlayer(): void {
  if (miniPlayerWindowRef && !miniPlayerWindowRef.closed) {
    miniPlayerWindowRef.focus()
    miniPlayerModeRef = 'popup'
    emitWindowModeChange()
    return
  }

  const popup = window.open(
    getPreviewUrl(),
    MINI_PLAYER_WINDOW_NAME,
    'popup=yes,width=520,height=320,resizable=yes,scrollbars=no'
  )

  if (!popup) {
    throw new Error('popup-blocked')
  }

  attachMiniPlayerWindowLifecycle(popup, 'popup')
}

export function useWindowPresentationControls() {
  const [isFullscreen, setIsFullscreen] = useState(() => (
    typeof document !== 'undefined' ? Boolean(document.fullscreenElement) : false
  ))
  const [miniPlayerMode, setMiniPlayerMode] = useState<MiniPlayerMode>(() => resolveMiniPlayerMode())

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    function handleWindowModeChange() {
      setMiniPlayerMode(resolveMiniPlayerMode())
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    window.addEventListener(WINDOW_MODE_EVENT, handleWindowModeChange)

    const timer = window.setInterval(() => {
      if (miniPlayerModeRef !== 'closed' && (!miniPlayerWindowRef || miniPlayerWindowRef.closed)) {
        miniPlayerWindowRef = null
        miniPlayerModeRef = 'closed'
        handleWindowModeChange()
      }
    }, 1000)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener(WINDOW_MODE_EVENT, handleWindowModeChange)
      window.clearInterval(timer)
    }
  }, [])

  const fullscreenSupported = typeof document !== 'undefined' && Boolean(document.documentElement?.requestFullscreen)
  const documentMiniPlayerSupported = typeof window !== 'undefined' && window.isSecureContext && Boolean(getDocumentPictureInPictureApi())
  const popupMiniPlayerSupported = typeof window !== 'undefined' && typeof window.open === 'function'

  const toggleFullscreen = useCallback(async () => {
    if (!fullscreenSupported) return
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      emitWindowModeChange()
      return
    }
    await document.documentElement.requestFullscreen()
    emitWindowModeChange()
  }, [fullscreenSupported])

  const closeMiniPlayer = useCallback(() => {
    if (!miniPlayerWindowRef || miniPlayerWindowRef.closed) {
      miniPlayerWindowRef = null
      miniPlayerModeRef = 'closed'
      emitWindowModeChange()
      return
    }

    miniPlayerWindowRef.close()
    miniPlayerWindowRef = null
    miniPlayerModeRef = 'closed'
    emitWindowModeChange()
  }, [])

  const openMiniPlayer = useCallback(async () => {
    if (documentMiniPlayerSupported) {
      await openDocumentMiniPlayer()
      return
    }

    if (popupMiniPlayerSupported) {
      openPopupMiniPlayer()
      return
    }

    throw new Error('mini-player-unavailable')
  }, [documentMiniPlayerSupported, popupMiniPlayerSupported])

  const toggleMiniPlayer = useCallback(async () => {
    if (resolveMiniPlayerMode() !== 'closed') {
      closeMiniPlayer()
      return
    }

    await openMiniPlayer()
  }, [closeMiniPlayer, openMiniPlayer])

  return {
    isFullscreen,
    fullscreenSupported,
    toggleFullscreen,
    miniPlayerMode,
    isMiniPlayerOpen: miniPlayerMode !== 'closed',
    miniPlayerSupport: documentMiniPlayerSupported ? 'document-pip' : (popupMiniPlayerSupported ? 'popup' : 'none'),
    toggleMiniPlayer,
    openMiniPlayer,
    closeMiniPlayer,
  } as const
}
