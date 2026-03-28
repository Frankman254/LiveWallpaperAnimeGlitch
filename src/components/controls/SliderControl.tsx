
import type { SliderControlProps } from "@/types/controls";

export default function SliderControl({ label, value, min, max, step, onChange }: SliderControlProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-cyan-400">
        <span>{label}</span>
        <span>{value.toFixed(3)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-cyan-400"
      />
    </div>
  );
}
