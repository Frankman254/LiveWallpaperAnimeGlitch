import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { UI_COLORS } from './tokens';
import { transition } from './tokens/motion';
import { cn } from './lib/cn';

export type ButtonVariant =
	| 'primary'
	| 'secondary'
	| 'ghost'
	| 'destructive'
	| 'warning';

export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonDensity = 'default' | 'compact';

type ButtonProps = {
	variant?: ButtonVariant;
	size?: ButtonSize;
	density?: ButtonDensity;
	icon?: ReactNode;
	iconTrailing?: ReactNode;
	full?: boolean;
	active?: boolean;
	children?: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

const SIZE_CLASS: Record<ButtonSize, string> = {
	sm: 'h-7 px-2.5 text-[11px] gap-1.5',
	md: 'h-8 px-3 text-[12px] gap-2',
	lg: 'h-10 px-4 text-[13px] gap-2'
};

const COMPACT_SIZE_CLASS: Record<ButtonSize, string> = {
	sm: 'h-6 px-2 text-[10px] gap-1',
	md: 'h-7 px-2.5 text-[11px] gap-1.5',
	lg: 'h-8 px-3 text-[12px] gap-1.5'
};

function variantStyle(variant: ButtonVariant, active: boolean): CSSProperties {
	switch (variant) {
		case 'primary':
			return {
				background: UI_COLORS.accent,
				color: UI_COLORS.accentFg,
				border: '1px solid transparent'
			};
		case 'secondary':
			return {
				background: active ? UI_COLORS.accentSoft : UI_COLORS.raised,
				color: UI_COLORS.fg,
				border: `1px solid ${active ? UI_COLORS.accentBorder : UI_COLORS.border}`
			};
		case 'ghost':
			return {
				background: active ? UI_COLORS.accentSoft : 'transparent',
				color: active ? UI_COLORS.accent : UI_COLORS.fg,
				border: `1px solid ${active ? UI_COLORS.accentBorder : 'transparent'}`
			};
		case 'destructive':
			return {
				background: UI_COLORS.dangerSoft,
				color: UI_COLORS.danger,
				border: `1px solid ${UI_COLORS.dangerBorder}`
			};
		case 'warning':
			return {
				background: UI_COLORS.warnSoft,
				color: UI_COLORS.warn,
				border: `1px solid ${UI_COLORS.warnBorder}`
			};
	}
}

export default function Button({
	variant = 'secondary',
	size = 'md',
	density = 'default',
	icon,
	iconTrailing,
	full = false,
	active = false,
	className,
	style,
	type = 'button',
	disabled,
	children,
	...rest
}: ButtonProps) {
	return (
		<button
			type={type}
			disabled={disabled}
			className={cn(
				'inline-flex items-center justify-center font-medium whitespace-nowrap rounded-[var(--editor-radius-md)] disabled:cursor-not-allowed disabled:opacity-40',
				density === 'compact' ? COMPACT_SIZE_CLASS[size] : SIZE_CLASS[size],
				full && 'w-full',
				className
			)}
			style={{
				...variantStyle(variant, active),
				transition: transition('background, border-color, color, transform'),
				...style
			}}
			{...rest}
		>
			{icon}
			{children}
			{iconTrailing}
		</button>
	);
}
