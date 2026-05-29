import { useShallow } from 'zustand/react/shallow';
import { Save, RotateCcw } from 'lucide-react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import {
	AUDIO_ROUTING_RANGES,
	FILTER_RANGES,
	IMAGE_EFFECT_RANGES,
	SCANLINE_RANGES
} from '@/config/ranges';
import type { FilterTarget, ScanlineMode } from '@/types/wallpaper';
import {
	CUSTOM_FILTER_LOOK_ID,
	FILTER_LOOK_PRESETS,
	findFilterLookById,
	type FilterLookId
} from '@/features/filterLooks/filterLooks';
import {
	Button,
	Caption,
	EnumButtonGroup as EnumButtons,
	ProfileSlotsEditor,
	SectionCard,
	UI_COLORS,
	ICON_SIZE
} from '@/ui';
import SliderControl from '../../SliderControl';
import ToggleControl from '../../ToggleControl';
import AudioChannelSelector from '../../ui/AudioChannelSelector';
import { AdvancedOnly, useIsSimple } from '../../UIMode';
import { useDialog } from '../../ui/DialogProvider';
import { confirmResetFiltersDefaults } from '../../ui/confirmCritical';

const FILTER_TARGETS: FilterTarget[] = [
	'global-background',
	'background',
	'selected-overlay',
	'logo',
	'spectrum'
];

const FILTER_TARGET_LABELS: Record<FilterTarget, string> = {
	'global-background': 'Global BG',
	background: 'Background Set',
	'selected-overlay': 'Selected Overlay',
	logo: 'Logo',
	spectrum: 'Spectrum'
};

const SCANLINE_MODES: ScanlineMode[] = ['always', 'pulse', 'burst', 'beat'];

const SCANLINE_MODE_LABELS: Record<ScanlineMode, string> = {
	always: 'Always',
	pulse: 'Pulse',
	burst: 'Burst',
	beat: 'Beat'
};

const LOOK_GRADIENTS: Record<FilterLookId, string> = {
	crt: 'linear-gradient(135deg, #22d3ee, #6366f1)',
	vhs: 'linear-gradient(135deg, #64748b, #f59e0b)',
	'cyber-neon': 'linear-gradient(135deg, #06b6d4, #ec4899)',
	'dream-bloom': 'linear-gradient(135deg, #f0abfc, #38bdf8)',
	'monochrome-ink': 'linear-gradient(135deg, #18181b, #71717a)',
	'club-glitch': 'linear-gradient(135deg, #f43f5e, #8b5cf6)',
	'glass-mist': 'linear-gradient(135deg, #bae6fd, #c4b5fd)',
	'infrared-pulse': 'linear-gradient(135deg, #fb923c, #ef4444)',
	[CUSTOM_FILTER_LOOK_ID]: 'linear-gradient(135deg, var(--lwag-accent), var(--editor-tag-bg))'
};

