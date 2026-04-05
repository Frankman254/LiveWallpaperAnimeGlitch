interface Props {
	label?: string;
}

import { useWallpaperStore } from '@/store/wallpaperStore';
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme';

export default function SectionDivider({ label }: Props) {
	const editorTheme = useWallpaperStore(state => state.editorTheme);
	const theme = EDITOR_THEME_CLASSES[editorTheme];
	return (
		<div className="flex items-center gap-2 my-1">
			<div
				className={`flex-1 h-px ${theme.panelSubtle.replace('text-', 'bg-')}`}
			/>
			{label && (
				<span
					className={`text-xs uppercase tracking-widest whitespace-nowrap ${theme.panelSubtle}`}
				>
					{label}
				</span>
			)}
			<div
				className={`flex-1 h-px ${theme.panelSubtle.replace('text-', 'bg-')}`}
			/>
		</div>
	);
}
