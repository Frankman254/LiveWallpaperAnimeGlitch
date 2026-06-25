import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
	Headphones,
	Image as ImageIcon,
	Layout,
	Palette,
	RotateCcw,
	Sparkles,
	Wand2
} from 'lucide-react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import type { ColorSourceMode } from '@/types/wallpaper';
import { MAX_SPECTRUM_SLOT_COUNT } from '@/lib/featureProfiles';
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
import {
	SpectrumTargetProvider,
	type SpectrumTarget
} from '../spectrum/SpectrumTargetContext';
import LogoTab from './LogoTab';
import { SpectrumFamilyPanel } from '../spectrum/panels/SpectrumFamilyPanel';
import { SpectrumStylePanel } from '../spectrum/panels/SpectrumStylePanel';
import { SpectrumAudioPanel } from '../spectrum/panels/SpectrumAudioPanel';
import { SpectrumFxPanel } from '../spectrum/panels/SpectrumFxPanel';
import { useSpectrumProfileState } from '../spectrum/useSpectrumProfileState';
import { useIsSimple } from '../../UIMode';

type SpectrumView = 'family' | 'style' | 'audio' | 'fx' | 'logo';

const MODERN_SPECTRUM_VIEW_STORAGE_KEY = 'lwag-modern-spectrum-view';

function isSpectrumView(value: unknown): value is SpectrumView {
	return (
		value === 'family' ||
		value === 'style' ||
		value === 'audio' ||
		value === 'fx' ||
		value === 'logo'
	);
}

function readPersistedView(isSimple: boolean): SpectrumView {
	if (typeof window === 'undefined') return 'family';
	try {
		const value = window.localStorage.getItem(
			MODERN_SPECTRUM_VIEW_STORAGE_KEY
		);
		if (!isSpectrumView(value)) return 'family';
		if (isSimple && value !== 'family' && value !== 'style')
			return 'family';
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
		logo: {
			title: t.tab_logo,
			subtitle: t.spectrum_meta_logo_subtitle
		}
	};
}

const SPECTRUM_TARGET_STORAGE_KEY = 'lwag-modern-spectrum-target';

function readPersistedTarget(): SpectrumTarget {
	if (typeof window === 'undefined') return 'main';
	try {
		const value = window.localStorage.getItem(SPECTRUM_TARGET_STORAGE_KEY);
		return value === 'instance' ? 'instance' : 'main';
	} catch {
		return 'main';
	}
}

