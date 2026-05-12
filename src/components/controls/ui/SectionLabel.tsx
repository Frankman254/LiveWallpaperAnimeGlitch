import type { ReactNode } from 'react';
import { FONT, UI_COLORS } from '@/ui';

type SectionLabelProps = {
	children: ReactNode;
	action?: ReactNode;
	className?: string;
};

export default function SectionLabel({
	children,
	action,
	className = ''
}: SectionLabelProps) {
	return (
		<div
			className={`mb-2 flex items-center justify-between gap-2 ${className}`}
		>
			<span
				className="uppercase"
				style={{
					color: UI_COLORS.fgMute,
					fontFamily: FONT.mono,
					fontSize: 10,
					fontWeight: 700,
					letterSpacing: '0.16em'
				}}
			>
				{children}
			</span>
			{action ? <div className="shrink-0">{action}</div> : null}
		</div>
	);
}
