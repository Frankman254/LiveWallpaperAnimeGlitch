import type { ReactNode } from 'react';
import TabSection from '@/components/controls/ui/TabSection';

type SectionProps = {
	title: string;
	hint?: string;
	children: ReactNode;
};

export function AudioCaptureSection({ title, children }: SectionProps) {
	return <TabSection title={title}>{children}</TabSection>;
}

export function AudioPlaylistSection({ title, hint, children }: SectionProps) {
	return (
		<TabSection title={title} hint={hint}>
			{children}
		</TabSection>
	);
}

export function AudioMixModeSection({ title, hint, children }: SectionProps) {
	return (
		<TabSection title={title} hint={hint}>
			{children}
		</TabSection>
	);
}

export function AudioTransportSection({ title, children }: SectionProps) {
	return <TabSection title={title}>{children}</TabSection>;
}

export function AudioAnalysisSection({ title, children }: SectionProps) {
	return <TabSection title={title}>{children}</TabSection>;
}

