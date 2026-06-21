import { MAX_LIGHTS_SLOT_COUNT } from '@/lib/featureProfiles';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import { SectionCard } from '@/ui';

import { ProfileSlotsGrid } from './MotionSharedControls';

type LightsProfilesStore = Pick<
	WallpaperStore,
	| 'lightsProfileSlots'
	| 'loadLightsProfileSlot'
	| 'addLightsProfileSlot'
	| 'removeLightsProfileSlot'
>;

export function LightsProfilesSection({
	store,
	activeIndex,
	onSave,
	labels
}: {
	store: LightsProfilesStore;
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
				slots={store.lightsProfileSlots}
				activeIndex={activeIndex}
				onLoad={store.loadLightsProfileSlot}
				onSave={onSave}
				onAdd={store.addLightsProfileSlot}
				onDelete={store.removeLightsProfileSlot}
				loadLabel={labels.load}
				saveLabel={labels.save}
				slotLabel={labels.title}
				emptyLabel={labels.empty}
				activeLabel={labels.active}
				maxSlots={MAX_LIGHTS_SLOT_COUNT}
			/>
		</SectionCard>
	);
}
