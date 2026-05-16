import { useShallow } from 'zustand/react/shallow';
import { RotateCcw, Wand2 } from 'lucide-react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import type { ColorSourceMode, WallpaperState } from '@/types/wallpaper';
import {
	doProfileSettingsMatch,
	extractSpectrumProfileSettings,
	MAX_SPECTRUM_SLOT_COUNT
} from '@/lib/featureProfiles';
import {
	SPECTRUM_LINEAR_STYLES,
	SPECTRUM_RADIAL_STYLES
} from '@/features/spectrum/spectrumControlConfig';
import { resolveSpectrumPlacement } from '@/features/spectrum/runtime/spectrumPlacement';
import {
	Button,
	Caption,
	ProfileSlotsEditor,
	SectionCard,
	ToggleSwitch,
	ICON_SIZE
} from '@/ui';
import ColorSourceShortcuts from '../../ui/ColorSourceShortcuts';
import { useDialog } from '../../ui/DialogProvider';
import { confirmResetSpectrumDefaults } from '../../ui/confirmCritical';
import { SpectrumMainSection } from '../spectrum/SpectrumMainSection';
import { SpectrumCloneSection } from '../spectrum/SpectrumCloneSection';
import { SpectrumMacroStrip } from '../spectrum/SpectrumMacroStrip';
import { useIsSimple } from '../../UIMode';

