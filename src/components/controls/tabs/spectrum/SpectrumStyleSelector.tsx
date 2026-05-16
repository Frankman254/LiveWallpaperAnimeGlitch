import type { ReactNode } from 'react';
import type { SpectrumShape } from '@/types/wallpaper';
import { BarChart3, Blocks, CircleDot, Minus, Waves } from 'lucide-react';
import { FONT, ICON_SIZE, OptionCardGrid, UI_COLORS } from '@/ui';

const STYLE_META: Record<
	SpectrumShape,
	{
		label: string;
		description: string;
		icon: ReactNode;
	}
> = {
	bars: {
		label: 'Bars',
		description: 'Clean equalizer columns.',
		icon: <BarChart3 size={ICON_SIZE.lg} />
	},
	blocks: {
		label: 'Blocks',
		description: 'Chunky stepped motion.',
		icon: <Blocks size={ICON_SIZE.lg} />
	},
	lines: {
		label: 'Lines',
		description: 'Legacy line style.',
		icon: <Minus size={ICON_SIZE.lg} />
	},
	wave: {
		label: 'Wave',
		description: 'Continuous reactive curve.',
		icon: <Waves size={ICON_SIZE.lg} />
	},
	dots: {
		label: 'Dots',
		description: 'Minimal pulse points.',
		icon: <CircleDot size={ICON_SIZE.lg} />
	},
	capsules: {
		label: 'Capsules',
		description: 'Legacy rounded bars.',
		icon: <Minus size={ICON_SIZE.lg} />
	}
};

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
					...STYLE_META[option]
				}))}
				value={value}
				onChange={onChange}
				density="compact"
				ariaLabel={label}
			/>
		</div>
	);
}
