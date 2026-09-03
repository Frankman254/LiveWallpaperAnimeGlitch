import type { ReactNode } from 'react';
import { CollapsibleSection as UICollapsibleSection } from '@/ui';

interface Props {
	label: string;
	defaultOpen?: boolean;
	children: ReactNode;
}

export default function CollapsibleSection({
	label,
	defaultOpen = true,
	children
}: Props) {
	return (
		<UICollapsibleSection title={label} defaultOpen={defaultOpen} dense>
			<div className="flex min-w-0 flex-col gap-2.5">{children}</div>
		</UICollapsibleSection>
	);
}
