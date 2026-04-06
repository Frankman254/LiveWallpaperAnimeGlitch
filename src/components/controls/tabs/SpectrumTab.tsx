import type { ReactNode } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { AUDIO_ROUTING_RANGES, SPECTRUM_RANGES } from '@/config/ranges';
import {
	doProfileSettingsMatch,
	extractSpectrumProfileSettings
} from '@/lib/featureProfiles';
import type {
	SpectrumColorMode,
	SpectrumLinearDirection,
	SpectrumLinearOrientation,
	SpectrumMode,
	SpectrumRadialShape,
	SpectrumShape
} from '@/types/wallpaper';
import {
	SPECTRUM_COLOR_MODES,
	SPECTRUM_LINEAR_DIRECTION_LABELS,
	SPECTRUM_LINEAR_DIRECTIONS,
	SPECTRUM_LINEAR_ORIENTATION_LABELS,
	SPECTRUM_LINEAR_ORIENTATIONS,
	SPECTRUM_MODE_LABELS,
	SPECTRUM_MODES,
	SPECTRUM_RADIAL_SHAPE_LABELS,
	SPECTRUM_RADIAL_SHAPES,
	SPECTRUM_STYLES
} from '@/features/spectrum/spectrumControlConfig';
import SliderControl from '../SliderControl';
import ToggleControl from '../ToggleControl';
import EnumButtons from '../ui/EnumButtons';
import ColorInput from '../ui/ColorInput';
import ResetButton from '../ui/ResetButton';
import AudioChannelSelector from '../ui/AudioChannelSelector';
import ProfileSlotsEditor from '../ui/ProfileSlotsEditor';
import TabSection from '../ui/TabSection';
import { useDialog } from '../ui/DialogProvider';

type RotationDirectionOption = 'clockwise' | 'counterclockwise';

const ROTATION_DIRECTIONS: RotationDirectionOption[] = [
	'clockwise',
	'counterclockwise'
];

function SpectrumGroup({
	title,
	accent = 'default',
	children
}: {
	title: string;
	accent?: 'default' | 'clone';
	children: ReactNode;
}) {
	const classes =
		accent === 'clone'
			? 'border-fuchsia-500/30 bg-fuchsia-500/5'
			: 'border-white/10 bg-black/10';

	return (
		<div className={`rounded-md border p-2 ${classes}`}>
			<div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
				{title}
			</div>
			<div className="flex flex-col gap-2">{children}</div>
		</div>
	);
}

function getRotationDirection(
	value: number
): RotationDirectionOption {
	return value < 0 ? 'counterclockwise' : 'clockwise';
}

function applyRotationDirection(
	speed: number,
	direction: RotationDirectionOption
): number {
	const magnitude = Math.abs(speed);
	return direction === 'counterclockwise' ? -magnitude : magnitude;
}

function SpectrumStyleSelector({
	label,
	value,
	onChange
}: {
	label: string;
	value: SpectrumShape;
	onChange: (value: SpectrumShape) => void;
}) {
	return (
		<div className="flex flex-col gap-1">
			<span className="text-xs text-cyan-400">{label}</span>
			<EnumButtons<SpectrumShape>
				options={SPECTRUM_STYLES}
				value={value}
				onChange={onChange}
			/>
		</div>
	);
}

function SpectrumColorControls({
	label,
	colorMode,
	onColorModeChange,
	primaryColor,
	onPrimaryColorChange,
	primaryLabel,
	secondaryColor,
	onSecondaryColorChange,
	secondaryLabel
}: {
	label: string;
	colorMode: SpectrumColorMode;
	onColorModeChange: (value: SpectrumColorMode) => void;
	primaryColor: string;
	onPrimaryColorChange: (value: string) => void;
	primaryLabel: string;
	secondaryColor: string;
	onSecondaryColorChange: (value: string) => void;
	secondaryLabel: string;
}) {
	return (
		<>
			<div className="flex flex-col gap-1">
				<span className="text-xs text-cyan-400">{label}</span>
				<EnumButtons<SpectrumColorMode>
					options={SPECTRUM_COLOR_MODES}
					value={colorMode}
					onChange={onColorModeChange}
				/>
			</div>
			<ColorInput
				label={primaryLabel}
				value={primaryColor}
				onChange={onPrimaryColorChange}
			/>
			{colorMode !== 'solid' ? (
				<ColorInput
					label={secondaryLabel}
					value={secondaryColor}
					onChange={onSecondaryColorChange}
				/>
			) : null}
		</>
	);
}

