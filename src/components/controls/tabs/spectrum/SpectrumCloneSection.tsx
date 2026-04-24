import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { AUDIO_ROUTING_RANGES, SPECTRUM_RANGES } from '@/config/ranges';
import type { SpectrumFamily, SpectrumRadialShape } from '@/types/wallpaper';
import {
	SPECTRUM_CLONE_FAMILIES,
	SPECTRUM_FAMILY_LABELS,
	SPECTRUM_RADIAL_SHAPE_LABELS,
	SPECTRUM_RADIAL_SHAPES,
	SPECTRUM_RADIAL_STYLES
} from '@/features/spectrum/spectrumControlConfig';
import SliderControl from '../../SliderControl';
import ToggleControl from '../../ToggleControl';
import EnumButtons from '../../ui/EnumButtons';
import AudioChannelSelector from '../../ui/AudioChannelSelector';
import { CAPTION_CLASS } from '../../ui/designTokens';
import { SpectrumGroup } from './SpectrumGroup';
import { SpectrumStyleSelector } from './SpectrumStyleSelector';
import { SpectrumColorControls } from './SpectrumColorControls';
import { AdvancedOnly } from '../../UIMode';

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
						<div className="flex flex-col gap-1">
							<span
								className="text-xs"
								style={{ color: 'var(--editor-accent-soft)' }}
							>
								{t.label_clone_spectrum_family}
							</span>
							<EnumButtons<SpectrumFamily>
								options={SPECTRUM_CLONE_FAMILIES}
								value={store.spectrumCloneFamily}
								onChange={store.setSpectrumCloneFamily}
								labels={SPECTRUM_FAMILY_LABELS}
							/>
						</div>
						{store.spectrumCloneFamily === 'tunnel' ? (
							<SliderControl
								label={t.label_clone_tunnel_ring_count}
								value={store.spectrumCloneTunnelRingCount}
								{...SPECTRUM_RANGES.tunnelRingCount}
								onChange={store.setSpectrumCloneTunnelRingCount}
							/>
						) : null}
						<SpectrumStyleSelector
							label={t.label_clone_style}
							options={SPECTRUM_RADIAL_STYLES}
							value={store.spectrumCloneStyle}
							onChange={store.setSpectrumCloneStyle}
						/>
						<ToggleControl
							label={t.label_clone_follow_logo}
							value={store.spectrumCloneFollowLogo}
							onChange={store.setSpectrumCloneFollowLogo}
						/>
						<ToggleControl
							label={t.label_clone_radial_fit_logo}
							value={store.spectrumCloneRadialFitLogo}
							onChange={store.setSpectrumCloneRadialFitLogo}
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
						<div className="flex min-w-0 flex-col gap-2">
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
						<div className="flex min-w-0 flex-col gap-2">
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
						<div className="flex min-w-0 flex-col gap-2">
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
						<div className="flex min-w-0 flex-col gap-2">
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

					<AdvancedOnly>
						<SpectrumGroup title={t.section_clone_frame_memory} accent="clone">
							<p
								className={CAPTION_CLASS}
								style={{ color: 'var(--editor-accent-muted)' }}
							>
								{t.hint_clone_frame_memory}
							</p>
							<SliderControl
								label="Afterglow"
								value={store.spectrumCloneAfterglow}
								{...SPECTRUM_RANGES.afterglow}
								onChange={store.setSpectrumCloneAfterglow}
							/>
							<SliderControl
								label="Motion Trails"
								value={store.spectrumCloneMotionTrails}
								{...SPECTRUM_RANGES.motionTrails}
								onChange={store.setSpectrumCloneMotionTrails}
							/>
							<SliderControl
								label="Ghost Frames"
								value={store.spectrumCloneGhostFrames}
								{...SPECTRUM_RANGES.ghostFrames}
								onChange={store.setSpectrumCloneGhostFrames}
							/>
							<div className="flex min-w-0 flex-col gap-2">
								<SliderControl
									label="Peak Ribbons"
									value={store.spectrumClonePeakRibbons}
									{...SPECTRUM_RANGES.peakRibbons}
									onChange={store.setSpectrumClonePeakRibbons}
								/>
								{store.spectrumClonePeakRibbons > 0.001 ? (
									<SliderControl
										label={t.label_peak_ribbon_angle}
										value={store.spectrumClonePeakRibbonAngle}
										{...SPECTRUM_RANGES.peakRibbonAngle}
										onChange={store.setSpectrumClonePeakRibbonAngle}
										unit="deg"
									/>
								) : null}
								<SliderControl
									label="Energy Bloom"
									value={store.spectrumCloneEnergyBloom}
									{...SPECTRUM_RANGES.energyBloom}
									onChange={store.setSpectrumCloneEnergyBloom}
								/>
							</div>
							<p
								className={CAPTION_CLASS}
								style={{ color: 'var(--editor-accent-muted)' }}
							>
								{t.hint_bass_shockwave}
							</p>
							<AudioChannelSelector
								value={store.spectrumCloneShockwaveBandMode}
								onChange={store.setSpectrumCloneShockwaveBandMode}
								label={t.label_shockwave_band_mode}
							/>
							<SliderControl
								label="Bass Shockwave"
								value={store.spectrumCloneBassShockwave}
								{...SPECTRUM_RANGES.bassShockwave}
								onChange={store.setSpectrumCloneBassShockwave}
							/>
							{store.spectrumCloneBassShockwave > 0.001 ? (
								<>
									<div className="space-y-1">
										<div className="text-[11px] opacity-70">
											{t.label_shockwave_color_mode}
										</div>
										<EnumButtons<'cycle' | 'primary' | 'secondary'>
											value={store.spectrumCloneShockwaveColorMode}
											options={['cycle', 'primary', 'secondary']}
											labels={{
												cycle: t.label_shockwave_color_cycle,
												primary: t.label_shockwave_color_primary,
												secondary: t.label_shockwave_color_secondary
											}}
											onChange={store.setSpectrumCloneShockwaveColorMode}
										/>
									</div>
									<SliderControl
										label={t.label_shockwave_thickness}
										value={store.spectrumCloneShockwaveThickness}
										{...SPECTRUM_RANGES.shockwaveThickness}
										onChange={store.setSpectrumCloneShockwaveThickness}
									/>
									<SliderControl
										label={t.label_shockwave_opacity}
										value={store.spectrumCloneShockwaveOpacity}
										{...SPECTRUM_RANGES.shockwaveOpacity}
										onChange={store.setSpectrumCloneShockwaveOpacity}
									/>
									<SliderControl
										label={t.label_shockwave_blur}
										value={store.spectrumCloneShockwaveBlur}
										{...SPECTRUM_RANGES.shockwaveBlur}
										onChange={store.setSpectrumCloneShockwaveBlur}
									/>
								</>
							) : null}
						</SpectrumGroup>
					</AdvancedOnly>
				</div>
	);
}
