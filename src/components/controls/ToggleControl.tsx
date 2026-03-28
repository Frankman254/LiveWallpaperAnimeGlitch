
import type { ToggleControlProps } from "@/types/controls";

export default function ToggleControl({ label, value, onChange }: ToggleControlProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-cyan-400">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`w-10 h-5 rounded-full transition-colors ${
          value ? "bg-cyan-500" : "bg-gray-700"
        } relative`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
