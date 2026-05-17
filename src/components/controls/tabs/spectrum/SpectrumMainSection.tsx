import { useEffect } from 'react';
import { useWallpaperStore } from '@/store/wallpaperStore';
import { useT } from '@/lib/i18n';
import { AUDIO_ROUTING_RANGES, SPECTRUM_RANGES } from '@/config/ranges';
import { AdvancedOnly } from '../../UIMode';
import type {
	SpectrumFamily,
	SpectrumLinearDirection,
	SpectrumLinearOrientation,
	SpectrumMode,
	SpectrumRadialShape,
	SpectrumShape,
	SpectrumSpiralDotShape
} from '@/types/wallpaper';
import {
	Caption,
	EnumButtonGroup as EnumButtons,
	FONT,
	OptionCardGrid,
	UI_COLORS
} from '@/ui';
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
import AudioChannelSelector from '../../ui/AudioChannelSelector';
import { SpectrumGroup } from './SpectrumGroup';
import { SpectrumStyleSelector } from './SpectrumStyleSelector';
import { SpectrumColorControls } from './SpectrumColorControls';
import { SpectrumFrameMemoryPresets } from './SpectrumFrameMemoryPresets';
import { SpectrumTunnelPresets } from './SpectrumTunnelPresets';
import { SpectrumLiquidLayerControls } from './SpectrumLiquidLayerControls';
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

const CONTROL_LABEL_STYLE = {
	color: UI_COLORS.fgMute,
	fontFamily: FONT.mono,
	fontSize: 10,
	fontWeight: 650,
	letterSpacing: '0.1em',
	textTransform: 'uppercase'
} as const;

function SpectrumFamilyPreview({ family }: { family: SpectrumFamily }) {
	if (family === 'oscilloscope') {
		return (
			<svg viewBox="0 0 80 38" className="h-9 w-full" aria-hidden>
				<path
					d="M4 20 C14 7 24 31 34 20 S54 7 64 20 S74 31 78 20"
					fill="none"
					stroke="currentColor"
					strokeWidth="4"
					strokeLinecap="round"
				/>
			</svg>
		);
	}
	if (family === 'tunnel') {
		return (
			<div className="grid place-items-center">
				<div className="h-8 w-8 rounded-full border-2 border-current opacity-90">
					<div className="m-1.5 h-5 w-5 rounded-full border-2 border-current opacity-70" />
				</div>
			</div>
		);
	}
	if (family === 'liquid') {
		return (
			<svg viewBox="0 0 80 38" className="h-9 w-full" aria-hidden>
				<path
					d="M8 28 C18 6 30 8 40 20 C50 32 64 33 72 12"
					fill="none"
					stroke="currentColor"
					strokeWidth="7"
					strokeLinecap="round"
				/>
			</svg>
		);
	}
	if (family === 'orbital') {
		return (
			<div className="relative h-10 w-10 rounded-full border border-current">
				<div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
				<div className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-current" />
			</div>
		);
	}
	if (family === 'spiral') {
		return (
			<svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
				<path
					d="M20 20 m-2,0 a2,2 0 1,1 4,0 m1,2 a5,5 0 1,1 -10,0 a5,5 0 1,1 8,-3 m3,1 a10,10 0 1,1 -16,2"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
				/>
			</svg>
		);
	}
	return (
		<div className="flex h-9 items-end justify-center gap-1.5">
			{[18, 28, 14, 34, 22].map((height, index) => (
				<span
					key={index}
					className="w-1.5 rounded-full bg-current"
					style={{ height }}
				/>
			))}
		</div>
	);
}

