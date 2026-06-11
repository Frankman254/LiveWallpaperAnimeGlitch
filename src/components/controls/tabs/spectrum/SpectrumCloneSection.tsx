import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { AUDIO_ROUTING_RANGES, SPECTRUM_RANGES } from '@/config/ranges';
import type {
	SpectrumFamily,
	SpectrumLinearDirection,
	SpectrumLinearOrientation,
	SpectrumMode,
	SpectrumRadialShape,
	SpectrumSpiralDotShape
} from '@/types/wallpaper';
import {
	SPECTRUM_CLONE_FAMILIES,
	SPECTRUM_FAMILY_LABELS,
	SPECTRUM_LINEAR_DIRECTIONS,
	SPECTRUM_LINEAR_DIRECTION_LABELS,
	SPECTRUM_LINEAR_ORIENTATIONS,
	SPECTRUM_LINEAR_ORIENTATION_LABELS,
	SPECTRUM_MODES,
	SPECTRUM_MODE_LABELS,
	SPECTRUM_RADIAL_SHAPE_LABELS,
	SPECTRUM_RADIAL_SHAPES,
	SPECTRUM_RADIAL_STYLES
} from '@/features/spectrum/spectrumControlConfig';
import { SPECTRUM_RADIAL_SHAPE_ICONS } from '@/features/spectrum/geometry/radialShapeIcons';
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
	FeatureGate,
	OptionCardGrid
} from '@/ui';
import { getSpectrumFamilyCapabilities } from '@/features/spectrum/spectrumFamilyCapabilities';
import { createDefaultSpectrumInstanceSettings } from '@/features/spectrum/spectrumInstanceModel';
import {
	DEFAULT_SHOCKWAVE_BAND_THRESHOLDS,
	SHOCKWAVE_BAND_LABELS
} from '@/features/spectrum/shockwaveCalibration';
import type {
	ResolvedAudioReactiveChannel,
	SpectrumBandMode
} from '@/types/wallpaper';
import type {
	RotationDirection,
	SpectrumRotationChannel,
	SpectrumRotationDrive
} from '@/features/stageFx/stageFxConfig';

