import { Download, Save, Plus, X } from 'lucide-react';
import Caption from './Caption';
import IconButton from './IconButton';
import SectionDivider from './SectionDivider';
import { UI_COLORS, ICON_SIZE } from './tokens';

type ProfileSlotLike = {
	name: string;
	values: unknown | null;
};

export type ProfileSlotsEditorProps = {
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
					<IconButton
						onClick={onAdd}
						disabled={slots.length >= maxSlots}
						size="sm"
						density="compact"
						title={
							slots.length >= maxSlots
								? `Max ${maxSlots}`
								: `Add slot (${slots.length}/${maxSlots})`
						}
					>
						<Plus size={ICON_SIZE.xs} />
					</IconButton>
				) : null}
			</div>
			<div
				className="grid gap-1.5"
				style={{
					gridTemplateColumns:
						'repeat(auto-fit, minmax(min(100%, var(--profile-slot-card-min, 128px)), 1fr))'
				}}
			>
				{slots.map((slot, index) => {
					const isActive = activeIndex === index && slot.values;
					const canDelete =
						Boolean(onDelete) && index >= minProtectedSlots;
					const slotTitle = slot.values ? slot.name : emptyLabel;
					return (
						<div
							key={`${slotLabel}-${index + 1}`}
							className="flex min-w-0 items-center gap-1 rounded border px-1.5 py-1"
							style={{
								borderColor: isActive
									? UI_COLORS.accentBorder
									: UI_COLORS.border,
								background: isActive
									? UI_COLORS.accentSoft
									: UI_COLORS.raised
							}}
						>
							<div className="min-w-0 flex-1">
								<div
									className="truncate text-[11px] leading-tight"
									style={{
										color: slot.values
											? UI_COLORS.fg
											: UI_COLORS.fgMute,
										fontWeight: isActive ? 600 : 400
									}}
									title={`${slotLabel} ${index + 1}: ${slotTitle}${isActive ? ` (${activeLabel})` : ''}`}
								>
									{`${index + 1}. ${slotTitle}`}
								</div>
							</div>
							<div className="flex shrink-0 items-center gap-0.5">
								<IconButton
									onClick={() => onLoad(index)}
									disabled={!slot.values}
									size="sm"
									density="compact"
									title={loadLabel}
								>
									<Download size={ICON_SIZE.xs} />
								</IconButton>
								<IconButton
									onClick={() => onSave(index)}
									size="sm"
									density="compact"
									variant={isActive ? 'warning' : 'default'}
									active={Boolean(isActive)}
									title={saveLabel}
								>
									<Save size={ICON_SIZE.xs} />
								</IconButton>
								{canDelete ? (
									<IconButton
										onClick={() => onDelete?.(index)}
										size="sm"
										density="compact"
										variant="destructive"
										title="Delete slot"
									>
										<X size={ICON_SIZE.xs} />
									</IconButton>
								) : null}
							</div>
						</div>
					);
				})}
			</div>
			{hint ? (
				<Caption as="span" className="text-[11px] leading-relaxed">
					{hint}
				</Caption>
			) : null}
		</>
	);
}

