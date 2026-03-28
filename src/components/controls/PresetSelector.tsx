
import { useWallpaperStore } from "@/store/wallpaperStore";
import type { PresetKey } from "@/types/presets";

const PRESET_LABELS: Record<PresetKey, string> = {
  softDream: "Soft Dream",
  cyberPop: "Cyber Pop",
  rainyNight: "Rainy Night",
};

export default function PresetSelector() {
  const { activePreset, applyPreset } = useWallpaperStore();

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-cyan-400 uppercase tracking-widest">Presets</span>
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(PRESET_LABELS) as PresetKey[]).map((key) => (
          <button
            key={key}
            onClick={() => applyPreset(key)}
            className={`px-3 py-1 text-xs rounded border transition-colors ${
              activePreset === key
                ? "bg-cyan-500 border-cyan-500 text-black"
                : "bg-transparent border-cyan-800 text-cyan-400 hover:border-cyan-500"
            }`}
          >
            {PRESET_LABELS[key]}
          </button>
        ))}
      </div>
    </div>
  );
}
