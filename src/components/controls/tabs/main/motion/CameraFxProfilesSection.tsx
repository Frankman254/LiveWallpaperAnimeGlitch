import { MAX_CAMERA_FX_SLOT_COUNT } from '@/lib/featureProfiles';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import { SectionCard } from '@/ui';

import { ProfileSlotsGrid } from './MotionSharedControls';

type CameraFxProfilesStore = Pick<
	WallpaperStore,
	| 'cameraFxProfileSlots'
	| 'loadCameraFxProfileSlot'
	| 'addCameraFxProfileSlot'
	| 'removeCameraFxProfileSlot'
>;

export function CameraFxProfilesSection({
	store,
	activeIndex,
	onSave,
	labels
}: {
	store: CameraFxProfilesStore;
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
				slots={store.cameraFxProfileSlots}
				activeIndex={activeIndex}
				onLoad={store.loadCameraFxProfileSlot}
				onSave={onSave}
				onAdd={store.addCameraFxProfileSlot}
				onDelete={store.removeCameraFxProfileSlot}
				loadLabel={labels.load}
				saveLabel={labels.save}
				slotLabel={labels.title}
				emptyLabel={labels.empty}
				activeLabel={labels.active}
				maxSlots={MAX_CAMERA_FX_SLOT_COUNT}
			/>
		</SectionCard>
	);
}