export default function ModernSpectrumTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			spectrumMode: s.spectrumMode,
			spectrumEnabled: s.spectrumEnabled,
			spectrumCircularClone: s.spectrumCircularClone,
			spectrumProfileSlots: s.spectrumProfileSlots,
			spectrumColorSource: s.spectrumColorSource,
			spectrumCloneColorSource: s.spectrumCloneColorSource,
			setSpectrumEnabled: s.setSpectrumEnabled,
			setSpectrumCircularClone: s.setSpectrumCircularClone,
			setSpectrumColorSources: s.setSpectrumColorSources,
			saveSpectrumProfileSlot: s.saveSpectrumProfileSlot,
			loadSpectrumProfileSlot: s.loadSpectrumProfileSlot,
			addSpectrumProfileSlot: s.addSpectrumProfileSlot,
			removeSpectrumProfileSlot: s.removeSpectrumProfileSlot,
			randomizeSpectrum: s.randomizeSpectrum,
			recoverAudioOverlays: s.recoverAudioOverlays,
			resetSpectrumToDefaults: s.resetSpectrumToDefaults
		}))
	);
	const { confirm } = useDialog();
	const isSimple = useIsSimple();
	const fullStore = useWallpaperStore.getState() as WallpaperState;
	const isRadial = store.spectrumMode === 'radial';
	const canMoveMainSpectrum = !resolveSpectrumPlacement(fullStore, {
		variant: 'main'
	}).positionLockedToLogo;
	const currentProfileSettings = extractSpectrumProfileSettings(fullStore);
	const activeProfileIndex = store.spectrumProfileSlots.findIndex(slot =>
		doProfileSettingsMatch(currentProfileSettings, slot.values)
	);
	const mainStyleOptions = isRadial
		? SPECTRUM_RADIAL_STYLES
		: SPECTRUM_LINEAR_STYLES;
	const sharedSpectrumColorSource =
		store.spectrumColorSource === store.spectrumCloneColorSource
			? store.spectrumColorSource
			: null;

	async function handleSaveProfile(index: number) {
		const slot = store.spectrumProfileSlots[index];
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
		store.saveSpectrumProfileSlot(index);
	}

	function handleRandomize(colorSource: ColorSourceMode) {
		store.randomizeSpectrum(colorSource);
	}

	return (
		<div className="flex min-w-0 flex-col gap-1.5">
			<SectionCard
				title={t.tab_spectrum}
				subtitle="Manual spectrum builder"
				density="compact"
				action={
					<ToggleSwitch
						checked={store.spectrumEnabled}
						onChange={store.setSpectrumEnabled}
						size="sm"
						ariaLabel={t.label_enabled}
					/>
				}
			>
				<ColorSourceShortcuts
					label={t.label_color_source}
					value={sharedSpectrumColorSource}
					onChange={store.setSpectrumColorSources}
					compact
				/>
			</SectionCard>

			{!isSimple ? (
				<SectionCard
					title={t.section_spectrum_profiles}
					subtitle="Save calibrated manual spectrum setups"
					density="compact"
				>
					<ProfileSlotsEditor
						title=""
						hint={t.hint_saved_profiles}
						slots={store.spectrumProfileSlots}
						activeIndex={
							activeProfileIndex >= 0 ? activeProfileIndex : null
						}
						onLoad={store.loadSpectrumProfileSlot}
						onSave={index => void handleSaveProfile(index)}
						onAdd={store.addSpectrumProfileSlot}
						onDelete={store.removeSpectrumProfileSlot}
						loadLabel={t.label_load_profile}
						saveLabel={t.label_save_profile}
						slotLabel={t.label_profile_slot}
						emptyLabel={t.profile_slot_empty}
						activeLabel={t.profile_slot_active}
						maxSlots={MAX_SPECTRUM_SLOT_COUNT}
					/>
				</SectionCard>
			) : null}

			<SectionCard
				title="Quick Adjust"
				subtitle="Randomize only as a starting point"
				density="compact"
			>
				<div className="flex flex-col gap-2">
					<div className="grid grid-cols-2 gap-1.5">
						<Button
							onClick={() => handleRandomize('manual')}
							size="sm"
							density="compact"
							variant="secondary"
							icon={<Wand2 size={ICON_SIZE.xs} />}
						>
							Any color
						</Button>
						<Button
							onClick={() => handleRandomize('image')}
							size="sm"
							density="compact"
							variant="secondary"
							icon={<Wand2 size={ICON_SIZE.xs} />}
						>
							Image colors
						</Button>
					</div>
					<SpectrumMacroStrip />
				</div>
			</SectionCard>

			{!isSimple ? (
				<SectionCard
					title={t.section_spectrum_main}
					subtitle="Geometry, color, surface and motion"
					density="compact"
				>
					<SpectrumMainSection
						isRadial={isRadial}
						mainStyleOptions={mainStyleOptions}
						canMoveMainSpectrum={canMoveMainSpectrum}
					/>
				</SectionCard>
			) : null}

			{isSimple ? null : store.spectrumCircularClone ? (
				<SectionCard
					title="Circular Spectrum"
					subtitle={t.hint_circular_spectrum}
					density="compact"
					action={
						<ToggleSwitch
							checked={store.spectrumCircularClone}
							onChange={store.setSpectrumCircularClone}
							size="sm"
							ariaLabel={t.label_circular_clone}
						/>
					}
				>
					<SpectrumCloneSection />
				</SectionCard>
			) : (
				<SectionCard
					title="Circular Spectrum"
					subtitle={t.hint_circular_spectrum}
					density="compact"
					action={
						<ToggleSwitch
							checked={store.spectrumCircularClone}
							onChange={store.setSpectrumCircularClone}
							size="sm"
							ariaLabel={t.label_circular_clone}
						/>
					}
				>
					<Caption as="p">
						Toggle to enable an independent circular clone of the main spectrum.
					</Caption>
				</SectionCard>
			)}

			{!isSimple ? (
				<SectionCard title="Recovery & Reset" density="compact">
					<div className="flex flex-wrap gap-1.5">
						<Button
							type="button"
							onClick={() => store.recoverAudioOverlays()}
							size="sm"
							density="compact"
							variant="secondary"
							title={t.hint_recover_logo_spectrum}
						>
							{t.label_recover_logo_spectrum}
						</Button>
						<Button
							type="button"
							onClick={onReset}
							size="sm"
							density="compact"
							variant="secondary"
							icon={<RotateCcw size={ICON_SIZE.xs} />}
						>
							{t.reset_tab}
						</Button>
						<Button
							type="button"
							onClick={() =>
								void (async () => {
									if (
										!(await confirmResetSpectrumDefaults(
											confirm,
											t
										))
									) {
										return;
									}
									store.resetSpectrumToDefaults();
								})()
							}
							size="sm"
							density="compact"
							variant="warning"
							icon={<RotateCcw size={ICON_SIZE.xs} />}
						>
							{t.label_reset_spectrum_defaults}
						</Button>
					</div>
				</SectionCard>
			) : null}
		</div>
	);
}
