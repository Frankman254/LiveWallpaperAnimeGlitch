import type { CSSProperties, ReactNode } from 'react';

type ToolbarProps = {
	children: ReactNode;
	className?: string;
	style?: CSSProperties;
};

export function Toolbar({ children, className = '', style }: ToolbarProps) {
	return (
		<div
			className={`flex items-center gap-2 ${className}`}
			style={{
				padding: '8px 12px',
				background: 'var(--editor-shell-bg)',
				border: '1px solid var(--editor-shell-border)',
				borderRadius: 'var(--editor-radius-lg)',
				backdropFilter: 'blur(20px)',
				WebkitBackdropFilter: 'blur(20px)',
				...style
			}}
		>
			{children}
		</div>
	);
}

export function ToolbarGroup({ children, className = '' }: ToolbarProps) {
	return (
		<div className={`flex items-center gap-1 ${className}`}>{children}</div>
	);
}

export function ToolbarDivider() {
	return (
		<div
			aria-hidden
			className="self-stretch mx-1"
			style={{ width: 1, background: 'var(--editor-tabbar-border)' }}
		/>
	);
}

export default Toolbar;
