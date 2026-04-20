import type { ReactNode } from 'react';

type FieldLabelProps = {
	children: ReactNode;
	tooltip?: string;
	className?: string;
};

export default function FieldLabel({
	children,
	tooltip,
	className = ''
}: FieldLabelProps) {
	return (
		<span
			className={`text-xs select-none cursor-default ${className}`}
			style={{ color: 'var(--editor-accent-soft)' }}
			title={tooltip}
		>
			{children}
		</span>
	);
}
