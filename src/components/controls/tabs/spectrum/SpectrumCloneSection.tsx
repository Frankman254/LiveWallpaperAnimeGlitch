import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { AUDIO_ROUTING_RANGES, SPECTRUM_RANGES } from '@/config/ranges';
import { DEFAULT_STATE } from '@/lib/constants';
import type {
	SpectrumFamily,
	SpectrumRadialShape,
	SpectrumSpiralDotShape
} from '@/types/wallpaper';
import {
	SPECTRUM_CLONE_FAMILIES,
	SPECTRUM_FAMILY_LABELS,
	SPECTRUM_RADIAL_SHAPE_LABELS,
	SPECTRUM_RADIAL_SHAPES,
	SPECTRUM_RADIAL_STYLES
} from '@/features/spectrum/spectrumControlConfig';
import SliderControl from '../../SliderControl';
import ToggleControl from '../../ToggleControl';
import AudioChannelSelector from '../../ui/AudioChannelSelector';
import { SpectrumGroup } from './SpectrumGroup';
import { SpectrumStyleSelector } from './SpectrumStyleSelector';
import { SpectrumColorControls } from './SpectrumColorControls';
import { SpectrumFrameMemoryPresets } from './SpectrumFrameMemoryPresets';
import { SpectrumLiquidLayerControls } from './SpectrumLiquidLayerControls';
import { SpectrumFamilyPreview } from './panels/SpectrumFamilyPanel';
import { AdvancedOnly } from '../../UIMode';
import {
	Caption,
	CollapsibleSection,
	EnumButtonGroup as EnumButtons,
	OptionCardGrid
} from '@/ui';
import { getSpectrumFamilyCapabilities } from '@/features/spectrum/spectrumFamilyCapabilities';

type RotationDirectionOption = 'clockwise' | 'counterclockwise';

const ROTATION_DIRECTIONS: RotationDirectionOption[] = [
	'clockwise',
	'counterclockwise'
];

const SPIRAL_DOT_SHAPES: SpectrumSpiralDotShape[] = [
	'circle',
	'square',
	'triangle',
	'diamond',
	'star',
	'plus',
	'mix'
];

