import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
	Disc,
	Headphones,
	Layout,
	Palette,
	RotateCcw,
	Sparkles,
	Wand2
} from 'lucide-react';
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
import {
	Button,
	Caption,
	EditorTabFooter,
	EditorTabHeader,
	EditorTabLayout,
	ProfileSlotsEditor,
	SectionCard,
	SegmentedControl,
	ToggleSwitch,
	ICON_SIZE
} from '@/ui';
import ColorSourceShortcuts from '../../ui/ColorSourceShortcuts';
import { useDialog } from '../../ui/DialogProvider';
import { confirmResetSpectrumDefaults } from '../../ui/confirmCritical';
import { SpectrumCloneSection } from '../spectrum/SpectrumCloneSection';
import { SpectrumMacroStrip } from '../spectrum/SpectrumMacroStrip';
import { SpectrumFamilyPanel } from '../spectrum/panels/SpectrumFamilyPanel';
import { SpectrumStylePanel } from '../spectrum/panels/SpectrumStylePanel';
import { SpectrumAudioPanel } from '../spectrum/panels/SpectrumAudioPanel';
import { SpectrumFxPanel } from '../spectrum/panels/SpectrumFxPanel';
import { useIsSimple } from '../../UIMode';

type SpectrumView = 'family' | 'style' | 'audio' | 'fx' | 'clone';

const MODERN_SPECTRUM_VIEW_STORAGE_KEY = 'lwag-modern-spectrum-view';

function isSpectrumView(value: unknown): value is SpectrumView {
	return (
		value === 'family' ||
		value === 'style' ||
		value === 'audio' ||
		value === 'fx' ||
		value === 'clone'
	);
}

function readPersistedView(isSimple: boolean): SpectrumView {
	if (typeof window === 'undefined') return 'family';
	try {
		const value = window.localStorage.getItem(MODERN_SPECTRUM_VIEW_STORAGE_KEY);
		if (!isSpectrumView(value)) return 'family';
		if (isSimple && value !== 'family' && value !== 'style') return 'family';
		return value;
	} catch {
		return 'family';
	}
}

function writePersistedView(value: SpectrumView) {
	if (typeof window === 'undefined') return;
	try {
		window.localStorage.setItem(MODERN_SPECTRUM_VIEW_STORAGE_KEY, value);
	} catch {
		/* localStorage unavailable */
	}
}

function buildViewMeta(
	t: ReturnType<typeof useT>
): Record<SpectrumView, { title: string; subtitle: string }> {
	return {
		family: {
			title: t.spectrum_meta_family_title,
			subtitle: t.spectrum_meta_family_subtitle
		},
		style: {
			title: t.spectrum_meta_style_title,
			subtitle: t.spectrum_meta_style_subtitle
		},
		audio: {
			title: t.spectrum_meta_audio_title,
			subtitle: t.spectrum_meta_audio_subtitle
		},
		fx: {
			title: t.spectrum_meta_fx_title,
			subtitle: t.spectrum_meta_fx_subtitle
		},
		clone: {
			title: t.spectrum_meta_clone_title,
			subtitle: t.spectrum_meta_clone_subtitle
		}
	};
}

