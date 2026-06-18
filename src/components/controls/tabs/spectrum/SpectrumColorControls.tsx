import type { ColorSourceMode, SpectrumColorMode } from '@/types/wallpaper';
import { SPECTRUM_COLOR_MODES } from '@/features/spectrum/spectrumControlConfig';
import { useT } from '@/lib/i18n';
import { FONT, SegmentedControl, UI_COLORS } from '@/ui';
import ColorInput from '@/ui/ConnectedColorInput';

const COLOR_SOURCES: ColorSourceMode[] = ['manual', 'image', 'theme'];

const LABEL_STYLE = {
	color: UI_COLORS.fgMute,
	fontFamily: FONT.mono,
	fontSize: 10,
	fontWeight: 650,
	letterSpacing: '0.1em',
	textTransform: 'uppercase'
} as const;

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
	secondaryLabel,
	colorModeOptions = SPECTRUM_COLOR_MODES
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
	/**
	 * Restricts the color-mode segmented control (the glow only offers
	 * solid/gradient). Defaults to the full fill set.
	 */
	colorModeOptions?: SpectrumColorMode[];
}) {
	const t = useT();
	return (
		<>
			<div className="flex flex-col gap-2">
				<span className="uppercase" style={LABEL_STYLE}>
					{t.label_color_source}
				</span>
				<SegmentedControl<ColorSourceMode>
					value={source}
					onChange={onSourceChange}
					options={COLOR_SOURCES.map(option => ({
						value: option,
						label:
							option === 'manual'
								? t.label_manual_color
								: option === 'image'
									? t.label_current_image
									: t.label_theme
					}))}
					size="md"
					density="compact"
					full
					ariaLabel={t.label_color_source}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<span className="uppercase" style={LABEL_STYLE}>
					{label}
				</span>
				<SegmentedControl<SpectrumColorMode>
					value={colorMode}
					onChange={onColorModeChange}
					options={colorModeOptions.map(option => ({
						value: option,
						label:
							option === 'visible-rotate'
								? 'Rotate RGB'
								: option[0].toUpperCase() + option.slice(1)
					}))}
					size="md"
					density="compact"
					full
					ariaLabel={label}
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
					style={{ color: UI_COLORS.fgMute }}
				>
					{source === 'theme'
						? t.hint_theme_palette_auto
						: t.hint_background_palette_auto}
				</div>
			)}
		</>
	);
}
