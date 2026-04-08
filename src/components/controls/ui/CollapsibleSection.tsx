import { useState, type ReactNode } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme';

interface Props {
	label: string;
	defaultOpen?: boolean;
	children: ReactNode;
}

export default function CollapsibleSection({
	label,
	defaultOpen = true,
	children
}: Props) {
	const [open, setOpen] = useState(defaultOpen);
	const editorTheme = useWallpaperStore(state => state.editorTheme);
	const theme = EDITOR_THEME_CLASSES[editorTheme];
	const lineClass = theme.panelSubtle.replace('text-', 'bg-');

	return (
		<div>
			<button
				type="button"
				onClick={() => setOpen(o => !o)}
				className="my-0.5 flex w-full items-center gap-2 group"
			>
				<div className={`flex-1 h-px ${lineClass}`} />
				<span
					className={`text-[10px] uppercase tracking-[0.18em] whitespace-nowrap ${theme.panelSubtle}`}
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					{label}
				</span>
				<span
					className={`text-[10px] leading-none transition-transform duration-150 ${theme.panelSubtle} ${open ? 'rotate-0' : '-rotate-90'}`}
					style={{ color: 'var(--editor-accent-muted)' }}
				>
					▾
				</span>
				<div className={`flex-1 h-px ${lineClass}`} />
			</button>
			{open && <div className="mt-1 flex flex-col gap-2">{children}</div>}
		</div>
	);
}
