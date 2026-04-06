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
				className="flex w-full items-center gap-2 my-1 group"
			>
				<div className={`flex-1 h-px ${lineClass}`} />
				<span
					className={`text-xs uppercase tracking-widest whitespace-nowrap ${theme.panelSubtle}`}
				>
					{label}
				</span>
				<span
					className={`text-[10px] leading-none transition-transform duration-150 ${theme.panelSubtle} ${open ? 'rotate-0' : '-rotate-90'}`}
				>
					▾
				</span>
				<div className={`flex-1 h-px ${lineClass}`} />
			</button>
			{open && (
				<div className="flex flex-col gap-2 mt-1">{children}</div>
			)}
		</div>
	);
}
