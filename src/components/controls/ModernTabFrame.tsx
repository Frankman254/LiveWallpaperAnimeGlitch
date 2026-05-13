import type { ReactNode } from 'react';
import { SectionCard } from '@/ui';

type ModernTabFrameProps = {
	title: ReactNode;
	subtitle?: ReactNode;
	action?: ReactNode;
	children: ReactNode;
};

export default function ModernTabFrame({
	title,
	subtitle,
	action,
	children
}: ModernTabFrameProps) {
	return (
		<SectionCard
			title={title}
			subtitle={subtitle}
			action={action}
			density="compact"
		>
			<div className="flex flex-col gap-1.5">{children}</div>
		</SectionCard>
	);
}
