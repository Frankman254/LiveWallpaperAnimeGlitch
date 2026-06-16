import type { CSSProperties, ReactNode } from 'react';
import { UI_COLORS } from './tokens';
import { transition } from './tokens/motion';
import { cn } from './lib/cn';

export type TabsSize = 'sm' | 'md';
export type TabsDensity = 'default' | 'compact';

export type TabItem<T extends string> = {
	id: T;
	label: ReactNode;
	icon?: ReactNode;
	disabled?: boolean;
};

type TabsProps<T extends string> = {
	items: ReadonlyArray<TabItem<T>>;
	value: T;
	onChange: (next: T) => void;
	size?: TabsSize;
	density?: TabsDensity;
	compact?: boolean;
	/** When true, tabs wrap to next line on overflow; when false, the strip scrolls horizontally. Default: true (wrap). */
	wrap?: boolean;
	ariaLabel?: string;
	className?: string;
	style?: CSSProperties;
};

const SIZE_SPEC: Record<TabsSize, { h: number; px: number; fs: number }> = {
	sm: { h: 26, px: 10, fs: 11 },
	md: { h: 32, px: 12, fs: 13 }
};

const COMPACT_SIZE_SPEC: Record<
	TabsSize,
	{ h: number; px: number; fs: number }
> = {
	sm: { h: 21, px: 7, fs: 10 },
	md: { h: 26, px: 8, fs: 11 }
};

export default function Tabs<T extends string>({
	items,
	value,
	onChange,
	size = 'md',
	density = 'default',
	compact = false,
	wrap = true,
	ariaLabel,
	className,
	style
}: TabsProps<T>) {
	const spec =
		density === 'compact' ? COMPACT_SIZE_SPEC[size] : SIZE_SPEC[size];
	return (
		<div
			role="tablist"
			aria-label={ariaLabel}
			className={cn(
				'flex items-center',
				density === 'compact' ? 'gap-0.5' : 'gap-1',
				wrap ? 'flex-wrap' : 'overflow-x-auto',
				className
			)}
			style={style}
		>
			{items.map(item => {
				const sel = item.id === value;
				return (
					<button
						key={item.id}
						type="button"
						role="tab"
						aria-selected={sel}
						disabled={item.disabled}
						onClick={() => onChange(item.id)}
						title={
							compact && typeof item.label === 'string'
								? item.label
								: undefined
						}
						className={cn(
							'inline-flex items-center whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-40',
							compact ? 'justify-center gap-0' : 'gap-1.5'
						)}
						style={{
							height: spec.h,
							width: compact && item.icon ? spec.h : undefined,
							padding:
								compact && item.icon
									? 0
									: `0 ${Math.max(5, Math.round(spec.px * 0.65))}px`,
							background: sel ? UI_COLORS.panel : 'transparent',
							color: sel ? UI_COLORS.fg : UI_COLORS.fgMute,
							border: 0,
							borderRadius: 'var(--editor-radius-md)',
							borderBottom: `2px solid ${sel ? UI_COLORS.accent : 'transparent'}`,
							fontSize: spec.fs,
							fontWeight: sel ? 600 : 500,
							transition: transition(
								'background, color, border-color'
							)
						}}
					>
						{item.icon}
						{!compact || !item.icon ? item.label : null}
					</button>
				);
			})}
		</div>
	);
}
