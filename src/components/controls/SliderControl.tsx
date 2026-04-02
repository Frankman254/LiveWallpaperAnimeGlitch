import type { SliderControlProps } from '@/types/controls'
import { useWallpaperStore } from '@/store/wallpaperStore'
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme'

function fmt(value: number, step: number): string {
  if (step >= 1) return String(Math.round(value))
  if (step >= 0.1) return value.toFixed(1)
  if (step >= 0.01) return value.toFixed(2)
  return value.toFixed(3)
}

export default function SliderControl({
  label, value, min, max, step, onChange,
  unit, tooltip, effectiveValue,
}: SliderControlProps) {
  const editorTheme = useWallpaperStore((state) => state.editorTheme)
  const theme = EDITOR_THEME_CLASSES[editorTheme]
  const displayValue = fmt(value, step)
  const isLimited = effectiveValue !== undefined && effectiveValue !== value

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-xs">
        <span
          className={`cursor-default ${theme.sectionTitle}`}
          title={tooltip}
        >
          {label}
          {tooltip && <span className={`ml-0.5 ${theme.panelSubtle}`}>?</span>}
        </span>
        <span className={isLimited ? 'text-amber-400' : theme.panelSubtle}>
          {isLimited
            ? `${fmt(effectiveValue!, step)}${unit ? ' ' + unit : ''} (set: ${displayValue})`
            : `${displayValue}${unit ? ' ' + unit : ''}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`h-1 w-full ${theme.controlAccent}`}
      />
    </div>
  )
}
