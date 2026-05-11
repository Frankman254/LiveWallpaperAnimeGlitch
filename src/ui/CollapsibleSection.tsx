import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { UI_COLORS, FONT, ICON_SIZE } from './tokens';
import { transition } from './tokens/motion';
import { cn } from './lib/cn';

type CollapsibleSectionProps = {
	title: ReactNode;
	badge?: ReactNode;
	defaultOpen?: boolean;
	dense?: boolean;
	className?: string;
	children: ReactNode;
};

export default function CollapsibleSection({
	title,
	badge,
	defaultOpen = false,
	dense = false,
	className,
	children
}: CollapsibleSectionProps) {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div
			className={cn(className)}
			style={{ borderTop: `1px solid ${UI_COLORS.hairline}` }}
		>
			<button
				type="button"
				onClick={() => setOpen(o => !o)}
				aria-expanded={open}
				className="inline-flex w-full items-center justify-between"
				style={{
					padding: dense ? '8px 16px' : '12px 16px',
					background: 'transparent',
					border: 0,
					cursor: 'pointer',
					color: UI_COLORS.fgMute,
					fontSize: 11,
					fontWeight: 600,
					letterSpacing: '0.08em',
					textTransform: 'uppercase',
					fontFamily: FONT.mono
				}}
			>
				<span className="inline-flex items-center gap-2">
					<ChevronRight
						size={ICON_SIZE.xs}
						style={{
							transform: open ? 'rotate(90deg)' : 'none',
							transition: transition('transform')
						}}
					/>
					{title}
					{badge ? (
						<span
							style={{
								fontSize: 9,
								padding: '2px 6px',
								borderRadius: 999,
								background: UI_COLORS.accentSoft,
								color: UI_COLORS.accent,
								border: `1px solid ${UI_COLORS.accentBorder}`,
								letterSpacing: '0.1em'
							}}
						>
							{badge}
						</span>
					) : null}
				</span>
			</button>
			{open ? <div style={{ padding: '0 16px 16px' }}>{children}</div> : null}
		</div>
	);
}
