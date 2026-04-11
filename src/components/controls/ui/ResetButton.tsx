import { useWallpaperStore } from '@/store/wallpaperStore';
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme';

interface Props {
	label: string;
	onClick: () => void;
}

export default function ResetButton({ label, onClick }: Props) {
	const editorTheme = useWallpaperStore(state => state.editorTheme);
	const theme = EDITOR_THEME_CLASSES[editorTheme];
	return (
		<button
			onClick={onClick}
			className={`self-end border px-2.5 py-1 text-[11px] transition-all duration-200 hover:-translate-y-0.5 ${theme.panelSubtle}`}
			style={{
				borderRadius: 'var(--editor-radius-md)',
				borderColor: 'var(--editor-tag-border)',
				background: 'var(--editor-tag-bg)',
				color: 'var(--editor-tag-fg)'
			}}
			title="Reset this tab to defaults"
		>
			{label}
		</button>
	);
}
