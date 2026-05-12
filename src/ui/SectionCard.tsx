import type { CSSProperties, ReactNode } from 'react';
import { UI_COLORS, FONT } from './tokens';
import { cn } from './lib/cn';

export type SectionCardLevel = 1 | 2;

type SectionCardProps = {
	title?: ReactNode;
	subtitle?: ReactNode;
	action?: ReactNode;
	level?: SectionCardLevel;
	density?: 'default' | 'compact';
	padded?: boolean;
	className?: string;
	style?: CSSProperties;
	children: ReactNode;
};

const LEVEL_BG: Record<SectionCardLevel, string> = {
	1: UI_COLORS.panel,
	2: UI_COLORS.raised
};

export default function SectionCard({
	title,
	subtitle,
	action,
	level = 1,
	density = 'default',
	padded = true,
	className,
	style,
	children
}: SectionCardProps) {
	const isDense = density === 'compact';
	const hasHeader = title != null || action != null;
	return (
		<div
			className={cn(className)}
			style={{
				background: LEVEL_BG[level],
				border: `1px solid ${UI_COLORS.border}`,
				borderRadius: 'var(--editor-radius-lg)',
				...style
			}}
		>
			{hasHeader ? (
				<div
					className="flex items-center justify-between gap-3"
					style={{
						padding: isDense
							? 'var(--section-card-compact-header-padding, 8px 10px)'
							: 'var(--section-card-header-padding, 10px 14px)',
						borderBottom: `1px solid ${UI_COLORS.hairline}`
					}}
				>
					<div className="min-w-0">
						{title ? (
							<div
								className="uppercase tracking-[0.08em]"
								style={{
									color: UI_COLORS.fgMute,
									fontFamily: FONT.mono,
									fontSize: isDense ? 10 : 11,
									fontWeight: 600
								}}
							>
								{title}
							</div>
						) : null}
						{subtitle ? (
							<div
								className="mt-0.5"
								style={{
									color: UI_COLORS.fg,
									fontSize: isDense ? 12 : 13
								}}
							>
								{subtitle}
							</div>
						) : null}
					</div>
					{action ? <div className="shrink-0">{action}</div> : null}
				</div>
			) : null}
			<div
				style={
					padded
						? {
								padding: isDense
									? 'var(--section-card-compact-body-padding, 10px)'
									: 'var(--section-card-body-padding, 12px)'
							}
						: undefined
				}
			>
				{children}
			</div>
		</div>
	);
}
