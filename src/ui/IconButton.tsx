import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { UI_COLORS } from './tokens';
import { transition } from './tokens/motion';
import { cn } from './lib/cn';

export type IconButtonSize = 'sm' | 'md' | 'lg';
export type IconButtonVariant = 'default' | 'warning' | 'destructive';
export type IconButtonDensity = 'default' | 'compact';

type IconButtonProps = {
	size?: IconButtonSize;
	variant?: IconButtonVariant;
	density?: IconButtonDensity;
	active?: boolean;
	children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

const SIZE_CLASS: Record<IconButtonSize, string> = {
	sm: 'h-7 w-7 min-h-[32px] min-w-[32px] sm:min-h-0 sm:min-w-0',
	md: 'h-8 w-8 min-h-[32px] min-w-[32px] sm:min-h-0 sm:min-w-0',
	lg: 'h-10 w-10'
};

const COMPACT_SIZE_CLASS: Record<IconButtonSize, string> = {
	sm: 'h-6 w-6 min-h-[26px] min-w-[26px] sm:min-h-0 sm:min-w-0',
	md: 'h-7 w-7 min-h-[28px] min-w-[28px] sm:min-h-0 sm:min-w-0',
	lg: 'h-8 w-8 min-h-[30px] min-w-[30px] sm:min-h-0 sm:min-w-0'
};

function variantStyle(
	variant: IconButtonVariant,
	active: boolean
): CSSProperties {
	if (variant === 'warning') {
		return {
			background: UI_COLORS.warnSoft,
			color: UI_COLORS.warn,
			border: `1px solid ${UI_COLORS.warnBorder}`
		};
	}
	if (variant === 'destructive') {
		return {
			background: UI_COLORS.dangerSoft,
			color: UI_COLORS.danger,
			border: `1px solid ${UI_COLORS.dangerBorder}`
		};
	}
	return active
		? {
				background: UI_COLORS.accentSoft,
				color: UI_COLORS.accent,
				border: `1px solid ${UI_COLORS.accentBorder}`
			}
		: {
				background: UI_COLORS.raised,
				color: UI_COLORS.fg,
				border: `1px solid ${UI_COLORS.border}`
			};
}

export default function IconButton({
	size = 'md',
	variant = 'default',
	density = 'default',
	active = false,
	className,
	style,
	type = 'button',
	disabled,
	children,
	...rest
}: IconButtonProps) {
	return (
		<button
			type={type}
			disabled={disabled}
			className={cn(
				'inline-flex items-center justify-center shrink-0 rounded-[var(--editor-radius-md)] disabled:cursor-not-allowed disabled:opacity-40',
				density === 'compact'
					? COMPACT_SIZE_CLASS[size]
					: SIZE_CLASS[size],
				className
			)}
			style={{
				...variantStyle(variant, active),
				transition: transition(
					'background, border-color, color, transform'
				),
				...style
			}}
			{...rest}
		>
			{children}
		</button>
	);
}