export default function ModernLooksTab({ onReset }: { onReset: () => void }) {
	const isSimple = useIsSimple();
	const primaryVariant = isSimple ? 'macro' : 'compact';
	const t = useT();
	const { confirm } = useDialog();
	const store = useWallpaperStore(
		useShallow(s => ({
			overlays: s.overlays,
			selectedOverlayId: s.selectedOverlayId,
			filterTargets: s.filterTargets,
			activeFilterLookId: s.activeFilterLookId,
			customFilterLookSettings: s.customFilterLookSettings,
			filterOpacity: s.filterOpacity,
			filterBrightness: s.filterBrightness,
			filterContrast: s.filterContrast,
			filterSaturation: s.filterSaturation,
			filterBlur: s.filterBlur,
			filterHueRotate: s.filterHueRotate,
			filterVignette: s.filterVignette,
			filterBloom: s.filterBloom,
			filterLumaThreshold: s.filterLumaThreshold,
			filterLensWarp: s.filterLensWarp,
			filterHeatDistortion: s.filterHeatDistortion,
			rgbShift: s.rgbShift,
			rgbShiftAudioReactive: s.rgbShiftAudioReactive,
			rgbShiftAudioChannel: s.rgbShiftAudioChannel,
			rgbShiftAudioSmoothingEnabled: s.rgbShiftAudioSmoothingEnabled,
			rgbShiftAudioSmoothing: s.rgbShiftAudioSmoothing,
			rgbShiftAudioSensitivity: s.rgbShiftAudioSensitivity,
			noiseIntensity: s.noiseIntensity,
			scanlineIntensity: s.scanlineIntensity,
			scanlineMode: s.scanlineMode,
			scanlineSpacing: s.scanlineSpacing,
			scanlineThickness: s.scanlineThickness,
			looksProfileSlots: s.looksProfileSlots,
			toggleFilterTarget: s.toggleFilterTarget,
			setFilterTargets: s.setFilterTargets,
			resetFiltersToDefaults: s.resetFiltersToDefaults,
			saveCustomFilterLookFromCurrent: s.saveCustomFilterLookFromCurrent,
			applyFilterLook: s.applyFilterLook,
			setFilterOpacity: s.setFilterOpacity,
			setFilterBrightness: s.setFilterBrightness,
			setFilterContrast: s.setFilterContrast,
			setFilterSaturation: s.setFilterSaturation,
			setFilterBlur: s.setFilterBlur,
			setFilterHueRotate: s.setFilterHueRotate,
			setFilterVignette: s.setFilterVignette,
			setFilterBloom: s.setFilterBloom,
			setFilterLumaThreshold: s.setFilterLumaThreshold,
			setFilterLensWarp: s.setFilterLensWarp,
			setFilterHeatDistortion: s.setFilterHeatDistortion,
			setRgbShift: s.setRgbShift,
			setRgbShiftAudioReactive: s.setRgbShiftAudioReactive,
			setRgbShiftAudioChannel: s.setRgbShiftAudioChannel,
			setRgbShiftAudioSmoothingEnabled: s.setRgbShiftAudioSmoothingEnabled,
			setRgbShiftAudioSmoothing: s.setRgbShiftAudioSmoothing,
			setRgbShiftAudioSensitivity: s.setRgbShiftAudioSensitivity,
			setNoiseIntensity: s.setNoiseIntensity,
			setScanlineIntensity: s.setScanlineIntensity,
			setScanlineMode: s.setScanlineMode,
			setScanlineSpacing: s.setScanlineSpacing,
			setScanlineThickness: s.setScanlineThickness,
			loadLooksProfileSlot: s.loadLooksProfileSlot,
			saveLooksProfileSlot: s.saveLooksProfileSlot,
			addLooksProfileSlot: s.addLooksProfileSlot,
			removeLooksProfileSlot: s.removeLooksProfileSlot
		}))
	);
	const selectedOverlay =
		store.overlays.find(
			overlay => overlay.id === store.selectedOverlayId
		) ?? null;
	const availableTargets = selectedOverlay
		? FILTER_TARGETS
		: FILTER_TARGETS.filter(target => target !== 'selected-overlay');
	const allTargetsEnabled = availableTargets.every(target =>
		store.filterTargets.includes(target)
	);
	const customLookPreset = store.customFilterLookSettings
		? findFilterLookById(
				CUSTOM_FILTER_LOOK_ID,
				store.customFilterLookSettings
			)
		: undefined;
	const lookPackButtons = customLookPreset
		? [...FILTER_LOOK_PRESETS, customLookPreset]
		: FILTER_LOOK_PRESETS;

	function toggleTarget(target: FilterTarget) {
		if (target === 'selected-overlay' && !selectedOverlay) return;
		store.toggleFilterTarget(target);
	}

	function toggleAllTargets() {
		if (allTargetsEnabled) {
			store.setFilterTargets(['background']);
			return;
		}
		store.setFilterTargets([...availableTargets]);
	}

	return (
		<div className="flex min-w-0 flex-col gap-1.5">
			<SectionCard
				title={t.label_look_packs}
				subtitle={t.looks_subtitle_preset_first}
				density="compact"
				action={
					<Button
						type="button"
						title={t.hint_save_custom_look}
						onClick={() => store.saveCustomFilterLookFromCurrent()}
						size="sm"
						density="compact"
						variant="primary"
						icon={<Save size={ICON_SIZE.xs} />}
					>
						{t.label_save_custom_look}
					</Button>
				}
			>
				<div className="flex flex-col gap-2">
					{store.activeFilterLookId ? (
						<div
							className="rounded-[var(--editor-radius-md)] border px-2 py-1.5 text-[11px]"
							style={{
								background: UI_COLORS.raised,
								borderColor: UI_COLORS.accentBorder
							}}
						>
							<span style={{ color: UI_COLORS.fgMute }}>
								{t.label_active_look_prefix}{' '}
							</span>
							<strong style={{ color: UI_COLORS.accent }}>
								{findFilterLookById(
									store.activeFilterLookId,
									store.customFilterLookSettings
								)?.name ?? store.activeFilterLookId}
							</strong>
						</div>
					) : null}
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
						{lookPackButtons.map(look => {
							const isActive = store.activeFilterLookId === look.id;
							return (
								<button
									key={look.id}
									type="button"
									onClick={() => store.applyFilterLook(look)}
									className="group flex min-w-0 flex-col overflow-hidden text-left"
									style={{
										borderRadius: 'var(--editor-radius-lg)',
										border: `1px solid ${
											isActive
												? UI_COLORS.accentBorder
												: UI_COLORS.border
										}`,
										background: isActive
											? UI_COLORS.accentSoft
											: UI_COLORS.raised,
										color: UI_COLORS.fg,
										boxShadow: isActive
											? '0 0 0 1px color-mix(in srgb, var(--lwag-accent) 36%, transparent)'
											: 'none'
									}}
								>
									<div
										aria-hidden
										className="m-2 mb-1.5 h-10 rounded-[var(--editor-radius-md)]"
										style={{
											background:
												LOOK_GRADIENTS[look.id] ??
												'linear-gradient(135deg, var(--editor-tag-bg), var(--editor-panel-bg))',
											border: `1px solid ${UI_COLORS.hairline}`
										}}
									/>
									<div className="min-w-0 px-2 pb-2">
										<div
											className="truncate text-[12px] font-semibold"
											style={{
												color: isActive
													? UI_COLORS.accent
													: UI_COLORS.fg
											}}
										>
											{look.id === CUSTOM_FILTER_LOOK_ID
												? t.label_custom_look_name
												: look.name}
										</div>
										<Caption as="div" className="line-clamp-2">
											{look.description}
										</Caption>
									</div>
								</button>
							);
						})}
					</div>
				</div>
			</SectionCard>

			<AdvancedOnly>
				<SectionCard
					title={t.label_filter_target}
					subtitle={t.hint_filter_target}
					density="compact"
					action={
						<Button
							type="button"
							onClick={toggleAllTargets}
							size="sm"
							density="compact"
							variant={allTargetsEnabled ? 'primary' : 'secondary'}
						>
							{t.label_all_layers}
						</Button>
					}
				>
					<div className="flex flex-wrap gap-1">
						{FILTER_TARGETS.map(target => {
							const disabled =
								target === 'selected-overlay' && !selectedOverlay;
							const active = store.filterTargets.includes(target);
							return (
								<Button
									key={target}
									type="button"
									onClick={() => toggleTarget(target)}
									disabled={disabled}
									variant={active ? 'primary' : 'secondary'}
									size="sm"
									density="compact"
									active={active}
								>
									{FILTER_TARGET_LABELS[target]}
								</Button>
							);
						})}
					</div>
				</SectionCard>
			</AdvancedOnly>

			<SectionCard
				title={t.section_appearance}
				subtitle={t.looks_subtitle_tone_basic}
				density="compact"
			>
				<div className="flex flex-col gap-1">
					<SliderControl
						label={t.label_opacity}
						value={store.filterOpacity}
						{...FILTER_RANGES.opacity}
						onChange={store.setFilterOpacity}
						variant={primaryVariant}
					/>
					<SliderControl
						label={t.label_brightness}
						value={store.filterBrightness}
						{...FILTER_RANGES.brightness}
						onChange={store.setFilterBrightness}
						variant={primaryVariant}
					/>
					<SliderControl
						label={t.label_contrast}
						value={store.filterContrast}
						{...FILTER_RANGES.contrast}
						onChange={store.setFilterContrast}
						variant={primaryVariant}
					/>
					<SliderControl
						label={t.label_saturation}
						value={store.filterSaturation}
						{...FILTER_RANGES.saturation}
						onChange={store.setFilterSaturation}
						variant={primaryVariant}
					/>
					<SliderControl
						label={t.label_blur}
						value={store.filterBlur}
						{...FILTER_RANGES.blur}
						onChange={store.setFilterBlur}
						unit="px"
					/>
					<SliderControl
						label={t.label_hue_rotate}
						value={store.filterHueRotate}
						{...FILTER_RANGES.hueRotate}
						onChange={store.setFilterHueRotate}
						unit="deg"
					/>
				</div>
			</SectionCard>

			<AdvancedOnly>
				<SectionCard title={t.looks_section_glitch} density="compact">
					<div className="flex flex-col gap-1">
						<SliderControl
							label={t.label_rgb_shift}
							value={store.rgbShift}
							{...IMAGE_EFFECT_RANGES.rgbShift}
							onChange={store.setRgbShift}
						/>
						<ToggleControl
							label={t.label_rgb_shift_audio_reactive}
							value={store.rgbShiftAudioReactive}
							onChange={store.setRgbShiftAudioReactive}
						/>
						{store.rgbShiftAudioReactive ? (
							<>
								<AudioChannelSelector
									value={store.rgbShiftAudioChannel}
									onChange={store.setRgbShiftAudioChannel}
								/>
								<ToggleControl
									label={t.label_smoothing}
									value={store.rgbShiftAudioSmoothingEnabled}
									onChange={store.setRgbShiftAudioSmoothingEnabled}
								/>
								{store.rgbShiftAudioSmoothingEnabled ? (
									<SliderControl
										label={t.label_smoothing_amount}
										value={store.rgbShiftAudioSmoothing}
										{...AUDIO_ROUTING_RANGES.selectedChannelSmoothing}
										onChange={store.setRgbShiftAudioSmoothing}
									/>
								) : null}
								<SliderControl
									label={t.label_rgb_shift_audio_sensitivity}
									value={store.rgbShiftAudioSensitivity}
									{...IMAGE_EFFECT_RANGES.rgbAudioSensitivity}
									onChange={store.setRgbShiftAudioSensitivity}
								/>
							</>
						) : null}
						<SliderControl
							label={t.label_noise_intensity}
							value={store.noiseIntensity}
							{...IMAGE_EFFECT_RANGES.noiseIntensity}
							onChange={store.setNoiseIntensity}
						/>
					</div>
				</SectionCard>
			</AdvancedOnly>

			<AdvancedOnly>
				<SectionCard title={t.looks_section_cinematic} density="compact">
					<div className="flex flex-col gap-1">
						<SliderControl
							label="Vignette"
							value={store.filterVignette}
							{...FILTER_RANGES.vignette}
							onChange={store.setFilterVignette}
						/>
						<SliderControl
							label="Bloom"
							value={store.filterBloom}
							{...FILTER_RANGES.bloom}
							onChange={store.setFilterBloom}
						/>
						<SliderControl
							label="Luma Threshold"
							value={store.filterLumaThreshold}
							{...FILTER_RANGES.lumaThreshold}
							onChange={store.setFilterLumaThreshold}
						/>
						<SliderControl
							label="Lens Warp"
							value={store.filterLensWarp}
							{...FILTER_RANGES.lensWarp}
							onChange={store.setFilterLensWarp}
						/>
						<SliderControl
							label="Heat Distortion"
							value={store.filterHeatDistortion}
							{...FILTER_RANGES.heatDistortion}
							onChange={store.setFilterHeatDistortion}
						/>
					</div>
				</SectionCard>
			</AdvancedOnly>

			<AdvancedOnly>
				<SectionCard title={t.label_scanlines} density="compact">
					<div className="flex flex-col gap-1">
						<SliderControl
							label={t.label_scanlines}
							value={store.scanlineIntensity}
							{...SCANLINE_RANGES.intensity}
							onChange={store.setScanlineIntensity}
						/>
						{store.scanlineIntensity > 0 ? (
							<>
								<div className="flex flex-col gap-1">
									<span
										className="text-xs"
										style={{ color: UI_COLORS.fgMute }}
									>
										{t.label_scanline_mode}
									</span>
									<EnumButtons<ScanlineMode>
										options={SCANLINE_MODES}
										value={store.scanlineMode}
										onChange={store.setScanlineMode}
										labels={SCANLINE_MODE_LABELS}
									/>
								</div>
								<SliderControl
									label={t.label_spacing}
									value={store.scanlineSpacing}
									{...SCANLINE_RANGES.spacing}
									onChange={store.setScanlineSpacing}
								/>
								<SliderControl
									label={t.label_thickness}
									value={store.scanlineThickness}
									{...SCANLINE_RANGES.thickness}
									onChange={store.setScanlineThickness}
								/>
							</>
						) : null}
					</div>
				</SectionCard>
			</AdvancedOnly>

			<SectionCard
				title={t.section_saved_profiles}
				subtitle={t.hint_saved_profiles}
				density="compact"
			>
				<ProfileSlotsEditor
					title={t.section_saved_profiles}
					hint={t.hint_saved_profiles}
					slots={store.looksProfileSlots}
					activeIndex={null}
					onLoad={store.loadLooksProfileSlot}
					onSave={store.saveLooksProfileSlot}
					onAdd={store.addLooksProfileSlot}
					onDelete={store.removeLooksProfileSlot}
					loadLabel={t.label_load_profile}
					saveLabel={t.label_save_profile}
					slotLabel={t.label_profile_slot}
					emptyLabel={t.profile_slot_empty}
					activeLabel={t.profile_slot_active}
				/>
			</SectionCard>

			<SectionCard title={t.looks_section_reset} density="compact">
				<div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
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
								if (!(await confirmResetFiltersDefaults(confirm, t))) {
									return;
								}
								store.resetFiltersToDefaults();
							})()
						}
						size="sm"
						density="compact"
						variant="warning"
						icon={<RotateCcw size={ICON_SIZE.xs} />}
					>
						{t.label_reset_filters_only}
					</Button>
				</div>
			</SectionCard>
		</div>
	);
}
