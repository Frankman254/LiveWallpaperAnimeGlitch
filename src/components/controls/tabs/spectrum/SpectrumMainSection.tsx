import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { AUDIO_ROUTING_RANGES, SPECTRUM_RANGES } from '@/config/ranges';
import type {
	SpectrumFamily,
	SpectrumLinearDirection,
	SpectrumLinearOrientation,
	SpectrumMode,
	SpectrumRadialShape,
	SpectrumShape
} from '@/types/wallpaper';
import {
	SPECTRUM_FAMILIES,
	SPECTRUM_FAMILY_LABELS,
	SPECTRUM_LINEAR_DIRECTION_LABELS,
	SPECTRUM_LINEAR_DIRECTIONS,
	SPECTRUM_LINEAR_ORIENTATION_LABELS,
	SPECTRUM_LINEAR_ORIENTATIONS,
	SPECTRUM_MODE_LABELS,
	SPECTRUM_MODES,
	SPECTRUM_RADIAL_SHAPE_LABELS,
	SPECTRUM_RADIAL_SHAPES
} from '@/features/spectrum/spectrumControlConfig';
import SliderControl from '../../SliderControl';
import ToggleControl from '../../ToggleControl';
import EnumButtons from '../../ui/EnumButtons';
import AudioChannelSelector from '../../ui/AudioChannelSelector';
import { SpectrumGroup } from './SpectrumGroup';
import { SpectrumStyleSelector } from './SpectrumStyleSelector';
import { SpectrumColorControls } from './SpectrumColorControls';

type RotationDirectionOption = 'clockwise' | 'counterclockwise';

const ROTATION_DIRECTIONS: RotationDirectionOption[] = [
	'clockwise',
	'counterclockwise'
];

function getRotationDirection(value: number): RotationDirectionOption {
	return value < 0 ? 'counterclockwise' : 'clockwise';
}

function applyRotationDirection(
	speed: number,
	direction: RotationDirectionOption
): number {
	const magnitude = Math.abs(speed);
	return direction === 'counterclockwise' ? -magnitude : magnitude;
}