const ROTATION_DRIVES: SpectrumRotationDrive[] = [
	'off',
	'fixed',
	'audio',
	'fixed-audio'
];
const ROTATION_DIRECTIONS: RotationDirection[] = ['cw', 'ccw'];
const ROTATION_CHANNELS: SpectrumRotationChannel[] = [
	'kick',
	'bass',
	'full',
	'selected'
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

function isShockwaveEnabled(value: number): boolean {
	return value >= SPECTRUM_RANGES.bassShockwave.step;
}

function getSelectedShockwaveThresholdChannel(
	value: SpectrumBandMode
): ResolvedAudioReactiveChannel | null {
	return value === 'auto' ? null : value;
}

const INSTANCE_DEFAULTS = createDefaultSpectrumInstanceSettings();

export function SpectrumCloneSection() {
	const t = useT();
	const instance = useWallpaperStore(s => s.spectrumInstances[0]);
	const updateInstance = useWallpaperStore(s => s.updateSpectrumInstance);
	if (!instance) return null;
	const update = (
		patch: Partial<import('@/types/wallpaper').SpectrumInstanceSettings>
	) => updateInstance(instance.id, patch);
	const cloneRotationHasFixed =
		instance.spectrumRotationDrive === 'fixed' ||
		instance.spectrumRotationDrive === 'fixed-audio';
	const cloneRotationHasAudio =
		instance.spectrumRotationDrive === 'audio' ||
		instance.spectrumRotationDrive === 'fixed-audio';
	const isCloneClassic = instance.spectrumFamily === 'classic';
	const isCloneLiquid = instance.spectrumFamily === 'liquid';
	const isCloneOscilloscope = instance.spectrumFamily === 'oscilloscope';
	const cloneCaps = getSpectrumFamilyCapabilities(instance.spectrumFamily);
	const cloneShockwaveThresholds = {
		...DEFAULT_SHOCKWAVE_BAND_THRESHOLDS,
		...instance.spectrumShockwaveBandThresholds
	};
	const selectedCloneShockwaveThresholdChannel =
		getSelectedShockwaveThresholdChannel(
			instance.spectrumShockwaveBandMode
		);
	const showCloneWaveFill =
		(isCloneClassic && instance.spectrumShape === 'wave') ||
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
						value={instance.spectrumFamily}
						onChange={value => update({ spectrumFamily: value })}
						density="compact"
						ariaLabel={t.label_clone_spectrum_family}
					/>
				</div>
				{cloneCaps.supportsLinear && cloneCaps.supportsRadial ? (
					<div className="flex flex-col gap-1">
						<span
							className="text-xs"
							style={{ color: 'var(--editor-accent-soft)' }}
						>
							{t.label_spectrum_mode}
						</span>
						<EnumButtons<SpectrumMode>
							options={SPECTRUM_MODES}
							value={instance.spectrumMode}
							onChange={value => update({ spectrumMode: value })}
							labels={SPECTRUM_MODE_LABELS}
						/>
					</div>
				) : null}
				{instance.spectrumMode === 'linear' ? (
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
								value={instance.spectrumLinearOrientation}
								onChange={value =>
									update({ spectrumLinearOrientation: value })
								}
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
								value={instance.spectrumLinearDirection}
								onChange={value =>
									update({ spectrumLinearDirection: value })
								}
								labels={SPECTRUM_LINEAR_DIRECTION_LABELS}
							/>
						</div>
						<SliderControl
							label={t.label_spectrum_span}
							value={instance.spectrumSpan}
							{...SPECTRUM_RANGES.span}
							onChange={value => update({ spectrumSpan: value })}
						/>
					</>
				) : (
					<Caption
						as="p"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{t.hint_clone_spectrum_radial}
					</Caption>
				)}
				{instance.spectrumFamily === 'tunnel' ? (
					<SliderControl
						label={t.label_clone_tunnel_ring_count}
						value={instance.spectrumTunnelRingCount}
						{...SPECTRUM_RANGES.tunnelRingCount}
						onChange={value =>
							update({ spectrumTunnelRingCount: value })
						}
					/>
				) : null}
				{isCloneClassic ? (
					<SpectrumStyleSelector
						label={t.label_clone_style}
						options={SPECTRUM_RADIAL_STYLES}
						value={instance.spectrumShape}
						onChange={value => update({ spectrumShape: value })}
					/>
				) : null}
				<ToggleControl
					label={t.label_clone_follow_logo}
					value={instance.spectrumFollowLogo}
					onChange={value => update({ spectrumFollowLogo: value })}
				/>
				<ToggleControl
					label={t.label_clone_radial_fit_logo}
					value={instance.spectrumRadialFitLogo}
					onChange={value => update({ spectrumRadialFitLogo: value })}
				/>
				{cloneCaps.supportsRadialShape && !isCloneLiquid ? (
					<>
						<CollapsibleSection
							title={t.label_radial_shape}
							defaultOpen
							dense
						>
							<EnumButtons<SpectrumRadialShape>
								options={SPECTRUM_RADIAL_SHAPES}
								value={instance.spectrumRadialShape}
								onChange={value =>
									update({ spectrumRadialShape: value })
								}
								labels={SPECTRUM_RADIAL_SHAPE_ICONS}
								tooltips={SPECTRUM_RADIAL_SHAPE_LABELS}
							/>
						</CollapsibleSection>
						<Caption
							as="p"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							{t.hint_radial_shape_families}
						</Caption>
						<SliderControl
							label={t.label_clone_angle}
							value={instance.spectrumRadialAngle}
							{...SPECTRUM_RANGES.cloneRadialAngle}
							onChange={value =>
								update({ spectrumRadialAngle: value })
							}
							unit="deg"
							defaultValue={INSTANCE_DEFAULTS.spectrumRadialAngle}
						/>
						{!instance.spectrumFollowLogo ? (
							<AdvancedOnly>
								<SliderControl
									label={
										instance.spectrumFamily === 'tunnel'
											? t.label_tunnel_inner_radius
											: t.label_inner_radius
									}
									value={instance.spectrumInnerRadius}
									{...SPECTRUM_RANGES.innerRadius}
									onChange={value =>
										update({ spectrumInnerRadius: value })
									}
								/>
							</AdvancedOnly>
						) : null}
					</>
				) : null}
				{!instance.spectrumFollowLogo ? (
					<AdvancedOnly>
						<CollapsibleSection
							title={t.spectrum_clone_section_position}
							dense
						>
							<div className="flex min-w-0 flex-col gap-2">
								<SliderControl
									label={t.label_position_x}
									value={instance.spectrumPositionX}
									{...SPECTRUM_RANGES.positionX}
									onChange={value =>
										update({ spectrumPositionX: value })
									}
									defaultValue={
										INSTANCE_DEFAULTS.spectrumPositionX
									}
								/>
								<SliderControl
									label={t.label_position_y}
									value={instance.spectrumPositionY}
									{...SPECTRUM_RANGES.positionY}
									onChange={value =>
										update({ spectrumPositionY: value })
									}
									defaultValue={
										INSTANCE_DEFAULTS.spectrumPositionY
									}
								/>
							</div>
						</CollapsibleSection>
					</AdvancedOnly>
				) : null}
				<div className="flex min-w-0 flex-col gap-2">
					<SliderControl
						label={t.label_clone_gap}
						value={instance.spectrumLogoGap}
						{...SPECTRUM_RANGES.cloneGap}
						onChange={value => update({ spectrumLogoGap: value })}
						unit="px"
					/>
				</div>
			</SpectrumGroup>

			<SpectrumGroup title={t.section_audio_color} accent="clone">
				<AudioChannelSelector
					value={instance.spectrumBandMode}
					onChange={value => update({ spectrumBandMode: value })}
					label={t.label_band_mode}
				/>
				<SliderControl
					label={t.label_smoothing}
					value={instance.spectrumAudioSmoothing}
					{...AUDIO_ROUTING_RANGES.selectedChannelSmoothing}
					onChange={value =>
						update({ spectrumAudioSmoothing: value })
					}
					defaultValue={INSTANCE_DEFAULTS.spectrumAudioSmoothing}
				/>
				<SliderControl
					label={t.label_audio_glow}
					tooltip="Clone-only. Adds extra glow halo on peaks while preserving the quiet-state glow."
					value={instance.spectrumGlowAudioAmount}
					{...SPECTRUM_RANGES.glowAudioAmount}
					onChange={value =>
						update({ spectrumGlowAudioAmount: value })
					}
					defaultValue={INSTANCE_DEFAULTS.spectrumGlowAudioAmount}
				/>
				<AdvancedOnly>
					<SliderControl
						label="Beat drop depth"
						tooltip="Clone-only. Controls how far the clone spectrum shrinks after a beat. 0 = no global drop, 1 = strong breathing, 3 = can fall near zero if Min Height is 0."
						value={instance.spectrumGainExpressiveness}
						{...SPECTRUM_RANGES.gainExpressiveness}
						onChange={value =>
							update({ spectrumGainExpressiveness: value })
						}
						defaultValue={
							INSTANCE_DEFAULTS.spectrumGainExpressiveness
						}
					/>
					<CollapsibleSection title={t.label_envelope_params} dense>
						<div className="flex min-w-0 flex-col gap-2">
							<SliderControl
								label="Rise speed (attack)"
								tooltip="How quickly the clone envelope jumps upward when audio gets louder."
								value={instance.spectrumEnvelopeAttack}
								{...SPECTRUM_RANGES.envelopeAttack}
								onChange={value =>
									update({ spectrumEnvelopeAttack: value })
								}
								defaultValue={
									INSTANCE_DEFAULTS.spectrumEnvelopeAttack
								}
							/>
							<SliderControl
								label="Drop speed (release)"
								tooltip="How quickly the clone envelope falls after a beat. Higher values make the clone drop faster."
								value={instance.spectrumEnvelopeRelease}
								{...SPECTRUM_RANGES.envelopeRelease}
								onChange={value =>
									update({ spectrumEnvelopeRelease: value })
								}
								defaultValue={
									INSTANCE_DEFAULTS.spectrumEnvelopeRelease
								}
							/>
							<SliderControl
								label="Envelope speed multiplier"
								tooltip="Global speed multiplier for clone attack and release. Lower feels smoother; higher reacts more sharply."
								value={instance.spectrumEnvelopeReactivitySpeed}
								{...SPECTRUM_RANGES.envelopeReactivitySpeed}
								onChange={value =>
									update({
										spectrumEnvelopeReactivitySpeed: value
									})
								}
								defaultValue={
									INSTANCE_DEFAULTS.spectrumEnvelopeReactivitySpeed
								}
							/>
							<SliderControl
								label="Peak memory (s)"
								tooltip="How long loud moments remain as the adaptive clone reference. Higher values make the drop feel more dramatic after peaks."
								value={instance.spectrumEnvelopePeakWindow}
								{...SPECTRUM_RANGES.envelopePeakWindow}
								onChange={value =>
									update({
										spectrumEnvelopePeakWindow: value
									})
								}
								defaultValue={
									INSTANCE_DEFAULTS.spectrumEnvelopePeakWindow
								}
							/>
							<SliderControl
								label="Silence floor / noise gate"
								tooltip="Raises the adaptive floor so quiet signal is treated as silence. This is not the visual bar floor; use Min Height for that."
								value={instance.spectrumEnvelopePeakFloor}
								{...SPECTRUM_RANGES.envelopePeakFloor}
								onChange={value =>
									update({ spectrumEnvelopePeakFloor: value })
								}
								defaultValue={
									INSTANCE_DEFAULTS.spectrumEnvelopePeakFloor
								}
							/>
							<SliderControl
								label="Beat punch"
								tooltip="Adds a short transient boost on sharp hits."
								value={instance.spectrumEnvelopePunch}
								{...SPECTRUM_RANGES.envelopePunch}
								onChange={value =>
									update({ spectrumEnvelopePunch: value })
								}
								defaultValue={
									INSTANCE_DEFAULTS.spectrumEnvelopePunch
								}
							/>
						</div>
					</CollapsibleSection>
				</AdvancedOnly>
				<SpectrumColorControls
					label={t.label_clone_color_mode}
					source={instance.spectrumColorSource}
					onSourceChange={value =>
						update({ spectrumColorSource: value })
					}
					colorMode={instance.spectrumColorMode}
					onColorModeChange={value =>
						update({ spectrumColorMode: value })
					}
					primaryColor={instance.spectrumPrimaryColor}
					onPrimaryColorChange={value =>
						update({ spectrumPrimaryColor: value })
					}
					primaryLabel={t.label_clone_primary_color}
					secondaryColor={instance.spectrumSecondaryColor}
					onSecondaryColorChange={value =>
						update({ spectrumSecondaryColor: value })
					}
					secondaryLabel={t.label_clone_secondary_color}
				/>
			</SpectrumGroup>

			<SpectrumGroup title={t.section_size_surface} accent="clone">
				<div className="flex min-w-0 flex-col gap-2">
					<SliderControl
						label={t.label_clone_bar_count}
						value={instance.spectrumBarCount}
						{...SPECTRUM_RANGES.cloneBarCount}
						onChange={value => update({ spectrumBarCount: value })}
					/>
					{cloneCaps.supportsBarWidth ? (
						<SliderControl
							label={t.label_clone_bar_width}
							value={instance.spectrumBarWidth}
							{...SPECTRUM_RANGES.cloneBarWidth}
							onChange={value =>
								update({ spectrumBarWidth: value })
							}
						/>
					) : null}
				</div>
				{isCloneOscilloscope ? null : (
					<div className="flex min-w-0 flex-col gap-2">
						<SliderControl
							label={t.label_min_height}
							value={instance.spectrumMinHeight}
							{...SPECTRUM_RANGES.minHeight}
							onChange={value =>
								update({ spectrumMinHeight: value })
							}
						/>
						<SliderControl
							label={t.label_max_height}
							value={instance.spectrumMaxHeight}
							{...SPECTRUM_RANGES.maxHeight}
							onChange={value =>
								update({ spectrumMaxHeight: value })
							}
						/>
					</div>
				)}
				<SliderControl
					label={t.label_clone_opacity}
					value={instance.spectrumOpacity}
					{...SPECTRUM_RANGES.cloneOpacity}
					onChange={value => update({ spectrumOpacity: value })}
				/>
				{showCloneWaveFill ? (
					<SliderControl
						label={t.label_wave_fill_opacity}
						value={instance.spectrumWaveFillOpacity}
						{...SPECTRUM_RANGES.cloneWaveFillOpacity}
						onChange={value =>
							update({ spectrumWaveFillOpacity: value })
						}
					/>
				) : null}
				{cloneCaps.supportsTunnelFx ? (
					<CollapsibleSection
						title={t.spectrum_clone_section_tunnel_surface}
						dense
					>
						<div className="flex min-w-0 flex-col gap-2">
							<SliderControl
								label={t.label_tunnel_depth_falloff}
								value={instance.spectrumTunnelDepthFalloff}
								{...SPECTRUM_RANGES.tunnelDepthFalloff}
								onChange={value =>
									update({
										spectrumTunnelDepthFalloff: value
									})
								}
							/>
							<SliderControl
								label={t.label_tunnel_wall_opacity}
								value={instance.spectrumTunnelWallOpacity}
								{...SPECTRUM_RANGES.tunnelWallOpacity}
								onChange={value =>
									update({ spectrumTunnelWallOpacity: value })
								}
							/>
							<SliderControl
								label={t.label_tunnel_pulse_strength}
								value={instance.spectrumTunnelPulseStrength}
								{...SPECTRUM_RANGES.tunnelPulseStrength}
								onChange={value =>
									update({
										spectrumTunnelPulseStrength: value
									})
								}
							/>
							<AdvancedOnly>
								<SliderControl
									label={t.label_tunnel_ring_spacing}
									value={instance.spectrumTunnelRingSpacing}
									{...SPECTRUM_RANGES.tunnelRingSpacing}
									onChange={value =>
										update({
											spectrumTunnelRingSpacing: value
										})
									}
								/>
								<ToggleControl
									label="Alternate ring rotation"
									tooltip="Counter-rotates every other clone ring in radial mode."
									value={
										instance.spectrumTunnelAlternateRotation
									}
									onChange={value =>
										update({
											spectrumTunnelAlternateRotation:
												value
										})
									}
								/>
							</AdvancedOnly>
						</div>
					</CollapsibleSection>
				) : null}
				{cloneCaps.supportsLiquidLayers ? (
					<AdvancedOnly>
						<CollapsibleSection
							title={t.spectrum_clone_section_liquid_layers}
							dense
						>
							<SpectrumLiquidLayerControls target="instance" />
						</CollapsibleSection>
					</AdvancedOnly>
				) : null}
				{instance.spectrumFamily === 'spiral' ? (
					<CollapsibleSection
						title={t.spectrum_clone_section_spiral_shape}
						dense
					>
						<div className="flex min-w-0 flex-col gap-2">
							<div className="flex flex-col gap-1">
								<span
									className="text-xs"
									style={{
										color: 'var(--editor-accent-soft)'
									}}
								>
									Spiral shape
								</span>
								<EnumButtons<SpectrumRadialShape>
									options={SPECTRUM_RADIAL_SHAPES}
									value={instance.spectrumSpiralShape}
									onChange={value =>
										update({ spectrumSpiralShape: value })
									}
									labels={SPECTRUM_RADIAL_SHAPE_ICONS}
									tooltips={SPECTRUM_RADIAL_SHAPE_LABELS}
								/>
							</div>
							<SliderControl
								label="Turns"
								value={instance.spectrumSpiralTurns}
								{...SPECTRUM_RANGES.spiralTurns}
								onChange={value =>
									update({ spectrumSpiralTurns: value })
								}
							/>
							<SliderControl
								label="Outer radius"
								value={instance.spectrumSpiralOuterRadius}
								{...SPECTRUM_RANGES.spiralOuterRadius}
								onChange={value =>
									update({ spectrumSpiralOuterRadius: value })
								}
							/>
							<SliderControl
								label="Tightness"
								value={instance.spectrumSpiralTightness}
								{...SPECTRUM_RANGES.spiralTightness}
								onChange={value =>
									update({ spectrumSpiralTightness: value })
								}
							/>
							<SliderControl
								label="Arms"
								value={instance.spectrumSpiralArms}
								{...SPECTRUM_RANGES.spiralArms}
								onChange={value =>
									update({ spectrumSpiralArms: value })
								}
							/>
							<SliderControl
								label="Audio → turns"
								tooltip="Audio amplitude inflates the clone turn count on hits."
								value={instance.spectrumSpiralAudioTurns}
								{...SPECTRUM_RANGES.spiralAudioTurns}
								onChange={value =>
									update({ spectrumSpiralAudioTurns: value })
								}
							/>
							<ToggleControl
								label="Logarithmic radius"
								value={instance.spectrumSpiralLogarithmic}
								onChange={value =>
									update({ spectrumSpiralLogarithmic: value })
								}
							/>
							<ToggleControl
								label="Gradient stroke"
								value={instance.spectrumSpiralGradientStroke}
								onChange={value =>
									update({
										spectrumSpiralGradientStroke: value
									})
								}
							/>
							<div className="flex flex-col gap-1">
								<span
									className="text-xs"
									style={{
										color: 'var(--editor-accent-soft)'
									}}
								>
									Dot shape
								</span>
								<EnumButtons<SpectrumSpiralDotShape>
									options={SPIRAL_DOT_SHAPES}
									value={instance.spectrumSpiralDotShape}
									onChange={value =>
										update({
											spectrumSpiralDotShape: value
										})
									}
									labels={SPIRAL_DOT_SHAPE_LABELS}
								/>
							</div>
							<SliderControl
								label="Connecting line"
								value={instance.spectrumSpiralStrokeWidth}
								{...SPECTRUM_RANGES.spiralStrokeWidth}
								onChange={value =>
									update({ spectrumSpiralStrokeWidth: value })
								}
							/>
						</div>
					</CollapsibleSection>
				) : null}
				{cloneCaps.supportsOscilloscopeLineWidth ? (
					<CollapsibleSection
						title={t.spectrum_clone_section_scope_crt}
						dense
					>
						<div className="flex min-w-0 flex-col gap-2">
							<SliderControl
								label="Line Width"
								value={instance.spectrumOscilloscopeLineWidth}
								{...SPECTRUM_RANGES.barWidth}
								onChange={value =>
									update({
										spectrumOscilloscopeLineWidth: value
									})
								}
							/>
							<SliderControl
								label="Scope height"
								tooltip="Vertical amplitude of the clone scope trace. This is separate from trace response."
								value={instance.spectrumMaxHeight}
								{...SPECTRUM_RANGES.maxHeight}
								onChange={value =>
									update({ spectrumMaxHeight: value })
								}
							/>
							<SliderControl
								label="Trace response"
								tooltip="Lower = wave lags / persists across frames. Higher = snaps faster to live PCM. Height is controlled by Scope height."
								value={instance.spectrumOscilloscopeScrollSpeed}
								{...SPECTRUM_RANGES.oscilloscopeScrollSpeed}
								onChange={value =>
									update({
										spectrumOscilloscopeScrollSpeed: value
									})
								}
							/>
							<ToggleControl
								label="Reactive line width"
								value={
									instance.spectrumOscilloscopeReactiveWidth
								}
								onChange={value =>
									update({
										spectrumOscilloscopeReactiveWidth: value
									})
								}
							/>
							<ToggleControl
								label="Phosphor afterglow"
								value={instance.spectrumOscilloscopePhosphor}
								onChange={value =>
									update({
										spectrumOscilloscopePhosphor: value
									})
								}
							/>
							{instance.spectrumOscilloscopePhosphor ? (
								<SliderControl
									label="Phosphor decay"
									value={
										instance.spectrumOscilloscopePhosphorDecay
									}
									{...SPECTRUM_RANGES.oscilloscopePhosphorDecay}
									onChange={value =>
										update({
											spectrumOscilloscopePhosphorDecay:
												value
										})
									}
								/>
							) : null}
							<ToggleControl
								label="CRT reticle"
								value={instance.spectrumOscilloscopeGrid}
								onChange={value =>
									update({ spectrumOscilloscopeGrid: value })
								}
							/>
							{instance.spectrumOscilloscopeGrid ? (
								<SliderControl
									label="Grid divisions"
									value={
										instance.spectrumOscilloscopeGridDivisions
									}
									{...SPECTRUM_RANGES.oscilloscopeGridDivisions}
									onChange={value =>
										update({
											spectrumOscilloscopeGridDivisions:
												value
										})
									}
								/>
							) : null}
						</div>
					</CollapsibleSection>
				) : null}
			</SpectrumGroup>

			<SpectrumGroup title={t.section_motion_finish} accent="clone">
				<SliderControl
					label={t.label_visual_smoothing}
					value={instance.spectrumSmoothing}
					{...SPECTRUM_RANGES.smoothing}
					onChange={value => update({ spectrumSmoothing: value })}
				/>
				{cloneCaps.supportsRotation ? (
					<CollapsibleSection
						title="Radial rotation"
						defaultOpen
						dense
					>
						<div className="flex flex-col gap-1">
							<span
								className="text-xs"
								style={{ color: 'var(--editor-accent-soft)' }}
							>
								Rotation drive
							</span>
							<EnumButtons<SpectrumRotationDrive>
								options={ROTATION_DRIVES}
								value={instance.spectrumRotationDrive}
								onChange={value =>
									update({ spectrumRotationDrive: value })
								}
								labels={{
									off: 'Off',
									fixed: 'Fixed',
									audio: 'Audio',
									'fixed-audio': 'Fixed + Audio'
								}}
							/>
						</div>
						<div className="flex flex-col gap-1">
							<span
								className="text-xs"
								style={{ color: 'var(--editor-accent-soft)' }}
							>
								{t.label_direction}
							</span>
							<EnumButtons<RotationDirection>
								options={ROTATION_DIRECTIONS}
								value={instance.spectrumRotationDirection}
								onChange={value =>
									update({ spectrumRotationDirection: value })
								}
								labels={{
									cw: t.label_clockwise,
									ccw: t.label_counterclockwise
								}}
							/>
						</div>
						<ToggleControl
							label="Invert on low energy"
							value={instance.spectrumRotationInvertOnLowEnergy}
							onChange={value =>
								update({
									spectrumRotationInvertOnLowEnergy: value
								})
							}
						/>
						{instance.spectrumRotationInvertOnLowEnergy ? (
							<>
								<SliderControl
									label="Low energy threshold"
									value={
										instance.spectrumRotationInvertThreshold
									}
									{...SPECTRUM_RANGES.rotationInvertThreshold}
									onChange={value =>
										update({
											spectrumRotationInvertThreshold:
												value
										})
									}
									defaultValue={
										INSTANCE_DEFAULTS.spectrumRotationInvertThreshold
									}
								/>
								<SliderControl
									label="Direction hold"
									value={
										instance.spectrumRotationInvertHoldMs
									}
									{...SPECTRUM_RANGES.rotationInvertHoldMs}
									onChange={value =>
										update({
											spectrumRotationInvertHoldMs: value
										})
									}
									defaultValue={
										INSTANCE_DEFAULTS.spectrumRotationInvertHoldMs
									}
									unit="ms"
								/>
							</>
						) : null}
						{cloneRotationHasFixed ? (
							<SliderControl
								label="Base rotation speed"
								value={Math.abs(instance.spectrumRotationSpeed)}
								{...{
									...SPECTRUM_RANGES.rotationSpeed,
									min: 0
								}}
								onChange={value =>
									update({ spectrumRotationSpeed: value })
								}
								defaultValue={Math.abs(
									INSTANCE_DEFAULTS.spectrumRotationSpeed
								)}
							/>
						) : null}
						{cloneRotationHasAudio ? (
							<>
								<SliderControl
									label="Audio rotation amount"
									value={instance.spectrumRotationAudioAmount}
									min={0}
									max={4}
									step={0.01}
									onChange={value =>
										update({
											spectrumRotationAudioAmount: value
										})
									}
									defaultValue={
										INSTANCE_DEFAULTS.spectrumRotationAudioAmount
									}
								/>
								<div className="flex flex-col gap-1">
									<span
										className="text-xs"
										style={{
											color: 'var(--editor-accent-soft)'
										}}
									>
										Audio channel
									</span>
									<EnumButtons<SpectrumRotationChannel>
										options={ROTATION_CHANNELS}
										value={instance.spectrumRotationChannel}
										onChange={value =>
											update({
												spectrumRotationChannel: value
											})
										}
										labels={{
											kick: 'Kick',
											bass: 'Bass',
											full: 'Full',
											selected: 'Selected'
										}}
									/>
								</div>
								<SliderControl
									label="Rotation smoothing"
									value={instance.spectrumRotationSmoothing}
									min={0}
									max={0.98}
									step={0.01}
									onChange={value =>
										update({
											spectrumRotationSmoothing: value
										})
									}
									defaultValue={
										INSTANCE_DEFAULTS.spectrumRotationSmoothing
									}
								/>
							</>
						) : null}
					</CollapsibleSection>
				) : null}
				{cloneCaps.supportsRadialShape && !isCloneLiquid ? (
					<SliderControl
						label="Rotate figure"
						tooltip="Rotates only the selected radial figure contour for the clone. The spectrum motion stays independent."
						value={instance.spectrumFigureRotationSpeed}
						{...SPECTRUM_RANGES.rotationSpeed}
						onChange={value =>
							update({ spectrumFigureRotationSpeed: value })
						}
						defaultValue={
							INSTANCE_DEFAULTS.spectrumFigureRotationSpeed
						}
					/>
				) : null}
				{cloneCaps.supportsMirror ? (
					<ToggleControl
						label={t.label_mirror_sym}
						value={instance.spectrumMirror}
						onChange={value => update({ spectrumMirror: value })}
					/>
				) : null}
				{cloneCaps.supportsPeakHold ? (
					<>
						<ToggleControl
							label={t.label_peak_hold}
							value={instance.spectrumPeakHold}
							onChange={value =>
								update({ spectrumPeakHold: value })
							}
						/>
						{instance.spectrumPeakHold ? (
							<SliderControl
								label={t.label_peak_decay}
								value={instance.spectrumPeakDecay}
								{...SPECTRUM_RANGES.peakDecay}
								onChange={value =>
									update({ spectrumPeakDecay: value })
								}
							/>
						) : null}
					</>
				) : null}
				<div className="flex min-w-0 flex-col gap-2">
					<SliderControl
						label={t.label_glow}
						value={instance.spectrumGlowIntensity}
						{...SPECTRUM_RANGES.glowIntensity}
						onChange={value =>
							update({ spectrumGlowIntensity: value })
						}
					/>
					<SliderControl
						label={t.label_glow_reach}
						value={instance.spectrumGlowReach}
						{...SPECTRUM_RANGES.glowReach}
						onChange={value => update({ spectrumGlowReach: value })}
					/>
					<SliderControl
						label={t.label_shadow_blur}
						value={instance.spectrumShadowBlur}
						{...SPECTRUM_RANGES.shadowBlur}
						onChange={value =>
							update({ spectrumShadowBlur: value })
						}
					/>
				</div>
			</SpectrumGroup>

			{cloneCaps.supportsShockwave ? (
				<CollapsibleSection
					title={t.spectrum_section_bass_shockwave}
					dense
				>
					<div className="flex min-w-0 flex-col gap-2">
						<Caption
							as="p"
							style={{ color: 'var(--editor-accent-muted)' }}
						>
							{t.hint_bass_shockwave}
						</Caption>
						<ToggleControl
							label="Bass Shockwave"
							value={instance.spectrumBassShockwaveEnabled}
							onChange={value =>
								update({ spectrumBassShockwaveEnabled: value })
							}
						/>
						<FeatureGate
							enabled={instance.spectrumBassShockwaveEnabled}
							hint={t.hint_enable_to_configure}
						>
							<AudioChannelSelector
								value={instance.spectrumShockwaveBandMode}
								onChange={value =>
									update({ spectrumShockwaveBandMode: value })
								}
								label={t.label_shockwave_band_mode}
							/>
							<SliderControl
								label="Intensity"
								value={instance.spectrumBassShockwave}
								{...SPECTRUM_RANGES.bassShockwave}
								onChange={value =>
									update({ spectrumBassShockwave: value })
								}
							/>
							{isShockwaveEnabled(
								instance.spectrumBassShockwave
							) ? (
								<>
									<div className="space-y-1">
										<div className="text-[11px] opacity-70">
											{t.label_shockwave_color_mode}
										</div>
										<EnumButtons<
											'cycle' | 'primary' | 'secondary'
										>
											value={
												instance.spectrumShockwaveColorMode
											}
											options={[
												'cycle',
												'primary',
												'secondary'
											]}
											labels={{
												cycle: t.label_shockwave_color_cycle,
												primary:
													t.label_shockwave_color_primary,
												secondary:
													t.label_shockwave_color_secondary
											}}
											onChange={value =>
												update({
													spectrumShockwaveColorMode:
														value
												})
											}
										/>
									</div>
									<SliderControl
										label={t.label_shockwave_thickness}
										value={
											instance.spectrumShockwaveThickness
										}
										{...SPECTRUM_RANGES.shockwaveThickness}
										onChange={value =>
											update({
												spectrumShockwaveThickness:
													value
											})
										}
									/>
									<SliderControl
										label={t.label_shockwave_opacity}
										value={
											instance.spectrumShockwaveOpacity
										}
										{...SPECTRUM_RANGES.shockwaveOpacity}
										onChange={value =>
											update({
												spectrumShockwaveOpacity: value
											})
										}
									/>
									<SliderControl
										label={t.label_shockwave_blur}
										value={instance.spectrumShockwaveBlur}
										{...SPECTRUM_RANGES.shockwaveBlur}
										onChange={value =>
											update({
												spectrumShockwaveBlur: value
											})
										}
									/>
									{selectedCloneShockwaveThresholdChannel ? (
										<div className="flex min-w-0 flex-col gap-1.5">
											<span className="text-[11px] uppercase tracking-[0.1em] opacity-70">
												Selected band trigger
											</span>
											<Caption
												as="p"
												style={{
													color: 'var(--editor-accent-muted)'
												}}
											>
												Lower values make this band
												create shockwave lines more
												easily.
											</Caption>
											<SliderControl
												label={`${SHOCKWAVE_BAND_LABELS[selectedCloneShockwaveThresholdChannel]} threshold`}
												value={
													cloneShockwaveThresholds[
														selectedCloneShockwaveThresholdChannel
													]
												}
												{...SPECTRUM_RANGES.shockwaveBandThreshold}
												defaultValue={
													DEFAULT_SHOCKWAVE_BAND_THRESHOLDS[
														selectedCloneShockwaveThresholdChannel
													]
												}
												onChange={value =>
													update({
														spectrumShockwaveBandThresholds:
															{
																...cloneShockwaveThresholds,
																[selectedCloneShockwaveThresholdChannel]:
																	value
															}
													})
												}
											/>
										</div>
									) : (
										<Caption
											as="p"
											style={{
												color: 'var(--editor-accent-muted)'
											}}
										>
											Auto switches bands at runtime.
											Select a specific band to tune its
											trigger threshold.
										</Caption>
									)}
								</>
							) : null}
						</FeatureGate>
					</div>
				</CollapsibleSection>
			) : null}

			<AdvancedOnly>
				<SpectrumGroup
					title={t.section_clone_frame_memory}
					accent="clone"
				>
					<Caption
						as="p"
						style={{ color: 'var(--editor-accent-muted)' }}
					>
						{t.hint_clone_frame_memory}
					</Caption>
					<ToggleControl
						label={t.label_enabled}
						value={instance.spectrumFrameMemoryEnabled}
						onChange={value =>
							update({ spectrumFrameMemoryEnabled: value })
						}
					/>
					<FeatureGate
						enabled={instance.spectrumFrameMemoryEnabled}
						hint={t.hint_enable_to_configure}
					>
						<div className="flex flex-col gap-1">
							<span
								className="text-[10px] font-semibold uppercase tracking-widest"
								style={{ color: 'var(--editor-accent-soft)' }}
							>
								{t.label_spectrum_frame_presets}
							</span>
							<SpectrumFrameMemoryPresets target="instance" />
						</div>
						<SliderControl
							label="Afterglow"
							value={instance.spectrumAfterglow}
							{...SPECTRUM_RANGES.afterglow}
							onChange={value =>
								update({ spectrumAfterglow: value })
							}
						/>
						<SliderControl
							label="Motion Trails"
							value={instance.spectrumMotionTrails}
							{...SPECTRUM_RANGES.motionTrails}
							onChange={value =>
								update({ spectrumMotionTrails: value })
							}
						/>
						<SliderControl
							label="Ghost Frames"
							value={instance.spectrumGhostFrames}
							{...SPECTRUM_RANGES.ghostFrames}
							onChange={value =>
								update({ spectrumGhostFrames: value })
							}
						/>
						<SliderControl
							label="History depth"
							tooltip="Clone-only. How many past frames stack into the clone ghost / motion-trail composite. Higher = longer visual memory + more GPU cost. The active visual quality tier still caps the effective depth."
							value={instance.spectrumFrameHistoryDepth}
							{...SPECTRUM_RANGES.frameHistoryDepth}
							onChange={value =>
								update({ spectrumFrameHistoryDepth: value })
							}
							defaultValue={
								INSTANCE_DEFAULTS.spectrumFrameHistoryDepth
							}
						/>
					</FeatureGate>
					<div className="flex min-w-0 flex-col gap-2">
						<ToggleControl
							label="Peak Ribbons"
							value={instance.spectrumPeakRibbonsEnabled}
							onChange={value =>
								update({ spectrumPeakRibbonsEnabled: value })
							}
						/>
						<FeatureGate
							enabled={instance.spectrumPeakRibbonsEnabled}
							hint={t.hint_enable_to_configure}
						>
							<SliderControl
								label="Intensity"
								value={instance.spectrumPeakRibbons}
								{...SPECTRUM_RANGES.peakRibbons}
								onChange={value =>
									update({ spectrumPeakRibbons: value })
								}
							/>
							{instance.spectrumPeakRibbons > 0.001 ? (
								<SliderControl
									label={t.label_peak_ribbon_angle}
									value={instance.spectrumPeakRibbonAngle}
									{...SPECTRUM_RANGES.peakRibbonAngle}
									onChange={value =>
										update({
											spectrumPeakRibbonAngle: value
										})
									}
									unit="deg"
								/>
							) : null}
						</FeatureGate>
						<ToggleControl
							label="Energy Bloom"
							value={instance.spectrumEnergyBloomEnabled}
							onChange={value =>
								update({ spectrumEnergyBloomEnabled: value })
							}
						/>
						<FeatureGate
							enabled={instance.spectrumEnergyBloomEnabled}
							hint={t.hint_enable_to_configure}
						>
							<SliderControl
								label="Intensity"
								value={instance.spectrumEnergyBloom}
								{...SPECTRUM_RANGES.energyBloom}
								onChange={value =>
									update({ spectrumEnergyBloom: value })
								}
							/>
						</FeatureGate>
					</div>
				</SpectrumGroup>
			</AdvancedOnly>
		</div>
	);
}
