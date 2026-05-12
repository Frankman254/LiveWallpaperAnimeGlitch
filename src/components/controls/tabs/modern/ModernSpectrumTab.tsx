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
import { Button, SectionCard, ToggleSwitch, UI_COLORS, ICON_SIZE } from '@/ui';
import ProfileSlotsEditor from '../../ui/ProfileSlotsEditor';
import ColorSourceShortcuts from '../../ui/ColorSourceShortcuts';
import { useDialog } from '../../ui/DialogProvider';
import { CAPTION_CLASS } from '../../ui/designTokens';
import { SpectrumMainSection } from '../spectrum/SpectrumMainSection';
import { SpectrumCloneSection } from '../spectrum/SpectrumCloneSection';
import { SpectrumMacroStrip } from '../spectrum/SpectrumMacroStrip';

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
				<div className="flex flex-col gap-2">
					<ColorSourceShortcuts
						label={t.label_color_source}
						value={sharedSpectrumColorSource}
						onChange={store.setSpectrumColorSources}
						compact
					/>
					<div
						className="flex items-center justify-between gap-2 rounded-[var(--editor-radius-md)] border px-2 py-1.5"
						style={{
							borderColor: UI_COLORS.border,
							background: UI_COLORS.raised,
							color: UI_COLORS.fgMute
						}}
					>
						<span className="text-[11px]">{t.label_enabled}</span>
						<span
							className="text-[10px] uppercase tracking-[0.1em]"
							style={{ color: UI_COLORS.accent }}
						>
							{store.spectrumEnabled ? 'On' : 'Off'}
						</span>
					</div>
				</div>
			</SectionCard>

			<SectionCard
				title={t.section_spectrum_profiles}
				subtitle="Save calibrated manual spectrum setups"
				density="compact"
			>
				<div className="flex flex-col gap-2">
					<p
						className={CAPTION_CLASS}
						style={{ color: UI_COLORS.fgMute }}
					>
						Save your calibrated manual spectrum setups here. Slots
						stay manual and do not auto-switch behind the scenes.
					</p>
					<ProfileSlotsEditor
						title={t.section_saved_profiles}
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
				</div>
			</SectionCard>

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
				<div className="flex items-center justify-between gap-2">
					<span className="text-[11px]" style={{ color: UI_COLORS.fg }}>
						{t.label_circular_clone}
					</span>
					<span
						className="text-[10px] uppercase tracking-[0.1em]"
						style={{ color: UI_COLORS.fgMute }}
					>
						{store.spectrumCircularClone ? 'Enabled' : 'Disabled'}
					</span>
				</div>
			</SectionCard>

			{store.spectrumCircularClone ? (
				<SectionCard
					title="Circular Settings"
					subtitle="Independent clone controls"
					density="compact"
				>
					<SpectrumCloneSection />
				</SectionCard>
			) : null}

			<SectionCard title="Recovery & Reset" density="compact">
				<div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
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
						onClick={() => store.resetSpectrumToDefaults()}
						size="sm"
						density="compact"
						variant="warning"
						icon={<RotateCcw size={ICON_SIZE.xs} />}
					>
						{t.label_reset_spectrum_defaults}
					</Button>
				</div>
			</SectionCard>
		</div>
	);
}
