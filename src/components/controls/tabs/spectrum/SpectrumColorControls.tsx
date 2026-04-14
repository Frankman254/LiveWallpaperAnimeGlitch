import type { ColorSourceMode, SpectrumColorMode } from '@/types/wallpaper';
import { SPECTRUM_COLOR_MODES } from '@/features/spectrum/spectrumControlConfig';
import { useT } from '@/lib/i18n';
import EnumButtons from '../../ui/EnumButtons';
import ColorInput from '../../ui/ColorInput';

const COLOR_SOURCES: ColorSourceMode[] = ['manual', 'background', 'theme'];

export function SpectrumColorControls({
	label,
	source,
	onSourceChange,
	colorMode,
	onColorModeChange,
	primaryColor,
	onPrimaryColorChange,
	primaryLabel,
	secondaryColor,
	onSecondaryColorChange,
	secondaryLabel
}: {
	label: string;
	source: ColorSourceMode;
	onSourceChange: (value: ColorSourceMode) => void;
	colorMode: SpectrumColorMode;
	onColorModeChange: (value: SpectrumColorMode) => void;
	primaryColor: string;
	onPrimaryColorChange: (value: string) => void;
	primaryLabel: string;
	secondaryColor: string;
	onSecondaryColorChange: (value: string) => void;
	secondaryLabel: string;
}) {
	const t = useT();
	return (
		<>
			<div className="flex flex-col gap-1">
				<span
					className="text-xs"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{t.label_color_source}
				</span>
				<EnumButtons<ColorSourceMode>
					options={COLOR_SOURCES}
					value={source}
					onChange={onSourceChange}
					labels={{
						manual: t.label_manual_color,
						background: t.label_current_image,
						theme: t.label_theme
					}}
				/>
			</div>
			<div className="flex flex-col gap-1">
				<span
					className="text-xs"
					style={{ color: 'var(--editor-accent-soft)' }}
				>
					{label}
				</span>
				<EnumButtons<SpectrumColorMode>
					options={SPECTRUM_COLOR_MODES}
					value={colorMode}
					onChange={onColorModeChange}
					labels={{
						solid: 'Solid',
						gradient: 'Gradient',
						rainbow: 'Rainbow',
						'visible-rotate': 'Rotate RGB'
					}}
				/>
			</div>
			{source === 'manual' ? (
				<>
					<ColorInput
						label={primaryLabel}
						value={primaryColor}
						onChange={onPrimaryColorChange}
					/>
					{colorMode !== 'solid' ? (
						<ColorInput
							label={secondaryLabel}
							value={secondaryColor}
							onChange={onSecondaryColorChange}
						/>
					) : null}
				</>
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
		</>
	);
}
