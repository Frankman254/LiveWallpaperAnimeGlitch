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
		<div className="flex flex-wrap gap-1.5">
			{options.map(opt => (
				<button
					key={opt}
					onClick={() => onChange(opt)}
					className={`border px-2.5 py-1 text-[11px] capitalize transition-all duration-200 hover:-translate-y-0.5 ${
						value === opt ? theme.tabActive : theme.tabInactive
					}`}
					style={
						value === opt
							? {
									borderRadius: 'var(--editor-radius-md)',
									background: 'var(--editor-active-bg)',
									borderColor: 'var(--editor-button-border)',
									color: 'var(--editor-active-fg)',
									boxShadow:
										'0 10px 24px color-mix(in srgb, var(--editor-accent-color) 18%, transparent)'
								}
							: {
									borderRadius: 'var(--editor-radius-md)',
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
