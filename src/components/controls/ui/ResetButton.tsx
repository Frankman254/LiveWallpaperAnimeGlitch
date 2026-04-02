import { useWallpaperStore } from '@/store/wallpaperStore'
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme'

interface Props {
  label: string
  onClick: () => void
}

export default function ResetButton({ label, onClick }: Props) {
  const editorTheme = useWallpaperStore((state) => state.editorTheme)
  const theme = EDITOR_THEME_CLASSES[editorTheme]
  return (
    <button
      onClick={onClick}
      className={`text-xs transition-opacity self-end ${theme.panelSubtle} hover:opacity-90`}
      title="Reset this tab to defaults"
    >
      {label}
    </button>
  )
}
