import type { ColorSourceMode } from '@/types/wallpaper';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import { SectionCard } from '@/ui';

import { OptionButtonGroup, ProfileSlotsGrid } from './MotionSharedControls';
import {
	COLOR_SOURCES,
	MAX_MOTION_PROFILE_SLOTS
} from './motionTabUtils';

type MotionProfilesStore = Pick<
	WallpaperStore,
	| 'motionProfileSlots'
	| 'loadMotionProfileSlot'
	| 'addMotionProfileSlot'
	| 'removeMotionProfileSlot'
	| 'setMotionColorSources'
>;

export function MotionProfilesSection({
	store,
	motionColorSource,
	activeMotionIndex,
	colorSourceLabels,
	onSaveMotionSlot,
	labels
}: {
	store: MotionProfilesStore;
	motionColorSource: ColorSourceMode | null;
	activeMotionIndex: number;
	colorSourceLabels: Record<ColorSourceMode, string>;
	onSaveMotionSlot: (index: number) => void;
	labels: {
		title: string;
		subtitle: string;
		colorSource: string;
		load: string;
		save: string;
		empty: string;
		active: string;
	};
}) {
	return (
		<SectionCard
			title={labels.title}
			subtitle={labels.subtitle}
			density="compact"
		>
			<div className="flex flex-col gap-3">
				<OptionButtonGroup<ColorSourceMode>
					label={labels.colorSource}
					options={COLOR_SOURCES}
					value={motionColorSource}
					onChange={store.setMotionColorSources}
					labels={colorSourceLabels}
					columns={3}
				/>
				<ProfileSlotsGrid
					slots={store.motionProfileSlots}
					activeIndex={activeMotionIndex >= 0 ? activeMotionIndex : null}
					onLoad={store.loadMotionProfileSlot}
					onSave={onSaveMotionSlot}
					onAdd={store.addMotionProfileSlot}
					onDelete={store.removeMotionProfileSlot}
					loadLabel={labels.load}
					saveLabel={labels.save}
					slotLabel={labels.title}
					emptyLabel={labels.empty}
					activeLabel={labels.active}
					maxSlots={MAX_MOTION_PROFILE_SLOTS}
				/>
			</div>
		</SectionCard>
	);
}
