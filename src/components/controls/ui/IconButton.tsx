import type { CSSProperties, ReactNode } from 'react';

type IconButtonSize = 'sm' | 'md';

type IconButtonVariant = 'default' | 'warning';

type IconButtonProps = {
	active?: boolean;
	variant?: IconButtonVariant;
	disabled?: boolean;
	size?: IconButtonSize;
	onClick?: () => void;
	onPointerDown?: (e: React.PointerEvent<HTMLButtonElement>) => void;
	type?: 'button' | 'submit' | 'reset';
	title?: string;
	className?: string;
	style?: CSSProperties;
	children: ReactNode;
};

const SIZE_CLASS: Record<IconButtonSize, string> = {
	sm: 'h-6 w-6',
	md: 'h-7 w-7'
};

const BASE_CLASS =
	'flex shrink-0 items-center justify-center border transition-colors disabled:cursor-not-allowed disabled:opacity-40';

const BASE_STYLE = {
	borderRadius: 'var(--editor-radius-md)',
	background:
		'color-mix(in srgb, var(--editor-button-bg) 55%, transparent)',
	borderColor:
		'color-mix(in srgb, var(--editor-button-border) 70%, transparent)',
	color: 'var(--editor-button-fg)',
	backdropFilter: 'blur(6px)',
	WebkitBackdropFilter: 'blur(6px)'
} as const;

const ACTIVE_STYLE = {
	borderRadius: 'var(--editor-radius-md)',
	background:
		'color-mix(in srgb, var(--editor-active-bg) 70%, transparent)',
	borderColor: 'var(--editor-accent-color)',
	color: 'var(--editor-active-fg)',
	backdropFilter: 'blur(6px)',
	WebkitBackdropFilter: 'blur(6px)'
} as const;

const WARNING_STYLE = {
	borderRadius: 'var(--editor-radius-md)',
	borderColor: 'rgba(251, 146, 60, 0.45)',
	background: 'rgba(251, 146, 60, 0.10)',
	color: 'rgba(253, 186, 116, 0.95)'
} as const;

function resolveStyle(active: boolean, variant: IconButtonVariant) {
	if (variant === 'warning') return WARNING_STYLE;
	return active ? ACTIVE_STYLE : BASE_STYLE;
}

export default function IconButton({
	active = false,
	variant = 'default',
	disabled = false,
	size = 'md',
	onClick,
	onPointerDown,
	type = 'button',
	title,
	className = '',
	style,
	children
}: IconButtonProps) {
	return (
		<button
			type={type}
			disabled={disabled}
			onClick={onClick}
			onPointerDown={onPointerDown}
			title={title}
			className={`${BASE_CLASS} ${SIZE_CLASS[size]} ${className}`}
			style={style ? { ...resolveStyle(active, variant), ...style } : resolveStyle(active, variant)}
		>
			{children}
		</button>
	);
}
