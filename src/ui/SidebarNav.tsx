import type { CSSProperties, ReactNode } from 'react';
import { UI_COLORS } from './tokens';
import { transition } from './tokens/motion';
import { cn } from './lib/cn';

export type SidebarNavItem<T extends string> = {
	id: T;
	label: ReactNode;
	icon?: ReactNode;
	hint?: ReactNode;
	disabled?: boolean;
};

type SidebarNavProps<T extends string> = {
	items: ReadonlyArray<SidebarNavItem<T>>;
	value: T;
	onChange: (next: T) => void;
	compact?: boolean;
	density?: 'default' | 'compact';
	ariaLabel?: string;
	className?: string;
	style?: CSSProperties;
};

export default function SidebarNav<T extends string>({
	items,
	value,
	onChange,
	compact = false,
	density = 'default',
	ariaLabel,
	className,
	style
}: SidebarNavProps<T>) {
	const isDense = density === 'compact';
	return (
		<nav
			aria-label={ariaLabel}
			className={cn(isDense ? 'flex flex-col gap-0' : 'flex flex-col gap-0.5', className)}
			style={style}
		>
			{items.map(item => {
				const sel = item.id === value;
				const button = (
					<button
						key={item.id}
						type="button"
						aria-current={sel ? 'page' : undefined}
						disabled={item.disabled}
						onClick={() => onChange(item.id)}
						title={
							compact && typeof item.label === 'string'
								? item.label
								: undefined
						}
						className={cn(
							'relative inline-flex w-full items-center text-left disabled:cursor-not-allowed disabled:opacity-40',
							compact
								? 'justify-center gap-0'
								: 'justify-start gap-2'
						)}
						style={{
							height: isDense ? 28 : 36,
							padding: compact ? 0 : isDense ? '0 7px' : '0 10px',
							background: sel ? UI_COLORS.accentSoft : 'transparent',
							color: sel ? UI_COLORS.accent : UI_COLORS.fgMute,
							border: 0,
							borderRadius: 'var(--editor-radius-md)',
							fontSize: isDense ? 10.5 : 12,
							fontWeight: sel ? 600 : 500,
							transition: transition('background, color')
						}}
					>
						{/* Active state indicator bar — left edge accent */}
						{sel ? (
							<span
								aria-hidden
								style={{
									position: 'absolute',
									left: 0,
									top: isDense ? 4 : 6,
									bottom: isDense ? 4 : 6,
									width: 3,
									borderRadius: 999,
									background: UI_COLORS.accent
								}}
							/>
						) : null}
						{item.icon ? (
							<span className="inline-flex shrink-0">{item.icon}</span>
						) : null}
						{!compact ? (
							<span className="truncate">{item.label}</span>
						) : null}
						{!compact && item.hint ? (
							<span
								className="ml-auto"
								style={{ fontSize: 10, color: UI_COLORS.fgFaint }}
							>
								{item.hint}
							</span>
						) : null}
					</button>
				);
				return button;
			})}
		</nav>
	);
}
