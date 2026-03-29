import { useWallpaperStore } from '@/store/wallpaperStore'
import { useT } from '@/lib/i18n'
import type { PresetKey } from '@/types/presets'

const PRESET_KEYS: PresetKey[] = ['softDream', 'cyberPop', 'rainyNight']
const PRESET_LABELS: Record<PresetKey, string> = {
  softDream: 'Soft Dream',
  cyberPop: 'Cyber Pop',
  rainyNight: 'Rainy Night',
}

export default function PresetSelector() {
  const { activePreset, isPresetDirty, applyPreset } = useWallpaperStore()
  const t = useT()

  function handleApply(key: PresetKey) {
    if (isPresetDirty && activePreset === key) return // already on this preset but with changes
    if (isPresetDirty) {
      const ok = window.confirm(t.confirm_apply_preset)
      if (!ok) return
    }
    applyPreset(key)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-cyan-400 uppercase tracking-widest">Presets</span>
        {isPresetDirty && (
          <span className="text-xs text-amber-400">{t.state_custom}</span>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {PRESET_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => handleApply(key)}
            className={`px-3 py-1 text-xs rounded border transition-colors ${
              activePreset === key && !isPresetDirty
                ? 'bg-cyan-500 border-cyan-500 text-black'
                : activePreset === key && isPresetDirty
                ? 'border-amber-500 text-amber-400'
                : 'bg-transparent border-cyan-800 text-cyan-400 hover:border-cyan-500'
            }`}
          >
            {PRESET_LABELS[key]}
          </button>
        ))}
      </div>
    </div>
  )
}
