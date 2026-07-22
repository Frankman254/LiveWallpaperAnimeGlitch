import type { CSSProperties } from 'react';
import { UI_COLORS, GLOW } from './tokens';
import { transition } from './tokens/motion';
import { cn } from './lib/cn';
import { FOCUS_RING } from './lib/focusRing';

export type ToggleSwitchSize = 'sm' | 'md' | 'lg';

type ToggleSwitchProps = {
	checked: boolean;
	onChange: (next: boolean) => void;
	size?: ToggleSwitchSize;
	disabled?: boolean;
	ariaLabel?: string;
	className?: string;
	style?: CSSProperties;
};

const TRACK: Record<ToggleSwitchSize, { w: number; h: number }> = {
	sm: { w: 28, h: 16 },
	md: { w: 36, h: 20 },
	lg: { w: 44, h: 24 }
};

export default function ToggleSwitch({
	checked,
	onChange,
	size = 'md',
	disabled = false,
	ariaLabel,
	className,
	style
}: ToggleSwitchProps) {
	const { w, h } = TRACK[size];
	const knob = h - 4;
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={ariaLabel}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className={cn(
				'relative shrink-0 rounded-full p-0 disabled:cursor-not-allowed disabled:opacity-40',
				FOCUS_RING,
				className
			)}
			style={{
				width: w,
				height: h,
				background: checked ? UI_COLORS.accent : UI_COLORS.overlay,
				border: `1px solid ${checked ? 'transparent' : UI_COLORS.border}`,
				boxShadow: checked ? GLOW.sm : 'none',
				transition: transition(
					'background, border-color, box-shadow',
					'base'
				),
				...style
			}}
		>
			<span
				aria-hidden
				className="absolute top-[1px] rounded-full"
				style={{
					left: checked ? w - knob - 3 : 1,
					width: knob,
					height: knob,
					background: checked ? UI_COLORS.accentFg : UI_COLORS.fg,
					boxShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
					transition: transition('left', 'base', 'emphasized')
				}}
			/>
		</button>
	);
}
