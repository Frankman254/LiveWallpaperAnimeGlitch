import type { ReactNode } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme';

interface TabSectionProps {
	title: string;
	hint?: string;
	children: ReactNode;
}

export default function TabSection({ title, hint, children }: TabSectionProps) {
	const editorTheme = useWallpaperStore(state => state.editorTheme);
	const theme = EDITOR_THEME_CLASSES[editorTheme];

	return (
		<section
			className={`rounded-lg border px-3 py-2.5 ${theme.sectionShell}`}
			style={{
				borderColor: 'var(--editor-accent-border)',
				background: 'var(--editor-surface-bg)'
			}}
		>
			<div className="mb-2 flex items-center gap-2">
				<span
					className={`text-[10px] font-bold uppercase tracking-[0.18em] ${theme.sectionTitle}`}
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{title}
				</span>
				{hint ? (
					<span
						className={`cursor-help text-[10px] ${theme.panelSubtle}`}
						style={{ color: 'var(--editor-accent-muted)' }}
						title={hint}
						aria-label={hint}
					>
						?
					</span>
				) : null}
			</div>
			<div className="flex flex-col gap-2.5">{children}</div>
		</section>
	);
}
