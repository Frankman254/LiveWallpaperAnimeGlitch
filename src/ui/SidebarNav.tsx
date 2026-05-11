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
	ariaLabel?: string;
	className?: string;
	style?: CSSProperties;
};

export default function SidebarNav<T extends string>({
	items,
	value,
	onChange,
	ariaLabel,
	className,
	style
}: SidebarNavProps<T>) {
	return (
		<nav
			aria-label={ariaLabel}
			className={cn('flex flex-col gap-0.5', className)}
			style={style}
		>
			{items.map(item => {
				const sel = item.id === value;
				return (
					<button
						key={item.id}
						type="button"
						aria-current={sel ? 'page' : undefined}
						disabled={item.disabled}
						onClick={() => onChange(item.id)}
						className="inline-flex w-full items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-40"
						style={{
							height: 34,
							padding: '0 10px',
							background: sel ? UI_COLORS.accentSoft : 'transparent',
							color: sel ? UI_COLORS.accent : UI_COLORS.fg,
							border: 0,
							borderRadius: 'var(--editor-radius-md)',
							fontSize: 12,
							fontWeight: sel ? 600 : 500,
							transition: transition('background, color')
						}}
					>
						{item.icon}
						<span className="flex-1 truncate">{item.label}</span>
						{item.hint ? (
							<span
								style={{ fontSize: 10, color: UI_COLORS.fgFaint }}
							>
								{item.hint}
							</span>
						) : null}
					</button>
				);
			})}
		</nav>
	);
}
