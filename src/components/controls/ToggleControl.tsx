import type { ToggleControlProps } from '@/types/controls';
import { ToggleSwitch, UI_COLORS } from '@/ui';

export default function ToggleControl({
	label,
	value,
	onChange,
	tooltip
}: ToggleControlProps) {
	return (
		<div className="flex items-center justify-between gap-3 group">
			<span
				className="cursor-default select-none text-xs transition-colors group-hover:text-white"
				title={tooltip}
				style={{ color: UI_COLORS.fgMute }}
			>
				{label}
				{tooltip && (
					<span
						className="ml-1 opacity-60"
						style={{ color: UI_COLORS.fgFaint }}
					>
						?
					</span>
				)}
			</span>
			<ToggleSwitch
				checked={value}
				onChange={onChange}
				size="md"
				ariaLabel={tooltip ?? label}
			/>
		</div>
	);
}
