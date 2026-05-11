import type { ReactNode } from 'react';
import { SECTION_HEADER_CLASS } from './designTokens';

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
				className={SECTION_HEADER_CLASS}
				style={{ color: 'var(--editor-accent-muted)' }}
			>
				{children}
			</span>
			{action ? <div className="shrink-0">{action}</div> : null}
		</div>
	);
}
