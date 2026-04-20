import type { ReactNode } from 'react';
import {
	BUTTON_BASE_CLASS,
	getButtonStyle,
	type ButtonVariant
} from './designTokens';

type ButtonSize = 'sm' | 'md';

type ButtonProps = {
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	onClick?: () => void;
	type?: 'button' | 'submit' | 'reset';
	title?: string;
	className?: string;
	children: ReactNode;
};

const SIZE_CLASS: Record<ButtonSize, string> = {
	sm: 'px-1.5 py-0.5 text-[10px]',
	md: 'px-2 py-1 text-[11px]'
};

export default function Button({
	variant = 'secondary',
	size = 'md',
	disabled = false,
	onClick,
	type = 'button',
	title,
	className = '',
	children
}: ButtonProps) {
	return (
		<button
			type={type}
			disabled={disabled}
			onClick={onClick}
			title={title}
			className={`${BUTTON_BASE_CLASS} ${SIZE_CLASS[size]} ${className}`}
			style={getButtonStyle(variant)}
		>
			{children}
		</button>
	);
}
