import type { ReactNode } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme';
import { SECTION_HEADER_CLASS } from '@/components/controls/ui/designTokens';

export default function BgSectionCard({
	title,
	hint,
	children
}: {
	title: string;
	hint?: string;
	children: ReactNode;
}) {
	const editorTheme = useWallpaperStore(state => state.editorTheme);
	const theme = EDITOR_THEME_CLASSES[editorTheme];
	return (
		<div
			className={`flex flex-col gap-2.5 rounded-lg border p-2.5 ${theme.sectionShell}`}
			style={{
				borderColor: 'var(--editor-accent-border)',
				background: 'var(--editor-surface-bg)'
			}}
		>
			<div className="flex flex-col gap-1">
				<span
					className={`${SECTION_HEADER_CLASS} ${theme.sectionTitle}`}
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{title}
				</span>
				{hint && (
					<span
						className={`text-[11px] ${theme.panelSubtle}`}
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{hint}
					</span>
				)}
			</div>
			{children}
		</div>
	);
}