function SpectrumModePreview({ mode }: { mode: SpectrumMode }) {
	if (mode === 'radial') {
		return (
			<div className="relative h-10 w-10 rounded-full border-2 border-current">
				{Array.from({ length: 8 }).map((_, index) => {
					const angle = (index / 8) * Math.PI * 2;
					return (
						<span
							key={index}
							className="absolute h-1.5 w-1.5 rounded-full bg-current"
							style={{
								left: `${50 + Math.cos(angle) * 42}%`,
								top: `${50 + Math.sin(angle) * 42}%`,
								transform: 'translate(-50%, -50%)'
							}}
						/>
					);
				})}
			</div>
		);
	}
	return (
		<div className="flex h-9 w-full items-end justify-center gap-1">
			{[12, 18, 26, 32, 22, 16, 10].map((height, index) => (
				<span
					key={index}
					className="w-1.5 rounded-sm bg-current"
					style={{ height }}
				/>
			))}
		</div>
	);
}

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

	// Family flags retained for hint copy (each family has its own help
	// text and we don't want to derive a generic message from a capability
	// flag — these stay 1:1 with the family id). All other control
	// visibility is derived from `caps` below instead of these booleans.
	const isClassic = store.spectrumFamily === 'classic';
	const isTunnel = store.spectrumFamily === 'tunnel';
	const isLiquid = store.spectrumFamily === 'liquid';
	const isOrbital = store.spectrumFamily === 'orbital';
	const isOscilloscope = store.spectrumFamily === 'oscilloscope';
	const caps = getSpectrumFamilyCapabilities(store.spectrumFamily);
	const isLinearMode = store.spectrumMode === 'linear';
	const showLinearAxisControls = isLinearMode;

	// Coerce the spectrum mode to whichever the active family supports.
	// Spiral, for example, only renders meaningfully in radial — if the user
	// switches to it while linear was selected, jump back to radial.
	useEffect(() => {
		if (!caps.supportsRadial && store.spectrumMode === 'radial') {
			store.setSpectrumMode('linear');
		} else if (!caps.supportsLinear && store.spectrumMode === 'linear') {
			store.setSpectrumMode('radial');
		}
	}, [caps.supportsLinear, caps.supportsRadial, store]);

	// Warn when bar count × bar width plausibly overflows the reference width.
	// Uses stored layoutReferenceWidth as the budget; 1.6× headroom for
	// on-canvas gaps/overlap tolerance.
	const barBudget = (store.layoutReferenceWidth ?? 1920) * 1.6;
	const barFootprint = store.spectrumBarCount * store.spectrumBarWidth;
	const barOverflow = barFootprint > barBudget;

	return (
		<div className="flex min-w-0 flex-col gap-2">
			<SpectrumGroup title={t.section_geometry_layout}>
				<div className="flex flex-col gap-2">
					<span
						className="uppercase"
						style={CONTROL_LABEL_STYLE}
					>
						Family
					</span>
					<OptionCardGrid<SpectrumFamily>
						items={SPECTRUM_FAMILIES.map(family => ({
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
													? 'Bins glowing along a logarithmic spiral.'
													: 'Circular motion around center.',
							preview: <SpectrumFamilyPreview family={family} />
						}))}
						value={store.spectrumFamily}
						onChange={store.setSpectrumFamily}
						density="compact"
						ariaLabel="Spectrum family"
					/>
				</div>

				{isTunnel ? (
					<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
						{t.hint_spectrum_family_tunnel}
					</Caption>
				) : null}
				{isLiquid ? (
					<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
						{t.hint_spectrum_family_liquid}
					</Caption>
				) : null}
				{isOrbital ? (
					<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
						{t.hint_spectrum_family_orbital}
					</Caption>
				) : null}

				{caps.supportsLinear && caps.supportsRadial ? (
				<div className="flex flex-col gap-2">
					<span
						className="uppercase"
						style={CONTROL_LABEL_STYLE}
					>
						{t.label_spectrum_mode}
					</span>
					<OptionCardGrid<SpectrumMode>
						items={SPECTRUM_MODES.map(mode => ({
							value: mode,
							label: SPECTRUM_MODE_LABELS[mode],
							description:
								mode === 'linear'
									? 'Horizontal or vertical timeline feel.'
									: 'Circular spectrum around a center.',
							preview: <SpectrumModePreview mode={mode} />
						}))}
						value={store.spectrumMode}
						onChange={store.setSpectrumMode}
						columns={2}
						density="compact"
						ariaLabel={t.label_spectrum_mode}
					/>
				</div>
				) : null}

				{caps.supportsShape && (
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
						{store.spectrumFollowLogo ? (
							<>
								<AdvancedOnly>
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
								</AdvancedOnly>
							</>
						) : (
							<AdvancedOnly>
							<SliderControl
								label={t.label_inner_radius}
								value={store.spectrumInnerRadius}
								{...SPECTRUM_RANGES.innerRadius}
								onChange={store.setSpectrumInnerRadius}
							/>
							</AdvancedOnly>
						)}
					</>
				)}

				{isRadial && caps.supportsRadialShape ? (
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
								value={store.spectrumRadialShape}
								onChange={store.setSpectrumRadialShape}
								labels={SPECTRUM_RADIAL_SHAPE_LABELS}
							/>
						</div>
						<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
							{t.hint_radial_shape_families}
						</Caption>
						<AdvancedOnly>
							<SliderControl
								label={t.label_radial_angle}
								value={store.spectrumRadialAngle}
								{...SPECTRUM_RANGES.radialAngle}
								onChange={store.setSpectrumRadialAngle}
								unit="deg"
							/>
						</AdvancedOnly>
						{!isClassic && !store.spectrumFollowLogo ? (
							<AdvancedOnly>
								<SliderControl
									label={
										isTunnel
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

				{showLinearAxisControls ? (
					<>
						<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
							{t.hint_linear_axis_controls}
						</Caption>
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
				) : null}

				<AdvancedOnly>
				{canMoveMainSpectrum ? (
					<div className="flex min-w-0 flex-col gap-2">
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
				</AdvancedOnly>
			</SpectrumGroup>

			<SpectrumGroup title={t.section_audio_color}>
				<AudioChannelSelector
					value={store.spectrumBandMode}
					onChange={store.setSpectrumBandMode}
					label={t.label_band_mode}
				/>
				<AdvancedOnly>
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
				<SliderControl
					label="Reactivity expressiveness"
					tooltip="How much the global beat envelope modulates bar height. 0 = bars ignore the envelope (only per-bin smoothing drives them). 0.5 = the legacy subtle pop. 1 = cinematic — bars drop ~32% on silence and surge ~16% on peaks."
					value={store.spectrumGainExpressiveness}
					{...SPECTRUM_RANGES.gainExpressiveness}
					onChange={store.setSpectrumGainExpressiveness}
				/>
				</AdvancedOnly>
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
				{caps.supportsOscilloscopeLineWidth ? (
					<SliderControl
						label="Line Width"
						value={store.spectrumOscilloscopeLineWidth}
						{...SPECTRUM_RANGES.barWidth}
						onChange={store.setSpectrumOscilloscopeLineWidth}
					/>
				) : null}
				{caps.supportsTunnelFx ? (
					<div className="flex min-w-0 flex-col gap-2">
						<div className="flex flex-col gap-1">
							<span
								className="uppercase"
								style={CONTROL_LABEL_STYLE}
							>
								{t.label_spectrum_tunnel_presets}
							</span>
							<SpectrumTunnelPresets />
							<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
								{t.hint_spectrum_tunnel_presets}
							</Caption>
						</div>
						<SliderControl
							label={t.label_ring_count}
							value={store.spectrumTunnelRingCount}
							{...SPECTRUM_RANGES.tunnelRingCount}
							onChange={store.setSpectrumTunnelRingCount}
						/>
						<SliderControl
							label={t.label_tunnel_depth_falloff}
							value={store.spectrumTunnelDepthFalloff}
							{...SPECTRUM_RANGES.tunnelDepthFalloff}
							onChange={store.setSpectrumTunnelDepthFalloff}
						/>
						<SliderControl
							label={t.label_tunnel_wall_opacity}
							value={store.spectrumTunnelWallOpacity}
							{...SPECTRUM_RANGES.tunnelWallOpacity}
							onChange={store.setSpectrumTunnelWallOpacity}
						/>
						<SliderControl
							label={t.label_tunnel_pulse_strength}
							value={store.spectrumTunnelPulseStrength}
							{...SPECTRUM_RANGES.tunnelPulseStrength}
							onChange={store.setSpectrumTunnelPulseStrength}
						/>
						<AdvancedOnly>
							<SliderControl
								label={t.label_tunnel_ring_spacing}
								value={store.spectrumTunnelRingSpacing}
								{...SPECTRUM_RANGES.tunnelRingSpacing}
								onChange={store.setSpectrumTunnelRingSpacing}
							/>
							<ToggleControl
								label="Alternate ring rotation"
								tooltip="Counter-rotates every other ring (radial mode only). One ring spins clockwise, the next counter-clockwise, etc. Creates a layered depth illusion when used with non-circle radial shapes."
								value={store.spectrumTunnelAlternateRotation}
								onChange={store.setSpectrumTunnelAlternateRotation}
							/>
						</AdvancedOnly>
					</div>
				) : null}
				{caps.supportsLiquidLayers ? (
					<AdvancedOnly>
						<SpectrumLiquidLayerControls />
					</AdvancedOnly>
				) : null}
				{store.spectrumFamily === 'spiral' ? (
					<div className="flex min-w-0 flex-col gap-2">
						<span className="uppercase" style={CONTROL_LABEL_STYLE}>
							Spiral shape
						</span>
						<EnumButtons<SpectrumRadialShape>
							options={SPECTRUM_RADIAL_SHAPES}
							value={store.spectrumSpiralShape}
							onChange={store.setSpectrumSpiralShape}
							labels={SPECTRUM_RADIAL_SHAPE_LABELS}
						/>
						<SliderControl
							label="Turns"
							value={store.spectrumSpiralTurns}
							{...SPECTRUM_RANGES.spiralTurns}
							onChange={store.setSpectrumSpiralTurns}
						/>
						<SliderControl
							label="Outer radius"
							value={store.spectrumSpiralOuterRadius}
							{...SPECTRUM_RANGES.spiralOuterRadius}
							onChange={store.setSpectrumSpiralOuterRadius}
						/>
						<SliderControl
							label="Tightness"
							value={store.spectrumSpiralTightness}
							{...SPECTRUM_RANGES.spiralTightness}
							onChange={store.setSpectrumSpiralTightness}
						/>
						<SliderControl
							label="Arms"
							value={store.spectrumSpiralArms}
							{...SPECTRUM_RANGES.spiralArms}
							onChange={store.setSpectrumSpiralArms}
						/>
						<SliderControl
							label="Audio → turns"
							tooltip="Audio amplitude inflates the turn count on hits"
							value={store.spectrumSpiralAudioTurns}
							{...SPECTRUM_RANGES.spiralAudioTurns}
							onChange={store.setSpectrumSpiralAudioTurns}
						/>
						<ToggleControl
							label="Logarithmic radius"
							value={store.spectrumSpiralLogarithmic}
							onChange={store.setSpectrumSpiralLogarithmic}
						/>
						<ToggleControl
							label="Gradient stroke"
							value={store.spectrumSpiralGradientStroke}
							onChange={store.setSpectrumSpiralGradientStroke}
						/>
						<span className="uppercase" style={CONTROL_LABEL_STYLE}>
							Dot shape
						</span>
						<EnumButtons<SpectrumSpiralDotShape>
							options={SPIRAL_DOT_SHAPES}
							value={store.spectrumSpiralDotShape}
							onChange={store.setSpectrumSpiralDotShape}
							labels={SPIRAL_DOT_SHAPE_LABELS}
						/>
						<SliderControl
							label="Line thickness"
							tooltip="Thickness of the line connecting dots. 0 hides it."
							value={store.spectrumSpiralStrokeWidth}
							{...SPECTRUM_RANGES.spiralStrokeWidth}
							onChange={store.setSpectrumSpiralStrokeWidth}
						/>
					</div>
				) : null}
				{store.spectrumFamily === 'oscilloscope' ? (
					<div className="flex min-w-0 flex-col gap-2">
						<span className="uppercase" style={CONTROL_LABEL_STYLE}>
							Scope
						</span>
						<SliderControl
							label="Sweep speed"
							tooltip="Lower = wave lags / persists across frames (smoother motion). Higher = wave snaps to raw PCM each frame (sharper, the original brusque behavior)."
							value={store.spectrumOscilloscopeScrollSpeed}
							{...SPECTRUM_RANGES.oscilloscopeScrollSpeed}
							onChange={store.setSpectrumOscilloscopeScrollSpeed}
						/>
						<ToggleControl
							label="Reactive line width"
							value={store.spectrumOscilloscopeReactiveWidth}
							onChange={store.setSpectrumOscilloscopeReactiveWidth}
						/>
						<ToggleControl
							label="Phosphor afterglow"
							value={store.spectrumOscilloscopePhosphor}
							onChange={store.setSpectrumOscilloscopePhosphor}
						/>
						{store.spectrumOscilloscopePhosphor ? (
							<SliderControl
								label="Phosphor decay"
								tooltip="Higher values fade the trail faster. Lower values leave a long ghost trace."
								value={store.spectrumOscilloscopePhosphorDecay}
								{...SPECTRUM_RANGES.oscilloscopePhosphorDecay}
								onChange={store.setSpectrumOscilloscopePhosphorDecay}
							/>
						) : null}
						<ToggleControl
							label="CRT reticle"
							value={store.spectrumOscilloscopeGrid}
							onChange={store.setSpectrumOscilloscopeGrid}
						/>
						{store.spectrumOscilloscopeGrid ? (
							<SliderControl
								label="Grid divisions"
								value={store.spectrumOscilloscopeGridDivisions}
								{...SPECTRUM_RANGES.oscilloscopeGridDivisions}
								onChange={store.setSpectrumOscilloscopeGridDivisions}
							/>
						) : null}
					</div>
				) : null}
				<div className="flex min-w-0 flex-col gap-2">
					<SliderControl
						label={
							isOscilloscope
								? 'Sample resolution'
								: isTunnel
									? 'Ring segments'
									: t.label_bar_count
						}
						tooltip={
							isOscilloscope
								? 'Number of PCM samples plotted per frame. Lower = chunkier wave + much better perf (scope draws one canvas segment per sample; raw PCM is 2048 points which is expensive).'
								: undefined
						}
						value={store.spectrumBarCount}
						{...SPECTRUM_RANGES.barCount}
						onChange={store.setSpectrumBarCount}
					/>
					{isTunnel ? (
						<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
							{t.hint_tunnel_bar_count}
						</Caption>
					) : null}
					{caps.supportsBarWidth ? (
						<SliderControl
							label={isTunnel ? 'Ring line width' : t.label_bar_width}
							value={store.spectrumBarWidth}
							{...SPECTRUM_RANGES.barWidth}
							onChange={store.setSpectrumBarWidth}
						/>
					) : null}
					{barOverflow ? (
						<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
							Bar count × width may clip at this viewport — reduce
							one for cleaner spacing.
						</Caption>
					) : null}
				</div>
				<div className="flex min-w-0 flex-col gap-2">
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
				{((isClassic && store.spectrumShape === 'wave') ||
					(!isClassic && caps.supportsWaveFill)) && (
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
				{isRadial && caps.supportsRotation ? (
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
				{caps.supportsMirror ? (
					<ToggleControl
						label={isRadial ? t.label_mirror_sym : t.label_mirror_ud}
						value={store.spectrumMirror}
						onChange={store.setSpectrumMirror}
					/>
				) : null}
				{caps.supportsPeakHold ? (
					<>
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
					</>
				) : null}
				<div className="flex min-w-0 flex-col gap-2">
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

			<AdvancedOnly>
			<SpectrumGroup title="Frame Memory">
				<div className="flex flex-col gap-1">
					<span
						className="uppercase"
						style={CONTROL_LABEL_STYLE}
					>
						{t.label_spectrum_frame_presets}
					</span>
					<SpectrumFrameMemoryPresets target="main" />
					<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
						{t.hint_spectrum_frame_presets}
					</Caption>
				</div>
				{store.performanceMode === 'low' ? (
					<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
						Performance: <strong>Low</strong>. Afterglow / Motion Trails blur
						run at 30% intensity to protect GPU; History depth is capped by the
						active visual quality tier (see slider hint). Switch to Medium/High
						in Perf for the full effect.
					</Caption>
				) : null}
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
				<SliderControl
					label="History depth"
					tooltip="How many past frames stack into the ghost / motion-trail composite. Higher = longer visual memory + more GPU cost. The active visual quality tier still caps the effective depth (minimal tier tops out at 2)."
					value={store.spectrumFrameHistoryDepth}
					{...SPECTRUM_RANGES.frameHistoryDepth}
					onChange={store.setSpectrumFrameHistoryDepth}
				/>
				{store.spectrumGhostFrames > 0.35 ? (
					<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
						High ghost-frame values can accumulate into a white
						blowout — try Safe preset or lower Afterglow / Glow.
					</Caption>
				) : null}
				<div className="flex min-w-0 flex-col gap-2">
					<SliderControl
						label="Peak Ribbons"
						value={store.spectrumPeakRibbons}
						{...SPECTRUM_RANGES.peakRibbons}
						onChange={store.setSpectrumPeakRibbons}
					/>
					{store.spectrumPeakRibbons > 0.001 ? (
						<SliderControl
							label={t.label_peak_ribbon_angle}
							value={store.spectrumPeakRibbonAngle}
							{...SPECTRUM_RANGES.peakRibbonAngle}
							onChange={store.setSpectrumPeakRibbonAngle}
							unit="deg"
						/>
					) : null}
					<SliderControl
						label="Energy Bloom"
						value={store.spectrumEnergyBloom}
						{...SPECTRUM_RANGES.energyBloom}
						onChange={store.setSpectrumEnergyBloom}
					/>
				</div>
				{caps.supportsShockwave ? (
					<>
						<Caption as="p" style={{ color: 'var(--editor-accent-muted)' }}>
							{t.hint_bass_shockwave}
						</Caption>
						<AudioChannelSelector
							value={store.spectrumShockwaveBandMode}
							onChange={store.setSpectrumShockwaveBandMode}
							label={t.label_shockwave_band_mode}
						/>
						<SliderControl
							label="Bass Shockwave"
							value={store.spectrumBassShockwave}
							{...SPECTRUM_RANGES.bassShockwave}
							onChange={store.setSpectrumBassShockwave}
						/>
					</>
				) : null}
				{caps.supportsShockwave && store.spectrumBassShockwave > 0.001 ? (
					<>
						<div className="space-y-1">
							<div className="text-[11px] opacity-70">
								{t.label_shockwave_color_mode}
							</div>
							<EnumButtons<'cycle' | 'primary' | 'secondary'>
								value={store.spectrumShockwaveColorMode}
								options={['cycle', 'primary', 'secondary']}
								labels={{
									cycle: t.label_shockwave_color_cycle,
									primary: t.label_shockwave_color_primary,
									secondary: t.label_shockwave_color_secondary
								}}
								onChange={store.setSpectrumShockwaveColorMode}
							/>
						</div>
						<SliderControl
							label={t.label_shockwave_thickness}
							value={store.spectrumShockwaveThickness}
							{...SPECTRUM_RANGES.shockwaveThickness}
							onChange={store.setSpectrumShockwaveThickness}
						/>
						<SliderControl
							label={t.label_shockwave_opacity}
							value={store.spectrumShockwaveOpacity}
							{...SPECTRUM_RANGES.shockwaveOpacity}
							onChange={store.setSpectrumShockwaveOpacity}
						/>
						<SliderControl
							label={t.label_shockwave_blur}
							value={store.spectrumShockwaveBlur}
							{...SPECTRUM_RANGES.shockwaveBlur}
							onChange={store.setSpectrumShockwaveBlur}
						/>
					</>
				) : null}
			</SpectrumGroup>
			</AdvancedOnly>
		</div>
	);
}
