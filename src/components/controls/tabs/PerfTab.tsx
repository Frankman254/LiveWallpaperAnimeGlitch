import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import type { PerformanceMode } from '@/types/wallpaper'
import SectionDivider from '../ui/SectionDivider'

const PERF_MODES: PerformanceMode[] = ['low', 'medium', 'high']

export default function PerfTab() {
  const t = useT()
  const store = useWallpaperStore()
  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-xs text-cyan-400 uppercase tracking-widest">{t.label_perf_mode}</span>
        <div className="flex gap-2">
          {PERF_MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => store.setPerformanceMode(mode)}
              className={`flex-1 py-1 text-xs rounded border capitalize transition-colors ${
                store.performanceMode === mode
                  ? 'bg-cyan-500 border-cyan-500 text-black'
                  : 'bg-transparent border-cyan-800 text-cyan-400 hover:border-cyan-500'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-500">
          {t.hint_perf_low}<br />{t.hint_perf_med}<br />{t.hint_perf_high}
        </span>
      </div>
      <SectionDivider />
      <button
        onClick={store.reset}
        className="text-xs text-red-400 hover:text-red-300 transition-colors text-left"
      >
        {t.reset_all}
      </button>
      <button
        onClick={() => { localStorage.removeItem('lwag-state'); store.reset() }}
        className="text-xs text-orange-500 hover:text-orange-400 transition-colors text-left"
      >
        {t.clear_storage}
      </button>
    </>
  )
}