const SPIRAL_DOT_SHAPE_LABELS: Record<SpectrumSpiralDotShape, string> = {
	circle: 'Circle',
	square: 'Square',
	triangle: 'Triangle',
	diamond: 'Diamond',
	star: 'Star',
	plus: 'Plus',
	mix: 'Mix'
};

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
	const isCloneClassic = store.spectrumCloneFamily === 'classic';
	const isCloneLiquid = store.spectrumCloneFamily === 'liquid';
	const cloneCaps = getSpectrumFamilyCapabilities(store.spectrumCloneFamily);
	const showCloneWaveFill =
		(isCloneClassic && store.spectrumCloneStyle === 'wave') ||
		(!isCloneClassic && cloneCaps.supportsWaveFill);

	return (
		<div className="flex min-w-0 flex-col gap-2">
					<SpectrumGroup title={t.section_geometry_layout} accent="clone">
						<div className="flex flex-col gap-2">
							<span
								className="text-xs uppercase"
								style={{ color: 'var(--editor-accent-soft)' }}
							>
								{t.label_clone_spectrum_family}
							</span>
							<OptionCardGrid<SpectrumFamily>
								items={SPECTRUM_CLONE_FAMILIES.map(family => ({
									value: family,
									label: SPECTRUM_FAMILY_LABELS[family],
									description:
										family === 'classic'
											? 'Bars, blocks, waves and dots.'
											: family === 'oscilloscope'
												? 'Scope-style waveform motion.'
												: family === 'tunnel'
													? 'Depth rings and radial travel.'
													: family === 'liquid'
														? 'Soft fluid spectrum surface.'
														: family === 'spiral'
															? 'Bins glowing along a spiral.'
															: 'Circular motion around center.',
									preview: <SpectrumFamilyPreview family={family} />
								}))}
								value={store.spectrumCloneFamily}
								onChange={store.setSpectrumCloneFamily}
								density="compact"
								ariaLabel={t.label_clone_spectrum_family}
							/>
						</div>
						<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
							{t.hint_clone_spectrum_radial}
						</Caption>
						{store.spectrumCloneFamily === 'tunnel' ? (
							<SliderControl
								label={t.label_clone_tunnel_ring_count}
								value={store.spectrumCloneTunnelRingCount}
								{...SPECTRUM_RANGES.tunnelRingCount}
								onChange={store.setSpectrumCloneTunnelRingCount}
							/>
						) : null}
						{isCloneClassic ? (
							<SpectrumStyleSelector
								label={t.label_clone_style}
								options={SPECTRUM_RADIAL_STYLES}
								value={store.spectrumCloneStyle}
								onChange={store.setSpectrumCloneStyle}
							/>
						) : null}
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
						{cloneCaps.supportsRadialShape && !isCloneLiquid ? (
							<>
								<div className="flex flex-col gap-1">
									<span
										className="text-xs"
										style={{ color: 'var(--editor-accent-soft)' }}
									>
										{t.label_radial_shape}
									</span>
									<EnumButtons<SpectrumRadialShape>
										options={SPECTRUM_RADIAL_SHAPES}
										value={store.spectrumCloneRadialShape}
										onChange={store.setSpectrumCloneRadialShape}
										labels={SPECTRUM_RADIAL_SHAPE_LABELS}
									/>
								</div>
								<Caption
									as="p"
									style={{ color: 'var(--editor-accent-muted)' }}
								>
									{t.hint_radial_shape_families}
								</Caption>
								<SliderControl
									label={t.label_clone_angle}
									value={store.spectrumCloneRadialAngle}
									{...SPECTRUM_RANGES.cloneRadialAngle}
									onChange={store.setSpectrumCloneRadialAngle}
									unit="deg"
									defaultValue={DEFAULT_STATE.spectrumCloneRadialAngle}
								/>
								{!store.spectrumCloneFollowLogo ? (
									<AdvancedOnly>
										<SliderControl
											label={
												store.spectrumCloneFamily === 'tunnel'
													? t.label_tunnel_inner_radius
													: t.label_inner_radius
											}
											value={store.spectrumInnerRadius}
											{...SPECTRUM_RANGES.innerRadius}
											onChange={store.setSpectrumInnerRadius}
										/>
									</AdvancedOnly>
								) : null}
							</>
						) : null}
						{!store.spectrumCloneFollowLogo ? (
							<AdvancedOnly>
								<CollapsibleSection title="Position" dense>
									<div className="flex min-w-0 flex-col gap-2">
										<SliderControl
											label={t.label_position_x}
											value={store.spectrumClonePositionX}
											{...SPECTRUM_RANGES.positionX}
											onChange={store.setSpectrumClonePositionX}
											defaultValue={DEFAULT_STATE.spectrumClonePositionX}
										/>
										<SliderControl
											label={t.label_position_y}
											value={store.spectrumClonePositionY}
											{...SPECTRUM_RANGES.positionY}
											onChange={store.setSpectrumClonePositionY}
											defaultValue={DEFAULT_STATE.spectrumClonePositionY}
										/>
									</div>
								</CollapsibleSection>
							</AdvancedOnly>
						) : null}
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
						<AdvancedOnly>
							<SliderControl
								label="Reactivity expressiveness"
								tooltip="Clone-only. How much the global beat envelope modulates clone bar height. 0 = ignore envelope, 0.5 = subtle pop, 1 = cinematic surge on peaks."
								value={store.spectrumCloneGainExpressiveness}
								{...SPECTRUM_RANGES.gainExpressiveness}
								onChange={store.setSpectrumCloneGainExpressiveness}
								defaultValue={
									DEFAULT_STATE.spectrumCloneGainExpressiveness
								}
							/>
							<CollapsibleSection
								title={t.label_envelope_params}
								dense
							>
								<div className="flex min-w-0 flex-col gap-2">
									<SliderControl
										label={t.label_logo_attack}
										value={store.spectrumCloneEnvelopeAttack}
										{...SPECTRUM_RANGES.envelopeAttack}
										onChange={
											store.setSpectrumCloneEnvelopeAttack
										}
										defaultValue={
											DEFAULT_STATE.spectrumCloneEnvelopeAttack
										}
									/>
									<SliderControl
										label={t.label_logo_release}
										value={store.spectrumCloneEnvelopeRelease}
										{...SPECTRUM_RANGES.envelopeRelease}
										onChange={
											store.setSpectrumCloneEnvelopeRelease
										}
										defaultValue={
											DEFAULT_STATE.spectrumCloneEnvelopeRelease
										}
									/>
									<SliderControl
										label={t.label_reactivity_speed}
										value={
											store.spectrumCloneEnvelopeReactivitySpeed
										}
										{...SPECTRUM_RANGES.envelopeReactivitySpeed}
										onChange={
											store.setSpectrumCloneEnvelopeReactivitySpeed
										}
										defaultValue={
											DEFAULT_STATE.spectrumCloneEnvelopeReactivitySpeed
										}
									/>
									<SliderControl
										label={t.label_logo_peak_window}
										value={
											store.spectrumCloneEnvelopePeakWindow
										}
										{...SPECTRUM_RANGES.envelopePeakWindow}
										onChange={
											store.setSpectrumCloneEnvelopePeakWindow
										}
										defaultValue={
											DEFAULT_STATE.spectrumCloneEnvelopePeakWindow
										}
									/>
									<SliderControl
										label={t.label_logo_peak_floor}
										value={
											store.spectrumCloneEnvelopePeakFloor
										}
										{...SPECTRUM_RANGES.envelopePeakFloor}
										onChange={
											store.setSpectrumCloneEnvelopePeakFloor
										}
										defaultValue={
											DEFAULT_STATE.spectrumCloneEnvelopePeakFloor
										}
									/>
									<SliderControl
										label={t.label_logo_punch}
										value={store.spectrumCloneEnvelopePunch}
										{...SPECTRUM_RANGES.envelopePunch}
										onChange={
											store.setSpectrumCloneEnvelopePunch
										}
										defaultValue={
											DEFAULT_STATE.spectrumCloneEnvelopePunch
										}
									/>
								</div>
							</CollapsibleSection>
						</AdvancedOnly>
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
							{cloneCaps.supportsBarWidth ? (
								<SliderControl
									label={t.label_clone_bar_width}
									value={store.spectrumCloneBarWidth}
									{...SPECTRUM_RANGES.cloneBarWidth}
									onChange={store.setSpectrumCloneBarWidth}
								/>
							) : null}
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
						{showCloneWaveFill ? (
							<SliderControl
								label={t.label_wave_fill_opacity}
								value={store.spectrumCloneWaveFillOpacity}
								{...SPECTRUM_RANGES.cloneWaveFillOpacity}
								onChange={store.setSpectrumCloneWaveFillOpacity}
							/>
						) : null}
						{cloneCaps.supportsTunnelFx ? (
							<CollapsibleSection title="Tunnel surface" dense>
								<div className="flex min-w-0 flex-col gap-2">
									<SliderControl
										label={t.label_tunnel_depth_falloff}
										value={store.spectrumCloneTunnelDepthFalloff}
										{...SPECTRUM_RANGES.tunnelDepthFalloff}
										onChange={store.setSpectrumCloneTunnelDepthFalloff}
									/>
									<SliderControl
										label={t.label_tunnel_wall_opacity}
										value={store.spectrumCloneTunnelWallOpacity}
										{...SPECTRUM_RANGES.tunnelWallOpacity}
										onChange={store.setSpectrumCloneTunnelWallOpacity}
									/>
									<SliderControl
										label={t.label_tunnel_pulse_strength}
										value={store.spectrumCloneTunnelPulseStrength}
										{...SPECTRUM_RANGES.tunnelPulseStrength}
										onChange={store.setSpectrumCloneTunnelPulseStrength}
									/>
									<AdvancedOnly>
										<SliderControl
											label={t.label_tunnel_ring_spacing}
											value={store.spectrumCloneTunnelRingSpacing}
											{...SPECTRUM_RANGES.tunnelRingSpacing}
											onChange={store.setSpectrumCloneTunnelRingSpacing}
										/>
										<ToggleControl
											label="Alternate ring rotation"
											tooltip="Counter-rotates every other clone ring in radial mode."
											value={store.spectrumCloneTunnelAlternateRotation}
											onChange={store.setSpectrumCloneTunnelAlternateRotation}
										/>
									</AdvancedOnly>
								</div>
							</CollapsibleSection>
						) : null}
						{cloneCaps.supportsLiquidLayers ? (
							<AdvancedOnly>
								<CollapsibleSection title="Liquid layers" dense>
									<SpectrumLiquidLayerControls target="clone" />
								</CollapsibleSection>
							</AdvancedOnly>
						) : null}
						{store.spectrumCloneFamily === 'spiral' ? (
							<CollapsibleSection title="Spiral shape" dense>
								<div className="flex min-w-0 flex-col gap-2">
									<div className="flex flex-col gap-1">
										<span
											className="text-xs"
											style={{ color: 'var(--editor-accent-soft)' }}
										>
											Spiral shape
										</span>
										<EnumButtons<SpectrumRadialShape>
											options={SPECTRUM_RADIAL_SHAPES}
											value={store.spectrumCloneSpiralShape}
											onChange={store.setSpectrumCloneSpiralShape}
											labels={SPECTRUM_RADIAL_SHAPE_LABELS}
										/>
									</div>
									<SliderControl
										label="Turns"
										value={store.spectrumCloneSpiralTurns}
										{...SPECTRUM_RANGES.spiralTurns}
										onChange={store.setSpectrumCloneSpiralTurns}
									/>
									<SliderControl
										label="Outer radius"
										value={store.spectrumCloneSpiralOuterRadius}
										{...SPECTRUM_RANGES.spiralOuterRadius}
										onChange={store.setSpectrumCloneSpiralOuterRadius}
									/>
									<SliderControl
										label="Tightness"
										value={store.spectrumCloneSpiralTightness}
										{...SPECTRUM_RANGES.spiralTightness}
										onChange={store.setSpectrumCloneSpiralTightness}
									/>
									<SliderControl
										label="Arms"
										value={store.spectrumCloneSpiralArms}
										{...SPECTRUM_RANGES.spiralArms}
										onChange={store.setSpectrumCloneSpiralArms}
									/>
									<SliderControl
										label="Audio → turns"
										tooltip="Audio amplitude inflates the clone turn count on hits."
										value={store.spectrumCloneSpiralAudioTurns}
										{...SPECTRUM_RANGES.spiralAudioTurns}
										onChange={store.setSpectrumCloneSpiralAudioTurns}
									/>
									<ToggleControl
										label="Logarithmic radius"
										value={store.spectrumCloneSpiralLogarithmic}
										onChange={store.setSpectrumCloneSpiralLogarithmic}
									/>
									<ToggleControl
										label="Gradient stroke"
										value={store.spectrumCloneSpiralGradientStroke}
										onChange={store.setSpectrumCloneSpiralGradientStroke}
									/>
									<div className="flex flex-col gap-1">
										<span
											className="text-xs"
											style={{ color: 'var(--editor-accent-soft)' }}
										>
											Dot shape
										</span>
										<EnumButtons<SpectrumSpiralDotShape>
											options={SPIRAL_DOT_SHAPES}
											value={store.spectrumCloneSpiralDotShape}
											onChange={store.setSpectrumCloneSpiralDotShape}
											labels={SPIRAL_DOT_SHAPE_LABELS}
										/>
									</div>
									<SliderControl
										label="Connecting line"
										value={store.spectrumCloneSpiralStrokeWidth}
										{...SPECTRUM_RANGES.spiralStrokeWidth}
										onChange={store.setSpectrumCloneSpiralStrokeWidth}
									/>
								</div>
							</CollapsibleSection>
						) : null}
						{cloneCaps.supportsOscilloscopeLineWidth ? (
							<CollapsibleSection title="Scope CRT" dense>
								<div className="flex min-w-0 flex-col gap-2">
									<SliderControl
										label="Line Width"
										value={store.spectrumCloneOscilloscopeLineWidth}
										{...SPECTRUM_RANGES.barWidth}
										onChange={store.setSpectrumCloneOscilloscopeLineWidth}
									/>
									<SliderControl
										label="Sweep speed"
										value={store.spectrumCloneOscilloscopeScrollSpeed}
										{...SPECTRUM_RANGES.oscilloscopeScrollSpeed}
										onChange={store.setSpectrumCloneOscilloscopeScrollSpeed}
									/>
									<ToggleControl
										label="Reactive line width"
										value={store.spectrumCloneOscilloscopeReactiveWidth}
										onChange={store.setSpectrumCloneOscilloscopeReactiveWidth}
									/>
									<ToggleControl
										label="Phosphor afterglow"
										value={store.spectrumCloneOscilloscopePhosphor}
										onChange={store.setSpectrumCloneOscilloscopePhosphor}
									/>
									{store.spectrumCloneOscilloscopePhosphor ? (
										<SliderControl
											label="Phosphor decay"
											value={store.spectrumCloneOscilloscopePhosphorDecay}
											{...SPECTRUM_RANGES.oscilloscopePhosphorDecay}
											onChange={store.setSpectrumCloneOscilloscopePhosphorDecay}
										/>
									) : null}
									<ToggleControl
										label="CRT reticle"
										value={store.spectrumCloneOscilloscopeGrid}
										onChange={store.setSpectrumCloneOscilloscopeGrid}
									/>
									{store.spectrumCloneOscilloscopeGrid ? (
										<SliderControl
											label="Grid divisions"
											value={store.spectrumCloneOscilloscopeGridDivisions}
											{...SPECTRUM_RANGES.oscilloscopeGridDivisions}
											onChange={store.setSpectrumCloneOscilloscopeGridDivisions}
										/>
									) : null}
								</div>
							</CollapsibleSection>
						) : null}
					</SpectrumGroup>

					<SpectrumGroup title={t.section_motion_finish} accent="clone">
						<SliderControl
							label={t.label_visual_smoothing}
							value={store.spectrumCloneSmoothing}
							{...SPECTRUM_RANGES.smoothing}
							onChange={store.setSpectrumCloneSmoothing}
						/>
						{cloneCaps.supportsRotation ? (
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
											applyRotationDirection(
												value,
												cloneRotationDirection
											)
										)
									}
								/>
							</>
						) : null}
						{cloneCaps.supportsRadialShape && !isCloneLiquid ? (
							<SliderControl
								label="Rotate figure"
								tooltip="Rotates only the selected radial figure contour for the clone. The spectrum motion stays independent."
								value={store.spectrumCloneFigureRotationSpeed}
								{...SPECTRUM_RANGES.rotationSpeed}
								onChange={store.setSpectrumCloneFigureRotationSpeed}
								defaultValue={DEFAULT_STATE.spectrumCloneFigureRotationSpeed}
							/>
						) : null}
						{cloneCaps.supportsMirror ? (
							<ToggleControl
								label={t.label_mirror_sym}
								value={store.spectrumCloneMirror}
								onChange={store.setSpectrumCloneMirror}
							/>
						) : null}
						{cloneCaps.supportsPeakHold ? (
							<>
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
							</>
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
							<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
								{t.hint_clone_frame_memory}
							</Caption>
							<div className="flex flex-col gap-1">
								<span
									className="text-[10px] font-semibold uppercase tracking-widest"
									style={{ color: 'var(--editor-accent-soft)' }}
								>
									{t.label_spectrum_frame_presets}
								</span>
								<SpectrumFrameMemoryPresets target="clone" />
							</div>
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
							<SliderControl
								label="History depth"
								tooltip="Clone-only. How many past frames stack into the clone ghost / motion-trail composite. Higher = longer visual memory + more GPU cost. The active visual quality tier still caps the effective depth."
								value={store.spectrumCloneFrameHistoryDepth}
								{...SPECTRUM_RANGES.frameHistoryDepth}
								onChange={store.setSpectrumCloneFrameHistoryDepth}
								defaultValue={DEFAULT_STATE.spectrumCloneFrameHistoryDepth}
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
							{cloneCaps.supportsShockwave ? (
								<>
									<Caption
										as="p"
										style={{ color: 'var(--editor-accent-muted)' }}
									>
										{t.hint_bass_shockwave}
									</Caption>
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
								</>
							) : null}
							{cloneCaps.supportsShockwave &&
							store.spectrumCloneBassShockwave > 0.001 ? (
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
