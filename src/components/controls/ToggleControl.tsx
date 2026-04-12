import type { ToggleControlProps } from '@/types/controls';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme';

export default function ToggleControl({
	label,
	value,
	onChange,
	tooltip
}: ToggleControlProps) {
	const editorTheme = useWallpaperStore(state => state.editorTheme);
	const theme = EDITOR_THEME_CLASSES[editorTheme];
	return (
		<div className="flex items-center justify-between gap-3 group">
			<span
				className={`text-xs cursor-default select-none ${theme.sectionTitle} transition-colors group-hover:text-white`}
				title={tooltip}
				style={{ color: 'var(--editor-accent-soft)' }}
			>
				{label}
				{tooltip && (
					<span
						className={`ml-1 opacity-60 ${theme.panelSubtle}`}
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						?
					</span>
				)}
			</span>
			<button
				onClick={() => onChange(!value)}
				className={`w-9 h-5 rounded-full transition-all duration-300 relative flex-shrink-0 border overflow-hidden ${
					value
						? `border-transparent ${theme.toggleOn}`
						: 'border-white/10'
				}`}
				style={{
					backgroundColor: value && !theme.toggleOn.includes('editor-rgb')
						? 'var(--editor-accent-color)'
						: value ? undefined : 'rgba(255,255,255,0.05)',
					boxShadow: value ? '0 0 10px var(--editor-accent-color)' : 'none'
				}}
			>
				<span
					className={`absolute top-[3px] w-3.5 h-3.5 bg-white rounded-full transition-transform duration-300 shadow-sm ${
						value ? 'translate-x-[18px] opacity-100' : 'translate-x-[3px] opacity-60'
					}`}
				/>
			</button>
		</div>
	);
}
