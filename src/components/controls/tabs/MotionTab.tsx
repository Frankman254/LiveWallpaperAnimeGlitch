import {
	doProfileSettingsMatch,
	extractMotionProfileSettings
} from '@/lib/featureProfiles';
import { useT } from '@/lib/i18n';
import { useWallpaperStore } from '@/store/wallpaperStore';
import ParticlesTab from './ParticlesTab';
import RainTab from './RainTab';
import ProfileSlotsEditor from '../ui/ProfileSlotsEditor';
import SectionDivider from '../ui/SectionDivider';
import TabSection from '../ui/TabSection';
import { useDialog } from '../ui/DialogProvider';

type Props = {
	onResetParticles: () => void;
	onResetRain: () => void;
};

export default function MotionTab({
	onResetParticles,
	onResetRain
}: Props) {
	const t = useT();
	const store = useWallpaperStore();
	const { confirm } = useDialog();
	const currentMotion = extractMotionProfileSettings(store);
	const activeSavedMotionIndex = store.motionProfileSlots.findIndex(slot =>
		doProfileSettingsMatch(currentMotion, slot.values)
	);

	async function handleSaveMotionSlot(index: number) {
		const slot = store.motionProfileSlots[index];
		if (slot?.values) {
			const ok = await confirm({
				title: t.label_save_profile,
				message: t.confirm_overwrite_profile,
				confirmLabel: t.label_save_profile,
				cancelLabel: t.label_cancel,
				tone: 'warning'
			});
			if (!ok) return;
		}
		store.saveMotionProfileSlot(index);
	}

	return (
		<>
			<TabSection
				title="Motion profiles"
				hint="Each slot saves both particle and rain settings together (up to 20 slots). Load one to switch the full motion look."
			>
				<ProfileSlotsEditor
					title="Saved profiles"
					hint="Particles + rain in one bundle — separate from global presets."
					slots={store.motionProfileSlots}
					activeIndex={
						activeSavedMotionIndex >= 0
							? activeSavedMotionIndex
							: null
					}
					onLoad={store.loadMotionProfileSlot}
					onSave={index => void handleSaveMotionSlot(index)}
					onAdd={store.addMotionProfileSlot}
					onDelete={store.removeMotionProfileSlot}
					loadLabel={t.label_load_profile}
					saveLabel={t.label_save_profile}
					slotLabel="Motion"
					emptyLabel={t.profile_slot_empty}
					activeLabel={t.profile_slot_active}
					minProtectedSlots={3}
					maxSlots={20}
				/>
			</TabSection>

			<ParticlesTab onReset={onResetParticles} />
			<SectionDivider label="Rain" />
			<RainTab onReset={onResetRain} />
		</>
	);
}
