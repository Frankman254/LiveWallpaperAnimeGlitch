import type { ReactNode } from 'react'
import { AudioDataProvider } from '@/context/AudioDataContext'
import { I18nProvider } from '@/lib/i18n'

export default function WallpaperAppProviders({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <AudioDataProvider>
        {children}
      </AudioDataProvider>
    </I18nProvider>
  )
}
