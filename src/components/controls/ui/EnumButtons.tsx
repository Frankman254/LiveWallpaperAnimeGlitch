interface Props<T extends string> {
  options: T[]
  value: T
  onChange: (v: T) => void
  labels?: Partial<Record<T, string>>
}

export default function EnumButtons<T extends string>({ options, value, onChange, labels }: Props<T>) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-2 py-0.5 text-xs rounded border capitalize transition-colors ${
            value === opt
              ? 'bg-cyan-500 border-cyan-500 text-black'
              : 'bg-transparent border-cyan-800 text-cyan-400 hover:border-cyan-500'
          }`}
        >
          {labels?.[opt] ?? opt}
        </button>
      ))}
    </div>
  )
}
