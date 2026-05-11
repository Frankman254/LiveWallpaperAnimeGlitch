import type { ReactNode } from 'react';
import { SectionCard, UI_COLORS } from '@/ui';

interface TabSectionProps {
	title: string;
	hint?: string;
	children: ReactNode;
}

export default function TabSection({ title, hint, children }: TabSectionProps) {
	return (
		<SectionCard
			title={title}
			action={
				hint ? (
					<span
						className="cursor-help rounded-full border px-1.5 py-0.5 text-[10px]"
						style={{
							color: UI_COLORS.fgMute,
							borderColor: UI_COLORS.border,
							background: UI_COLORS.overlay
						}}
						title={hint}
						aria-label={hint}
					>
						?
					</span>
				) : null
			}
			density="compact"
		>
			<div className="flex flex-col gap-2.5">{children}</div>
		</SectionCard>
	);
}