export default function SpectrumTab({ onReset }: { onReset: () => void }) {
	const t = useT();
	const store = useWallpaperStore();
	const { confirm } = useDialog();
	const isRadial = store.spectrumMode === 'radial';
	const cloneSectionVisible = !isRadial;
	const cloneEnabled = cloneSectionVisible && store.spectrumCircularClone;
	const canMoveMainSpectrum =
		!isRadial || !store.spectrumFollowLogo || !store.logoEnabled;
	const currentProfileSettings = extractSpectrumProfileSettings(store);
	const activeProfileIndex = store.spectrumProfileSlots.findIndex(slot =>
		doProfileSettingsMatch(currentProfileSettings, slot.values)
	);
	const mainRotationDirection = getRotationDirection(
		store.spectrumRotationSpeed
	);
	const cloneRotationDirection = getRotationDirection(
		store.spectrumCloneRotationSpeed
	);

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

	return (
		<>
			<ResetButton label={t.reset_tab} onClick={onReset} />

			<TabSection
				title={t.section_spectrum_profiles}
				hint={t.hint_editor_diag_spectrum}
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
				/>
			</TabSection>

			<TabSection title={t.section_spectrum_main}>
				<div className="flex flex-col gap-2 xl:grid xl:grid-cols-2">
					<SpectrumGroup title={t.section_geometry_layout}>
						<div className="flex flex-col gap-1">
							<span className="text-xs text-cyan-400">
								{t.label_spectrum_mode}
							</span>
							<EnumButtons<SpectrumMode>
								options={SPECTRUM_MODES}
								value={store.spectrumMode}
								onChange={store.setSpectrumMode}
								labels={SPECTRUM_MODE_LABELS}
							/>
						</div>

						<SpectrumStyleSelector
							label={t.label_spectrum_style}
							value={store.spectrumShape}
							onChange={store.setSpectrumShape}
						/>

						{isRadial ? (
							<>
								<ToggleControl
									label={t.label_follow_logo}
									value={store.spectrumFollowLogo}
									onChange={store.setSpectrumFollowLogo}
								/>
								<div className="flex flex-col gap-1">
									<span className="text-xs text-cyan-400">
										{t.label_radial_shape}
									</span>
									<EnumButtons<SpectrumRadialShape>
										options={SPECTRUM_RADIAL_SHAPES}
										value={store.spectrumRadialShape}
										onChange={store.setSpectrumRadialShape}
										labels={SPECTRUM_RADIAL_SHAPE_LABELS}
									/>
								</div>
								<SliderControl
									label={t.label_radial_angle}
									value={store.spectrumRadialAngle}
									{...SPECTRUM_RANGES.radialAngle}
									onChange={store.setSpectrumRadialAngle}
									unit="deg"
								/>
								{store.spectrumFollowLogo ? (
									<>
										<ToggleControl
											label={t.label_fit_around_logo}
											value={store.spectrumRadialFitLogo}
											onChange={
												store.setSpectrumRadialFitLogo
											}
											tooltip={t.hint_fit_around_logo}
										/>
										<SliderControl
											label={t.label_logo_gap}
											value={store.spectrumLogoGap}
											{...SPECTRUM_RANGES.logoGap}
											onChange={store.setSpectrumLogoGap}
											unit="px"
										/>
									</>
								) : (
									<SliderControl
										label={t.label_inner_radius}
										value={store.spectrumInnerRadius}
										{...SPECTRUM_RANGES.innerRadius}
										onChange={store.setSpectrumInnerRadius}
									/>
								)}
							</>
						) : (
							<>
								<div className="flex flex-col gap-1">
									<span className="text-xs text-cyan-400">
										{t.label_spectrum_orientation}
									</span>
									<EnumButtons<SpectrumLinearOrientation>
										options={SPECTRUM_LINEAR_ORIENTATIONS}
										value={store.spectrumLinearOrientation}
										onChange={
											store.setSpectrumLinearOrientation
										}
										labels={
											SPECTRUM_LINEAR_ORIENTATION_LABELS
										}
									/>
								</div>
								<div className="flex flex-col gap-1">
									<span className="text-xs text-cyan-400">
										{t.label_linear_direction}
									</span>
									<EnumButtons<SpectrumLinearDirection>
										options={SPECTRUM_LINEAR_DIRECTIONS}
										value={store.spectrumLinearDirection}
										onChange={
											store.setSpectrumLinearDirection
										}
										labels={SPECTRUM_LINEAR_DIRECTION_LABELS}
									/>
								</div>
								<SliderControl
									label={t.label_spectrum_span}
									value={store.spectrumSpan}
									{...SPECTRUM_RANGES.span}
									onChange={store.setSpectrumSpan}
								/>
							</>
						)}

						{canMoveMainSpectrum ? (
							<div className="grid grid-cols-2 gap-2">
								<SliderControl
									label={t.label_position_x}
									value={store.spectrumPositionX}
									{...SPECTRUM_RANGES.positionX}
									onChange={store.setSpectrumPositionX}
								/>
								<SliderControl
									label={t.label_position_y}
									value={store.spectrumPositionY}
									{...SPECTRUM_RANGES.positionY}
									onChange={store.setSpectrumPositionY}
								/>
							</div>
						) : null}
					</SpectrumGroup>

					<SpectrumGroup title={t.section_audio_color}>
						<AudioChannelSelector
							value={store.spectrumBandMode}
							onChange={store.setSpectrumBandMode}
							label={t.label_band_mode}
						/>
						<ToggleControl
							label={t.label_smoothing}
							value={store.spectrumAudioSmoothingEnabled}
							onChange={store.setSpectrumAudioSmoothingEnabled}
						/>
						{store.spectrumAudioSmoothingEnabled ? (
							<SliderControl
								label={t.label_smoothing_amount}
								value={store.spectrumAudioSmoothing}
								{...AUDIO_ROUTING_RANGES.selectedChannelSmoothing}
								onChange={store.setSpectrumAudioSmoothing}
							/>
						) : null}
						<SpectrumColorControls
							label={t.label_color_mode}
							colorMode={store.spectrumColorMode}
							onColorModeChange={store.setSpectrumColorMode}
							primaryColor={store.spectrumPrimaryColor}
							onPrimaryColorChange={store.setSpectrumPrimaryColor}
							primaryLabel={t.label_primary_color}
							secondaryColor={store.spectrumSecondaryColor}
							onSecondaryColorChange={
								store.setSpectrumSecondaryColor
							}
							secondaryLabel={t.label_secondary_color}
						/>
					</SpectrumGroup>

					<SpectrumGroup title={t.section_size_surface}>
						<div className="grid grid-cols-2 gap-2">
							<SliderControl
								label={t.label_bar_count}
								value={store.spectrumBarCount}
								{...SPECTRUM_RANGES.barCount}
								onChange={store.setSpectrumBarCount}
							/>
							<SliderControl
								label={t.label_bar_width}
								value={store.spectrumBarWidth}
								{...SPECTRUM_RANGES.barWidth}
								onChange={store.setSpectrumBarWidth}
							/>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<SliderControl
								label={t.label_min_height}
								value={store.spectrumMinHeight}
								{...SPECTRUM_RANGES.minHeight}
								onChange={store.setSpectrumMinHeight}
							/>
							<SliderControl
								label={t.label_max_height}
								value={store.spectrumMaxHeight}
								{...SPECTRUM_RANGES.maxHeight}
								onChange={store.setSpectrumMaxHeight}
							/>
						</div>
						<SliderControl
							label={t.label_opacity}
							value={store.spectrumOpacity}
							{...SPECTRUM_RANGES.opacity}
							onChange={store.setSpectrumOpacity}
						/>
						{store.spectrumShape === 'wave' ? (
							<SliderControl
								label={t.label_wave_fill_opacity}
								value={store.spectrumWaveFillOpacity}
								{...SPECTRUM_RANGES.waveFillOpacity}
								onChange={store.setSpectrumWaveFillOpacity}
							/>
						) : null}
					</SpectrumGroup>

					<SpectrumGroup title={t.section_motion_finish}>
						<SliderControl
							label={t.label_visual_smoothing}
							value={store.spectrumSmoothing}
							{...SPECTRUM_RANGES.smoothing}
							onChange={store.setSpectrumSmoothing}
						/>
						{isRadial ? (
							<>
								<div className="flex flex-col gap-1">
									<span className="text-xs text-cyan-400">
										{t.label_direction}
									</span>
									<EnumButtons<RotationDirectionOption>
										options={ROTATION_DIRECTIONS}
										value={mainRotationDirection}
										onChange={value =>
											store.setSpectrumRotationSpeed(
												applyRotationDirection(
													store.spectrumRotationSpeed,
													value
												)
											)
										}
										labels={{
											clockwise: t.label_clockwise,
											counterclockwise:
												t.label_counterclockwise
										}}
									/>
								</div>
								<SliderControl
									label={t.label_rotation_speed}
									value={Math.abs(store.spectrumRotationSpeed)}
									{...{
										...SPECTRUM_RANGES.rotationSpeed,
										min: 0
									}}
									onChange={value =>
										store.setSpectrumRotationSpeed(
											applyRotationDirection(
												value,
												mainRotationDirection
											)
										)
									}
								/>
							</>
						) : null}
						<ToggleControl
							label={
								isRadial ? t.label_mirror_sym : t.label_mirror_ud
							}
							value={store.spectrumMirror}
							onChange={store.setSpectrumMirror}
						/>
						<ToggleControl
							label={t.label_peak_hold}
							value={store.spectrumPeakHold}
							onChange={store.setSpectrumPeakHold}
						/>
						{store.spectrumPeakHold ? (
							<SliderControl
								label={t.label_peak_decay}
								value={store.spectrumPeakDecay}
								{...SPECTRUM_RANGES.peakDecay}
								onChange={store.setSpectrumPeakDecay}
							/>
						) : null}
						<div className="grid grid-cols-2 gap-2">
							<SliderControl
								label={t.label_glow}
								value={store.spectrumGlowIntensity}
								{...SPECTRUM_RANGES.glowIntensity}
								onChange={store.setSpectrumGlowIntensity}
							/>
							<SliderControl
								label={t.label_shadow_blur}
								value={store.spectrumShadowBlur}
								{...SPECTRUM_RANGES.shadowBlur}
								onChange={store.setSpectrumShadowBlur}
							/>
						</div>
					</SpectrumGroup>
				</div>
			</TabSection>

			{cloneSectionVisible ? (
				<TabSection
					title={t.section_spectrum_clone}
					hint={t.hint_spectrum_clone_section}
				>
					<div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/5 p-2">
						<ToggleControl
							label={t.label_circular_clone}
							value={store.spectrumCircularClone}
							onChange={store.setSpectrumCircularClone}
							tooltip={t.hint_circular_clone}
						/>

						{cloneEnabled ? (
							<div className="mt-2 flex flex-col gap-2 xl:grid xl:grid-cols-2">
							<SpectrumGroup
								title={t.section_geometry_layout}
								accent="clone"
							>
								<SpectrumStyleSelector
									label={t.label_clone_style}
									value={store.spectrumCloneStyle}
									onChange={store.setSpectrumCloneStyle}
								/>
								<div className="flex flex-col gap-1">
									<span className="text-xs text-cyan-400">
										{t.label_clone_shape}
									</span>
									<EnumButtons<SpectrumRadialShape>
										options={SPECTRUM_RADIAL_SHAPES}
										value={store.spectrumCloneRadialShape}
										onChange={
											store.setSpectrumCloneRadialShape
										}
										labels={SPECTRUM_RADIAL_SHAPE_LABELS}
									/>
								</div>
								<SliderControl
									label={t.label_clone_angle}
									value={store.spectrumCloneRadialAngle}
									{...SPECTRUM_RANGES.cloneRadialAngle}
									onChange={store.setSpectrumCloneRadialAngle}
									unit="deg"
								/>
								<div className="grid grid-cols-2 gap-2">
									<SliderControl
										label={t.label_clone_gap}
										value={store.spectrumCloneGap}
										{...SPECTRUM_RANGES.cloneGap}
										onChange={store.setSpectrumCloneGap}
										unit="px"
									/>
									<SliderControl
										label={t.label_clone_scale}
										value={store.spectrumCloneScale}
										{...SPECTRUM_RANGES.cloneScale}
										onChange={store.setSpectrumCloneScale}
									/>
								</div>
							</SpectrumGroup>

							<SpectrumGroup
								title={t.section_audio_color}
								accent="clone"
							>
								<AudioChannelSelector
									value={store.spectrumCloneBandMode}
									onChange={store.setSpectrumCloneBandMode}
									label={t.label_band_mode}
								/>
								<ToggleControl
									label={t.label_smoothing}
									value={store.spectrumCloneAudioSmoothingEnabled}
									onChange={
										store.setSpectrumCloneAudioSmoothingEnabled
									}
								/>
								{store.spectrumCloneAudioSmoothingEnabled ? (
									<SliderControl
										label={t.label_smoothing_amount}
										value={store.spectrumCloneAudioSmoothing}
										{...AUDIO_ROUTING_RANGES.selectedChannelSmoothing}
										onChange={
											store.setSpectrumCloneAudioSmoothing
										}
									/>
								) : null}
								<SpectrumColorControls
									label={t.label_clone_color_mode}
									colorMode={store.spectrumCloneColorMode}
									onColorModeChange={
										store.setSpectrumCloneColorMode
									}
									primaryColor={store.spectrumClonePrimaryColor}
									onPrimaryColorChange={
										store.setSpectrumClonePrimaryColor
									}
									primaryLabel={t.label_clone_primary_color}
									secondaryColor={
										store.spectrumCloneSecondaryColor
									}
									onSecondaryColorChange={
										store.setSpectrumCloneSecondaryColor
									}
									secondaryLabel={t.label_clone_secondary_color}
								/>
							</SpectrumGroup>

							<SpectrumGroup
								title={t.section_size_surface}
								accent="clone"
							>
								<div className="grid grid-cols-2 gap-2">
									<SliderControl
										label={t.label_clone_bar_count}
										value={store.spectrumCloneBarCount}
										{...SPECTRUM_RANGES.cloneBarCount}
										onChange={store.setSpectrumCloneBarCount}
									/>
									<SliderControl
										label={t.label_clone_bar_width}
										value={store.spectrumCloneBarWidth}
										{...SPECTRUM_RANGES.cloneBarWidth}
										onChange={store.setSpectrumCloneBarWidth}
									/>
								</div>
								<div className="grid grid-cols-2 gap-2">
									<SliderControl
										label={t.label_min_height}
										value={store.spectrumCloneMinHeight}
										{...SPECTRUM_RANGES.minHeight}
										onChange={store.setSpectrumCloneMinHeight}
									/>
									<SliderControl
										label={t.label_max_height}
										value={store.spectrumCloneMaxHeight}
										{...SPECTRUM_RANGES.maxHeight}
										onChange={store.setSpectrumCloneMaxHeight}
									/>
								</div>
								<SliderControl
									label={t.label_clone_opacity}
									value={store.spectrumCloneOpacity}
									{...SPECTRUM_RANGES.cloneOpacity}
									onChange={store.setSpectrumCloneOpacity}
								/>
								{store.spectrumCloneStyle === 'wave' ? (
									<SliderControl
										label={t.label_wave_fill_opacity}
										value={store.spectrumCloneWaveFillOpacity}
										{...SPECTRUM_RANGES.cloneWaveFillOpacity}
										onChange={
											store.setSpectrumCloneWaveFillOpacity
										}
									/>
								) : null}
							</SpectrumGroup>

							<SpectrumGroup
								title={t.section_motion_finish}
								accent="clone"
							>
								<SliderControl
									label={t.label_visual_smoothing}
									value={store.spectrumCloneSmoothing}
									{...SPECTRUM_RANGES.smoothing}
									onChange={store.setSpectrumCloneSmoothing}
								/>
								<div className="flex flex-col gap-1">
									<span className="text-xs text-cyan-400">
										{t.label_direction}
									</span>
									<EnumButtons<RotationDirectionOption>
										options={ROTATION_DIRECTIONS}
										value={cloneRotationDirection}
										onChange={value =>
											store.setSpectrumCloneRotationSpeed(
												applyRotationDirection(
													store.spectrumCloneRotationSpeed,
													value
												)
											)
										}
										labels={{
											clockwise: t.label_clockwise,
											counterclockwise:
												t.label_counterclockwise
										}}
									/>
								</div>
								<SliderControl
									label={t.label_rotation_speed}
									value={Math.abs(store.spectrumCloneRotationSpeed)}
									{...{
										...SPECTRUM_RANGES.rotationSpeed,
										min: 0
									}}
									onChange={value =>
										store.setSpectrumCloneRotationSpeed(
											applyRotationDirection(
												value,
												cloneRotationDirection
											)
										)
									}
								/>
								<ToggleControl
									label={t.label_mirror_sym}
									value={store.spectrumCloneMirror}
									onChange={store.setSpectrumCloneMirror}
								/>
								<ToggleControl
									label={t.label_peak_hold}
									value={store.spectrumClonePeakHold}
									onChange={store.setSpectrumClonePeakHold}
								/>
								{store.spectrumClonePeakHold ? (
									<SliderControl
										label={t.label_peak_decay}
										value={store.spectrumClonePeakDecay}
										{...SPECTRUM_RANGES.peakDecay}
										onChange={store.setSpectrumClonePeakDecay}
									/>
								) : null}
								<div className="grid grid-cols-2 gap-2">
									<SliderControl
										label={t.label_glow}
										value={store.spectrumCloneGlowIntensity}
										{...SPECTRUM_RANGES.glowIntensity}
										onChange={
											store.setSpectrumCloneGlowIntensity
										}
									/>
									<SliderControl
										label={t.label_shadow_blur}
										value={store.spectrumCloneShadowBlur}
										{...SPECTRUM_RANGES.shadowBlur}
										onChange={store.setSpectrumCloneShadowBlur}
									/>
								</div>
							</SpectrumGroup>
							</div>
						) : null}
					</div>
				</TabSection>
			) : null}
		</>
	);
}
