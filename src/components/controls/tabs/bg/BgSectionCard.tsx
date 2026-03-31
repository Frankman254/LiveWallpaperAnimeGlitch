import type { ReactNode } from 'react'

export default function BgSectionCard({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-cyan-950/80 bg-cyan-950/10 p-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-widest text-cyan-400">{title}</span>
        {hint && <span className="text-[11px] text-cyan-700">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
