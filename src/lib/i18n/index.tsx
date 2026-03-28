import { createContext, useContext, type ReactNode } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { en, type TranslationKey } from './en'
import { es } from './es'

export type Translations = Record<TranslationKey, string>

const I18nContext = createContext<Translations>(en as Translations)

export function I18nProvider({ children }: { children: ReactNode }) {
  const language = useWallpaperStore((s) => s.language)
  const t: Translations = language === 'es' ? es : (en as Translations)
  return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>
}

/** Returns the active translation object. Use as: const t = useT() */
export function useT(): Translations {
  return useContext(I18nContext)
}
