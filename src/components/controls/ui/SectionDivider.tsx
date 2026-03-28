interface Props { label?: string }

export default function SectionDivider({ label }: Props) {
  return (
    <div className="flex items-center gap-2 my-1">
      <div className="flex-1 h-px bg-cyan-900" />
      {label && <span className="text-xs text-cyan-700 uppercase tracking-widest whitespace-nowrap">{label}</span>}
      <div className="flex-1 h-px bg-cyan-900" />
    </div>
  )
}
