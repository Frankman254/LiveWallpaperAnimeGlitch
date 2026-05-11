import type { CSSProperties, ReactNode } from 'react';

type CardLevel = 1 | 2;

type CardProps = {
	title?: ReactNode;
	subtitle?: ReactNode;
	action?: ReactNode;
	children: ReactNode;
	level?: CardLevel;
	padded?: boolean;
	className?: string;
	style?: CSSProperties;
};

const LEVEL_BG: Record<CardLevel, string> = {
	1: 'var(--editor-tag-bg)',
	2: 'var(--editor-surface-bg)'
};

export default function Card({
	title,
	subtitle,
	action,
	children,
	level = 1,
	padded = true,
	className = '',
	style
}: CardProps) {
	const hasHeader = title != null || action != null;
	return (
		<div
			className={className}
			style={{
				background: LEVEL_BG[level],
				border: '1px solid var(--editor-tag-border)',
				borderRadius: 'var(--editor-radius-lg)',
				backdropFilter: 'blur(20px) saturate(140%)',
				WebkitBackdropFilter: 'blur(20px) saturate(140%)',
				...style
			}}
		>
			{hasHeader ? (
				<div
					className="flex items-center justify-between"
					style={{
						padding: '12px 16px',
						borderBottom:
							'1px solid color-mix(in srgb, var(--editor-tag-border) 50%, transparent)'
					}}
				>
					<div className="min-w-0">
						{title ? (
							<div
								className="text-[11px] font-semibold uppercase tracking-[0.08em]"
								style={{ color: 'var(--editor-accent-muted)' }}
							>
								{title}
							</div>
						) : null}
						{subtitle ? (
							<div
								className="mt-0.5 text-[13px]"
								style={{ color: 'var(--editor-accent-fg)' }}
							>
								{subtitle}
							</div>
						) : null}
					</div>
					{action ? <div className="shrink-0">{action}</div> : null}
				</div>
			) : null}
			<div style={padded ? { padding: 16 } : undefined}>{children}</div>
		</div>
	);
}
