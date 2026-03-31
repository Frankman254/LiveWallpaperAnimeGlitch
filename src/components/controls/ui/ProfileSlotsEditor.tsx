import SectionDivider from '@/components/controls/ui/SectionDivider'

type ProfileSlotLike = {
  name: string
  values: unknown | null
}

type ProfileSlotsEditorProps = {
  title: string
  hint: string
  slots: ProfileSlotLike[]
  activeIndex: number | null
  onSave: (index: number) => void
  onLoad: (index: number) => void
  loadLabel: string
  saveLabel: string
  slotLabel: string
  emptyLabel: string
  activeLabel: string
}

export default function ProfileSlotsEditor({
  title,
  hint,
  slots,
  activeIndex,
  onSave,
  onLoad,
  loadLabel,
  saveLabel,
  slotLabel,
  emptyLabel,
  activeLabel,
}: ProfileSlotsEditorProps) {
  return (
    <>
      <SectionDivider label={title} />
      <div className="flex flex-col gap-2">
        {slots.map((slot, index) => {
          const isActive = activeIndex === index && slot.values
          return (
            <div
              key={`${slotLabel}-${index + 1}`}
              className={`flex items-center justify-between gap-2 rounded border px-2 py-2 ${
                isActive
                  ? 'border-cyan-500 bg-cyan-950/20'
                  : 'border-cyan-950/80 bg-cyan-950/10'
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs text-cyan-400">{`${slotLabel} ${index + 1}`}</div>
                <div className="truncate text-[11px] text-cyan-700">
                  {slot.values ? slot.name : emptyLabel}
                  {isActive ? ` · ${activeLabel}` : ''}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => onLoad(index)}
                  disabled={!slot.values}
                  className="rounded border border-cyan-900 px-2 py-1 text-[11px] text-cyan-400 transition-colors hover:border-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loadLabel}
                </button>
                <button
                  onClick={() => onSave(index)}
                  className="rounded border border-cyan-900 px-2 py-1 text-[11px] text-cyan-400 transition-colors hover:border-cyan-500"
                >
                  {saveLabel}
                </button>
              </div>
            </div>
          )
        })}
        <span className="text-[11px] leading-relaxed text-cyan-700">{hint}</span>
      </div>
    </>
  )
}
