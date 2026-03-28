interface Props {
  label: string
  onClick: () => void
}

export default function ResetButton({ label, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-cyan-700 hover:text-cyan-500 transition-colors self-end"
      title="Reset this tab to defaults"
    >
      {label}
    </button>
  )
}
