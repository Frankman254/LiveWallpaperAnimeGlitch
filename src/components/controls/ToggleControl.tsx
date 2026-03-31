import type { ToggleControlProps } from '@/types/controls'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme'

export default function ToggleControl({ label, value, onChange, tooltip }: ToggleControlProps) {
  const editorTheme = useWallpaperStore((state) => state.editorTheme)
  const theme = EDITOR_THEME_CLASSES[editorTheme]
  return (
    <div className="flex justify-between items-center">
      <span
        className={`text-xs cursor-default ${theme.sectionTitle}`}
        title={tooltip}
      >
        {label}
        {tooltip && <span className={`ml-0.5 ${theme.panelSubtle}`}>?</span>}
      </span>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors ${
          value ? 'bg-cyan-500' : 'bg-gray-700/80'
        } relative flex-shrink-0`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}
