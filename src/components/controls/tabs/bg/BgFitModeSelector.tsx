import type { ImageFitMode } from '@/types/wallpaper';
import { Button, FONT, UI_COLORS } from '@/ui';
import { FIT_MODES } from './constants';

export default function BgFitModeSelector({
	label,
	value,
	onChange
}: {
	label: string;
	value: ImageFitMode;
	onChange: (value: ImageFitMode) => void;
}) {
	return (
		<div className="flex flex-col gap-1">
			<span
				className="uppercase"
				style={{
					color: UI_COLORS.fgMute,
					fontFamily: FONT.mono,
					fontSize: 10,
					fontWeight: 650,
					letterSpacing: '0.1em'
				}}
			>
				{label}
			</span>
			<div className="flex flex-wrap gap-1.5">
				{FIT_MODES.map(mode => (
					<Button
						key={mode}
						size="sm"
						density="compact"
						variant={value === mode ? 'primary' : 'secondary'}
						active={value === mode}
						onClick={() => onChange(mode)}
					>
						{mode}
					</Button>
				))}
			</div>
		</div>
	);
}
