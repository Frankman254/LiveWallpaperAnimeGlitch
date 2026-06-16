import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useDialog } from '@/components/controls/ui/DialogProvider';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import Caption from './Caption';
import IconButton from './IconButton';
import SectionDivider from './SectionDivider';
import { FONT, UI_COLORS, ICON_SIZE } from './tokens';
import { cn } from './lib/cn';

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

/**
 * Compact preset-slot picker. Default = a 2-col grid of named pills: click a
 * filled pill to LOAD it, click an empty pill to SAVE the current config into
 * it. Filled pills reveal overwrite-save + delete icons on hover. The global
 * `editorCompactSlotIcons` pref switches to a numbered icon grid (load-only,
 * name on hover) for maximum density. Replaces the old tall stacked cards.
 */
export default function ProfileSlotsEditor({
	title,
	hint,
	slots,
	activeIndex,
	onSave,
	onLoad,
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
	const iconMode = useWallpaperStore(
		state => state.editorCompactSlotIcons ?? false
	);
	const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

	async function handleDelete(index: number) {
		if (!onDelete) return;
		const slot = slots[index];
		if (!slot) return;

		if (confirmOnDelete) {
			const slotName = slot.values ? slot.name : emptyLabel;
			const ok = await confirm({
				title: t.confirm_delete_profile_slot_title,
				message: slot.values
					? t.confirm_delete_profile_slot_named.replace(
							'{name}',
							slotName
						)
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

	function pillStyle(isActive: boolean, isFocused: boolean) {
		return {
			borderColor: isActive
				? UI_COLORS.accent
				: isFocused
					? UI_COLORS.accentBorder
					: UI_COLORS.border,
			background: isActive ? UI_COLORS.accentSoft : UI_COLORS.raised,
			color: isActive ? UI_COLORS.accent : UI_COLORS.fg
		};
	}

	return (
		<div className="flex min-w-0 flex-col gap-1.5">
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

			<div
				className={cn(
					'grid min-w-0 gap-1',
					iconMode
						? 'grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))]'
						: 'grid-cols-2'
				)}
			>
				{slots.map((slot, index) => {
					const hasSavedValues = Boolean(slot.values);
					const isActive = activeIndex === index && hasSavedValues;
					const isFocused = focusedIndex === index;
					const canDelete =
						Boolean(onDelete) && index >= minProtectedSlots;
					const displayName = hasSavedValues ? slot.name : emptyLabel;

					const activate = () => {
						setFocusedIndex(index);
						if (hasSavedValues) onLoad(index);
						else onSave(index);
					};

					if (iconMode) {
						return (
							<button
								key={`${slotLabel}-${index + 1}`}
								type="button"
								onClick={activate}
								title={`${slotLabel} ${index + 1} · ${displayName}`}
								aria-label={`${slotLabel} ${index + 1} · ${displayName}`}
								className="flex h-9 items-center justify-center rounded-md border text-[12px] font-semibold transition-colors"
								style={{
									...pillStyle(isActive, isFocused),
									opacity: hasSavedValues ? 1 : 0.5,
									fontFamily: FONT.mono
								}}
							>
								{index + 1}
							</button>
						);
					}

					return (
						<div
							key={`${slotLabel}-${index + 1}`}
							className="group relative min-w-0"
						>
							<button
								type="button"
								onClick={activate}
								title={hasSavedValues ? displayName : undefined}
								className="flex w-full min-w-0 items-center gap-1.5 rounded-md border py-1.5 pl-2 pr-12 text-left text-[12px] transition-colors"
								style={{
									...pillStyle(isActive, isFocused),
									opacity: hasSavedValues ? 1 : 0.55
								}}
							>
								<span
									className="shrink-0 text-[10px] font-semibold tabular-nums"
									style={{
										color: UI_COLORS.fgMute,
										fontFamily: FONT.mono
									}}
								>
									{index + 1}
								</span>
								<span
									className="min-w-0 flex-1 truncate"
									style={{
										fontWeight: isActive ? 600 : 450
									}}
								>
									{displayName}
								</span>
								{isActive ? (
									<span
										className="shrink-0 rounded px-1 py-px text-[9px] font-semibold uppercase tracking-wide"
										style={{
											color: UI_COLORS.accent,
											border: `1px solid ${UI_COLORS.accentBorder}`
										}}
									>
										{activeLabel}
									</span>
								) : null}
							</button>

							{hasSavedValues ? (
								<div className="absolute inset-y-0 right-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
									<IconButton
										onClick={() => {
											setFocusedIndex(index);
											onSave(index);
										}}
										size="sm"
										density="compact"
										variant="default"
										title={saveLabel}
										aria-label={`${saveLabel} ${slotLabel} ${index + 1}`}
									>
										<Save size={ICON_SIZE.xs} />
									</IconButton>
									{canDelete ? (
										<IconButton
											onClick={() =>
												void handleDelete(index)
											}
											size="sm"
											density="compact"
											variant="destructive"
											title={t.label_delete_slot}
											aria-label={t.label_delete_slot}
										>
											<Trash2 size={ICON_SIZE.xs} />
										</IconButton>
									) : null}
								</div>
							) : null}
						</div>
					);
				})}
			</div>

			{hint ? (
				<Caption as="p" className="text-[10px] leading-relaxed">
					{hint}
				</Caption>
			) : null}
		</div>
	);
}
