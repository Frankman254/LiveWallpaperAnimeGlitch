import { Download, Plus, Save, Trash2 } from 'lucide-react';
import { useDialog } from '@/components/controls/ui/DialogProvider';
import { useT } from '@/lib/i18n';
import Caption from './Caption';
import Button from './Button';
import IconButton from './IconButton';
import SectionDivider from './SectionDivider';
import { FONT, UI_COLORS, ICON_SIZE } from './tokens';

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
	/** When true (default), delete asks for confirmation before calling onDelete. */
	confirmOnDelete?: boolean;
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
	confirmOnDelete = true,
	minProtectedSlots = 3,
	maxSlots = 10
}: ProfileSlotsEditorProps) {
	const t = useT();
	const { confirm } = useDialog();

	async function handleDelete(index: number) {
		if (!onDelete) return;
		const slot = slots[index];
		if (!slot) return;

		if (confirmOnDelete) {
			const slotName = slot.values ? slot.name : emptyLabel;
			const ok = await confirm({
				title: t.confirm_delete_profile_slot_title,
				message: slot.values
					? t.confirm_delete_profile_slot_named.replace('{name}', slotName)
					: t.confirm_delete_profile_slot_index.replace(
							'{index}',
							String(index + 1)
						),
				confirmLabel: t.label_delete_slot,
				cancelLabel: t.label_cancel,
				tone: 'danger'
			});
			if (!ok) return;
		}

		onDelete(index);
	}

	return (
		<div className="flex min-w-0 flex-col gap-2">
			{title || onAdd ? (
				<div className="flex items-center justify-between gap-2">
					{title ? (
						<div className="min-w-0 flex-1">
							<SectionDivider label={title} />
						</div>
					) : (
						<span className="flex-1" />
					)}
					{onAdd ? (
						<IconButton
							onClick={onAdd}
							disabled={slots.length >= maxSlots}
							size="sm"
							density="compact"
							title={
								slots.length >= maxSlots
									? `Max ${maxSlots}`
									: `${t.label_add_profile_slot} (${slots.length}/${maxSlots})`
							}
							aria-label={t.label_add_profile_slot}
						>
							<Plus size={ICON_SIZE.xs} />
						</IconButton>
					) : null}
				</div>
			) : null}

			<div className="flex min-w-0 flex-col gap-1.5">
				{slots.map((slot, index) => {
					const isActive = activeIndex === index && slot.values;
					const canDelete =
						Boolean(onDelete) && index >= minProtectedSlots;
					const displayName = slot.values ? slot.name : emptyLabel;
					const hasSavedValues = Boolean(slot.values);

					return (
						<article
							key={`${slotLabel}-${index + 1}`}
							className="flex min-w-0 flex-col gap-2 rounded-[var(--editor-radius-md)] border"
							style={{
								padding: '0.5rem 0.625rem',
								borderColor: isActive
									? UI_COLORS.accentBorder
									: UI_COLORS.border,
								background: isActive
									? UI_COLORS.accentSoft
									: UI_COLORS.raised
							}}
						>
							<header className="flex min-w-0 items-start gap-2">
								<div className="min-w-0 flex-1">
									<div
										className="text-[10px] font-semibold uppercase tracking-[0.1em]"
										style={{
											color: UI_COLORS.fgMute,
											fontFamily: FONT.mono
										}}
									>
										{slotLabel} {index + 1}
									</div>
									<p
										className="mt-0.5 text-[12px] leading-snug break-words"
										style={{
											color: hasSavedValues
												? UI_COLORS.fg
												: UI_COLORS.fgMute,
											fontWeight: isActive ? 600 : 450
										}}
									>
										{displayName}
									</p>
									{isActive ? (
										<span
											className="mt-1 inline-block rounded px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide"
											style={{
												color: UI_COLORS.accent,
												background: UI_COLORS.accentSoft,
												border: `1px solid ${UI_COLORS.accentBorder}`
											}}
										>
											{activeLabel}
										</span>
									) : null}
								</div>
								{canDelete ? (
									<IconButton
										onClick={() => void handleDelete(index)}
										size="sm"
										density="compact"
										variant="destructive"
										title={t.label_delete_slot}
										aria-label={t.label_delete_slot}
									>
										<Trash2 size={ICON_SIZE.xs} />
									</IconButton>
								) : null}
							</header>

							<div className="grid min-w-0 grid-cols-2 gap-1">
								<Button
									type="button"
									onClick={() => onLoad(index)}
									disabled={!hasSavedValues}
									size="sm"
									density="compact"
									variant="secondary"
									full
									icon={<Download size={ICON_SIZE.xs} />}
								>
									{loadLabel}
								</Button>
								<Button
									type="button"
									onClick={() => onSave(index)}
									size="sm"
									density="compact"
									variant={isActive ? 'warning' : 'secondary'}
									active={Boolean(isActive)}
									full
									icon={<Save size={ICON_SIZE.xs} />}
								>
									{saveLabel}
								</Button>
							</div>
						</article>
					);
				})}
			</div>

			{hint ? (
				<Caption as="p" className="text-[11px] leading-relaxed">
					{hint}
				</Caption>
			) : null}
		</div>
	);
}