export function SpectrumMainSection({
	isRadial,
	mainStyleOptions,
	canMoveMainSpectrum
}: {
	isRadial: boolean;
	mainStyleOptions: SpectrumShape[];
	canMoveMainSpectrum: boolean;
}) {
	const t = useT();
	const store = useWallpaperStore();
	const mainRotationDirection = getRotationDirection(store.spectrumRotationSpeed);

	const isClassic = store.spectrumFamily === 'classic';

	return (
		<div className="flex flex-col gap-2 xl:grid xl:grid-cols-2">
			<SpectrumGroup title={t.section_geometry_layout}>
				<div className="flex flex-col gap-1">
					<span
						className="text-xs"
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						Family
					</span>
					<EnumButtons<SpectrumFamily>
						options={SPECTRUM_FAMILIES}
						value={store.spectrumFamily}
						onChange={store.setSpectrumFamily}
						labels={SPECTRUM_FAMILY_LABELS}
					/>
				</div>

				{isClassic && (
				<div className="flex flex-col gap-1">
					<span
						className="text-xs"
						style={{ color: 'var(--editor-accent-soft)' }}
					>
						{t.label_spectrum_mode}
					</span>
					<EnumButtons<SpectrumMode>
						options={SPECTRUM_MODES}
						value={store.spectrumMode}
						onChange={store.setSpectrumMode}
						labels={SPECTRUM_MODE_LABELS}
					/>
				</div>
				)}

				{isClassic && (
				<SpectrumStyleSelector
					label={t.label_spectrum_style}
					options={mainStyleOptions}
					value={store.spectrumShape}
					onChange={store.setSpectrumShape}
				/>
				)}

				{isClassic && isRadial && (
					<>
						<ToggleControl
							label={t.label_follow_logo}
							value={store.spectrumFollowLogo}
							onChange={store.setSpectrumFollowLogo}
						/>
						<div className="flex flex-col gap-1">
							<span
								className="text-xs"
								style={{ color: 'var(--editor-accent-soft)' }}
							>
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
									onChange={store.setSpectrumRadialFitLogo}
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
				)}

				{isClassic && !isRadial && (
					<>
						<div className="flex flex-col gap-1">
							<span
								className="text-xs"
								style={{ color: 'var(--editor-accent-soft)' }}
							>
								{t.label_spectrum_orientation}
							</span>
							<EnumButtons<SpectrumLinearOrientation>
								options={SPECTRUM_LINEAR_ORIENTATIONS}
								value={store.spectrumLinearOrientation}
								onChange={store.setSpectrumLinearOrientation}
								labels={SPECTRUM_LINEAR_ORIENTATION_LABELS}
							/>
						</div>
						<div className="flex flex-col gap-1">
							<span
								className="text-xs"
								style={{ color: 'var(--editor-accent-soft)' }}
							>
								{t.label_linear_direction}
							</span>
							<EnumButtons<SpectrumLinearDirection>
								options={SPECTRUM_LINEAR_DIRECTIONS}
								value={store.spectrumLinearDirection}
								onChange={store.setSpectrumLinearDirection}
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
					source={store.spectrumColorSource}
					onSourceChange={store.setSpectrumColorSource}
					colorMode={store.spectrumColorMode}
					onColorModeChange={store.setSpectrumColorMode}
					primaryColor={store.spectrumPrimaryColor}
					onPrimaryColorChange={store.setSpectrumPrimaryColor}
					primaryLabel={t.label_primary_color}
					secondaryColor={store.spectrumSecondaryColor}
					onSecondaryColorChange={store.setSpectrumSecondaryColor}
					secondaryLabel={t.label_secondary_color}
				/>
			</SpectrumGroup>

			<SpectrumGroup title={t.section_size_surface}>
				{store.spectrumFamily === 'oscilloscope' && (
					<SliderControl
						label="Line Width"
						value={store.spectrumOscilloscopeLineWidth}
						{...SPECTRUM_RANGES.barWidth}
						onChange={store.setSpectrumOscilloscopeLineWidth}
					/>
				)}
				{store.spectrumFamily === 'tunnel' && (
					<SliderControl
						label="Ring Count"
						value={store.spectrumTunnelRingCount}
						min={2}
						max={24}
						step={1}
						onChange={store.setSpectrumTunnelRingCount}
					/>
				)}
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
				{(store.spectrumShape === 'wave' || store.spectrumFamily === 'liquid' || store.spectrumFamily === 'oscilloscope') && (
					<SliderControl
						label={t.label_wave_fill_opacity}
						value={store.spectrumWaveFillOpacity}
						{...SPECTRUM_RANGES.waveFillOpacity}
						onChange={store.setSpectrumWaveFillOpacity}
					/>
				)}
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
							<span
								className="text-xs"
								style={{ color: 'var(--editor-accent-soft)' }}
							>
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
									counterclockwise: t.label_counterclockwise
								}}
							/>
						</div>
						<SliderControl
							label={t.label_rotation_speed}
							value={Math.abs(store.spectrumRotationSpeed)}
							{...{ ...SPECTRUM_RANGES.rotationSpeed, min: 0 }}
							onChange={value =>
								store.setSpectrumRotationSpeed(
									applyRotationDirection(value, mainRotationDirection)
								)
							}
						/>
					</>
				) : null}
				<ToggleControl
					label={isRadial ? t.label_mirror_sym : t.label_mirror_ud}
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

			<SpectrumGroup title="Frame Memory">
				<SliderControl
					label="Afterglow"
					value={store.spectrumAfterglow}
					{...SPECTRUM_RANGES.afterglow}
					onChange={store.setSpectrumAfterglow}
				/>
				<SliderControl
					label="Motion Trails"
					value={store.spectrumMotionTrails}
					{...SPECTRUM_RANGES.motionTrails}
					onChange={store.setSpectrumMotionTrails}
				/>
				<SliderControl
					label="Ghost Frames"
					value={store.spectrumGhostFrames}
					{...SPECTRUM_RANGES.ghostFrames}
					onChange={store.setSpectrumGhostFrames}
				/>
				<div className="grid grid-cols-2 gap-2">
					<SliderControl
						label="Peak Ribbons"
						value={store.spectrumPeakRibbons}
						{...SPECTRUM_RANGES.peakRibbons}
						onChange={store.setSpectrumPeakRibbons}
					/>
					<SliderControl
						label="Energy Bloom"
						value={store.spectrumEnergyBloom}
						{...SPECTRUM_RANGES.energyBloom}
						onChange={store.setSpectrumEnergyBloom}
					/>
				</div>
				<SliderControl
					label="Bass Shockwave"
					value={store.spectrumBassShockwave}
					{...SPECTRUM_RANGES.bassShockwave}
					onChange={store.setSpectrumBassShockwave}
				/>
			</SpectrumGroup>
		</div>
	);
}
