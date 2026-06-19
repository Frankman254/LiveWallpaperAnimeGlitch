import { useMemo, type ReactNode } from 'react';
import type { SpectrumShape } from '@/types/wallpaper';
import {
	BarChart3,
	Blocks,
	CircleDot,
	Grid3x3,
	Minus,
	Waves
} from 'lucide-react';
import { useT } from '@/lib/i18n';
import { FONT, ICON_SIZE, OptionCardGrid, UI_COLORS } from '@/ui';

export function SpectrumStyleSelector({
	label,
	options,
	value,
	onChange
}: {
	label: string;
	options: SpectrumShape[];
	value: SpectrumShape;
	onChange: (value: SpectrumShape) => void;
}) {
	const t = useT();
	const styleMeta = useMemo<
		Record<
			SpectrumShape,
			{
				label: string;
				description: string;
				icon: ReactNode;
			}
		>
	>(
		() => ({
			bars: {
				label: t.spectrum_shape_bars_label,
				description: t.spectrum_shape_bars_desc,
				icon: <BarChart3 size={ICON_SIZE.lg} />
			},
			blocks: {
				label: t.spectrum_shape_blocks_label,
				description: t.spectrum_shape_blocks_desc,
				icon: <Blocks size={ICON_SIZE.lg} />
			},
			pixel: {
				label: t.spectrum_shape_pixel_label,
				description: t.spectrum_shape_pixel_desc,
				icon: <Grid3x3 size={ICON_SIZE.lg} />
			},
			lines: {
				label: 'Lines',
				description: 'Legacy line style.',
				icon: <Minus size={ICON_SIZE.lg} />
			},
			wave: {
				label: t.spectrum_shape_wave_label,
				description: t.spectrum_shape_wave_desc,
				icon: <Waves size={ICON_SIZE.lg} />
			},
			dots: {
				label: t.spectrum_shape_dots_label,
				description: t.spectrum_shape_dots_desc,
				icon: <CircleDot size={ICON_SIZE.lg} />
			},
			capsules: {
				label: 'Capsules',
				description: 'Legacy rounded bars.',
				icon: <Minus size={ICON_SIZE.lg} />
			}
		}),
		[t]
	);

	return (
		<div className="flex flex-col gap-2">
			<span
				className="uppercase tracking-widest"
				style={{
					color: UI_COLORS.fgMute,
					fontFamily: FONT.mono,
					fontSize: 10,
					fontWeight: 650
				}}
			>
				{label}
			</span>
			<OptionCardGrid<SpectrumShape>
				items={options.map(option => ({
					value: option,
					...styleMeta[option]
				}))}
				value={value}
				onChange={onChange}
				density="compact"
				ariaLabel={label}
			/>
		</div>
	);
}
