interface Props<T extends string> {
	options: T[];
	value: T;
	onChange: (v: T) => void;
	labels?: Partial<Record<T, string>>;
}

import { useWallpaperStore } from '@/store/wallpaperStore';
import { EDITOR_THEME_CLASSES } from '@/components/controls/editorTheme';

export default function EnumButtons<T extends string>({
	options,
	value,
	onChange,
	labels
}: Props<T>) {
	const editorTheme = useWallpaperStore(state => state.editorTheme);
	const theme = EDITOR_THEME_CLASSES[editorTheme];
	return (
		<div className="flex flex-wrap gap-1">
			{options.map(opt => (
				<button
					key={opt}
					onClick={() => onChange(opt)}
					className={`px-2 py-0.5 text-xs rounded border capitalize transition-colors ${
						value === opt ? theme.tabActive : theme.tabInactive
					}`}
					style={
						value === opt
							? {
									background: 'var(--editor-active-bg)',
									borderColor: 'var(--editor-button-border)',
									color: 'var(--editor-active-fg)'
								}
							: {
									background: 'var(--editor-tag-bg)',
									borderColor: 'var(--editor-tag-border)',
									color: 'var(--editor-tag-fg)'
								}
					}
				>
					{labels?.[opt] ?? opt}
				</button>
			))}
		</div>
	);
}
