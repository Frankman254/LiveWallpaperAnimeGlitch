interface Props {
	label?: string;
}

import { useWallpaperStore } from '@/store/wallpaperStore';
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme';

export default function SectionDivider({ label }: Props) {
	const editorTheme = useWallpaperStore(state => state.editorTheme);
	const theme = EDITOR_THEME_CLASSES[editorTheme];
	return (
		<div className="my-2 flex items-center gap-2.5">
			<div
				className={`h-px flex-1 ${theme.panelSubtle.replace('text-', 'bg-')}`}
				style={{
					background:
						'linear-gradient(90deg, transparent, var(--editor-accent-border), transparent)'
				}}
			/>
			{label && (
				<span
					className={`whitespace-nowrap border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${theme.panelSubtle}`}
					style={{
						borderRadius: 'var(--editor-radius-md)',
						color: 'var(--editor-accent-muted)',
						borderColor: 'var(--editor-tag-border)',
						background: 'var(--editor-tag-bg)'
					}}
				>
					{label}
				</span>
			)}
			<div
				className={`h-px flex-1 ${theme.panelSubtle.replace('text-', 'bg-')}`}
				style={{
					background:
						'linear-gradient(90deg, transparent, var(--editor-accent-border), transparent)'
				}}
			/>
		</div>
	);
}
