import SectionDivider from '@/components/controls/ui/SectionDivider';
import { Button, UI_COLORS } from '@/ui';

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
					<Button
						onClick={onAdd}
						disabled={slots.length >= maxSlots}
						size="sm"
						density="compact"
						variant="secondary"
						title={
							slots.length >= maxSlots
								? `Max ${maxSlots}`
								: `Add slot (${slots.length}/${maxSlots})`
						}
					>
						+
					</Button>
				) : null}
			</div>
			<div
				className="grid gap-2"
				style={{
					gridTemplateColumns:
						'repeat(auto-fit, minmax(min(100%, var(--profile-slot-card-min, 160px)), 1fr))'
				}}
			>
				{slots.map((slot, index) => {
					const isActive = activeIndex === index && slot.values;
					const canDelete =
						Boolean(onDelete) && index >= minProtectedSlots;
					return (
						<div
							key={`${slotLabel}-${index + 1}`}
							className="flex min-w-0 flex-col gap-1.5 rounded border px-2 py-2"
							style={{
								borderColor: isActive
									? UI_COLORS.accentBorder
									: UI_COLORS.border,
								background: isActive
									? UI_COLORS.accentSoft
									: UI_COLORS.raised
							}}
						>
							<div className="flex items-start justify-between gap-2">
								<div className="min-w-0">
									<div
										className="text-xs"
										style={{ color: UI_COLORS.fg }}
									>{`${slotLabel} ${index + 1}`}</div>
									<div
										className="truncate text-[11px]"
										style={{ color: UI_COLORS.fgMute }}
									>
										{slot.values ? slot.name : emptyLabel}
										{isActive ? ` · ${activeLabel}` : ''}
									</div>
								</div>
								{canDelete ? (
									<Button
										onClick={() => onDelete?.(index)}
										size="sm"
										density="compact"
										variant="destructive"
										title="Delete slot"
									>
										×
									</Button>
								) : null}
							</div>
							<div className="grid grid-cols-2 gap-1">
								<Button
									onClick={() => onLoad(index)}
									disabled={!slot.values}
									size="sm"
									density="compact"
									variant="secondary"
								>
									{loadLabel}
								</Button>
								<Button
									onClick={() => onSave(index)}
									size="sm"
									density="compact"
									variant={isActive ? 'primary' : 'secondary'}
								>
									{saveLabel}
								</Button>
							</div>
						</div>
					);
				})}
			</div>
			<span
				className="text-[11px] leading-relaxed"
				style={{ color: UI_COLORS.fgMute }}
			>
				{hint}
			</span>
		</>
	);
}
