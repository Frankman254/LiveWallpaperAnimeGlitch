interface Props {
  label: string
  value: string
  onChange: (v: string) => void
}

export default function ColorInput({ label, value, onChange }: Props) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-cyan-400">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"
      />
    </div>
  )
}
