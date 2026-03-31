import { useCurrentFps } from '@/hooks/useCurrentFps'
import { useWallpaperStore } from '@/store/wallpaperStore'

function getFpsTone(fps: number) {
  if (fps >= 55) return 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
  if (fps >= 35) return 'text-cyan-300 border-cyan-500/40 bg-cyan-500/10'
  if (fps >= 20) return 'text-amber-300 border-amber-500/40 bg-amber-500/10'
  return 'text-rose-300 border-rose-500/40 bg-rose-500/10'
}

export default function FpsBadge() {
  const showFps = useWallpaperStore((state) => state.showFps)
  if (!showFps) return null

  return <VisibleFpsBadge />
}

function VisibleFpsBadge() {
  const fps = useCurrentFps()
  const displayValue = fps > 0 ? `${fps} FPS` : '-- FPS'

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide tabular-nums ${getFpsTone(fps)}`}
      title="Current render FPS"
    >
      {displayValue}
    </span>
  )
}
