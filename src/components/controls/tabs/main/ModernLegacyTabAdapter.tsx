import type { ReactNode } from 'react';
import { SectionCard, UI_COLORS } from '@/ui';

type ModernLegacyTabAdapterProps = {
	title: string;
	subtitle: string;
	action?: ReactNode;
	children: ReactNode;
};

export default function ModernLegacyTabAdapter({
	title,
	subtitle,
	action,
	children
}: ModernLegacyTabAdapterProps) {
	return (
		<div className="flex flex-col gap-2">
			<SectionCard
				title={title}
				subtitle={subtitle}
				density="compact"
				action={action}
			>
				<div
					className="modern-legacy-tab-surface rounded-[var(--editor-radius-md)] border p-2"
					style={{
						borderColor: UI_COLORS.hairline,
						background: UI_COLORS.overlay
					}}
				>
					{children}
				</div>
			</SectionCard>
		</div>
	);
}