export default function ModernSpectrumTab({
	onReset
}: {
	onReset: () => void;
}) {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			spectrumMode: s.spectrumMode,
			spectrumEnabled: s.spectrumEnabled,
			spectrumMainVisible: s.spectrumMainVisible,
			spectrumCircularClone: s.spectrumCircularClone,
			spectrumProfileSlots: s.spectrumProfileSlots,
			spectrumColorSource: s.spectrumColorSource,
			spectrumCloneColorSource: s.spectrumCloneColorSource,
			setSpectrumEnabled: s.setSpectrumEnabled,
			setSpectrumMainVisible: s.setSpectrumMainVisible,
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

	const [view, setView] = useState<SpectrumView>(() => readPersistedView(isSimple));

	// Force back to Family/Style if user dropped to Simple mode while on an
	// advanced tab. Otherwise they would stare at an empty panel (everything
	// inside Audio/FX/Clone is AdvancedOnly).
	useEffect(() => {
		if (isSimple && view !== 'family' && view !== 'style') {
			setView('family');
			writePersistedView('family');
		}
	}, [isSimple, view]);

	function handleViewChange(next: SpectrumView) {
		const safe =
			isSimple && next !== 'family' && next !== 'style' ? 'family' : next;
		setView(safe);
		writePersistedView(safe);
	}

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

	const viewOptions = isSimple
		? ([
				{
					value: 'family',
					label: t.spectrum_view_family,
					icon: <Layout size={ICON_SIZE.xs} />
				},
				{
					value: 'style',
					label: t.spectrum_view_style,
					icon: <Palette size={ICON_SIZE.xs} />
				}
			] as const)
		: ([
				{
					value: 'family',
					label: t.spectrum_view_family,
					icon: <Layout size={ICON_SIZE.xs} />
				},
				{
					value: 'style',
					label: t.spectrum_view_style,
					icon: <Palette size={ICON_SIZE.xs} />
				},
				{
					value: 'audio',
					label: t.spectrum_view_audio,
					icon: <Headphones size={ICON_SIZE.xs} />
				},
				{
					value: 'fx',
					label: t.spectrum_view_fx,
					icon: <Sparkles size={ICON_SIZE.xs} />
				},
				{
					value: 'clone',
					label: t.spectrum_view_clone,
					icon: <Disc size={ICON_SIZE.xs} />
				}
			] as const);

	const meta = buildViewMeta(t)[view];

	return (
		<EditorTabLayout
			header={
				<EditorTabHeader
					title={t.tab_spectrum}
					subtitle={t.spectrum_subtitle_manual_builder}
					enabled={store.spectrumEnabled}
					onToggle={store.setSpectrumEnabled}
					switchAriaLabel={t.label_enabled}
				>
					{store.spectrumEnabled ? (
						<ColorSourceShortcuts
							label={t.label_color_source}
							value={sharedSpectrumColorSource}
							onChange={store.setSpectrumColorSources}
							compact
						/>
					) : (
						<Caption as="p">{t.hint_enable_to_configure}</Caption>
					)}
				</EditorTabHeader>
			}
			savedProfiles={
				store.spectrumEnabled && !isSimple ? (
					<SectionCard
						title={t.section_spectrum_profiles}
						subtitle={t.spectrum_profiles_subtitle}
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
				) : undefined
			}
			footer={
				store.spectrumEnabled && !isSimple ? (
					<EditorTabFooter title={t.spectrum_section_recovery_reset}>
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
										!(await confirmResetSpectrumDefaults(confirm, t))
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
					</EditorTabFooter>
				) : undefined
			}
		>
			{store.spectrumEnabled ? (
				<>
					<SectionCard
						title={t.spectrum_section_quick_adjust}
						subtitle={t.spectrum_quick_subtitle}
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
									{t.spectrum_btn_random_any}
								</Button>
								<Button
									onClick={() => handleRandomize('image')}
									size="sm"
									density="compact"
									variant="secondary"
									icon={<Wand2 size={ICON_SIZE.xs} />}
								>
									{t.spectrum_btn_random_image}
								</Button>
							</div>
							<SpectrumMacroStrip />
						</div>
					</SectionCard>

					<SectionCard
						title={t.spectrum_section_sections}
						subtitle={t.spectrum_sections_subtitle}
						density="compact"
					>
						<SegmentedControl<SpectrumView>
							value={view}
							onChange={handleViewChange}
							options={viewOptions}
							size="sm"
							density="compact"
							full
							ariaLabel={t.spectrum_aria_sections}
						/>
						<div className="mt-2 flex items-center justify-between gap-3">
							<div className="min-w-0">
								<div className="text-[12px] font-medium">
									{t.spectrum_label_main_visible}
								</div>
								<Caption as="p">
									{t.spectrum_hint_main_visible}
								</Caption>
							</div>
							<ToggleSwitch
								checked={store.spectrumMainVisible}
								onChange={store.setSpectrumMainVisible}
								size="sm"
								ariaLabel={t.spectrum_label_main_visible}
							/>
						</div>
					</SectionCard>

					{view === 'clone' ? (
						<SectionCard
							title={meta.title}
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
							{store.spectrumCircularClone ? (
								<SpectrumCloneSection />
							) : (
								<Caption as="p">
									{t.spectrum_clone_caption_toggle}
								</Caption>
							)}
						</SectionCard>
					) : (
						<SectionCard
							title={meta.title}
							subtitle={meta.subtitle}
							density="compact"
						>
							{view === 'family' ? (
								<SpectrumFamilyPanel mainStyleOptions={mainStyleOptions} />
							) : null}
							{view === 'style' ? <SpectrumStylePanel /> : null}
							{view === 'audio' ? <SpectrumAudioPanel /> : null}
							{view === 'fx' ? <SpectrumFxPanel /> : null}
						</SectionCard>
					)}
				</>
			) : null}
		</EditorTabLayout>
	);
}
