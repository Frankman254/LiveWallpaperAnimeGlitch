import type { ReactNode } from 'react';
import { SectionCard } from '@/ui';

export default function BgSectionCard({
	title,
	hint,
	children
}: {
	title: string;
	hint?: string;
	children: ReactNode;
}) {
	return (
		<SectionCard title={title} subtitle={hint} level={2} density="compact">
			<div className="flex flex-col gap-2">{children}</div>
		</SectionCard>
	);
}
