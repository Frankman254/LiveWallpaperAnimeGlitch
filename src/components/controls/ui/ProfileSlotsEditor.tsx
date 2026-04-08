import SectionDivider from '@/components/controls/ui/SectionDivider';

type ProfileSlotLike = {
	name: string;
	values: unknown | null;
};

type ProfileSlotsEditorProps = {
	title: string;
	hint: string;
	slots: ProfileSlotLike[];
	activeIndex: number | null;
	onSave: (index: number) => void;
	onLoad: (index: number) => void;
	loadLabel: string;
	saveLabel: string;
	slotLabel: string;
	emptyLabel: string;
	activeLabel: string;
	onAdd?: () => void;
	onDelete?: (index: number) => void;
	minProtectedSlots?: number;
	maxSlots?: number;
};

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
	onAdd,
	onDelete,
	minProtectedSlots = 3,
	maxSlots = 10
}: ProfileSlotsEditorProps) {
	return (
		<>
			<div className="flex items-center justify-between gap-2">
				<SectionDivider label={title} />
				{onAdd ? (
					<button
						onClick={onAdd}
						disabled={slots.length >= maxSlots}
						className="rounded border px-2 py-1 text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
						style={{
							borderColor: 'var(--editor-button-border)',
							background: 'var(--editor-button-bg)',
							color: 'var(--editor-button-fg)'
						}}
						title={
							slots.length >= maxSlots
								? `Max ${maxSlots}`
								: `Add slot (${slots.length}/${maxSlots})`
						}
					>
						+
					</button>
				) : null}
			</div>
			<div className="flex flex-wrap items-start gap-2">
				{slots.map((slot, index) => {
					const isActive = activeIndex === index && slot.values;
					const canDelete =
						Boolean(onDelete) && index >= minProtectedSlots;
					return (
						<div
							key={`${slotLabel}-${index + 1}`}
							className="inline-flex w-fit min-w-[118px] max-w-[190px] flex-col gap-1.5 rounded border px-2 py-2 align-top"
							style={{
								borderColor: isActive
									? 'var(--editor-accent-color)'
									: 'var(--editor-accent-border)',
								background: isActive
									? 'var(--editor-tag-bg)'
									: 'var(--editor-surface-bg)'
							}}
						>
							<div className="flex items-start justify-between gap-2">
								<div className="min-w-0">
									<div
										className="text-xs"
										style={{ color: 'var(--editor-accent-soft)' }}
									>{`${slotLabel} ${index + 1}`}</div>
									<div
										className="truncate text-[11px]"
										style={{ color: 'var(--editor-accent-muted)' }}
									>
										{slot.values ? slot.name : emptyLabel}
										{isActive ? ` · ${activeLabel}` : ''}
									</div>
								</div>
								{canDelete ? (
									<button
										onClick={() => onDelete?.(index)}
										className="rounded border border-red-900 px-1.5 py-0.5 text-[11px] text-red-400 transition-colors hover:border-red-600"
										title="Delete slot"
									>
										×
									</button>
								) : null}
							</div>
							<div className="flex shrink-0 flex-wrap gap-1">
								<button
									onClick={() => onLoad(index)}
									disabled={!slot.values}
									className="rounded border px-2 py-1 text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
									style={{
										borderColor: 'var(--editor-button-border)',
										background: 'var(--editor-button-bg)',
										color: 'var(--editor-button-fg)'
									}}
								>
									{loadLabel}
								</button>
								<button
									onClick={() => onSave(index)}
									className="rounded border px-2 py-1 text-[11px] transition-colors"
									style={{
										borderColor: 'var(--editor-button-border)',
										background: 'var(--editor-button-bg)',
										color: 'var(--editor-button-fg)'
									}}
								>
									{saveLabel}
								</button>
							</div>
						</div>
					);
				})}
			</div>
			<span
				className="text-[11px] leading-relaxed"
				style={{ color: 'var(--editor-accent-muted)' }}
			>
				{hint}
			</span>
		</>
	);
}
