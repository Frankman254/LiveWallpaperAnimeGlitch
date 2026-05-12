import type { ReactNode } from 'react';
import { SectionCard, UI_COLORS } from '@/ui';

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
		<SectionCard
			title={title}
			level={2}
			density="compact"
			style={{
				borderColor:
					accent === 'clone'
						? UI_COLORS.border
						: UI_COLORS.accentBorder,
				background:
					accent === 'clone'
						? UI_COLORS.raised
						: UI_COLORS.panel
			}}
		>
			<div className="flex min-w-0 flex-col gap-2">{children}</div>
		</SectionCard>
	);
}
