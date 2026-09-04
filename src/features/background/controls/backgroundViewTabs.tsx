import {
	AudioLines,
	Grid3x3,
	Image as ImageIcon,
	SlidersHorizontal
} from 'lucide-react';
import { ICON_SIZE, SegmentedControl } from '@/ui';
import type { BgView } from './backgroundViewState';

function getBackgroundViewOptions(canShowAudio: boolean) {
	return canShowAudio
		? ([
				{
					value: 'pool',
					label: 'Pool',
					icon: <Grid3x3 size={ICON_SIZE.xs} />
				},
				{
					value: 'active',
					label: 'Active',
					icon: <SlidersHorizontal size={ICON_SIZE.xs} />
				},
				{
					value: 'audio',
					label: 'Audio',
					icon: <AudioLines size={ICON_SIZE.xs} />
				},
				{
					value: 'global',
					label: 'Global',
					icon: <ImageIcon size={ICON_SIZE.xs} />
				}
			] as const)
		: ([
				{
					value: 'pool',
					label: 'Pool',
					icon: <Grid3x3 size={ICON_SIZE.xs} />
				},
				{
					value: 'active',
					label: 'Active',
					icon: <SlidersHorizontal size={ICON_SIZE.xs} />
				},
				{
					value: 'global',
					label: 'Global',
					icon: <ImageIcon size={ICON_SIZE.xs} />
				}
			] as const);
}

export function BackgroundViewTabs({
	view,
	onChange,
	canShowAudio
}: {
	view: BgView;
	onChange: (view: BgView) => void;
	canShowAudio: boolean;
}) {
	return (
		<SegmentedControl<BgView>
			value={view}
			onChange={onChange}
			options={getBackgroundViewOptions(canShowAudio)}
			size="sm"
			density="compact"
			full
			ariaLabel="Background sections"
		/>
	);
}
