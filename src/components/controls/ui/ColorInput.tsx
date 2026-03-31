interface Props {
  label: string
  value: string
  onChange: (v: string) => void
}

import { useWallpaperStore } from '@/store/wallpaperStore'
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme'

export default function ColorInput({ label, value, onChange }: Props) {
  const editorTheme = useWallpaperStore((state) => state.editorTheme)
  const theme = EDITOR_THEME_CLASSES[editorTheme]
  return (
    <div className="flex justify-between items-center">
      <span className={`text-xs ${theme.sectionTitle}`}>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"
      />
    </div>
  )
}
