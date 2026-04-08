import type { ColorSourceMode } from '@/types/wallpaper';
import { useT } from '@/lib/i18n';
import EnumButtons from './EnumButtons';
import ColorInput from './ColorInput';

const COLOR_SOURCES: ColorSourceMode[] = ['manual', 'background', 'theme'];

export default function AdaptiveColorInput({
	label,
	source,
	onSourceChange,
	value,
	onValueChange,
	onChange,
	backgroundLabel
}: {
	label: string;
	source: ColorSourceMode;
	onSourceChange: (value: ColorSourceMode) => void;
	value: string;
	onValueChange?: (value: string) => void;
	onChange?: (value: string) => void;
	backgroundLabel?: string;
}) {
	const t = useT();
	const handleValueChange = onValueChange ?? onChange;
	return (
		<div
			className="rounded-md border p-2"
			style={{
				borderColor: 'var(--editor-accent-border)',
				background: 'var(--editor-surface-bg)'
			}}
		>
			<div className="flex flex-col gap-2">
				<div className="flex flex-col gap-1">
					<span
						className="text-xs"
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						{label}
					</span>
					<EnumButtons<ColorSourceMode>
						options={COLOR_SOURCES}
						value={source}
						onChange={onSourceChange}
						labels={{
							manual: t.label_manual_color,
							background:
								backgroundLabel ?? t.label_current_image,
							theme: t.label_theme
						}}
					/>
				</div>
				{source === 'manual' ? (
					<ColorInput
						label={t.label_manual_color}
						value={value}
						onChange={handleValueChange ?? (() => {})}
					/>
				) : (
					<div
						className="text-[11px]"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{source === 'theme'
							? t.hint_theme_palette_auto
							: t.hint_background_palette_auto}
					</div>
				)}
			</div>
		</div>
	);
}
