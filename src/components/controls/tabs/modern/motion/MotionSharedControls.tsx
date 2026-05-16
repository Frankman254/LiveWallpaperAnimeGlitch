import { Download, Plus, Save, X } from 'lucide-react';
import {
	Button,
	FONT,
	ICON_SIZE,
	IconButton,
	ToggleSwitch,
	UI_COLORS
} from '@/ui';

import {
	MAX_FEATURE_PROFILE_SLOTS,
	type ProfileSlotLike
} from './motionTabUtils';

type OptionButtonGroupProps<T extends string> = {
	label: string;
	options: readonly T[];
	value: T | null;
	onChange: (value: T) => void;
	labels?: Partial<Record<T, string>>;
	columns?: 'auto' | 2 | 3;
};

export function OptionButtonGroup<T extends string>({
	label,
	options,
	value,
	onChange,
	labels,
	columns = 'auto'
}: OptionButtonGroupProps<T>) {
	const gridClass =
		columns === 2
			? 'grid grid-cols-2 gap-1.5'
			: columns === 3
				? 'grid grid-cols-2 gap-1.5 sm:grid-cols-3'
				: 'flex flex-wrap gap-1.5';
	return (
		<div className="flex flex-col gap-1.5">
			<span
				className="uppercase"
				style={{
					color: UI_COLORS.fgMute,
					fontFamily: FONT.mono,
					fontSize: 10,
					fontWeight: 650,
					letterSpacing: '0.1em'
				}}
			>
				{label}
			</span>
			<div className={gridClass}>
				{options.map(option => (
					<Button
						key={option}
						size="sm"
						density="compact"
						variant={value === option ? 'primary' : 'secondary'}
						active={value === option}
						onClick={() => onChange(option)}
						full={columns !== 'auto'}
					>
						{labels?.[option] ?? option}
					</Button>
				))}
			</div>
		</div>
	);
}

export function SwitchRow({
	label,
	checked,
	onChange,
	tooltip
}: {
	label: string;
	checked: boolean;
	onChange: (value: boolean) => void;
	tooltip?: string;
}) {
	return (
		<div
			className="flex items-center justify-between gap-3 rounded-[var(--editor-radius-md)] border px-3 py-2"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.raised
			}}
			title={tooltip}
		>
			<span
				className="min-w-0 text-[12px] font-medium"
				style={{ color: UI_COLORS.fg }}
			>
				{label}
			</span>
			<ToggleSwitch
				checked={checked}
				onChange={onChange}
				size="sm"
				ariaLabel={label}
			/>
		</div>
	);
}

export function ColorField({
	label,
	value,
	onChange
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
}) {
	return (
		<label className="flex flex-col gap-1.5">
			<span
				className="uppercase"
				style={{
					color: UI_COLORS.fgMute,
					fontFamily: FONT.mono,
					fontSize: 10,
					fontWeight: 650,
					letterSpacing: '0.1em'
				}}
			>
				{label}
			</span>
			<span
				className="flex items-center gap-2 rounded-[var(--editor-radius-md)] border px-2 py-1.5"
				style={{
					borderColor: UI_COLORS.border,
					background: UI_COLORS.raised
				}}
			>
				<input
					type="color"
					value={value}
					onChange={event => onChange(event.target.value)}
					className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
				/>
				<input
					value={value}
					onChange={event => onChange(event.target.value)}
					className="min-w-0 flex-1 bg-transparent text-[12px] outline-none"
					style={{ color: UI_COLORS.fg }}
				/>
			</span>
		</label>
	);
}

export function ProfileSlotsGrid({
	slots,
	activeIndex,
	onLoad,
	onSave,
	onAdd,
	onDelete,
	loadLabel,
	saveLabel,
	slotLabel,
	emptyLabel,
	activeLabel,
	maxSlots = MAX_FEATURE_PROFILE_SLOTS,
	minProtectedSlots = 3
}: {
	slots: ProfileSlotLike[];
	activeIndex: number | null;
	onLoad: (index: number) => void;
	onSave: (index: number) => void;
	onAdd?: () => void;
	onDelete?: (index: number) => void;
	loadLabel: string;
	saveLabel: string;
	slotLabel: string;
	emptyLabel: string;
	activeLabel: string;
	maxSlots?: number;
	minProtectedSlots?: number;
}) {
	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between gap-2">
				<span
					className="text-[10px] uppercase tracking-[0.12em]"
					style={{ color: UI_COLORS.fgMute, fontFamily: FONT.mono }}
				>
					{slotLabel} slots
				</span>
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
						'repeat(auto-fit, minmax(min(100%, 128px), 1fr))'
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
							className="flex min-w-0 items-center gap-1 rounded-[var(--editor-radius-md)] border px-1.5 py-1"
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
		</div>
	);
}
