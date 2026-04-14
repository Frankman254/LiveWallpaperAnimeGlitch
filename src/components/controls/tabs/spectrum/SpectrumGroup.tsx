import type { ReactNode } from 'react';

export function SpectrumGroup({
	title,
	accent = 'default',
	children
}: {
	title: string;
	accent?: 'default' | 'clone';
	children: ReactNode;
}) {
	return (
		<div
			className="rounded-md p-2 border"
			style={{
				borderColor:
					accent === 'clone'
						? 'var(--editor-tag-border)'
						: 'var(--editor-accent-border)',
				background:
					accent === 'clone'
						? 'var(--editor-tag-bg)'
						: 'var(--editor-surface-bg)'
			}}
		>
			<div
				className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em]"
				style={{ color: 'var(--editor-accent-soft)' }}
			>
				{title}
			</div>
			<div className="flex flex-col gap-2">{children}</div>
		</div>
	);
}
