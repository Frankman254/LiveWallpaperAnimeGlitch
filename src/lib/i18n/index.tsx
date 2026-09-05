import { createContext, useContext, type ReactNode } from 'react';
import { en, type TranslationKey } from './en';
import { es } from './es';

export type Translations = Record<TranslationKey, string>;
export type Language = 'en' | 'es';

const I18nContext = createContext<Translations>(en as Translations);

/**
 * Takes the active language as a prop rather than reading it off the store.
 *
 * It used to call `useWallpaperStore(s => s.language)`, which was the only
 * thing left making `lib/` — a leaf zone — depend on global state. The app
 * has exactly one mount site (`components/app/WallpaperAppProviders`), so
 * lifting the read one level up cost two files and left the dictionaries a
 * genuine leaf: `@/lib/i18n` now knows nothing about this product's store.
 */
export function I18nProvider({
	language,
	children
}: {
	language: Language;
	children: ReactNode;
}) {
	const t: Translations = language === 'es' ? es : (en as Translations);
	return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
}

/** Returns the active translation object. Use as: const t = useT() */
export function useT(): Translations {
	return useContext(I18nContext);
}
