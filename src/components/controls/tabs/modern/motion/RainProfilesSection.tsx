import { MAX_RAIN_SLOT_COUNT } from '@/lib/featureProfiles';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import { SectionCard } from '@/ui';

import { ProfileSlotsGrid } from './MotionSharedControls';

type RainProfilesStore = Pick<
	WallpaperStore,
	| 'rainProfileSlots'
	| 'loadRainProfileSlot'
	| 'addRainProfileSlot'
	| 'removeRainProfileSlot'
>;

export function RainProfilesSection({
	store,
	activeIndex,
	onSave,
	labels
}: {
	store: RainProfilesStore;
	activeIndex: number | null;
	onSave: (index: number) => void;
	labels: {
		title: string;
		subtitle: string;
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
			<ProfileSlotsGrid
				slots={store.rainProfileSlots}
				activeIndex={activeIndex}
				onLoad={store.loadRainProfileSlot}
				onSave={onSave}
				onAdd={store.addRainProfileSlot}
				onDelete={store.removeRainProfileSlot}
				loadLabel={labels.load}
				saveLabel={labels.save}
				slotLabel={labels.title}
				emptyLabel={labels.empty}
				activeLabel={labels.active}
				maxSlots={MAX_RAIN_SLOT_COUNT}
			/>
		</SectionCard>
	);
}
