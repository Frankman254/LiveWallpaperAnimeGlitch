import type { ReactNode } from 'react'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme'

interface TabSectionProps {
  title: string
  hint?: string
  children: ReactNode
}

export default function TabSection({ title, hint, children }: TabSectionProps) {
  const editorTheme = useWallpaperStore((state) => state.editorTheme)
  const theme = EDITOR_THEME_CLASSES[editorTheme]

  return (
    <section className={`rounded-lg border p-3 ${theme.sectionShell}`}>
      <div className="mb-3 flex flex-col gap-1">
        <span className={`text-[11px] font-bold uppercase tracking-[0.2em] ${theme.sectionTitle}`}>
          {title}
        </span>
        {hint ? (
          <span className={`text-[11px] leading-relaxed ${theme.panelSubtle}`}>
            {hint}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-3">
        {children}
      </div>
    </section>
  )
}
