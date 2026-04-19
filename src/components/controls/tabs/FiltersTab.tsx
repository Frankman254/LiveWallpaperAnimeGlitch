import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import {
	AUDIO_ROUTING_RANGES,
	FILTER_RANGES,
	IMAGE_EFFECT_RANGES,
	SCANLINE_RANGES
} from '@/config/ranges';
import type { FilterTarget, ScanlineMode } from '@/types/wallpaper';
import SliderControl from '../SliderControl';
import ToggleControl from '../ToggleControl';
import EnumButtons from '../ui/EnumButtons';
import ResetButton from '../ui/ResetButton';
import SectionDivider from '../ui/SectionDivider';
import AudioChannelSelector from '../ui/AudioChannelSelector';
import CollapsibleSection from '../ui/CollapsibleSection';
import ProfileSlotsEditor from '../ui/ProfileSlotsEditor';
import {
	CUSTOM_FILTER_LOOK_ID,
	FILTER_LOOK_PRESETS,
	findFilterLookById
} from '@/features/filterLooks/filterLooks';

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

export default function FiltersTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const store = useWallpaperStore();
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

	const customLookPreset = store.customFilterLookSettings
		? findFilterLookById(
				CUSTOM_FILTER_LOOK_ID,
				store.customFilterLookSettings
			)
		: undefined;
	const lookPackButtons = customLookPreset
		? [...FILTER_LOOK_PRESETS, customLookPreset]
		: FILTER_LOOK_PRESETS;

	return (
		<>
			<div className="flex flex-col gap-2">
				<ResetButton label={t.reset_tab} onClick={onReset} />
				<button
					type="button"
					onClick={() => store.resetFiltersToDefaults()}
					className="rounded border px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/5"
					style={{
						borderColor: 'var(--editor-accent-border)',
						background: 'var(--editor-tag-bg)',
						color: 'var(--editor-tag-fg)'
					}}
				>
					{t.label_reset_filters_only}
				</button>
			</div>

			<SectionDivider label={t.label_look_packs} />
			<div className="flex flex-col gap-2">
				<button
					type="button"
					title={t.hint_save_custom_look}
					onClick={() => store.saveCustomFilterLookFromCurrent()}
					className="rounded border px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/5"
					style={{
						borderColor: 'var(--editor-accent-border)',
						background: 'var(--editor-tag-bg)',
						color: 'var(--editor-tag-fg)'
					}}
				>
					{t.label_save_custom_look}
				</button>
				{store.activeFilterLookId ? (
					<div
						className="rounded-md px-3 py-1.5 text-[11px]"
						style={{
							background: 'var(--editor-surface-bg)',
							border: '1px solid var(--editor-accent-border)',
							opacity: 0.95
						}}
					>
						<span style={{ color: 'var(--editor-accent-muted)' }}>
							{t.label_active_look_prefix}{' '}
						</span>
						<strong style={{ color: 'var(--editor-accent-soft)' }}>
							{findFilterLookById(
								store.activeFilterLookId,
								store.customFilterLookSettings
							)?.name ?? store.activeFilterLookId}
						</strong>
					</div>
				) : null}
				<div className="grid grid-cols-2 gap-2">
					{lookPackButtons.map(look => {
						const isActive = store.activeFilterLookId === look.id;
						return (
							<button
								key={look.id}
								type="button"
								onClick={() => store.applyFilterLook(look)}
								className="rounded border p-2 text-left transition-colors hover:bg-white/5"
								style={{
									borderColor: isActive
										? 'var(--editor-accent-color)'
										: 'var(--editor-accent-border)',
									background: isActive
										? 'var(--editor-surface-bg)'
										: 'var(--editor-bg)',
									boxShadow: isActive
										? '0 0 0 1px color-mix(in srgb, var(--editor-accent-color) 55%, transparent), 0 4px 14px color-mix(in srgb, var(--editor-accent-color) 18%, transparent)'
										: 'inset 0 0 0 1px color-mix(in srgb, var(--editor-accent-color) 22%, transparent)'
								}}
							>
								<div
									className="text-xs font-semibold"
									style={{
										color: 'var(--editor-accent-fg)',
										opacity: isActive ? 1 : 0.92
									}}
								>
									{look.id === CUSTOM_FILTER_LOOK_ID
										? t.label_custom_look_name
										: look.name}
								</div>
								<div
									className="text-[10px] leading-snug"
									style={{ color: 'var(--editor-accent-muted)' }}
								>
									{look.description}
								</div>
							</button>
						);
					})}
				</div>
			</div>

			<SectionDivider label={t.tab_filters} />
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between gap-2">
					<span
						className="text-xs"
						title={t.hint_filter_target}
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						{t.label_filter_target}
					</span>
					<button
						type="button"
						onClick={toggleAllTargets}
						className="rounded border px-2 py-1 text-[11px] transition-colors"
						style={
							allTargetsEnabled
								? {
										background: 'var(--editor-active-bg)',
										borderColor: 'var(--editor-tag-border)',
										color: 'var(--editor-active-fg)'
									}
								: {
										background: 'var(--editor-tag-bg)',
										borderColor: 'var(--editor-tag-border)',
										color: 'var(--editor-tag-fg)'
									}
						}
					>
						{t.label_all_layers}
					</button>
				</div>
				<div className="flex flex-wrap gap-1">
					{FILTER_TARGETS.map(target => {
						const disabled =
							target === 'selected-overlay' && !selectedOverlay;
						const active = store.filterTargets.includes(target);
						return (
							<button
								key={target}
								type="button"
								onClick={() => toggleTarget(target)}
								disabled={disabled}
								className="rounded border px-2 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-35"
								style={
									active
										? {
												background: 'var(--editor-active-bg)',
												borderColor:
													'var(--editor-tag-border)',
												color: 'var(--editor-active-fg)'
											}
										: {
												background:
													'var(--editor-tag-bg)',
												borderColor:
													'var(--editor-tag-border)',
												color: 'var(--editor-tag-fg)'
											}
								}
							>
								{FILTER_TARGET_LABELS[target]}
							</button>
						);
					})}
				</div>
			</div>

			<SectionDivider label={t.section_appearance} />
			<CollapsibleSection label="Tone" defaultOpen>
				<SliderControl
					label={t.label_opacity}
					value={store.filterOpacity}
					{...FILTER_RANGES.opacity}
					onChange={store.setFilterOpacity}
				/>
				<SliderControl
					label={t.label_brightness}
					value={store.filterBrightness}
					{...FILTER_RANGES.brightness}
					onChange={store.setFilterBrightness}
				/>
				<SliderControl
					label={t.label_contrast}
					value={store.filterContrast}
					{...FILTER_RANGES.contrast}
					onChange={store.setFilterContrast}
				/>
				<SliderControl
					label={t.label_saturation}
					value={store.filterSaturation}
					{...FILTER_RANGES.saturation}
					onChange={store.setFilterSaturation}
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
			</CollapsibleSection>

			<CollapsibleSection label="Glitch" defaultOpen={false}>
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
				{store.rgbShiftAudioReactive && (
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
				)}
				<SliderControl
					label={t.label_noise_intensity}
					value={store.noiseIntensity}
					{...IMAGE_EFFECT_RANGES.noiseIntensity}
					onChange={store.setNoiseIntensity}
				/>
			</CollapsibleSection>

			<CollapsibleSection label="Cinematic FX" defaultOpen={false}>
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
			</CollapsibleSection>

			<CollapsibleSection label={t.label_scanlines} defaultOpen={false}>
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
								style={{ color: 'var(--editor-accent-soft)' }}
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
			</CollapsibleSection>

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
		</>
	);
}
