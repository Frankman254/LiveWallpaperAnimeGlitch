import {
	Button,
	ConnectedColorInput,
	FONT,
	ProfileSlotsEditor,
	Slider,
	ToggleSwitch,
	UI_COLORS
} from '@/ui';

import {
	MAX_FEATURE_PROFILE_SLOTS,
	type ProfileSlotLike
} from './motionTabUtils';
import type {
	FxAudioChannel,
	FxBandThresholds
} from '@/features/stageFx/stageFxConfig';

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

export function FxBandThresholdControls({
	thresholds,
	onChange
}: {
	thresholds: FxBandThresholds;
	onChange: (channel: FxAudioChannel, value: number) => void;
}) {
	return (
		<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
			{(['kick', 'bass', 'full'] as const).map(channel => (
				<Slider
					key={channel}
					label={`${channel} threshold`}
					value={thresholds[channel]}
					min={0}
					max={1}
					step={0.01}
					onChange={value => onChange(channel, value)}
					variant="compact"
					formatValue={value => value.toFixed(2)}
				/>
			))}
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
	// Delegated to the shared ConnectedColorInput so this surface also gets
	// the perf fix (commit on picker close, not on every drag), the hex
	// input + paste-to-set behaviour, and the global favourites strip.
	return (
		<div
			className="rounded-[var(--editor-radius-md)] border px-2 py-1.5"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.raised
			}}
		>
			<ConnectedColorInput
				label={label}
				value={value}
				onChange={onChange}
			/>
		</div>
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
		<ProfileSlotsEditor
			title=""
			hint=""
			slots={slots}
			activeIndex={activeIndex}
			onLoad={onLoad}
			onSave={onSave}
			onAdd={onAdd}
			onDelete={onDelete}
			loadLabel={loadLabel}
			saveLabel={saveLabel}
			slotLabel={slotLabel}
			emptyLabel={emptyLabel}
			activeLabel={activeLabel}
			maxSlots={maxSlots}
			minProtectedSlots={minProtectedSlots}
		/>
	);
}
