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

	return (
		<>
			<ResetButton label={t.reset_tab} onClick={onReset} />

			<SectionDivider label={t.tab_filters} />
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between gap-2">
					<span
						className="text-xs text-cyan-400"
						title={t.hint_filter_target}
					>
						{t.label_filter_target}
					</span>
					<button
						type="button"
						onClick={toggleAllTargets}
						className={`rounded border px-2 py-1 text-[11px] transition-colors ${
							allTargetsEnabled
								? 'border-cyan-300 bg-cyan-300 text-black'
								: 'border-cyan-900 text-cyan-400 hover:border-cyan-500'
						}`}
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
								className={`rounded border px-2 py-1 text-xs transition-colors ${
									active
										? 'border-cyan-300 bg-cyan-300 text-black'
										: 'border-cyan-900 text-cyan-400 hover:border-cyan-500'
								} disabled:cursor-not-allowed disabled:opacity-35`}
							>
								{FILTER_TARGET_LABELS[target]}
							</button>
						);
					})}
				</div>
			</div>

			<SectionDivider label={t.section_appearance} />
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

			<CollapsibleSection label={t.label_rgb_shift} defaultOpen={false}>
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
							<span className="text-xs text-cyan-400">
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
		</>
	);
}
