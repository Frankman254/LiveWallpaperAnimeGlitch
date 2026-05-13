import type { CSSProperties, ReactNode } from 'react';
import { UI_COLORS, BLUR, GLOW } from './tokens';
import { cn } from './lib/cn';

type ToolbarProps = {
	children: ReactNode;
	density?: 'default' | 'compact';
	className?: string;
	style?: CSSProperties;
};

export function Toolbar({
	children,
	density = 'default',
	className,
	style
}: ToolbarProps) {
	return (
		<div
			className={cn('flex items-center gap-2', className)}
			style={{
				padding: density === 'compact' ? '4px 6px' : '8px 12px',
				background: UI_COLORS.shell,
				border: `1px solid ${UI_COLORS.borderStrong}`,
				borderRadius: 'var(--editor-radius-lg)',
				backdropFilter: BLUR.medium,
				WebkitBackdropFilter: BLUR.medium,
				boxShadow: GLOW.panel,
				...style
			}}
		>
			{children}
		</div>
	);
}

export function ToolbarGroup({
	children,
	density = 'default',
	className,
	style
}: ToolbarProps) {
	return (
		<div
			className={cn('flex items-center gap-1.5', className)}
			style={{
				gap: density === 'compact' ? 3 : undefined,
				...style
			}}
		>
			{children}
		</div>
	);
}

export function ToolbarDivider({
	className,
	style
}: Omit<ToolbarProps, 'children'>) {
	return (
		<div
			aria-hidden
			className={cn('mx-1 self-stretch', className)}
			style={{
				width: 1,
				background: UI_COLORS.hairline,
				...style
			}}
		/>
	);
}

export default Toolbar;
