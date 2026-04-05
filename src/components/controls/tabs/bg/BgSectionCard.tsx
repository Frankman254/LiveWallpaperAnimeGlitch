import type { ReactNode } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme';

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
			className={`flex flex-col gap-3 rounded-lg border p-3 ${theme.sectionShell}`}
		>
			<div className="flex flex-col gap-1">
				<span
					className={`text-xs uppercase tracking-widest ${theme.sectionTitle}`}
				>
					{title}
				</span>
				{hint && (
					<span className={`text-[11px] ${theme.panelSubtle}`}>
						{hint}
					</span>
				)}
			</div>
			{children}
		</div>
	);
}
