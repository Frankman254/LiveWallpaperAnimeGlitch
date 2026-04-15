import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { AUDIO_ROUTING_RANGES, SPECTRUM_RANGES } from '@/config/ranges';
import type { SpectrumRadialShape } from '@/types/wallpaper';
import {
	SPECTRUM_RADIAL_SHAPE_LABELS,
	SPECTRUM_RADIAL_SHAPES,
	SPECTRUM_RADIAL_STYLES
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

export function SpectrumCloneSection() {
	const t = useT();
	const store = useWallpaperStore();
	const cloneRotationDirection = getRotationDirection(
		store.spectrumCloneRotationSpeed
	);

	return (
		<div className="flex flex-col gap-2 xl:grid xl:grid-cols-2">
					<SpectrumGroup title={t.section_geometry_layout} accent="clone">
						<SpectrumStyleSelector
							label={t.label_clone_style}
							options={SPECTRUM_RADIAL_STYLES}
							value={store.spectrumCloneStyle}
							onChange={store.setSpectrumCloneStyle}
						/>
						<div className="flex flex-col gap-1">
							<span
								className="text-xs"
								style={{ color: 'var(--editor-accent-soft)' }}
							>
								{t.label_clone_shape}
							</span>
							<EnumButtons<SpectrumRadialShape>
								options={SPECTRUM_RADIAL_SHAPES}
								value={store.spectrumCloneRadialShape}
								onChange={store.setSpectrumCloneRadialShape}
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

					<SpectrumGroup title={t.section_audio_color} accent="clone">
						<AudioChannelSelector
							value={store.spectrumCloneBandMode}
							onChange={store.setSpectrumCloneBandMode}
							label={t.label_band_mode}
						/>
						<ToggleControl
							label={t.label_smoothing}
							value={store.spectrumCloneAudioSmoothingEnabled}
							onChange={store.setSpectrumCloneAudioSmoothingEnabled}
						/>
						{store.spectrumCloneAudioSmoothingEnabled ? (
							<SliderControl
								label={t.label_smoothing_amount}
								value={store.spectrumCloneAudioSmoothing}
								{...AUDIO_ROUTING_RANGES.selectedChannelSmoothing}
								onChange={store.setSpectrumCloneAudioSmoothing}
							/>
						) : null}
						<SpectrumColorControls
							label={t.label_clone_color_mode}
							source={store.spectrumCloneColorSource}
							onSourceChange={store.setSpectrumCloneColorSource}
							colorMode={store.spectrumCloneColorMode}
							onColorModeChange={store.setSpectrumCloneColorMode}
							primaryColor={store.spectrumClonePrimaryColor}
							onPrimaryColorChange={store.setSpectrumClonePrimaryColor}
							primaryLabel={t.label_clone_primary_color}
							secondaryColor={store.spectrumCloneSecondaryColor}
							onSecondaryColorChange={store.setSpectrumCloneSecondaryColor}
							secondaryLabel={t.label_clone_secondary_color}
						/>
					</SpectrumGroup>

					<SpectrumGroup title={t.section_size_surface} accent="clone">
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
								onChange={store.setSpectrumCloneWaveFillOpacity}
							/>
						) : null}
					</SpectrumGroup>

					<SpectrumGroup title={t.section_motion_finish} accent="clone">
						<SliderControl
							label={t.label_visual_smoothing}
							value={store.spectrumCloneSmoothing}
							{...SPECTRUM_RANGES.smoothing}
							onChange={store.setSpectrumCloneSmoothing}
						/>
						<div className="flex flex-col gap-1">
							<span
								className="text-xs"
								style={{ color: 'var(--editor-accent-soft)' }}
							>
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
									counterclockwise: t.label_counterclockwise
								}}
							/>
						</div>
						<SliderControl
							label={t.label_rotation_speed}
							value={Math.abs(store.spectrumCloneRotationSpeed)}
							{...{ ...SPECTRUM_RANGES.rotationSpeed, min: 0 }}
							onChange={value =>
								store.setSpectrumCloneRotationSpeed(
									applyRotationDirection(value, cloneRotationDirection)
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
								onChange={store.setSpectrumCloneGlowIntensity}
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
	);
}
