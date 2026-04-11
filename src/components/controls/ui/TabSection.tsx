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
			className={`border px-3.5 py-3 ${theme.sectionShell}`}
			style={{
				borderRadius: 'var(--editor-radius-lg)',
				borderColor: 'var(--editor-accent-border)',
				background:
					'linear-gradient(180deg, color-mix(in srgb, var(--editor-surface-bg) 92%, white 2%), color-mix(in srgb, var(--editor-shell-bg) 18%, transparent))',
				boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)'
			}}
		>
			<div className="mb-3 flex items-center gap-2">
				<span
					className="h-1.5 w-1.5 rounded-full"
					style={{
						background:
							'linear-gradient(180deg, var(--editor-accent-color), color-mix(in srgb, var(--editor-accent-soft) 72%, var(--editor-accent-color)))',
						boxShadow:
							'0 0 12px color-mix(in srgb, var(--editor-accent-color) 38%, transparent)'
					}}
				/>
				<span
					className={`text-[10px] font-bold uppercase tracking-[0.22em] ${theme.sectionTitle}`}
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{title}
				</span>
				{hint ? (
					<span
						className={`cursor-help border px-1.5 py-0.5 text-[10px] ${theme.panelSubtle}`}
						style={{
							borderRadius: 'var(--editor-radius-sm)',
							color: 'var(--editor-accent-muted)',
							borderColor: 'var(--editor-tag-border)',
							background: 'var(--editor-tag-bg)'
						}}
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
