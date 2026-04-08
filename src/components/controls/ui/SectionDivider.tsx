interface Props {
	label?: string;
}

import { useWallpaperStore } from '@/store/wallpaperStore';
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme';

export default function SectionDivider({ label }: Props) {
	const editorTheme = useWallpaperStore(state => state.editorTheme);
	const theme = EDITOR_THEME_CLASSES[editorTheme];
	return (
		<div className="my-1 flex items-center gap-2">
			<div
				className={`flex-1 h-px ${theme.panelSubtle.replace('text-', 'bg-')}`}
				style={{ backgroundColor: 'var(--editor-accent-border)' }}
			/>
			{label && (
				<span
					className={`text-[10px] uppercase tracking-[0.18em] whitespace-nowrap ${theme.panelSubtle}`}
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{label}
				</span>
			)}
			<div
				className={`flex-1 h-px ${theme.panelSubtle.replace('text-', 'bg-')}`}
				style={{ backgroundColor: 'var(--editor-accent-border)' }}
			/>
		</div>
	);
}
