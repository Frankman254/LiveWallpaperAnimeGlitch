import type { ReactNode } from 'react';

type FieldProps = {
	label: ReactNode;
	hint?: ReactNode;
	children: ReactNode;
	layout?: 'row' | 'column';
	className?: string;
};

export default function Field({
	label,
	hint,
	children,
	layout = 'row',
	className = ''
}: FieldProps) {
	if (layout === 'row') {
		return (
			<div
				className={`flex items-center justify-between gap-3 py-1.5 ${className}`}
			>
				<div className="flex min-w-0 flex-col gap-0.5">
					<span
						className="text-[12px] font-medium"
						style={{ color: 'var(--editor-accent-fg)' }}
					>
						{label}
					</span>
					{hint ? (
						<span
							className="text-[10px] leading-snug"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							{hint}
						</span>
					) : null}
				</div>
				<div className="shrink-0">{children}</div>
			</div>
		);
	}
	return (
		<div className={`flex flex-col gap-1.5 py-1.5 ${className}`}>
			<span
				className="text-[11px] font-semibold uppercase tracking-[0.08em]"
				style={{ color: 'var(--editor-accent-muted)' }}
			>
				{label}
			</span>
			{children}
			{hint ? (
				<span
					className="text-[10px] leading-snug"
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{hint}
				</span>
			) : null}
		</div>
	);
}
