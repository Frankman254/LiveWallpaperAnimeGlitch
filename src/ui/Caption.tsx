import type { CSSProperties, ReactNode } from 'react';
import { UI_COLORS } from './tokens';
import { cn } from './lib/cn';

type CaptionProps = {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
	as?: 'span' | 'p' | 'div';
};

export default function Caption({
	children,
	className,
	style,
	as: Component = 'span'
}: CaptionProps) {
	return (
		<Component
			className={cn('text-[10px] leading-snug', className)}
			style={{ color: UI_COLORS.fgMute, ...style }}
		>
			{children}
		</Component>
	);
}
