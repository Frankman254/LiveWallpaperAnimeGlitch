import {
	forwardRef,
	useState,
	type CSSProperties,
	type InputHTMLAttributes
} from 'react';
import { UI_COLORS } from './tokens';
import { transition } from './tokens/motion';
import { cn } from './lib/cn';

export type TextInputSize = 'sm' | 'md' | 'lg';

type TextInputProps = {
	size?: TextInputSize;
	full?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>;

const SIZE_STYLE: Record<TextInputSize, CSSProperties> = {
	sm: { height: 28, padding: '0 9px', fontSize: 11 },
	md: { height: 32, padding: '0 11px', fontSize: 12 },
	lg: { height: 38, padding: '0 13px', fontSize: 13 }
};

const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
	function TextInput(
		{
			size = 'md',
			full = false,
			className,
			style,
			onFocus,
			onBlur,
			...rest
		},
		ref
	) {
		const [focused, setFocused] = useState(false);
		return (
			<input
				ref={ref}
				className={cn(
					'outline-none placeholder:text-[color:var(--editor-accent-muted)] disabled:cursor-not-allowed disabled:opacity-40',
					full && 'w-full',
					className
				)}
				style={{
					...SIZE_STYLE[size],
					background: focused
						? UI_COLORS.panelGradient
						: UI_COLORS.raisedGradient,
					color: UI_COLORS.fg,
					border: `1px solid ${focused ? UI_COLORS.accent : UI_COLORS.border}`,
					borderRadius: 'var(--editor-radius-md)',
					boxShadow: focused
						? UI_COLORS.focusRing
						: 'inset 0 1px 0 rgba(255,255,255,0.025)',
					transition: transition(
						'background, border-color, box-shadow'
					),
					...style
				}}
				onFocus={event => {
					setFocused(true);
					onFocus?.(event);
				}}
				onBlur={event => {
					setFocused(false);
					onBlur?.(event);
				}}
				{...rest}
			/>
		);
	}
);

export default TextInput;
