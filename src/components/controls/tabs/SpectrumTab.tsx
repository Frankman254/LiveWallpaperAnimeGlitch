import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import {
	doProfileSettingsMatch,
	extractSpectrumProfileSettings,
	MAX_SPECTRUM_SLOT_COUNT
} from '@/lib/featureProfiles';
import type { ColorSourceMode } from '@/types/wallpaper';
import {
	SPECTRUM_LINEAR_STYLES,
	SPECTRUM_RADIAL_STYLES
} from '@/features/spectrum/spectrumControlConfig';
import ToggleControl from '../ToggleControl';
import ResetButton from '../ui/ResetButton';
import ProfileSlotsEditor from '../ui/ProfileSlotsEditor';
import CollapsibleSection from '../ui/CollapsibleSection';
import { useDialog } from '../ui/DialogProvider';
import { SpectrumMainSection } from './spectrum/SpectrumMainSection';
import { SpectrumCloneSection } from './spectrum/SpectrumCloneSection';
import { SpectrumPresetGallery } from './spectrum/SpectrumPresetGallery';
import { SpectrumMacroStrip } from './spectrum/SpectrumMacroStrip';
import { generateRandomSpectrumParams } from './spectrum/randomizer';

export default function SpectrumTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const store = useWallpaperStore();
	const { confirm } = useDialog();
	const isRadial = store.spectrumMode === 'radial';
	const cloneSectionVisible = !isRadial;
	const canMoveMainSpectrum =
		!isRadial || !store.spectrumFollowLogo || !store.logoEnabled;
	const currentProfileSettings = extractSpectrumProfileSettings(store);
	const activeProfileIndex = store.spectrumProfileSlots.findIndex(slot =>
		doProfileSettingsMatch(currentProfileSettings, slot.values)
	);
	const mainStyleOptions = isRadial
		? SPECTRUM_RADIAL_STYLES
		: SPECTRUM_LINEAR_STYLES;

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
		const newParams = generateRandomSpectrumParams(colorSource);
		useWallpaperStore.setState(newParams);
	}

	return (
		<>
			<div className="mb-3 flex flex-col gap-2">
				<div className="flex flex-wrap gap-2">
					<ResetButton label={t.reset_tab} onClick={onReset} />
					<button
						type="button"
						onClick={() => store.resetSpectrumToDefaults()}
						className="rounded border px-3 py-2 text-xs transition-colors hover:bg-white/5"
						style={{
							borderColor: 'var(--editor-accent-border)',
							background: 'var(--editor-tag-bg)',
							color: 'var(--editor-tag-fg)'
						}}
					>
						{t.label_reset_spectrum_defaults}
					</button>
					<button
						type="button"
						onClick={() => store.recoverAudioOverlays()}
						className="rounded border px-3 py-2 text-xs transition-colors hover:bg-white/5"
						style={{
							borderColor: 'var(--editor-active-fg)',
							background: 'var(--editor-surface-bg)',
							color: 'var(--editor-active-fg)'
						}}
						title={t.hint_recover_logo_spectrum}
					>
						{t.label_recover_logo_spectrum}
					</button>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => handleRandomize('manual')}
						className="flex-1 rounded-2xl border px-3 py-2 text-xs transition-colors hover:bg-white/5 active:scale-95"
						style={{
							borderColor: 'var(--editor-accent-border)',
							background: 'var(--editor-surface-bg)',
							color: 'var(--editor-active-fg)'
						}}
					>
						🎲 Random (Any Color)
					</button>
					<button
						onClick={() => handleRandomize('background')}
						className="flex-1 rounded-2xl border px-3 py-2 text-xs transition-colors hover:bg-white/5 active:scale-95"
						style={{
							borderColor: 'var(--editor-tag-border)',
							background: 'var(--editor-tag-bg)',
							color: 'var(--editor-tag-fg)'
						}}
					>
						🎨 Random (Image Colors)
					</button>
				</div>
			</div>

			<CollapsibleSection label="Macros" defaultOpen>
				<SpectrumMacroStrip />
			</CollapsibleSection>

			<CollapsibleSection label="Presets" defaultOpen>
				<SpectrumPresetGallery />
			</CollapsibleSection>

			<CollapsibleSection
				label={t.section_spectrum_profiles}
				defaultOpen={false}
			>
				<ToggleControl
					label={t.label_enabled}
					value={store.spectrumEnabled}
					onChange={store.setSpectrumEnabled}
				/>
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
			</CollapsibleSection>

			<CollapsibleSection label={t.section_spectrum_main} defaultOpen>
				<SpectrumMainSection
					isRadial={isRadial}
					mainStyleOptions={mainStyleOptions}
					canMoveMainSpectrum={canMoveMainSpectrum}
				/>
			</CollapsibleSection>

			{cloneSectionVisible ? (
				<CollapsibleSection
					label={t.section_spectrum_clone}
					defaultOpen={false}
				>
					<p
						className="mb-2 text-[10px] leading-snug"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{t.hint_spectrum_clone_section}
					</p>
					<SpectrumCloneSection />
				</CollapsibleSection>
			) : null}
		</>
	);
}
