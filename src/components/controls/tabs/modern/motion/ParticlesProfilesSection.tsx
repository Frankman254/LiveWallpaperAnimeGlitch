import { MAX_PARTICLES_SLOT_COUNT } from '@/lib/featureProfiles';
import type { WallpaperStore } from '@/store/wallpaperStoreTypes';
import { SectionCard } from '@/ui';

import { ProfileSlotsGrid } from './MotionSharedControls';

type ParticlesProfilesStore = Pick<
	WallpaperStore,
	| 'particlesProfileSlots'
	| 'loadParticlesProfileSlot'
	| 'addParticlesProfileSlot'
	| 'removeParticlesProfileSlot'
>;

export function ParticlesProfilesSection({
	store,
	activeIndex,
	onSave,
	labels
}: {
	store: ParticlesProfilesStore;
	/** Index of the currently-matching slot, or null if none. */
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
				slots={store.particlesProfileSlots}
				activeIndex={activeIndex}
				onLoad={store.loadParticlesProfileSlot}
				onSave={onSave}
				onAdd={store.addParticlesProfileSlot}
				onDelete={store.removeParticlesProfileSlot}
				loadLabel={labels.load}
				saveLabel={labels.save}
				slotLabel={labels.title}
				emptyLabel={labels.empty}
				activeLabel={labels.active}
				maxSlots={MAX_PARTICLES_SLOT_COUNT}
			/>
		</SectionCard>
	);
}
