import type { CSSProperties, ReactNode } from 'react';

type TabPillSize = 'sm' | 'md';

type TabPillProps = {
	active?: boolean;
	onClick?: () => void;
	children: ReactNode;
	icon?: ReactNode;
	title?: string;
	disabled?: boolean;
	size?: TabPillSize;
	className?: string;
	style?: CSSProperties;
};

const SIZE_STYLE: Record<TabPillSize, { h: number; px: number; fs: number }> = {
	sm: { h: 24, px: 10, fs: 11 },
	md: { h: 32, px: 12, fs: 13 }
};

export default function TabPill({
	active = false,
	onClick,
	children,
	icon,
	title,
	disabled = false,
	size = 'md',
	className = '',
	style
}: TabPillProps) {
	const s = SIZE_STYLE[size];
	return (
		<button
			type="button"
			onClick={onClick}
			title={title}
			disabled={disabled}
			className={`inline-flex items-center gap-1.5 whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
			style={{
				height: s.h,
				padding: `0 ${s.px}px`,
				background: active ? 'var(--editor-tag-bg)' : 'transparent',
				color: active
					? 'var(--editor-accent-fg)'
					: 'var(--editor-accent-muted)',
				border: 0,
				borderRadius: 'var(--editor-radius-md)',
				borderBottom: `2px solid ${active ? 'var(--editor-accent-color)' : 'transparent'}`,
				fontSize: s.fs,
				fontWeight: active ? 600 : 500,
				...style
			}}
		>
			{icon}
			{children}
		</button>
	);
}
