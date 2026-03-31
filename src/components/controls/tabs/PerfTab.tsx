import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import type { ControlPanelAnchor, EditorTheme, PerformanceMode } from '@/types/wallpaper'
import { DEFAULT_STATE, PARTICLE_LIMITS } from '@/lib/constants'
import SectionDivider from '../ui/SectionDivider'
import ToggleControl from '../ToggleControl'
import EnumButtons from '../ui/EnumButtons'

const PERF_MODES: PerformanceMode[] = ['low', 'medium', 'high']
const PANEL_ANCHORS: ControlPanelAnchor[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
const EDITOR_THEMES: EditorTheme[] = ['cyber', 'glass', 'sunset', 'terminal']

export default function PerfTab() {
  const t = useT()
  const store = useWallpaperStore()
  const limit = PARTICLE_LIMITS[store.performanceMode]
  const cappedCount = Math.min(store.particleCount, limit)
  const isCapped = store.particleCount > limit
  const panelAnchorLabels: Record<ControlPanelAnchor, string> = {
    'top-left': t.corner_top_left,
    'top-right': t.corner_top_right,
    'bottom-left': t.corner_bottom_left,
    'bottom-right': t.corner_bottom_right,
  }
  const editorThemeLabels: Record<EditorTheme, string> = {
    cyber: 'Cyber',
    glass: 'Glass',
    sunset: 'Sunset',
    terminal: 'Terminal',
  }

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
        <div className="text-xs text-gray-500 space-y-0.5">
          <p>{t.hint_perf_low}</p>
          <p>{t.hint_perf_med}</p>
          <p>{t.hint_perf_high}</p>
        </div>
      </div>

      <SectionDivider label={t.section_editor_panel} />
      <ToggleControl
        label={t.label_show_fps}
        value={store.showFps}
        onChange={store.setShowFps}
      />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400 uppercase tracking-widest">{t.label_fps_corner}</span>
        <EnumButtons<ControlPanelAnchor>
          options={PANEL_ANCHORS}
          value={store.fpsOverlayAnchor}
          onChange={store.setFpsOverlayAnchor}
          labels={panelAnchorLabels}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400 uppercase tracking-widest">{t.label_panel_corner}</span>
        <EnumButtons<ControlPanelAnchor>
          options={PANEL_ANCHORS}
          value={store.controlPanelAnchor}
          onChange={store.setControlPanelAnchor}
          labels={panelAnchorLabels}
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-cyan-400 uppercase tracking-widest">{t.label_editor_theme}</span>
        <EnumButtons<EditorTheme>
          options={EDITOR_THEMES}
          value={store.editorTheme}
          onChange={store.setEditorTheme}
          labels={editorThemeLabels}
        />
      </div>

      {isCapped && (
        <div className="px-3 py-2 rounded border border-amber-800 bg-amber-950/30">
          <p className="text-xs text-amber-400">
            {t.label_count}: {store.particleCount} → {t.hint_effective} {cappedCount}
          </p>
        </div>
      )}

      <SectionDivider />
      <button
        onClick={store.reset}
        className="text-xs text-red-400 hover:text-red-300 transition-colors text-left"
      >
        {t.reset_all}
      </button>
      <button
        onClick={() => {
          localStorage.removeItem('lwag-state')
          useWallpaperStore.setState({ ...DEFAULT_STATE })
        }}
        className="text-xs text-orange-500 hover:text-orange-400 transition-colors text-left"
      >
        {t.clear_storage}
      </button>
    </>
  )
}