export default function SpectrumTab({
	onReset,
	onResetLogo
}: {
	onReset: () => void;
	onResetLogo: () => void;
}) {
	const t = useT();
	const store = useWallpaperStore(
		useShallow(s => ({
			spectrumMode: s.spectrumMode,
			spectrumEnabled: s.spectrumEnabled,
			spectrumMainVisible: s.spectrumMainVisible,
			spectrumInstances: s.spectrumInstances,
			spectrumProfileSlots: s.spectrumProfileSlots,
			spectrumColorSource: s.spectrumColorSource,
			setSpectrumEnabled: s.setSpectrumEnabled,
			setSpectrumMainVisible: s.setSpectrumMainVisible,
			setSpectrumInstanceEnabled: s.setSpectrumInstanceEnabled,
			setSpectrumColorSources: s.setSpectrumColorSources,
			saveSpectrumProfileSlot: s.saveSpectrumProfileSlot,
			loadSpectrumProfileSlot: s.loadSpectrumProfileSlot,
			addSpectrumProfileSlot: s.addSpectrumProfileSlot,
			removeSpectrumProfileSlot: s.removeSpectrumProfileSlot,
			randomizeSpectrum: s.randomizeSpectrum,
			randomizeSpectrumTarget: s.randomizeSpectrumTarget,
			resetSpectrumTarget: s.resetSpectrumTarget,
			recoverAudioOverlays: s.recoverAudioOverlays,
			resetSpectrumToDefaults: s.resetSpectrumToDefaults
		}))
	);
	const { confirm } = useDialog();
	const isSimple = useIsSimple();
	const secondInstance = store.spectrumInstances[0];
	// At least one spectrum must stay visible, so the toggle for the only
	// remaining visible spectrum is locked (use the master switch to hide all).
	const anySpectrumInstanceEnabled = store.spectrumInstances.some(
		instance => instance.enabled
	);
	const otherSpectrumInstanceEnabled = store.spectrumInstances.some(
		instance => instance.id !== secondInstance?.id && instance.enabled
	);
	const sharedSpectrumColorSource = store.spectrumInstances.every(
		instance => instance.spectrumColorSource === store.spectrumColorSource
	)
		? store.spectrumColorSource
		: null;

	const [view, setView] = useState<SpectrumView>(() =>
		readPersistedView(isSimple)
	);
	const [target, setTarget] = useState<SpectrumTarget>(() =>
		readPersistedTarget()
	);
	// Reactive: re-renders the active-profile indicator the moment any
	// profile-relevant setting changes on the currently edited spectrum.
	const { activeProfileIndex } = useSpectrumProfileState(target);

	function handleTargetChange(next: SpectrumTarget) {
		setTarget(next);
		try {
			window.localStorage.setItem(SPECTRUM_TARGET_STORAGE_KEY, next);
		} catch {
			/* localStorage unavailable */
		}
	}

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
		store.saveSpectrumProfileSlot(index, target);
	}

	function handleRandomize(colorSource: ColorSourceMode) {
		store.randomizeSpectrumTarget(target, colorSource);
	}

	async function handleResetTarget() {
		const targetLabel =
			target === 'main'
				? t.spectrum_target_main
				: t.spectrum_target_second;
		const ok = await confirm({
			title: t.spectrum_btn_reset_current,
			message: `${t.spectrum_btn_reset_current} — ${targetLabel}`,
			confirmLabel: t.spectrum_btn_reset_current,
			cancelLabel: t.label_cancel,
			tone: 'warning'
		});
		if (!ok) return;
		store.resetSpectrumTarget(target);
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
					value: 'logo',
					label: t.tab_logo,
					icon: <ImageIcon size={ICON_SIZE.xs} />
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
							label={t.spectrum_color_source_both}
							value={sharedSpectrumColorSource}
							onChange={store.setSpectrumColorSources}
							compact
						/>
					) : (
						<Caption as="p">{t.hint_enable_to_configure}</Caption>
					)}
				</EditorTabHeader>
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
							title={t.spectrum_global_controls_subtitle}
						>
							{t.spectrum_btn_reset_all}
						</Button>
					</EditorTabFooter>
				) : undefined
			}
		>
			{store.spectrumEnabled ? (
				<>
					{/* GLOBAL ZONE — above the target selector. Everything here
					    affects BOTH spectrums (visibility of each is independent
					    but lives here because it is not bound to the edit target). */}
					<SectionCard
						title={t.spectrum_global_controls_title}
						subtitle={t.spectrum_global_controls_subtitle}
						density="compact"
					>
						<Caption as="p">
							{t.spectrum_global_visibility_hint}
						</Caption>
						<div className="mt-1 flex flex-col gap-2">
							<div className="flex items-center justify-between gap-3">
								<div className="min-w-0">
									<div className="text-[12px] font-medium">
										{t.spectrum_target_main}
									</div>
									<Caption as="p">
										{t.spectrum_hint_main_visible}
									</Caption>
								</div>
								<ToggleSwitch
									checked={store.spectrumMainVisible}
									onChange={store.setSpectrumMainVisible}
									size="sm"
									disabled={
										store.spectrumMainVisible &&
										!anySpectrumInstanceEnabled
									}
									ariaLabel={t.spectrum_label_main_visible}
								/>
							</div>
							{secondInstance ? (
								<div className="flex items-center justify-between gap-3">
									<div className="min-w-0">
										<div className="text-[12px] font-medium">
											{t.spectrum_target_second}
										</div>
										<Caption as="p">
											{t.spectrum_hint_second_visible}
										</Caption>
									</div>
									<ToggleSwitch
										checked={secondInstance.enabled}
										onChange={value =>
											store.setSpectrumInstanceEnabled(
												secondInstance.id,
												value
											)
										}
										size="sm"
										disabled={
											secondInstance.enabled &&
											!store.spectrumMainVisible &&
											!otherSpectrumInstanceEnabled
										}
										ariaLabel={
											t.spectrum_label_second_visible
										}
									/>
								</div>
							) : null}
						</div>
					</SectionCard>

					{/* TARGET SELECTOR — the ownership boundary. */}
					<SectionCard
						title={t.spectrum_section_sections}
						subtitle={t.spectrum_sections_subtitle}
						density="compact"
					>
						<SegmentedControl<SpectrumTarget>
							value={target}
							onChange={handleTargetChange}
							options={[
								{
									value: 'main',
									label: t.spectrum_target_main
								},
								{
									value: 'instance',
									label: t.spectrum_target_second
								}
							]}
							size="sm"
							density="compact"
							full
							ariaLabel={t.spectrum_aria_target}
						/>
						<div className="mt-2">
							<div className="text-[12px] font-semibold">
								{target === 'main'
									? t.spectrum_editing_main
									: t.spectrum_editing_second}
							</div>
							<Caption as="p">
								{t.spectrum_target_zone_hint}
							</Caption>
						</div>
						<div className="mt-2">
							<SegmentedControl<SpectrumView>
								value={view}
								onChange={handleViewChange}
								options={viewOptions}
								size="sm"
								density="compact"
								full
								ariaLabel={t.spectrum_aria_sections}
							/>
						</div>
					</SectionCard>

					{view === 'logo' ? (
						<SectionCard
							title={meta.title}
							subtitle={meta.subtitle}
							density="compact"
						>
							<LogoTab onReset={onResetLogo} />
						</SectionCard>
					) : (
						<>
							{/* TARGET ZONE — per-target presets + actions. */}
							{!isSimple ? (
								<SectionCard
									title={`${t.section_spectrum_profiles} — ${
										target === 'main'
											? t.spectrum_target_main
											: t.spectrum_target_second
									}`}
									subtitle={t.spectrum_profiles_subtitle}
									density="compact"
								>
									<ProfileSlotsEditor
										title=""
										hint={t.hint_saved_profiles}
										slots={store.spectrumProfileSlots}
										activeIndex={
											activeProfileIndex >= 0
												? activeProfileIndex
												: null
										}
										onLoad={index =>
											store.loadSpectrumProfileSlot(
												index,
												target
											)
										}
										onSave={index =>
											void handleSaveProfile(index)
										}
										onAdd={store.addSpectrumProfileSlot}
										onDelete={
											store.removeSpectrumProfileSlot
										}
										loadLabel={t.label_load_profile}
										saveLabel={t.label_save_profile}
										slotLabel={t.label_profile_slot}
										emptyLabel={t.profile_slot_empty}
										activeLabel={t.profile_slot_active}
										maxSlots={MAX_SPECTRUM_SLOT_COUNT}
									/>
									<div className="mt-2 flex flex-col gap-1.5">
										<Caption as="p">
											{t.spectrum_quick_subtitle_current}
										</Caption>
										<div className="grid grid-cols-2 gap-1.5">
											<Button
												onClick={() =>
													handleRandomize('manual')
												}
												size="sm"
												density="compact"
												variant="secondary"
												icon={
													<Wand2
														size={ICON_SIZE.xs}
													/>
												}
											>
												{t.spectrum_btn_random_any}
											</Button>
											<Button
												onClick={() =>
													handleRandomize('image')
												}
												size="sm"
												density="compact"
												variant="secondary"
												icon={
													<Wand2
														size={ICON_SIZE.xs}
													/>
												}
											>
												{t.spectrum_btn_random_image}
											</Button>
										</div>
										<Button
											onClick={() =>
												void handleResetTarget()
											}
											size="sm"
											density="compact"
											variant="secondary"
											icon={
												<RotateCcw
													size={ICON_SIZE.xs}
												/>
											}
										>
											{t.spectrum_btn_reset_current}
										</Button>
									</div>
								</SectionCard>
							) : null}

							<SectionCard
								title={`${meta.title} — ${
									target === 'main'
										? t.spectrum_target_main
										: t.spectrum_target_second
								}`}
								subtitle={meta.subtitle}
								density="compact"
							>
								<SpectrumTargetProvider target={target}>
									{view === 'family' ? (
										<SpectrumFamilyPanel />
									) : null}
									{view === 'style' ? (
										<SpectrumStylePanel />
									) : null}
									{view === 'audio' ? (
										<SpectrumAudioPanel />
									) : null}
									{view === 'fx' ? <SpectrumFxPanel /> : null}
								</SpectrumTargetProvider>
							</SectionCard>
						</>
					)}
				</>
			) : null}
		</EditorTabLayout>
	);
}
