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
		<div className="flex items-center justify-between gap-3">
			<span
				className={`text-xs cursor-default ${theme.sectionTitle}`}
				title={tooltip}
				style={{ color: 'var(--editor-accent-soft)' }}
			>
				{label}
				{tooltip && (
					<span
						className={`ml-0.5 ${theme.panelSubtle}`}
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						?
					</span>
				)}
			</span>
			<button
				onClick={() => onChange(!value)}
				className={`w-10 h-5 rounded-full transition-colors ${
					value ? theme.toggleOn : theme.toggleOff
				} relative flex-shrink-0`}
				style={
					value
						? { backgroundColor: 'var(--editor-accent-color)' }
						: undefined
				}
			>
				<span
					className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
						value ? 'translate-x-5' : 'translate-x-0.5'
					}`}
				/>
			</button>
		</div>
	);
}
