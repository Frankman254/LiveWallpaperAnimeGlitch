import { useAudioContext } from '@/context/useAudioContext';
import { useT } from '@/lib/i18n';
import { Button, ToggleSwitch, UI_COLORS, FONT } from '@/ui';

export function SnapToNowButton({
	onSnap
}: {
	onSnap: (v: number | null) => void;
}) {
	const { getCurrentTime } = useAudioContext();
	const t = useT();
	return (
		<Button
			onClick={() => onSnap(Math.max(0, Math.round(getCurrentTime())))}
			size="sm"
			density="compact"
			variant="ghost"
			title={t.timestamp_set_current_tooltip}
		>
			NOW
		</Button>
	);
}

export function ModernSwitchRow({
	label,
	checked,
	onChange
}: {
	label: string;
	checked: boolean;
	onChange: (value: boolean) => void;
}) {
	return (
		<div
			className="flex items-center justify-between gap-3 rounded-(--editor-radius-md) border px-3 py-2"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.raised
			}}
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

export function OverrideRow({
	label,
	active,
	onCapture,
	onClear
}: {
	label: string;
	active: boolean;
	onCapture: () => void;
	onClear: () => void;
}) {
	return (
		<div
			className="flex items-center justify-between gap-3 rounded-(--editor-radius-md) border px-3 py-2"
			style={{
				borderColor: UI_COLORS.border,
				background: UI_COLORS.raised
			}}
		>
			<div className="min-w-0">
				<div
					className="truncate text-[12px] font-medium"
					style={{ color: UI_COLORS.fg }}
				>
					{label}
				</div>
				<div
					className="text-[10px] uppercase tracking-[0.12em]"
					style={{ color: UI_COLORS.fgMute, fontFamily: FONT.mono }}
				>
					{active ? 'Active override' : 'Uses global settings'}
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-1">
				<Button
					onClick={onCapture}
					size="sm"
					density="compact"
					variant="secondary"
				>
					Capture
				</Button>
				{active ? (
					<Button
						onClick={onClear}
						size="sm"
						density="compact"
						variant="ghost"
					>
						Clear
					</Button>
				) : null}
			</div>
		</div>
	);
}
