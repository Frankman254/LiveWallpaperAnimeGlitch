import type { ColorSourceMode } from '@/types/wallpaper';
import { useT } from '@/lib/i18n';
import {
	Caption,
	ColorInput,
	EnumButtonGroup,
	FieldLabel,
	UI_COLORS
} from '@/ui';

const COLOR_SOURCES: ColorSourceMode[] = ['manual', 'image', 'theme'];

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
				borderColor: UI_COLORS.border,
				background: UI_COLORS.panel
			}}
		>
			<div className="flex flex-col gap-2">
				<div className="flex flex-col gap-1">
					<FieldLabel>{label}</FieldLabel>
					<EnumButtonGroup<ColorSourceMode>
						options={COLOR_SOURCES}
						value={source}
						onChange={onSourceChange}
						labels={{
							manual: t.label_manual_color,
							image: backgroundLabel ?? t.label_current_image,
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
					<Caption as="div" className="text-[11px]">
						{source === 'theme'
							? t.hint_theme_palette_auto
							: t.hint_background_palette_auto}
					</Caption>
				)}
			</div>
		</div>
	);
}
